import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Use proxy in development, direct URL in production
    const baseURL = import.meta.env.DEV 
      ? '/api'  // This will use Vite's proxy
      : import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false, // Set to false for now to avoid CORS issues
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add debug logging
        console.log('Making request to:', config.baseURL + config.url);
        console.log('Request method:', config.method);
        console.log('Request headers:', config.headers);
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('Response received:', response.status, response.statusText);
        return response;
      },
      (error) => {
        console.error('Response error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });

        // Handle specific error cases
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          console.error('❌ Network error - Backend server may not be running on port 5000');
          console.error('Make sure to run: cd backend && npm run dev');
        }

        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  async upload<T = any>(
    url: string,
    file: File,
    data?: any,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
    }

    const response = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  setToken(token: string) {
    this.api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeToken() {
    delete this.api.defaults.headers.Authorization;
  }

  // Add a test method to check connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/test');
      console.log('✅ Backend connection test successful:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  }
}

export default new ApiService();