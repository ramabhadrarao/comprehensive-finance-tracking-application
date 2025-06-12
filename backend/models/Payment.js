import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: [true, 'Investment is required']
  },
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investor',
    required: [true, 'Investor is required']
  },
  scheduleMonth: {
    type: Number,
    required: [true, 'Schedule month is required'],
    min: 1
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'],
    required: [true, 'Payment method is required']
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  type: {
    type: String,
    enum: ['interest', 'principal', 'mixed', 'penalty', 'bonus'],
    default: 'mixed'
  },
  interestAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  principalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  penaltyAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  receipt: {
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', async function(next) {
  if (!this.paymentId) {
    const count = await mongoose.models.Payment.countDocuments();
    this.paymentId = `PAY${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

// Validate amount breakdown
paymentSchema.pre('save', function(next) {
  const totalBreakdown = this.interestAmount + this.principalAmount + 
                        this.penaltyAmount + this.bonusAmount;
  
  if (Math.abs(this.amount - totalBreakdown) > 0.01) {
    return next(new Error('Payment amount does not match the sum of breakdown amounts'));
  }
  
  next();
});

// Index for better performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ investment: 1 });
paymentSchema.index({ investor: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ scheduleMonth: 1 });

export default mongoose.model('Payment', paymentSchema);