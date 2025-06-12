import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Investor from '../models/Investor.js';
import Investment from '../models/Investment.js';
import Payment from '../models/Payment.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/investors
// @desc    Get all investors with pagination and search
// @access  Private (Admin, Finance Manager)
router.get('/', authenticate, authorize('admin', 'finance_manager'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'blocked'])
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

  // Build query
  let query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { investorId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  const [investors, total] = await Promise.all([
    Investor.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Investor.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: investors,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  });
}));

// @route   GET /api/investors/:id
// @desc    Get single investor
// @access  Private (Admin, Finance Manager)
router.get('/:id', authenticate, authorize('admin', 'finance_manager'), asyncHandler(async (req, res) => {
  const investor = await Investor.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('userId', 'name email lastLogin');

  if (!investor) {
    return res.status(404).json({ message: 'Investor not found' });
  }

  // Get investments and payments summary
  const [investments, totalPayments] = await Promise.all([
    Investment.find({ investor: investor._id })
      .populate('plan', 'name interestRate')
      .sort({ createdAt: -1 }),
    Payment.aggregate([
      { $match: { investor: investor._id } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalInterest: { $sum: '$interestAmount' },
          totalPrincipal: { $sum: '$principalAmount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  res.json({
    success: true,
    data: {
      ...investor.toObject(),
      investments,
      paymentSummary: totalPayments[0] || {
        totalAmount: 0,
        totalInterest: 0,
        totalPrincipal: 0,
        count: 0
      }
    }
  });
}));

// @route   POST /api/investors
// @desc    Create new investor
// @access  Private (Admin, Finance Manager)
router.post('/', authenticate, authorize('admin', 'finance_manager'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.pincode').optional().matches(/^\d{6}$/).withMessage('Please enter a valid 6-digit pincode'),
  body('kyc.panNumber').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Please enter a valid PAN number'),
  body('kyc.aadharNumber').matches(/^\d{12}$/).withMessage('Please enter a valid 12-digit Aadhar number'),
  body('kyc.bankDetails.accountNumber').notEmpty().withMessage('Account number is required'),
  body('kyc.bankDetails.ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Please enter a valid IFSC code'),
  body('kyc.bankDetails.bankName').notEmpty().withMessage('Bank name is required'),
  body('kyc.bankDetails.branchName').notEmpty().withMessage('Branch name is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { name, email, phone, address, kyc } = req.body;

  // Check if investor already exists
  const existingInvestor = await Investor.findOne({
    $or: [
      { email },
      { 'kyc.panNumber': kyc.panNumber },
      { 'kyc.aadharNumber': kyc.aadharNumber }
    ]
  });

  if (existingInvestor) {
    return res.status(400).json({ 
      message: 'Investor already exists with this email, PAN, or Aadhar number' 
    });
  }

  const investor = await Investor.create({
    name,
    email,
    phone,
    address,
    kyc,
    createdBy: req.user._id
  });

  await investor.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Investor created successfully',
    data: investor
  });
}));

// @route   PUT /api/investors/:id
// @desc    Update investor
// @access  Private (Admin, Finance Manager)
router.put('/:id', authenticate, authorize('admin', 'finance_manager'), [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('status').optional().isIn(['active', 'inactive', 'blocked'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const investor = await Investor.findById(req.params.id);
  if (!investor) {
    return res.status(404).json({ message: 'Investor not found' });
  }

  // Check for conflicts if email, PAN, or Aadhar is being updated
  const { email, kyc } = req.body;
  if (email || kyc) {
    const conflicts = {};
    if (email && email !== investor.email) conflicts.email = email;
    if (kyc?.panNumber && kyc.panNumber !== investor.kyc.panNumber) {
      conflicts['kyc.panNumber'] = kyc.panNumber;
    }
    if (kyc?.aadharNumber && kyc.aadharNumber !== investor.kyc.aadharNumber) {
      conflicts['kyc.aadharNumber'] = kyc.aadharNumber;
    }

    if (Object.keys(conflicts).length > 0) {
      const existingInvestor = await Investor.findOne({
        _id: { $ne: investor._id },
        $or: Object.entries(conflicts).map(([key, value]) => ({ [key]: value }))
      });

      if (existingInvestor) {
        return res.status(400).json({ 
          message: 'Another investor already exists with this email, PAN, or Aadhar number' 
        });
      }
    }
  }

  // Update investor
  Object.assign(investor, req.body);
  await investor.save();
  await investor.populate('createdBy', 'name email');

  res.json({
    success: true,
    message: 'Investor updated successfully',
    data: investor
  });
}));

// @route   DELETE /api/investors/:id
// @desc    Delete investor
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const investor = await Investor.findById(req.params.id);
  if (!investor) {
    return res.status(404).json({ message: 'Investor not found' });
  }

  // Check if investor has active investments
  const activeInvestments = await Investment.countDocuments({
    investor: investor._id,
    status: 'active'
  });

  if (activeInvestments > 0) {
    return res.status(400).json({ 
      message: 'Cannot delete investor with active investments' 
    });
  }

  await investor.deleteOne();

  res.json({
    success: true,
    message: 'Investor deleted successfully'
  });
}));

// @route   POST /api/investors/:id/documents
// @desc    Upload investor documents
// @access  Private (Admin, Finance Manager)
router.post('/:id/documents', 
  authenticate, 
  authorize('admin', 'finance_manager'),
  uploadMultiple('documents'),
  handleUploadError,
  asyncHandler(async (req, res) => {
    const investor = await Investor.findById(req.params.id);
    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Add uploaded files to investor's agreements
    const newDocuments = req.files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      uploadDate: new Date()
    }));

    investor.agreements.push(...newDocuments);
    await investor.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        uploaded: newDocuments.length,
        documents: investor.agreements
      }
    });
  })
);

// @route   GET /api/investors/stats/overview
// @desc    Get investors overview stats
// @access  Private (Admin, Finance Manager)
router.get('/stats/overview', authenticate, authorize('admin', 'finance_manager'), asyncHandler(async (req, res) => {
  const [
    totalInvestors,
    activeInvestors,
    newThisMonth,
    totalInvestment,
    averageInvestment
  ] = await Promise.all([
    Investor.countDocuments(),
    Investor.countDocuments({ status: 'active' }),
    Investor.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }),
    Investor.aggregate([
      { $group: { _id: null, total: { $sum: '$totalInvestment' } } }
    ]),
    Investor.aggregate([
      { $group: { _id: null, average: { $avg: '$totalInvestment' } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalInvestors,
      activeInvestors,
      inactiveInvestors: totalInvestors - activeInvestors,
      newThisMonth,
      totalInvestment: totalInvestment[0]?.total || 0,
      averageInvestment: averageInvestment[0]?.average || 0
    }
  });
}));

export default router;