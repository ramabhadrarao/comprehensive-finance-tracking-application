import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Investment from '../models/Investment.js';
import Investor from '../models/Investor.js';
import Plan from '../models/Plan.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   GET /api/investments
// @desc    Get all investments with pagination and filters
// @access  Private
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'completed', 'closed', 'defaulted']),
  query('investor').optional().isMongoId().withMessage('Invalid investor ID'),
  query('plan').optional().isMongoId().withMessage('Invalid plan ID')
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
  const investorId = req.query.investor;
  const planId = req.query.plan;

  // Build query
  let query = {};
  
  if (search) {
    query.$or = [
      { investmentId: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  if (investorId) {
    query.investor = investorId;
  }

  if (planId) {
    query.plan = planId;
  }

  // If user is investor role, only show their investments
  if (req.user.role === 'investor') {
    const investor = await Investor.findOne({ userId: req.user._id });
    if (investor) {
      query.investor = investor._id;
    } else {
      query.investor = null; // No investments if no investor profile
    }
  }

  const [investments, total] = await Promise.all([
    Investment.find(query)
      .populate('investor', 'investorId name email phone')
      .populate('plan', 'planId name interestType interestRate tenure')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Investment.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: investments,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      limit
    }
  });
}));

// @route   GET /api/investments/:id
// @desc    Get single investment with schedule
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };

  // If user is investor role, ensure they can only see their investments
  if (req.user.role === 'investor') {
    const investor = await Investor.findOne({ userId: req.user._id });
    if (investor) {
      query.investor = investor._id;
    } else {
      return res.status(404).json({ message: 'Investment not found' });
    }
  }

  const investment = await Investment.findOne(query)
    .populate('investor', 'investorId name email phone address')
    .populate('plan', 'planId name description interestType interestRate tenure interestPayoutFrequency principalRepayment')
    .populate('createdBy', 'name email');

  if (!investment) {
    return res.status(404).json({ message: 'Investment not found' });
  }

  // Update payment status before sending response
  investment.updatePaymentStatus();
  await investment.save();

  res.json({
    success: true,
    data: investment
  });
}));

// @route   POST /api/investments
// @desc    Create new investment
// @access  Private (Admin, Finance Manager)
router.post('/', authenticate, authorize('admin', 'finance_manager'), [
  body('investor').isMongoId().withMessage('Valid investor ID is required'),
  body('plan').isMongoId().withMessage('Valid plan ID is required'),
  body('principalAmount').isFloat({ min: 1 }).withMessage('Principal amount must be greater than 0'),
  body('investmentDate').optional().isISO8601().withMessage('Invalid investment date'),
  body('notes').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const { investor: investorId, plan: planId, principalAmount, investmentDate, notes } = req.body;

  // Verify investor exists
  const investor = await Investor.findById(investorId);
  if (!investor) {
    return res.status(404).json({ message: 'Investor not found' });
  }

  if (investor.status !== 'active') {
    return res.status(400).json({ message: 'Cannot create investment for inactive investor' });
  }

  // Verify plan exists and is active
  const plan = await Plan.findById(planId);
  if (!plan) {
    return res.status(404).json({ message: 'Plan not found' });
  }

  if (!plan.isActive) {
    return res.status(400).json({ message: 'Cannot invest in inactive plan' });
  }

  // Validate investment amount
  if (principalAmount < plan.minInvestment || principalAmount > plan.maxInvestment) {
    return res.status(400).json({ 
      message: `Investment amount must be between ₹${plan.minInvestment} and ₹${plan.maxInvestment}` 
    });
  }

  // Calculate expected returns
  const returns = plan.calculateExpectedReturns(principalAmount);
  
  // Set investment date
  const invDate = investmentDate ? new Date(investmentDate) : new Date();
  const maturityDate = new Date(invDate);
  maturityDate.setMonth(maturityDate.getMonth() + plan.tenure);

  // Create investment
  const investment = new Investment({
    investor: investorId,
    plan: planId,
    principalAmount,
    investmentDate: invDate,
    maturityDate,
    interestRate: plan.interestRate,
    interestType: plan.interestType,
    tenure: plan.tenure,
    totalExpectedReturns: returns.totalReturns,
    totalInterestExpected: returns.totalInterest,
    remainingAmount: returns.totalReturns,
    notes,
    createdBy: req.user._id
  });

  // Generate payment schedule
  investment.schedule = investment.generateSchedule();
  await investment.save();

  // Update investor and plan statistics
  await Promise.all([
    Investor.findByIdAndUpdate(investorId, {
      $inc: { 
        totalInvestment: principalAmount,
        activeInvestments: 1
      }
    }),
    Plan.findByIdAndUpdate(planId, {
      $inc: { 
        totalInvestors: 1,
        totalInvestment: principalAmount
      }
    })
  ]);

  // Populate for response
  await investment.populate([
    { path: 'investor', select: 'investorId name email phone' },
    { path: 'plan', select: 'planId name interestType interestRate tenure' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Investment created successfully',
    data: investment
  });
}));

// @route   PUT /api/investments/:id
// @desc    Update investment
// @access  Private (Admin, Finance Manager)
router.put('/:id', authenticate, authorize('admin', 'finance_manager'), [
  body('status').optional().isIn(['active', 'completed', 'closed', 'defaulted']),
  body('notes').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    return res.status(404).json({ message: 'Investment not found' });
  }

  const { status, notes } = req.body;
  const oldStatus = investment.status;

  // Update allowed fields
  if (status) investment.status = status;
  if (notes !== undefined) investment.notes = notes;

  await investment.save();

  // Update investor statistics if status changed
  if (status && status !== oldStatus) {
    const investor = await Investor.findById(investment.investor);
    if (investor) {
      if (oldStatus === 'active' && status !== 'active') {
        investor.activeInvestments = Math.max(0, investor.activeInvestments - 1);
      } else if (oldStatus !== 'active' && status === 'active') {
        investor.activeInvestments += 1;
      }
      await investor.save();
    }
  }

  await investment.populate([
    { path: 'investor', select: 'investorId name email phone' },
    { path: 'plan', select: 'planId name interestType interestRate tenure' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.json({
    success: true,
    message: 'Investment updated successfully',
    data: investment
  });
}));

// @route   GET /api/investments/:id/schedule
// @desc    Get investment payment schedule
// @access  Private
router.get('/:id/schedule', authenticate, asyncHandler(async (req, res) => {
  let query = { _id: req.params.id };

  // If user is investor role, ensure they can only see their investments
  if (req.user.role === 'investor') {
    const investor = await Investor.findOne({ userId: req.user._id });
    if (investor) {
      query.investor = investor._id;
    } else {
      return res.status(404).json({ message: 'Investment not found' });
    }
  }

  const investment = await Investment.findOne(query)
    .select('investmentId schedule totalExpectedReturns totalPaidAmount remainingAmount')
    .populate('investor', 'investorId name')
    .populate('plan', 'planId name');

  if (!investment) {
    return res.status(404).json({ message: 'Investment not found' });
  }

  // Update payment status
  investment.updatePaymentStatus();
  await investment.save();

  res.json({
    success: true,
    data: {
      investment: {
        investmentId: investment.investmentId,
        investor: investment.investor,
        plan: investment.plan,
        totalExpectedReturns: investment.totalExpectedReturns,
        totalPaidAmount: investment.totalPaidAmount,
        remainingAmount: investment.remainingAmount
      },
      schedule: investment.schedule
    }
  });
}));

// @route   GET /api/investments/stats/overview
// @desc    Get investments overview stats
// @access  Private (Admin, Finance Manager)
router.get('/stats/overview', authenticate, authorize('admin', 'finance_manager'), asyncHandler(async (req, res) => {
  const [
    totalInvestments,
    activeInvestments,
    completedInvestments,
    totalValue,
    totalPaid,
    overduePayments
  ] = await Promise.all([
    Investment.countDocuments(),
    Investment.countDocuments({ status: 'active' }),
    Investment.countDocuments({ status: 'completed' }),
    Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$principalAmount' } } }
    ]),
    Investment.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPaidAmount' } } }
    ]),
    Investment.aggregate([
      { $unwind: '$schedule' },
      { 
        $match: { 
          'schedule.status': 'overdue',
          status: 'active'
        } 
      },
      { $count: 'count' }
    ])
  ]);

  const avgInvestmentSize = totalInvestments > 0 ? 
    (totalValue[0]?.total || 0) / totalInvestments : 0;

  res.json({
    success: true,
    data: {
      totalInvestments,
      activeInvestments,
      completedInvestments,
      totalValue: totalValue[0]?.total || 0,
      totalPaid: totalPaid[0]?.total || 0,
      remainingValue: (totalValue[0]?.total || 0) - (totalPaid[0]?.total || 0),
      overduePayments: overduePayments[0]?.count || 0,
      averageInvestmentSize: Math.round(avgInvestmentSize * 100) / 100
    }
  });
}));

// @route   GET /api/investments/due/upcoming
// @desc    Get upcoming due payments
// @access  Private (Admin, Finance Manager)
router.get('/due/upcoming', authenticate, authorize('admin', 'finance_manager'), [
  query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
], asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const upcomingPayments = await Investment.aggregate([
    { $match: { status: 'active' } },
    { $unwind: '$schedule' },
    {
      $match: {
        'schedule.status': 'pending',
        'schedule.dueDate': {
          $gte: new Date(),
          $lte: endDate
        }
      }
    },
    {
      $lookup: {
        from: 'investors',
        localField: 'investor',
        foreignField: '_id',
        as: 'investorInfo'
      }
    },
    {
      $lookup: {
        from: 'plans',
        localField: 'plan',
        foreignField: '_id',
        as: 'planInfo'
      }
    },
    {
      $project: {
        investmentId: 1,
        investor: { $arrayElemAt: ['$investorInfo', 0] },
        plan: { $arrayElemAt: ['$planInfo', 0] },
        month: '$schedule.month',
        dueDate: '$schedule.dueDate',
        totalAmount: '$schedule.totalAmount',
        interestAmount: '$schedule.interestAmount',
        principalAmount: '$schedule.principalAmount'
      }
    },
    { $sort: { dueDate: 1 } }
  ]);

  res.json({
    success: true,
    data: upcomingPayments.map(payment => ({
      investmentId: payment.investmentId,
      investor: {
        id: payment.investor._id,
        investorId: payment.investor.investorId,
        name: payment.investor.name,
        email: payment.investor.email,
        phone: payment.investor.phone
      },
      plan: {
        id: payment.plan._id,
        name: payment.plan.name
      },
      month: payment.month,
      dueDate: payment.dueDate,
      totalAmount: payment.totalAmount,
      interestAmount: payment.interestAmount,
      principalAmount: payment.principalAmount
    }))
  });
}));

export default router;