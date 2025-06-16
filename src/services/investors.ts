// src/services/investors.ts - Enhanced with User Account Management
import api from './api';
import { Investor, ApiResponse, PaginationParams } from '../types';

export interface CreateInvestorData extends Partial<Investor> {
  // NEW: User account creation fields
  createUserAccount?: boolean;
  userAccountDetails?: {
    password: string;
    confirmPassword: string;
    sendCredentials?: boolean;
    temporaryPassword?: boolean;
  };
}

export interface UserAccountCreationResult {
  success: boolean;
  message: string;
  data: {
    investor: Investor;
    userAccountCreated: boolean;
    emailSent: boolean;
    userId?: string;
  };
}

export interface UserAccountManagement {
  userId?: string;
  emailSent: boolean;
}

export const investorsService = {
  // Get all investors
  async getInvestors(params?: PaginationParams): Promise<ApiResponse<Investor[]>> {
    return api.get('/investors', { params });
  },

  // Get single investor
  async getInvestor(id: string): Promise<ApiResponse<Investor>> {
    return api.get(`/investors/${id}`);
  },

  // Create investor with optional user account
  async createInvestor(data: CreateInvestorData): Promise<UserAccountCreationResult> {
    return api.post('/investors', data);
  },

  // Update investor
  async updateInvestor(id: string, data: Partial<Investor>): Promise<ApiResponse<Investor>> {
    return api.put(`/investors/${id}`, data);
  },

  // Delete investor
  async deleteInvestor(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/investors/${id}`);
  },

  // Upload documents
  async uploadDocuments(id: string, files: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    formData.append('type', 'agreement');

    return api.post(`/investors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get investor statistics
  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/investors/stats/overview');
  },

  // NEW: User Account Management Methods

  // Create user account for existing investor
  async createUserAccount(
    investorId: string, 
    credentials: {
      password: string;
      sendCredentials?: boolean;
      temporaryPassword?: boolean;
    }
  ): Promise<ApiResponse<UserAccountManagement>> {
    return api.post(`/investors/${investorId}/create-user-account`, credentials);
  },

  // Reset password for investor's user account
  async resetPassword(
    investorId: string,
    passwordData: {
      newPassword: string;
      sendCredentials?: boolean;
    }
  ): Promise<ApiResponse<UserAccountManagement>> {
    return api.post(`/investors/${investorId}/reset-password`, passwordData);
  },

  // Check if investor has user account
  async checkUserAccount(investorId: string): Promise<ApiResponse<{
    hasUserAccount: boolean;
    userId?: string;
    userEmail?: string;
    userStatus?: string;
    lastLogin?: string;
  }>> {
    const investor = await this.getInvestor(investorId);
    return {
      success: true,
      data: {
        hasUserAccount: !!investor.data.userId,
        userId: investor.data.userId,
        userEmail: investor.data.email,
        userStatus: investor.data.status,
        lastLogin: investor.data.userId?.lastLogin
      }
    };
  },

  // Bulk operations for user account management
  async bulkCreateUserAccounts(
    investorIds: string[],
    options: {
      generateTempPasswords?: boolean;
      sendCredentials?: boolean;
      passwordLength?: number;
    } = {}
  ): Promise<ApiResponse<{
    successful: Array<{ investorId: string; userId: string; password?: string }>;
    failed: Array<{ investorId: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      emailsSent: number;
    };
  }>> {
    return api.post('/investors/bulk/create-user-accounts', {
      investorIds,
      options
    });
  },

  // Get investors without user accounts
  async getInvestorsWithoutUserAccounts(params?: PaginationParams): Promise<ApiResponse<Investor[]>> {
    return api.get('/investors', { 
      params: { 
        ...params,
        hasUserAccount: false 
      } 
    });
  },

  // Get user account activity for investor
  async getUserAccountActivity(investorId: string): Promise<ApiResponse<{
    lastLogin?: string;
    loginCount: number;
    investmentsViewed: number;
    paymentsViewed: number;
    documentsDownloaded: number;
    recentActivity: Array<{
      action: string;
      timestamp: string;
      details?: any;
    }>;
  }>> {
    return api.get(`/investors/${investorId}/user-activity`);
  },

  // Send login instructions to investor
  async sendLoginInstructions(
    investorId: string,
    options: {
      includeResetLink?: boolean;
      customMessage?: string;
    } = {}
  ): Promise<ApiResponse<{ emailSent: boolean }>> {
    return api.post(`/investors/${investorId}/send-login-instructions`, options);
  },

  // Validate investor data before user account creation
  async validateForUserAccount(investorData: Partial<Investor>): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }>> {
    return api.post('/investors/validate-for-user-account', investorData);
  },

  // Get investor portfolio summary (for investor portal)
  async getPortfolioSummary(investorId: string): Promise<ApiResponse<{
    investor: Investor;
    totalInvested: number;
    totalReturns: number;
    pendingReturns: number;
    activeInvestments: number;
    completedInvestments: number;
    recentPayments: any[];
    upcomingPayments: any[];
    documentsSummary: {
      total: number;
      byCategory: { [key: string]: number };
    };
  }>> {
    return api.get(`/investors/${investorId}/portfolio-summary`);
  },

  // Advanced search for investors
  async searchInvestors(searchParams: {
    query?: string;
    filters?: {
      status?: string[];
      hasUserAccount?: boolean;
      dateRange?: { start: string; end: string };
      investmentRange?: { min: number; max: number };
      location?: {
        city?: string;
        state?: string;
        pincode?: string;
      };
      kycStatus?: string[];
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Investor[]>> {
    return api.post('/investors/search', searchParams);
  },

  // Export investors data
  async exportInvestors(options: {
    format: 'csv' | 'excel' | 'pdf';
    includeUserAccounts?: boolean;
    includeInvestments?: boolean;
    includeDocuments?: boolean;
    filters?: any;
  }): Promise<Blob> {
    const response = await api.get('/investors/export', { 
      params: options,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Import investors from file
  async importInvestors(
    file: File,
    options: {
      createUserAccounts?: boolean;
      sendWelcomeEmails?: boolean;
      skipValidation?: boolean;
      dryRun?: boolean;
    } = {}
  ): Promise<ApiResponse<{
    successful: number;
    failed: number;
    errors: Array<{
      row: number;
      field?: string;
      error: string;
    }>;
    summary: {
      totalRows: number;
      processedRows: number;
      userAccountsCreated: number;
      emailsSent: number;
    };
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(options).forEach(key => {
      formData.append(key, String(options[key as keyof typeof options]));
    });

    return api.post('/investors/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get investor communication history
  async getCommunicationHistory(investorId: string): Promise<ApiResponse<{
    emails: Array<{
      type: string;
      subject: string;
      sentAt: string;
      status: 'sent' | 'delivered' | 'opened' | 'failed';
      content?: string;
    }>;
    sms: Array<{
      type: string;
      message: string;
      sentAt: string;
      status: 'sent' | 'delivered' | 'failed';
    }>;
    notifications: Array<{
      type: string;
      title: string;
      message: string;
      sentAt: string;
      readAt?: string;
    }>;
  }>> {
    return api.get(`/investors/${investorId}/communication-history`);
  },

  // Send custom communication to investor
  async sendCommunication(
    investorId: string,
    communication: {
      type: 'email' | 'sms' | 'notification';
      subject?: string;
      message: string;
      templateId?: string;
      variables?: { [key: string]: any };
      priority?: 'low' | 'normal' | 'high';
      scheduledFor?: string;
    }
  ): Promise<ApiResponse<{ 
    communicationId: string; 
    status: string; 
    scheduledFor?: string; 
  }>> {
    return api.post(`/investors/${investorId}/send-communication`, communication);
  },

  // Investor preferences management
  async getInvestorPreferences(investorId: string): Promise<ApiResponse<{
    communication: {
      email: boolean;
      sms: boolean;
      notifications: boolean;
    };
    language: string;
    timezone: string;
    currency: string;
    reports: {
      frequency: 'monthly' | 'quarterly' | 'yearly';
      format: 'pdf' | 'excel';
      includeDocuments: boolean;
    };
  }>> {
    return api.get(`/investors/${investorId}/preferences`);
  },

  async updateInvestorPreferences(
    investorId: string,
    preferences: any
  ): Promise<ApiResponse<any>> {
    return api.put(`/investors/${investorId}/preferences`, preferences);
  },

  // Compliance and verification
  async updateKYCStatus(
    investorId: string,
    kycUpdate: {
      status: 'pending' | 'verified' | 'rejected';
      verifiedBy?: string;
      verificationDate?: string;
      notes?: string;
      documents?: string[];
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investors/${investorId}/kyc-status`, kycUpdate);
  },

  async getComplianceStatus(investorId: string): Promise<ApiResponse<{
    kycStatus: 'pending' | 'verified' | 'rejected';
    amlStatus: 'clear' | 'flagged' | 'under_review';
    taxCompliance: 'compliant' | 'non_compliant' | 'pending';
    riskRating: 'low' | 'medium' | 'high';
    lastReviewDate?: string;
    nextReviewDate?: string;
    flags: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      createdAt: string;
    }>;
  }>> {
    return api.get(`/investors/${investorId}/compliance-status`);
  },

  // Investor relationship management
  async getRelationshipSummary(investorId: string): Promise<ApiResponse<{
    relationshipStartDate: string;
    totalLifetimeValue: number;
    averageInvestmentSize: number;
    investmentFrequency: number; // investments per year
    lastInteractionDate: string;
    satisfactionScore?: number;
    riskProfile: 'conservative' | 'moderate' | 'aggressive';
    preferredContactMethod: 'email' | 'phone' | 'sms';
    assignedRelationshipManager?: {
      id: string;
      name: string;
      email: string;
    };
    notes: Array<{
      id: string;
      content: string;
      createdBy: string;
      createdAt: string;
      category: 'general' | 'investment' | 'service' | 'complaint';
    }>;
  }>> {
    return api.get(`/investors/${investorId}/relationship-summary`);
  },

  async addRelationshipNote(
    investorId: string,
    note: {
      content: string;
      category: 'general' | 'investment' | 'service' | 'complaint';
      priority?: 'low' | 'normal' | 'high';
      followUpDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/investors/${investorId}/relationship-notes`, note);
  }
};