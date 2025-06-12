import api from './api';
import { LoginData, RegisterData, AuthResponse, User } from '../types';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    return api.post('/auth/login', data);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return api.post('/auth/register', data);
  },

  async getProfile(): Promise<{ success: boolean; user: User }> {
    return api.get('/auth/me');
  },

  async updateProfile(data: Partial<User>): Promise<{ success: boolean; user: User }> {
    return api.put('/auth/profile', data);
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/logout');
  },

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
    api.setToken(token);
  },

  removeToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    api.removeToken();
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  storeUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};