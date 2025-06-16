// backend/models/Investment.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1
  },
  dueDate: {
    type: Date,
    required: true
  },
  interestAmount: {
    type: Number,
    required: true,
    min: 0
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  remainingPrincipal: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'partial'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidDate: {
    type: Date,
    default: null
  }
});

// Timeline/Activity Log Schema
const timelineSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['investment_created', 'payment_received', 'payment_overdue', 'document_uploaded', 'status_changed', 'note_added', 'schedule_updated'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Document Schema with categories
const documentSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['agreement', 'kyc', 'payment_proof', 'communication', 'legal', 'other'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const investmentSchema = new mongoose.Schema({
  investmentId: {
    type: String,
    unique: true
  },
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: [true, 'Investor is required']
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plan is required']
  },
  // NEW: Selected Repayment Plan
  selectedRepaymentPlan: {
    planType: {
      type: String,
      enum: ['existing', 'new'],
      required: true
    },
    // If existing plan is selected
    existingPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() { return this.selectedRepaymentPlan.planType === 'existing'; }
    },
    // If new/custom plan is configured
    customPlan: {
      paymentType: {
        type: String,
        enum: ['interest', 'interestWithPrincipal'],
        required: function() { return this.selectedRepaymentPlan.planType === 'new'; }
      },
      // Interest payment configuration
      interestPayment: {
        dateOfInvestment: Date,
        amountInvested: Number,
        tenure: Number,
        interestRate: Number,
        interestType: {
          type: String,
          enum: ['flat', 'reducing']
        },
        interestFrequency: {
          type: String,
          enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'others']
        },
        interestStartDate: Date,
        principalRepaymentOption: {
          type: String,
          enum: ['fixed', 'flexible']
        },
        withdrawalAfterPercentage: Number,
        principalSettlementTerm: Number
      },
      // Interest with Principal configuration
      interestWithPrincipalPayment: {
        interestRate: Number,
        interestType: {
          type: String,
          enum: ['flat', 'reducing']
        },
        dateOfInvestment: Date,
        investedAmount: Number,
        principalRepaymentPercentage: Number,
        paymentFrequency: {
          type: String,
          enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'others']
        },
        interestPayoutDate: Date,
        principalPayoutDate: Date
      }
    }
  },
  principalAmount: {
    type: Number,
    required: [true, 'Principal amount is required'],
    min: [1000, 'Principal amount cannot be less than 1000']
  },
  investmentDate: {
    type: Date,
    required: [true, 'Investment date is required'],
    default: Date.now
  },
  maturityDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'closed', 'defaulted'],
    default: 'active'
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0
  },
  interestType: {
    type: String,
    enum: ['flat', 'reducing'],
    required: true
  },
  tenure: {
    type: Number,
    required: true,
    min: 1
  },
  totalExpectedReturns: {
    type: Number,
    required: true,
    min: 0
  },
  totalInterestExpected: {
    type: Number,
    required: true,
    min: 0
  },
  totalPaidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInterestPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrincipalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  schedule: [scheduleSchema],
  
  // NEW: Enhanced document management
  documents: [documentSchema],
  
  // NEW: Timeline/Activity log
  timeline: [timelineSchema],
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  
  // NEW: Additional tracking fields
  riskAssessment: {
    score: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    factors: [String],
    lastUpdated: Date
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate investment ID before saving
investmentSchema.pre('save', async function(next) {
  if (!this.investmentId) {
    const count = await mongoose.models.Investment.countDocuments();
    this.investmentId = `INVST${String(count + 1).padStart(6, '0')}`;
  }
  
  // Add creation to timeline
  if (this.isNew) {
    this.timeline.push({
      type: 'investment_created',
      description: `Investment created for amount ${this.principalAmount}`,
      amount: this.principalAmount,
      performedBy: this.createdBy,
      metadata: {
        planId: this.plan,
        investorId: this.investor
      }
    });
  }
  
  next();
});

// Add document method
investmentSchema.methods.addDocument = function(documentData, uploadedBy) {
  const document = {
    ...documentData,
    uploadedBy
  };
  
  this.documents.push(document);
  
  // Add to timeline
  this.timeline.push({
    type: 'document_uploaded',
    description: `Document uploaded: ${documentData.originalName}`,
    performedBy: uploadedBy,
    metadata: {
      category: documentData.category,
      fileName: documentData.fileName
    }
  });
  
  return this.save();
};

// Add timeline entry method
investmentSchema.methods.addTimelineEntry = function(type, description, performedBy, amount = 0, metadata = {}) {
  this.timeline.push({
    type,
    description,
    amount,
    performedBy,
    metadata
  });
  
  return this.save();
};

// Get documents by category
investmentSchema.methods.getDocumentsByCategory = function(category) {
  return this.documents.filter(doc => doc.category === category && doc.isActive);
};

// Enhanced schedule generation with repayment plan support
investmentSchema.methods.generateSchedule = function() {
  const schedule = [];
  let remainingPrincipal = this.principalAmount;
  const startDate = new Date(this.investmentDate);

  // Check if custom repayment plan is configured
  if (this.selectedRepaymentPlan && this.selectedRepaymentPlan.planType === 'new') {
    return this.generateCustomSchedule();
  }
  
  // Fallback to legacy schedule generation
  return this.generateLegacySchedule();
};

// Generate schedule based on custom repayment plan
investmentSchema.methods.generateCustomSchedule = function() {
  const schedule = [];
  const customPlan = this.selectedRepaymentPlan.customPlan;
  const startDate = new Date(this.investmentDate);
  
  if (customPlan.paymentType === 'interest') {
    return this.generateInterestOnlySchedule(customPlan.interestPayment, startDate);
  } else {
    return this.generateInterestWithPrincipalSchedule(customPlan.interestWithPrincipalPayment, startDate);
  }
};

// Interest-only schedule generation
investmentSchema.methods.generateInterestOnlySchedule = function(config, startDate) {
  const schedule = [];
  let remainingPrincipal = this.principalAmount;
  const monthlyRate = config.interestRate / 100;
  
  // Generate interest payments
  for (let month = 1; month <= config.tenure; month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + month);
    
    let interestAmount = 0;
    let principalAmount = 0;
    
    if (config.interestType === 'flat') {
      interestAmount = this.principalAmount * monthlyRate;
    } else {
      interestAmount = remainingPrincipal * monthlyRate;
    }
    
    // Handle principal repayment based on option
    if (config.principalRepaymentOption === 'fixed' && month === config.tenure) {
      // Principal at the end
      principalAmount = remainingPrincipal;
      remainingPrincipal = 0;
    } else if (config.principalRepaymentOption === 'flexible') {
      // Flexible withdrawal logic
      const settlementStartMonth = Math.ceil(config.tenure * config.withdrawalAfterPercentage / 100);
      if (month >= settlementStartMonth) {
        const monthlyPrincipal = this.principalAmount / config.principalSettlementTerm;
        principalAmount = Math.min(monthlyPrincipal, remainingPrincipal);
        remainingPrincipal -= principalAmount;
      }
    }
    
    schedule.push({
      month,
      dueDate,
      interestAmount: Math.round(interestAmount * 100) / 100,
      principalAmount: Math.round(principalAmount * 100) / 100,
      totalAmount: Math.round((interestAmount + principalAmount) * 100) / 100,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      status: 'pending',
      paidAmount: 0,
      paidDate: null
    });
  }
  
  return schedule;
};

// Interest with Principal schedule generation
investmentSchema.methods.generateInterestWithPrincipalSchedule = function(config, startDate) {
  const schedule = [];
  let remainingPrincipal = this.principalAmount;
  const monthlyInterestRate = config.interestRate / 100;
  const principalPercentage = config.principalRepaymentPercentage / 100;
  
  // Calculate payment frequency
  let frequencyMonths = 1;
  switch (config.paymentFrequency) {
    case 'quarterly': frequencyMonths = 3; break;
    case 'half-yearly': frequencyMonths = 6; break;
    case 'yearly': frequencyMonths = 12; break;
    case 'others': frequencyMonths = 1; break; // Handle custom dates separately
  }
  
  const totalPaymentPeriods = Math.ceil(this.tenure / frequencyMonths);
  const principalPerPayment = (this.principalAmount * principalPercentage) / totalPaymentPeriods;
  
  for (let month = 1; month <= this.tenure; month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + month);
    
    let interestAmount = 0;
    let principalAmount = 0;
    
    // Calculate interest
    if (config.interestType === 'flat') {
      interestAmount = this.principalAmount * monthlyInterestRate;
    } else {
      interestAmount = remainingPrincipal * monthlyInterestRate;
    }
    
    // Calculate principal payment at frequency intervals
    if (month % frequencyMonths === 0 || month === this.tenure) {
      principalAmount = Math.min(principalPerPayment, remainingPrincipal);
      remainingPrincipal -= principalAmount;
    }
    
    schedule.push({
      month,
      dueDate,
      interestAmount: Math.round(interestAmount * 100) / 100,
      principalAmount: Math.round(principalAmount * 100) / 100,
      totalAmount: Math.round((interestAmount + principalAmount) * 100) / 100,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      status: 'pending',
      paidAmount: 0,
      paidDate: null
    });
  }
  
  return schedule;
};

// Legacy schedule generation (existing logic)
investmentSchema.methods.generateLegacySchedule = function() {
  const schedule = [];
  const monthlyRate = this.interestRate / 100;
  let remainingPrincipal = this.principalAmount;
  const startDate = new Date(this.investmentDate);

  // Handle both populated and non-populated plan
  let principalRepaymentPercentage = 0;
  let principalStartMonth = this.tenure + 1;
  
  if (this.plan && typeof this.plan === 'object' && this.plan.principalRepayment) {
    principalRepaymentPercentage = this.plan.principalRepayment.percentage || 0;
    principalStartMonth = this.plan.principalRepayment.startFromMonth || this.tenure + 1;
  } else {
    if (this.interestType === 'flat') {
      principalRepaymentPercentage = 100;
      principalStartMonth = this.tenure;
    } else {
      principalRepaymentPercentage = 50;
      principalStartMonth = Math.floor(this.tenure / 2);
    }
  }
  
  const totalPrincipalPayments = Math.max(1, this.tenure - principalStartMonth + 1);
  const monthlyPrincipalAmount = principalRepaymentPercentage > 0 ? 
    (this.principalAmount * principalRepaymentPercentage / 100) / totalPrincipalPayments : 0;

  for (let month = 1; month <= this.tenure; month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + month);

    let interestAmount = 0;
    let principalAmount = 0;

    if (this.interestType === 'flat') {
      interestAmount = this.principalAmount * monthlyRate;
    } else {
      interestAmount = remainingPrincipal * monthlyRate;
    }

    if (month >= principalStartMonth) {
      if (month === this.tenure) {
        principalAmount = remainingPrincipal;
      } else {
        principalAmount = monthlyPrincipalAmount;
      }
      remainingPrincipal -= principalAmount;
      remainingPrincipal = Math.max(0, remainingPrincipal);
    }

    schedule.push({
      month,
      dueDate,
      interestAmount: Math.round(interestAmount * 100) / 100,
      principalAmount: Math.round(principalAmount * 100) / 100,
      totalAmount: Math.round((interestAmount + principalAmount) * 100) / 100,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
      status: 'pending',
      paidAmount: 0,
      paidDate: null
    });
  }

  return schedule;
};

// Update payment status method (enhanced with timeline)
investmentSchema.methods.updatePaymentStatus = function() {
  const now = new Date();
  let totalPaid = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let statusChanged = false;

  this.schedule.forEach(payment => {
    const oldStatus = payment.status;
    
    if (payment.status === 'paid') {
      totalPaid += payment.paidAmount;
      totalInterestPaid += Math.min(payment.paidAmount, payment.interestAmount);
      totalPrincipalPaid += Math.max(0, payment.paidAmount - payment.interestAmount);
    } else if (payment.status === 'partial') {
      totalPaid += payment.paidAmount;
      totalInterestPaid += Math.min(payment.paidAmount, payment.interestAmount);
      totalPrincipalPaid += Math.max(0, payment.paidAmount - payment.interestAmount);
    }

    // Update overdue status
    if (payment.status === 'pending' && payment.dueDate < now) {
      payment.status = 'overdue';
      statusChanged = true;
    }
  });

  this.totalPaidAmount = totalPaid;
  this.totalInterestPaid = totalInterestPaid;
  this.totalPrincipalPaid = totalPrincipalPaid;
  this.remainingAmount = this.totalExpectedReturns - totalPaid;

  // Update investment status
  const oldInvestmentStatus = this.status;
  if (this.remainingAmount <= 0) {
    this.status = 'completed';
  }
  
  // Add timeline entry for status changes
  if (statusChanged || oldInvestmentStatus !== this.status) {
    this.timeline.push({
      type: 'status_changed',
      description: `Investment status updated to ${this.status}`,
      performedBy: this.createdBy, // This should be updated to actual user performing the action
      metadata: {
        oldStatus: oldInvestmentStatus,
        newStatus: this.status
      }
    });
  }
};

// Index for better performance
investmentSchema.index({ investor: 1 });
investmentSchema.index({ plan: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ investmentDate: 1 });
investmentSchema.index({ maturityDate: 1 });
investmentSchema.index({ 'documents.category': 1 });
investmentSchema.index({ 'documents.isActive': 1 });
investmentSchema.index({ 'timeline.type': 1 });
investmentSchema.index({ 'timeline.date': 1 });

export default mongoose.model('Investment', investmentSchema);