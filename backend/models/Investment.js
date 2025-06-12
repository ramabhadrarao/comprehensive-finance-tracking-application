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

const investmentSchema = new mongoose.Schema({
  investmentId: {
    type: String,
    unique: true,
    required: true
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
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  documents: [{
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
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
  next();
});

// Calculate schedule method
investmentSchema.methods.generateSchedule = function() {
  const schedule = [];
  const monthlyRate = this.interestRate / 100;
  let remainingPrincipal = this.principalAmount;
  const startDate = new Date(this.investmentDate);

  // Get plan details for principal repayment
  const principalRepaymentPercentage = this.plan.principalRepayment?.percentage || 0;
  const principalStartMonth = this.plan.principalRepayment?.startFromMonth || this.tenure + 1;
  
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

    // Principal repayment logic
    if (month >= principalStartMonth) {
      if (month === this.tenure) {
        // Last month - pay remaining principal
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

// Update payment status method
investmentSchema.methods.updatePaymentStatus = function() {
  const now = new Date();
  let totalPaid = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  this.schedule.forEach(payment => {
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
    }
  });

  this.totalPaidAmount = totalPaid;
  this.totalInterestPaid = totalInterestPaid;
  this.totalPrincipalPaid = totalPrincipalPaid;
  this.remainingAmount = this.totalExpectedReturns - totalPaid;

  // Update investment status
  if (this.remainingAmount <= 0) {
    this.status = 'completed';
  } else if (this.schedule.some(p => p.status === 'overdue')) {
    // Keep active status but note overdue payments exist
  }
};

// Index for better performance
investmentSchema.index({ investmentId: 1 });
investmentSchema.index({ investor: 1 });
investmentSchema.index({ plan: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ investmentDate: 1 });
investmentSchema.index({ maturityDate: 1 });

export default mongoose.model('Investment', investmentSchema);