import api from './api';
import { Payment, ApiResponse, PaginationParams } from '../types';

export const paymentsService = {
  async getPayments(params?: PaginationParams): Promise<ApiResponse<Payment[]>> {
    return api.get('/payments', { params });
  },

  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    return api.get(`/payments/${id}`);
  },

  async createPayment(data: any): Promise<ApiResponse<Payment>> {
    return api.post('/payments', data);
  },

  async updatePayment(id: string, data: Partial<Payment>): Promise<ApiResponse<Payment>> {
    return api.put(`/payments/${id}`, data);
  },

  async uploadReceipt(id: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('type', 'receipt');

    return api.post(`/payments/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/payments/stats/overview');
  }
};