// src/types/index.ts - Complete Type Definitions

// ================================
// USER & AUTHENTICATION TYPES
// ================================

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

// ================================
// INVESTOR TYPES
// ================================

export interface InvestorAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
}

export interface InvestorKYC {
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
}

export interface InvestorAgreement {
  fileName: string;
  filePath: string;
  uploadDate: string;
}

export interface Investor {
  _id: string;
  investorId: string;
  name: string;
  email: string;
  phone: string;
  address: InvestorAddress;
  kyc: InvestorKYC;
  agreements?: InvestorAgreement[];
  totalInvestment: number;
  activeInvestments: number;
  totalReturns: number;
  status: 'active' | 'inactive' | 'blocked';
  userId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// PLAN TYPES
// ================================

export interface PlanPrincipalRepayment {
  percentage: number;
  startFromMonth: number;
}

export interface RepaymentPlanInterestPayment {
  interestType: 'flat' | 'reducing';
  interestRate: number;
  interestFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
  interestStartDate?: string;
  principalRepaymentOption: 'fixed' | 'flexible';
  withdrawalAfterPercentage?: number;
  principalSettlementTerm?: number;
}

export interface RepaymentPlanInterestWithPrincipal {
  interestRate: number;
  interestType: 'flat' | 'reducing';
  principalRepaymentPercentage: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'others';
  interestPayoutDate?: string;
  principalPayoutDate?: string;
}

export interface RepaymentPlan {
  _id: string;
  planName: string;
  paymentType: 'interest' | 'interestWithPrincipal';
  interestPayment?: RepaymentPlanInterestPayment;
  interestWithPrincipalPayment?: RepaymentPlanInterestWithPrincipal;
  isDefault: boolean;
  isActive: boolean;
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
  principalRepayment: PlanPrincipalRepayment;
  repaymentPlans?: RepaymentPlan[];
  defaultRepaymentPlan?: string;
  isActive: boolean;
  features?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  totalInvestors: number;
  totalInvestment: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// INVESTMENT TYPES
// ================================

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

export interface InvestmentDocument {
  _id: string;
  category: 'agreement' | 'kyc' | 'payment_proof' | 'communication' | 'legal' | 'other';
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  description?: string;
  isActive: boolean;
}

export interface TimelineEntry {
  _id: string;
  date: string;
  type: 'investment_created' | 'payment_received' | 'payment_overdue' | 'document_uploaded' | 'status_changed' | 'note_added' | 'communication';
  description: string;
  amount?: number;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  } | null;
  metadata?: any;
}

export interface SelectedRepaymentPlan {
  planType: 'existing' | 'new';
  existingPlanId?: string;
  customPlan?: {
    paymentType: 'interest' | 'interestWithPrincipal';
    interestPayment?: RepaymentPlanInterestPayment & {
      dateOfInvestment?: string;
      amountInvested?: number;
      tenure?: number;
    };
    interestWithPrincipalPayment?: RepaymentPlanInterestWithPrincipal & {
      dateOfInvestment?: string;
      investedAmount?: number;
    };
  };
}

export interface RiskAssessment {
  score: number;
  factors: string[];
  lastUpdated?: string;
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
    address?: InvestorAddress;
  };
  plan: {
    _id: string;
    planId: string;
    name: string;
    description?: string;
    interestType: string;
    interestRate: number;
    tenure: number;
    interestPayoutFrequency: string;
    principalRepayment: PlanPrincipalRepayment;
    repaymentPlans?: RepaymentPlan[];
  };
  selectedRepaymentPlan?: SelectedRepaymentPlan;
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
  documents?: InvestmentDocument[];
  timeline?: TimelineEntry[];
  notes?: string;
  riskAssessment?: RiskAssessment;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// PAYMENT TYPES
// ================================

export interface PaymentDocument {
  _id: string;
  category: 'receipt' | 'bank_statement' | 'cheque_copy' | 'upi_screenshot' | 'other';
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  description?: string;
}

export interface PaymentAuditEntry {
  action: 'created' | 'updated' | 'verified' | 'document_added' | 'document_removed' | 'status_changed';
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  details: any;
}

export interface Payment {
  _id: string;
  paymentId: string;
  investment: {
    _id: string;
    investmentId: string;
    principalAmount: number;
    maturityDate?: string;
  };
  investor: {
    _id: string;
    investorId: string;
    name: string;
    email: string;
    phone: string;
    address?: InvestorAddress;
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
  
  // Enhanced document support
  documents: PaymentDocument[];
  
  // Legacy receipt field (for backward compatibility)
  receipt?: {
    fileName: string;
    filePath: string;
    uploadDate: string;
  };
  
  processedBy: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedAt?: string;
  
  // Additional tracking
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedAt?: string;
  
  // Audit trail
  auditLog: PaymentAuditEntry[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFormData {
  investment: string;
  scheduleMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber?: string;
  type?: 'interest' | 'principal' | 'mixed' | 'penalty' | 'bonus';
  interestAmount?: number;
  principalAmount?: number;
  penaltyAmount?: number;
  bonusAmount?: number;
  notes?: string;
  documentCategory?: 'receipt' | 'bank_statement' | 'cheque_copy' | 'upi_screenshot' | 'other';
  documentDescription?: string;
}

export interface PaymentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  calculatedAmounts: {
    interest: number;
    principal: number;
    total: number;
  };
  requiredDocuments: string[];
  scheduleInfo: {
    dueDate: string;
    totalDue: number;
    alreadyPaid: number;
    remaining: number;
    status: string;
  };
}

export interface BulkPaymentResult {
  successful: Payment[];
  failed: Array<{
    data: any;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalAmount: number;
  };
}

export interface PaymentReconciliation {
  id: string;
  date: string;
  bankStatementFile?: string;
  matchedPayments: Array<{
    paymentId: string;
    bankTransactionId: string;
    amount: number;
    confidence: number;
  }>;
  unmatchedPayments: Payment[];
  unmatchedTransactions: Array<{
    transactionId: string;
    amount: number;
    date: string;
    description: string;
  }>;
  discrepancies: Array<{
    type: 'amount_mismatch' | 'date_mismatch' | 'missing_payment' | 'duplicate';
    description: string;
    paymentId?: string;
    transactionId?: string;
  }>;
  status: 'pending' | 'completed' | 'failed';
  summary: {
    totalBankAmount: number;
    totalPaymentAmount: number;
    difference: number;
    matchedCount: number;
    unmatchedCount: number;
  };
}

export interface PaymentDispute {
  _id: string;
  paymentId: string;
  type: 'amount_mismatch' | 'duplicate_payment' | 'unauthorized' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  evidenceFiles: Array<{
    fileName: string;
    filePath: string;
    uploadDate: string;
  }>;
  resolution?: {
    action: 'refund' | 'adjustment' | 'no_action' | 'escalate';
    description: string;
    amount?: number;
    resolvedBy: string;
    resolvedAt: string;
  };
  timeline: Array<{
    action: string;
    description: string;
    performedBy: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWorkflow {
  stage: 'recorded' | 'verified' | 'reconciled' | 'completed';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  nextAction?: string;
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
  history: Array<{
    stage: string;
    status: string;
    timestamp: string;
    performedBy: string;
    notes?: string;
  }>;
}

export interface PaymentNotification {
  _id: string;
  paymentId: string;
  type: 'confirmation' | 'verification_required' | 'document_request' | 'overdue_notice';
  message: string;
  channel: 'email' | 'sms' | 'both';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  recipient: {
    email?: string;
    phone?: string;
  };
  sentAt?: string;
  deliveredAt?: string;
  metadata?: any;
  createdAt: string;
}

export interface PaymentTemplate {
  _id: string;
  name: string;
  description: string;
  paymentMethod: string;
  defaultAmounts: {
    interestPercentage?: number;
    principalPercentage?: number;
    fixedAmount?: number;
  };
  requiredDocuments: string[];
  autoCalculation: boolean;
  isActive: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ================================
// STATISTICS & DASHBOARD TYPES
// ================================

export interface DashboardStats {
  totalInvestments: number;
  activeInvestments: number;
  completedInvestments: number;
  totalValue: number;
  totalPaid: number;
  remainingValue: number;
  overduePayments: number;
  averageInvestmentSize: number;
  documentStats?: any;
  repaymentPlanUsage?: any;
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
  documentsStats: Array<{
    _id: string;
    count: number;
  }>;
}

export interface PaymentDashboard {
  summary: {
    totalReceived: number;
    pendingPayments: number;
    overduePayments: number;
    thisMonthCollection: number;
  };
  recentPayments: Payment[];
  upcomingDue: Array<{
    investmentId: string;
    investor: string;
    dueDate: string;
    amount: number;
    daysRemaining: number;
  }>;
  paymentTrends: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  methodDistribution: Array<{
    method: string;
    percentage: number;
    amount: number;
  }>;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  plansByType: Array<{
    _id: string;
    count: number;
    averageRate: number;
  }>;
  mostPopularPlan: {
    _id: string;
    name: string;
    investmentCount: number;
    totalInvestment: number;
  } | null;
  repaymentPlanStats: Array<{
    _id: string;
    count: number;
  }>;
}

// ================================
// SETTINGS TYPES
// ================================

export interface CompanyAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country: string;
}

export interface CompanySettings {
  name: string;
  logo?: string;
  email: string;
  phone: string;
  address: CompanyAddress;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface FinancialSettings {
  defaultCurrency: string;
  currencySymbol: string;
  financialYearStart: string;
  interestCalculationMethod: string;
  defaultLateFee: number;
  gracePeriodDays: number;
}

export interface NotificationSettings {
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
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: string;
  retentionDays: number;
}

export interface Settings {
  _id: string;
  company: CompanySettings;
  financial: FinancialSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  backup: BackupSettings;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// API & UTILITY TYPES
// ================================

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

export interface SearchParams {
  query?: string;
  filters?: {
    [key: string]: any;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  limit?: number;
}

export interface FileUpload {
  file: File;
  category?: string;
  description?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  };
}

// ================================
// CHART & REPORT TYPES
// ================================

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ReportData {
  summary: any;
  details: any[];
  charts: {
    [key: string]: ChartData[] | TimeSeriesData[];
  };
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    [key: string]: any;
  };
  generatedAt: string;
  generatedBy: string;
}

// ================================
// WORKFLOW & NOTIFICATION TYPES
// ================================

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  notes?: string;
}

export interface Workflow {
  _id: string;
  name: string;
  description: string;
  entityType: 'investment' | 'payment' | 'investor' | 'plan';
  entityId: string;
  status: 'active' | 'completed' | 'cancelled';
  currentStep: number;
  steps: WorkflowStep[];
  createdBy: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  types: {
    paymentReminders: boolean;
    overdueAlerts: boolean;
    maturityNotices: boolean;
    documentRequests: boolean;
    statusUpdates: boolean;
    systemAlerts: boolean;
  };
  frequency: {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// ================================
// AUDIT & COMPLIANCE TYPES
// ================================

export interface AuditEntry {
  _id: string;
  entityType: 'user' | 'investor' | 'plan' | 'investment' | 'payment' | 'document';
  entityId: string;
  action: string;
  description: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  beforeData?: any;
  afterData?: any;
  metadata?: any;
}

export interface ComplianceCheck {
  _id: string;
  type: 'kyc' | 'aml' | 'tax' | 'regulatory' | 'internal';
  entityType: 'investor' | 'investment' | 'payment';
  entityId: string;
  status: 'pending' | 'passed' | 'failed' | 'requires_review';
  score?: number;
  details: {
    checks: Array<{
      name: string;
      status: 'passed' | 'failed' | 'warning';
      message: string;
    }>;
    documents: string[];
    reviewNotes?: string;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// INTEGRATION TYPES
// ================================

export interface ExternalIntegration {
  _id: string;
  name: string;
  type: 'banking' | 'payment_gateway' | 'accounting' | 'crm' | 'notification';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: {
    [key: string]: any;
  };
  credentials: {
    [key: string]: string;
  };
  lastSyncAt?: string;
  errorMessage?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: Array<{
    record: any;
    error: string;
  }>;
  summary: {
    [key: string]: any;
  };
  syncedAt: string;
}

// ================================
// EXPORT TYPES
// ================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    [key: string]: any;
  };
  includeDocuments?: boolean;
  template?: string;
}

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    field?: string;
    value?: any;
    error: string;
  }>;
  warnings: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  summary: {
    [key: string]: any;
  };
  importedAt: string;
}

// ================================
// FORM VALIDATION TYPES
// ================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox';
  validation?: ValidationRule;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
}

// ================================
// ERROR TYPES
// ================================

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface FormErrors {
  [fieldName: string]: string | string[];
}

// ================================
// THEME & UI TYPES
// ================================

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: {
    [key: string]: string;
  };
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  currencyFormat: string;
  sidebarCollapsed: boolean;
  tablePageSize: number;
  dashboardLayout: string[];
}

// ================================
// UTILITY HELPER TYPES
// ================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateType<T> = Omit<T, '_id' | 'createdAt' | 'updatedAt'>;

export type UpdateType<T> = Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>;

// ================================
// COMPONENT PROP TYPES
// ================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  testId?: string;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
  data?: any;
}

export interface TableColumn<T = any> {
  key: keyof T;
  title: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize?: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  };
  onRow?: (record: T, index: number) => any;
}

export interface ModalProps extends BaseComponentProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onOk?: () => void;
  width?: string | number;
  footer?: React.ReactNode;
  destroyOnClose?: boolean;
}

export interface FormProps<T = any> extends BaseComponentProps {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  schema?: FormSchema;
}

// ================================
// DEFAULT EXPORTS
// ================================

export default {
  // Export commonly used types as default
  User,
  Investor,
  Plan,
  Investment,
  Payment,
  ApiResponse,
  PaginationParams
};