import api from './api';
import { Investor, ApiResponse, PaginationParams } from '../types';

export const investorsService = {
  async getInvestors(params?: PaginationParams): Promise<ApiResponse<Investor[]>> {
    return api.get('/investors', { params });
  },

  async getInvestor(id: string): Promise<ApiResponse<Investor>> {
    return api.get(`/investors/${id}`);
  },

  async createInvestor(data: Partial<Investor>): Promise<ApiResponse<Investor>> {
    return api.post('/investors', data);
  },

  async updateInvestor(id: string, data: Partial<Investor>): Promise<ApiResponse<Investor>> {
    return api.put(`/investors/${id}`, data);
  },

  async deleteInvestor(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/investors/${id}`);
  },

  async uploadDocuments(id: string, files: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    formData.append('type', 'agreement');

    return api.post(`/investors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/investors/stats/overview');
  }
};