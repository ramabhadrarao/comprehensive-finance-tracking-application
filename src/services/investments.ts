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
  }
};