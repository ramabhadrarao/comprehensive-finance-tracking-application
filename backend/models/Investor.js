import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
  panNumber: {
    type: String,
    required: [true, 'PAN number is required'],
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  aadharNumber: {
    type: String,
    required: [true, 'Aadhar number is required'],
    match: [/^\d{12}$/, 'Please enter a valid 12-digit Aadhar number']
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Account number is required']
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required']
    },
    branchName: {
      type: String,
      required: [true, 'Branch name is required']
    }
  },
  documents: {
    panCard: String,
    aadharCard: String,
    bankStatement: String,
    signature: String
  }
});

const investorSchema = new mongoose.Schema({
  investorId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  kyc: {
    type: kycSchema,
    required: [true, 'KYC details are required']
  },
  agreements: [{
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  totalInvestment: {
    type: Number,
    default: 0,
    min: [0, 'Total investment cannot be negative']
  },
  activeInvestments: {
    type: Number,
    default: 0,
    min: [0, 'Active investments cannot be negative']
  },
  totalReturns: {
    type: Number,
    default: 0,
    min: [0, 'Total returns cannot be negative']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate investor ID before saving
investorSchema.pre('save', async function(next) {
  if (!this.investorId) {
    const count = await mongoose.models.Investor.countDocuments();
    this.investorId = `INV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for better performance - Remove duplicate indexes
investorSchema.index({ email: 1 });
investorSchema.index({ 'kyc.panNumber': 1 });

export default mongoose.model('Investor', investorSchema);