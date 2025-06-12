import api from './api';
import { ApiResponse } from '../types';

export const reportsService = {
  async getDashboardReport(): Promise<ApiResponse<any>> {
    return api.get('/reports/dashboard');
  },

  async getInvestorSummary(params?: any): Promise<ApiResponse<any[]>> {
    return api.get('/reports/investor-summary', { params });
  },

  async getPlanPerformance(): Promise<ApiResponse<any[]>> {
    return api.get('/reports/plan-performance');
  },

  async getPaymentAnalysis(params?: any): Promise<ApiResponse<any>> {
    return api.get('/reports/payment-analysis', { params });
  },

  async getOverduePayments(): Promise<ApiResponse<any[]>> {
    return api.get('/reports/overdue-payments');
  },

  async exportData(type: 'investors' | 'investments' | 'payments'): Promise<any> {
    const response = await api.get(`/reports/export/${type}`, {
      responseType: 'blob'
    });
    return response;
  }
};