import mongoose from 'mongoose';

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

// Calculate expected returns method
planSchema.methods.calculateExpectedReturns = function(principalAmount) {
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

// Index for better performance - Remove duplicate indexes
planSchema.index({ isActive: 1 });
planSchema.index({ interestType: 1 });

export default mongoose.model('Plan', planSchema);