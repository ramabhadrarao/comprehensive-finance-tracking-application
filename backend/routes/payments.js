import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Payment from '../models/Payment.js';
import Investment from '../models/Investment.js';
import Investor from '../models/Investor.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments with pagination and filters
// @access  Private
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']),
  query('investment').optional().isMongoId().withMessage('Invalid investment ID'),
  query('investor').optional().isMongoId().withMessage('Invalid investor ID'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid date format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search;
  const status = req.query.status;
  const investmentId = req.query.investment;
  const investorId = req.query.investor;
  const dateFrom = req.query.dateFrom;
  const dateTo = req.query.dateTo;

  // Build query
  let query = {};
  
  if (search) {
    query.$or = [
      { paymentId: { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  if (investmentId) {
    query.investment = investmentId;
  }

  if (investorId) {
    query.investor = investorId;
  }

  if (dateFrom || dateTo) {
    query.paymentDate = {};
    if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.paymentDate.$lte = endDate;
    }
  }

  // If user is investor role, only show their payments
  if (req.user.role === 'investor') {
    const investor = await Investor.findOne({ userId: req.user._id });
    if (investor) {
      query.investor = investor._id;
    } else {
      query.investor = null; // No payments if no investor profile
    }
  }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('investment', 'investmentId principalAmount')
      .populate('investor', 'investorId name email phone')
      .populate('processedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: payments,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  });
}));

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };

  // If user is investor role, ensure they can only see their payments
  if (req.user.role === 'investor') {
    const investor = await Investor.findOne({ userId: req.user._id });
    if (investor) {
      query.investor = investor._id;
    } else {
      return res.status(404).json({ message: 'Payment not found' });
    }
  }

  const payment = await Payment.findOne(query)
    .populate('investment', 'investmentId principalAmount maturityDate')
    .populate('investor', 'investorId name email phone address')
    .populate('processedBy', 'name email')
    .populate('verifiedBy', 'name email');

  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  res.json({
    success: true,
    data: payment
  });
}));

// @route   POST /api/payments
// @desc    Record new payment
// @access  Private (Admin, Finance Manager)
router.post('/', authenticate, authorize('admin', 'finance_manager'), [
  body('investment').isMongoId().withMessage('Valid investment ID is required'),
  body('scheduleMonth').isInt({ min: 1 }).withMessage('Schedule month must be a positive integer'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentDate').optional().isISO8601().withMessage('Invalid payment date'),
  body('paymentMethod').isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other']).withMessage('Invalid payment method'),
  body('referenceNumber').optional().trim(),
  body('type').optional().isIn(['interest', 'principal', 'mixed', 'penalty', 'bonus']),
  body('interestAmount').optional().isFloat({ min: 0 }).withMessage('Interest amount must be non-negative'),
  body('principalAmount').optional().isFloat({ min: 0 }).withMessage('Principal amount must be non-negative'),
  body('penaltyAmount').optional().isFloat({ min: 0 }).withMessage('Penalty amount must be non-negative'),
  body('bonusAmount').optional().isFloat({ min: 0 }).withMessage('Bonus amount must be non-negative'),
  body('notes').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const {
    investment: investmentId,
    scheduleMonth,
    amount,
    paymentDate,
    paymentMethod,
    referenceNumber,
    type,
    interestAmount,
    principalAmount,
    penaltyAmount,
    bonusAmount,
    notes
  } = req.body;

  // Verify investment exists and is active
  const investment = await Investment.findById(investmentId).populate('investor');
  if (!investment) {
    return res.status(404).json({ message: 'Investment not found' });
  }

  if (investment.status !== 'active') {
    return res.status(400).json({ message: 'Cannot record payment for non-active investment' });
  }

  // Verify schedule month exists
  const scheduleItem = investment.schedule.find(s => s.month === scheduleMonth);
  if (!scheduleItem) {
    return res.status(400).json({ message: 'Invalid schedule month' });
  }

  // Calculate breakdown if not provided
  let finalInterestAmount = interestAmount || 0;
  let finalPrincipalAmount = principalAmount || 0;
  let finalPenaltyAmount = penaltyAmount || 0;
  let finalBonusAmount = bonusAmount || 0;

  // Auto-calculate if breakdown not provided
  if (!interestAmount && !principalAmount && !penaltyAmount && !bonusAmount) {
    const remainingInterest = scheduleItem.interestAmount - Math.min(scheduleItem.paidAmount, scheduleItem.interestAmount);
    finalInterestAmount = Math.min(amount, remainingInterest);
    finalPrincipalAmount = Math.max(0, amount - finalInterestAmount);
  }

  // Create payment record
  const payment = await Payment.create({
    investment: investmentId,
    investor: investment.investor._id,
    scheduleMonth,
    amount,
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMethod,
    referenceNumber,
    type: type || 'mixed',
    interestAmount: finalInterestAmount,
    principalAmount: finalPrincipalAmount,
    penaltyAmount: finalPenaltyAmount,
    bonusAmount: finalBonusAmount,
    notes,
    processedBy: req.user._id
  });

  // Update investment schedule
  scheduleItem.paidAmount += amount;
  if (scheduleItem.paidAmount >= scheduleItem.totalAmount) {
    scheduleItem.status = 'paid';
    scheduleItem.paidDate = payment.paymentDate;
  } else {
    scheduleItem.status = 'partial';
  }

  // Update investment totals
  investment.updatePaymentStatus();
  await investment.save();

  // Update investor totals
  await Investor.findByIdAndUpdate(investment.investor._id, {
    $inc: { totalReturns: amount }
  });

  // Populate for response
  await payment.populate([
    { path: 'investment', select: 'investmentId principalAmount' },
    { path: 'investor', select: 'investorId name email phone' },
    { path: 'processedBy', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    data: payment
  });
}));

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private (Admin, Finance Manager)
router.put('/:id', authenticate, authorize('admin', 'finance_manager'), [
  body('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']),
  body('verifiedBy').optional().isMongoId().withMessage('Invalid verifier ID'),
  body('notes').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  const { status, verifiedBy, notes } = req.body;

  // Update fields
  if (status) payment.status = status;
  if (notes !== undefined) payment.notes = notes;
  
  if (verifiedBy) {
    payment.verifiedBy = verifiedBy;
    payment.verifiedAt = new Date();
  }

  await payment.save();

  await payment.populate([
    { path: 'investment', select: 'investmentId principalAmount' },
    { path: 'investor', select: 'investorId name email phone' },
    { path: 'processedBy', select: 'name email' },
    { path: 'verifiedBy', select: 'name email' }
  ]);

  res.json({
    success: true,
    message: 'Payment updated successfully',
    data: payment
  });
}));

// @route   POST /api/payments/:id/receipt
// @desc    Upload payment receipt
// @access  Private (Admin, Finance Manager)
router.post('/:id/receipt', 
  authenticate, 
  authorize('admin', 'finance_manager'),
  uploadSingle('receipt'),
  handleUploadError,
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No receipt file uploaded' });
    }

    // Update payment with receipt info
    payment.receipt = {
      fileName: req.file.originalname,
      filePath: req.file.path,
      uploadDate: new Date()
    };

    await payment.save();

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: {
        receipt: payment.receipt
      }
    });
  })
);

// @route   GET /api/payments/stats/overview
// @desc    Get payments overview stats
// @access  Private (Admin, Finance Manager)
router.get('/stats/overview', authenticate, authorize('admin', 'finance_manager'), asyncHandler(async (req, res) => {
  const [
    totalPayments,
    completedPayments,
    pendingPayments,
    totalAmount,
    thisMonthPayments,
    paymentsByMethod
  ] = await Promise.all([
    Payment.countDocuments(),
    Payment.countDocuments({ status: 'completed' }),
    Payment.countDocuments({ status: 'pending' }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Payment.countDocuments({
      paymentDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      },
      status: 'completed'
    }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments: totalPayments - completedPayments - pendingPayments,
      totalAmount: totalAmount[0]?.total || 0,
      thisMonthPayments,
      averagePayment: completedPayments > 0 ? 
        Math.round(((totalAmount[0]?.total || 0) / completedPayments) * 100) / 100 : 0,
      paymentsByMethod
    }
  });
}));

// @route   GET /api/payments/bulk/template
// @desc    Download bulk payment upload template
// @access  Private (Admin, Finance Manager)
router.get('/bulk/template', authenticate, authorize('admin', 'finance_manager'), asyncHandler(async (req, res) => {
  // In a real application, you would generate and return a CSV/Excel template
  const csvTemplate = `Investment ID,Schedule Month,Amount,Payment Date,Payment Method,Reference Number,Notes
INVST000001,1,5000,2024-01-15,bank_transfer,TXN123456,Monthly interest payment
INVST000001,2,5000,2024-02-15,bank_transfer,TXN123457,Monthly interest payment`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=bulk_payment_template.csv');
  res.send(csvTemplate);
}));

export default router;