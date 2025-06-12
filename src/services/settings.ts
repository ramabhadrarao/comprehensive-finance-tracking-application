import api from './api';
import { Settings, ApiResponse } from '../types';

export const settingsService = {
  async getSettings(): Promise<ApiResponse<Settings>> {
    return api.get('/settings');
  },

  async updateSettings(data: Partial<Settings>): Promise<ApiResponse<Settings>> {
    return api.put('/settings', data);
  },

  async uploadLogo(file: File): Promise<ApiResponse<any>> {
    return api.upload('/settings/logo', file, { type: 'company' });
  }
};