// backend/models/Plan.js
import mongoose from 'mongoose';

// Repayment Plan Schema for flexible configuration
const repaymentPlanSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
    trim: true
  },
  paymentType: {
    type: String,
    enum: ['interest', 'interestWithPrincipal'],
    required: true
  },
  // Interest-only payment configuration
  interestPayment: {
    interestType: {
      type: String,
      enum: ['flat', 'reducing'],
      required: function() { return this.paymentType === 'interest'; }
    },
    interestRate: {
      type: Number,
      required: function() { return this.paymentType === 'interest'; },
      min: 0,
      max: 100
    },
    interestFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'others'],
      required: function() { return this.paymentType === 'interest'; }
    },
    interestStartDate: {
      type: Date,
      required: function() { return this.paymentType === 'interest' && this.interestFrequency === 'others'; }
    },
    principalRepaymentOption: {
      type: String,
      enum: ['fixed', 'flexible'],
      required: function() { return this.paymentType === 'interest'; }
    },
    // For flexible withdrawal option
    withdrawalAfterPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: function() { 
        return this.paymentType === 'interest' && this.principalRepaymentOption === 'flexible'; 
      }
    },
    principalSettlementTerm: {
      type: Number,
      min: 1,
      required: function() { 
        return this.paymentType === 'interest' && this.principalRepaymentOption === 'flexible'; 
      }
    }
  },
  // Interest with Principal payment configuration
  interestWithPrincipalPayment: {
    interestRate: {
      type: Number,
      required: function() { return this.paymentType === 'interestWithPrincipal'; },
      min: 0,
      max: 100
    },
    interestType: {
      type: String,
      enum: ['flat', 'reducing'],
      required: function() { return this.paymentType === 'interestWithPrincipal'; }
    },
    principalRepaymentPercentage: {
      type: Number,
      required: function() { return this.paymentType === 'interestWithPrincipal'; },
      min: 0,
      max: 100
    },
    paymentFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'half-yearly', 'yearly', 'others'],
      required: function() { return this.paymentType === 'interestWithPrincipal'; }
    },
    // For custom frequency
    interestPayoutDate: {
      type: Date,
      required: function() { 
        return this.paymentType === 'interestWithPrincipal' && this.paymentFrequency === 'others'; 
      }
    },
    principalPayoutDate: {
      type: Date,
      required: function() { 
        return this.paymentType === 'interestWithPrincipal' && this.paymentFrequency === 'others'; 
      }
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const planSchema = new mongoose.Schema({
  planId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  interestType: {
    type: String,
    enum: ['flat', 'reducing'],
    required: [true, 'Interest type is required']
  },
  interestRate: {
    type: Number,
    required: [true, 'Interest rate is required'],
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  minInvestment: {
    type: Number,
    required: [true, 'Minimum investment amount is required'],
    min: [1000, 'Minimum investment cannot be less than 1000']
  },
  maxInvestment: {
    type: Number,
    required: [true, 'Maximum investment amount is required'],
    validate: {
      validator: function(value) {
        return value >= this.minInvestment;
      },
      message: 'Maximum investment must be greater than minimum investment'
    }
  },
  tenure: {
    type: Number,
    required: [true, 'Investment tenure is required'],
    min: [1, 'Tenure must be at least 1 month'],
    max: [240, 'Tenure cannot exceed 240 months']
  },
  interestPayoutFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'half_yearly', 'yearly'],
    required: [true, 'Interest payout frequency is required']
  },
  principalRepayment: {
    percentage: {
      type: Number,
      required: [true, 'Principal repayment percentage is required'],
      min: [0, 'Principal repayment percentage cannot be negative'],
      max: [100, 'Principal repayment percentage cannot exceed 100%']
    },
    startFromMonth: {
      type: Number,
      required: [true, 'Principal repayment start month is required'],
      min: [1, 'Start month must be at least 1'],
      validate: {
        validator: function(value) {
          return value <= this.tenure;
        },
        message: 'Start month cannot exceed tenure'
      }
    }
  },
  // NEW: Repayment Plans Array
  repaymentPlans: [repaymentPlanSchema],
  
  // NEW: Default repayment plan reference
  defaultRepaymentPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepaymentPlan'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  features: [{
    type: String,
    trim: true
  }],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  totalInvestors: {
    type: Number,
    default: 0,
    min: [0, 'Total investors cannot be negative']
  },
  totalInvestment: {
    type: Number,
    default: 0,
    min: [0, 'Total investment cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate plan ID before saving
planSchema.pre('save', async function(next) {
  if (!this.planId) {
    const count = await mongoose.models.Plan.countDocuments();
    this.planId = `PLAN${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to add repayment plan
planSchema.methods.addRepaymentPlan = function(repaymentPlanData) {
  this.repaymentPlans.push(repaymentPlanData);
  
  // Set as default if it's the first plan or explicitly marked as default
  if (this.repaymentPlans.length === 1 || repaymentPlanData.isDefault) {
    this.defaultRepaymentPlan = this.repaymentPlans[this.repaymentPlans.length - 1]._id;
  }
  
  return this.save();
};

// Method to get active repayment plans
planSchema.methods.getActiveRepaymentPlans = function() {
  return this.repaymentPlans.filter(plan => plan.isActive);
};

// Calculate expected returns method (enhanced for repayment plans)
planSchema.methods.calculateExpectedReturns = function(principalAmount, repaymentPlanId = null) {
  let repaymentPlan = null;
  
  if (repaymentPlanId) {
    repaymentPlan = this.repaymentPlans.id(repaymentPlanId);
  } else if (this.defaultRepaymentPlan) {
    repaymentPlan = this.repaymentPlans.id(this.defaultRepaymentPlan);
  }
  
  if (repaymentPlan) {
    return this.calculateReturnsWithRepaymentPlan(principalAmount, repaymentPlan);
  }
  
  // Fallback to legacy calculation
  return this.calculateLegacyReturns(principalAmount);
};

// Legacy calculation method
planSchema.methods.calculateLegacyReturns = function(principalAmount) {
  const monthlyRate = this.interestRate / 100;
  let totalInterest = 0;

  if (this.interestType === 'flat') {
    totalInterest = principalAmount * monthlyRate * this.tenure;
  } else {
    // Reducing balance calculation
    let remainingPrincipal = principalAmount;
    const principalRepaymentAmount = (principalAmount * this.principalRepayment.percentage / 100) / 
      (this.tenure - this.principalRepayment.startFromMonth + 1);

    for (let month = 1; month <= this.tenure; month++) {
      totalInterest += remainingPrincipal * monthlyRate;
      
      if (month >= this.principalRepayment.startFromMonth) {
        remainingPrincipal -= principalRepaymentAmount;
        remainingPrincipal = Math.max(0, remainingPrincipal);
      }
    }
  }

  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalReturns: Math.round((principalAmount + totalInterest) * 100) / 100,
    effectiveRate: Math.round((totalInterest / principalAmount) * 100 * 100) / 100
  };
};

// New calculation method for repayment plans
planSchema.methods.calculateReturnsWithRepaymentPlan = function(principalAmount, repaymentPlan) {
  if (repaymentPlan.paymentType === 'interest') {
    return this.calculateInterestOnlyReturns(principalAmount, repaymentPlan);
  } else {
    return this.calculateInterestWithPrincipalReturns(principalAmount, repaymentPlan);
  }
};

// Interest-only calculation
planSchema.methods.calculateInterestOnlyReturns = function(principalAmount, repaymentPlan) {
  const interestConfig = repaymentPlan.interestPayment;
  const monthlyRate = interestConfig.interestRate / 100;
  let totalInterest = 0;
  
  if (interestConfig.interestType === 'flat') {
    totalInterest = principalAmount * monthlyRate * this.tenure;
  } else {
    // Reducing balance - but principal repaid based on option
    let remainingPrincipal = principalAmount;
    
    if (interestConfig.principalRepaymentOption === 'fixed') {
      // Principal repaid at the end
      totalInterest = principalAmount * monthlyRate * this.tenure;
    } else {
      // Flexible withdrawal
      const settlementStartMonth = Math.ceil(this.tenure * interestConfig.withdrawalAfterPercentage / 100);
      const monthlyPrincipalRepayment = principalAmount / interestConfig.principalSettlementTerm;
      
      for (let month = 1; month <= this.tenure; month++) {
        totalInterest += remainingPrincipal * monthlyRate;
        
        if (month >= settlementStartMonth) {
          remainingPrincipal -= monthlyPrincipalRepayment;
          remainingPrincipal = Math.max(0, remainingPrincipal);
        }
      }
    }
  }
  
  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalReturns: Math.round((principalAmount + totalInterest) * 100) / 100,
    effectiveRate: Math.round((totalInterest / principalAmount) * 100 * 100) / 100,
    repaymentType: 'interest'
  };
};

// Interest with principal calculation
planSchema.methods.calculateInterestWithPrincipalReturns = function(principalAmount, repaymentPlan) {
  const config = repaymentPlan.interestWithPrincipalPayment;
  const monthlyRate = config.interestRate / 100;
  const principalPercentage = config.principalRepaymentPercentage / 100;
  
  let totalInterest = 0;
  let remainingPrincipal = principalAmount;
  let monthlyPrincipalPayment = 0;
  
  // Calculate frequency-based payments
  let paymentFrequencyMonths = 1;
  switch (config.paymentFrequency) {
    case 'quarterly': paymentFrequencyMonths = 3; break;
    case 'half-yearly': paymentFrequencyMonths = 6; break;
    case 'yearly': paymentFrequencyMonths = 12; break;
    case 'others': paymentFrequencyMonths = 1; break; // Custom handling
  }
  
  const totalPayments = Math.ceil(this.tenure / paymentFrequencyMonths);
  monthlyPrincipalPayment = (principalAmount * principalPercentage) / totalPayments;
  
  for (let month = 1; month <= this.tenure; month++) {
    if (config.interestType === 'flat') {
      totalInterest += principalAmount * monthlyRate;
    } else {
      totalInterest += remainingPrincipal * monthlyRate;
    }
    
    // Reduce principal at payment intervals
    if (month % paymentFrequencyMonths === 0) {
      remainingPrincipal -= monthlyPrincipalPayment;
      remainingPrincipal = Math.max(0, remainingPrincipal);
    }
  }
  
  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalReturns: Math.round((principalAmount + totalInterest) * 100) / 100,
    effectiveRate: Math.round((totalInterest / principalAmount) * 100 * 100) / 100,
    repaymentType: 'interestWithPrincipal'
  };
};

// Index for better performance
planSchema.index({ isActive: 1 });
planSchema.index({ interestType: 1 });
planSchema.index({ 'repaymentPlans.isActive': 1 });

export default mongoose.model('Plan', planSchema);