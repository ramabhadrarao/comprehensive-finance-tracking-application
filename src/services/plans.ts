import api from './api';
import { Plan, ApiResponse, PaginationParams } from '../types';

export const plansService = {
  async getPlans(params?: PaginationParams): Promise<ApiResponse<Plan[]>> {
    return api.get('/plans', { params });
  },

  async getActivePlans(): Promise<ApiResponse<Plan[]>> {
    return api.get('/plans/active');
  },

  async getPlan(id: string): Promise<ApiResponse<Plan>> {
    return api.get(`/plans/${id}`);
  },

  async createPlan(data: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return api.post('/plans', data);
  },

  async updatePlan(id: string, data: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return api.put(`/plans/${id}`, data);
  },

  async deletePlan(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/plans/${id}`);
  },

  async calculateReturns(id: string, principalAmount: number): Promise<ApiResponse<any>> {
    return api.post(`/plans/${id}/calculate`, { principalAmount });
  },

  async getStats(): Promise<ApiResponse<any>> {
    return api.get('/plans/stats/overview');
  }
};