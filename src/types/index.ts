export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_manager' | 'investor';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface Investor {
  _id: string;
  investorId: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country: string;
  };
  kyc: {
    panNumber: string;
    aadharNumber: string;
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName: string;
    };
    documents?: {
      panCard?: string;
      aadharCard?: string;
      bankStatement?: string;
      signature?: string;
    };
  };
  agreements?: Array<{
    fileName: string;
    filePath: string;
    uploadDate: string;
  }>;
  totalInvestment: number;
  activeInvestments: number;
  totalReturns: number;
  status: 'active' | 'inactive' | 'blocked';
  userId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  _id: string;
  planId: string;
  name: string;
  description?: string;
  interestType: 'flat' | 'reducing';
  interestRate: number;
  minInvestment: number;
  maxInvestment: number;
  tenure: number;
  interestPayoutFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  principalRepayment: {
    percentage: number;
    startFromMonth: number;
  };
  isActive: boolean;
  features?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  totalInvestors: number;
  totalInvestment: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  _id: string;
  investmentId: string;
  investor: {
    _id: string;
    investorId: string;
    name: string;
    email: string;
    phone: string;
  };
  plan: {
    _id: string;
    planId: string;
    name: string;
    interestType: string;
    interestRate: number;
    tenure: number;
  };
  principalAmount: number;
  investmentDate: string;
  maturityDate: string;
  status: 'active' | 'completed' | 'closed' | 'defaulted';
  interestRate: number;
  interestType: string;
  tenure: number;
  totalExpectedReturns: number;
  totalInterestExpected: number;
  totalPaidAmount: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  remainingAmount: number;
  schedule: PaymentSchedule[];
  notes?: string;
  documents?: Array<{
    fileName: string;
    filePath: string;
    uploadDate: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSchedule {
  month: number;
  dueDate: string;
  interestAmount: number;
  principalAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  paidAmount: number;
  paidDate?: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  investment: {
    _id: string;
    investmentId: string;
    principalAmount: number;
  };
  investor: {
    _id: string;
    investorId: string;
    name: string;
    email: string;
    phone: string;
  };
  scheduleMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'interest' | 'principal' | 'mixed' | 'penalty' | 'bonus';
  interestAmount: number;
  principalAmount: number;
  penaltyAmount: number;
  bonusAmount: number;
  notes?: string;
  receipt?: {
    fileName: string;
    filePath: string;
    uploadDate: string;
  };
  processedBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalInvestments: number;
  activeInvestments: number;
  completedInvestments: number;
  totalValue: number;
  totalPaid: number;
  remainingValue: number;
  overduePayments: number;
  averageInvestmentSize: number;
}

export interface InvestorStats {
  totalInvestors: number;
  activeInvestors: number;
  inactiveInvestors: number;
  newThisMonth: number;
  totalInvestment: number;
  averageInvestment: number;
}

export interface PaymentStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAmount: number;
  thisMonthPayments: number;
  averagePayment: number;
  paymentsByMethod: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

export interface Settings {
  _id: string;
  company: {
    name: string;
    logo?: string;
    email: string;
    phone: string;
    address: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country: string;
    };
    website?: string;
    taxId?: string;
    registrationNumber?: string;
  };
  financial: {
    defaultCurrency: string;
    currencySymbol: string;
    financialYearStart: string;
    interestCalculationMethod: string;
    defaultLateFee: number;
    gracePeriodDays: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    paymentReminders: {
      enabled: boolean;
      daysBefore: number;
    };
    overdueAlerts: {
      enabled: boolean;
      frequency: string;
    };
    investmentMaturity: {
      enabled: boolean;
      daysBefore: number;
    };
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
  };
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  errors?: any[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  [key: string]: any;
}