// src/services/investments.ts
import api from './api';
import { Investment, ApiResponse, PaginationParams } from '../types';

export const investmentsService = {
  async getInvestments(params?: PaginationParams): Promise<ApiResponse<Investment[]>> {
    return api.get('/investments', { params });
  },

  async getInvestment(id: string): Promise<ApiResponse<Investment>> {
    return api.get(`/investments/${id}`);
  },

  async createInvestment(data: any): Promise<ApiResponse<Investment>> {
    return api.post('/investments', data);
  },

  async updateInvestment(id: string, data: Partial<Investment>): Promise<ApiResponse<Investment>> {
    return api.put(`/investments/${id}`, data);
  },

  async getSchedule(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/schedule`);
  },

  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/investments/stats/overview');
  },

  async getUpcomingDue(days?: number): Promise<ApiResponse<any[]>> {
    return api.get('/investments/due/upcoming', { params: { days } });
  },

  // NEW: Document Management Methods
  async getDocuments(id: string, params?: { category?: string }): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/documents`, { params });
  },

  async uploadDocuments(
    id: string, 
    files: File[], 
    data: { category: string; description?: string }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    
    // Append files
    files.forEach(file => {
      formData.append('documents', file);
    });
    
    // Append metadata
    formData.append('category', data.category);
    if (data.description) {
      formData.append('description', data.description);
    }

    return api.post(`/investments/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async deleteDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return api.delete(`/investments/${id}/documents/${documentId}`);
  },

  // NEW: Timeline Management Methods
  async getTimeline(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/timeline`);
  },

  async addTimelineEntry(
    id: string, 
    data: {
      type: string;
      description: string;
      amount?: number;
      metadata?: any;
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/timeline`, data);
  },

  // NEW: Repayment Plan Methods
  async getRepaymentPlans(planId: string): Promise<ApiResponse<any>> {
    return api.get(`/plans/${planId}/repayment-plans`);
  },

  async calculateReturnsWithRepaymentPlan(
    planId: string, 
    principalAmount: number, 
    repaymentPlanId?: string
  ): Promise<ApiResponse<any>> {
    return api.post(`/plans/${planId}/calculate`, { 
      principalAmount, 
      repaymentPlanId 
    });
  },

  // Enhanced Investment Creation with Repayment Plan
  async createInvestmentWithRepaymentPlan(data: {
    investor: string;
    plan: string;
    principalAmount: number;
    investmentDate?: string;
    notes?: string;
    selectedRepaymentPlan: {
      planType: 'existing' | 'new';
      existingPlanId?: string;
      customPlan?: any;
    };
  }): Promise<ApiResponse<Investment>> {
    return api.post('/investments', data);
  },

  // Bulk Operations
  async bulkUpdateInvestments(
    investments: string[], 
    updates: Partial<Investment>
  ): Promise<ApiResponse<any>> {
    return api.put('/investments/bulk', { investments, updates });
  },

  async exportInvestments(params?: any): Promise<Blob> {
    const response = await api.get('/investments/export', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  },

  // Investment Analytics
  async getInvestmentAnalytics(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/analytics`);
  },

  async getPerformanceMetrics(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/performance`);
  },

  // Payment Integration
  async getPaymentHistory(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/payments`);
  },

  async recordPayment(id: string, paymentData: any): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/payments`, paymentData);
  },

  // Risk Assessment
  async updateRiskAssessment(
    id: string, 
    riskData: {
      score: number;
      factors: string[];
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/risk-assessment`, riskData);
  },

  // Communication Methods
  async sendNotification(
    id: string, 
    notification: {
      type: 'payment_reminder' | 'maturity_notice' | 'document_request' | 'custom';
      message: string;
      channel: 'email' | 'sms' | 'both';
    }
  ): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/notifications`, notification);
  },

  async getNotificationHistory(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/notifications`);
  },

  // Advanced Filtering and Search
  async searchInvestments(searchParams: {
    query?: string;
    filters?: {
      status?: string[];
      dateRange?: { start: string; end: string };
      amountRange?: { min: number; max: number };
      plans?: string[];
      investors?: string[];
      repaymentPlanType?: string[];
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Investment[]>> {
    return api.post('/investments/search', searchParams);
  },

  // Report Generation
  async generateInvestmentReport(
    id: string, 
    reportType: 'summary' | 'detailed' | 'financial' | 'compliance'
  ): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/reports/${reportType}`);
  },

  async generatePortfolioReport(
    investorId: string,
    options?: {
      includeProjections?: boolean;
      includeDocuments?: boolean;
      format?: 'pdf' | 'excel';
    }
  ): Promise<Blob> {
    const response = await api.post(`/investors/${investorId}/portfolio-report`, options, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Workflow Management
  async updateInvestmentWorkflow(
    id: string, 
    workflow: {
      stage: 'application' | 'verification' | 'approval' | 'active' | 'maturity' | 'closure';
      notes?: string;
      nextAction?: string;
      actionDueDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/workflow`, workflow);
  },

  async getWorkflowHistory(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/workflow/history`);
  },

  // Integration with External Systems
  async syncWithExternalSystem(
    id: string, 
    system: 'bank' | 'accounting' | 'crm',
    action: 'sync' | 'validate' | 'update'
  ): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/sync/${system}`, { action });
  },

  // Compliance and Audit
  async getComplianceStatus(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/compliance`);
  },

  async updateComplianceStatus(
    id: string,
    compliance: {
      kycStatus: 'pending' | 'verified' | 'rejected';
      amlStatus: 'pending' | 'cleared' | 'flagged';
      taxStatus: 'compliant' | 'non_compliant';
      notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/compliance`, compliance);
  },

  async getAuditTrail(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/audit-trail`);
  },

  // Performance Tracking
  async getROIAnalysis(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/roi-analysis`);
  },

  async getPerformanceComparison(
    id: string, 
    benchmarks: string[]
  ): Promise<ApiResponse<any>> {
    return api.post(`/investments/${id}/performance-comparison`, { benchmarks });
  },

  // Automated Actions
  async setupAutomatedActions(
    id: string,
    actions: Array<{
      trigger: 'payment_due' | 'payment_overdue' | 'maturity_approaching' | 'document_expiry';
      action: 'send_notification' | 'generate_report' | 'update_status' | 'create_task';
      parameters: any;
      isActive: boolean;
    }>
  ): Promise<ApiResponse<any>> {
    return api.put(`/investments/${id}/automated-actions`, { actions });
  },

  async getAutomatedActions(id: string): Promise<ApiResponse<any>> {
    return api.get(`/investments/${id}/automated-actions`);
  }
};