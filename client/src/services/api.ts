import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { PortfolioData, TransactionStats } from '@/types/analysis';

const API_BASE_URL = 'http://localhost:5001/api';

// Check if backend is available
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:5001/health', { 
      method: 'GET',
      timeout: 5000 
    } as any);
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

// Create a base API instance
const createApiInstance = (baseURL: string, config: AxiosRequestConfig = {}): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
    ...config,
  });

  // Add request interceptor to include auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized access (e.g., redirect to login)
        localStorage.removeItem('authToken');
        // Don't redirect to login since we made auth optional
        console.log('Unauthorized access - clearing token');
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create API instances
const api = createApiInstance(API_BASE_URL);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }).then(response => {
      // Ensure response has the expected structure
      if (!response.data.token) {
        throw new Error('Invalid response format');
      }
      return response;
    }),
  walletLogin: (data: { walletAddress: string; signature: string }) =>
    api.post('/auth/wallet-login', data),
  register: (userData: { 
    firstName: string; 
    lastName: string;
    email: string; 
    password: string; 
    phoneNumber?: string;
    country?: string;
  }) => api.post('/auth/register', userData),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/change-password', { currentPassword, newPassword }),
};

// Transactions API
export const transactionAPI = {
  getTransactions: () => api.get('/transactions'),
  createTransaction: (transactionData: any) => 
    api.post('/transactions', transactionData),
  getTransaction: (id: string) => 
    api.get(`/transactions/${id}`),
};

// Rates API
export const ratesAPI = {
  getExchangeRates: () => api.get('/rates'),
  convertCurrency: (from: string, to: string, amount: number) =>
    api.get(`/rates/convert?from=${from}&to=${to}&amount=${amount}`),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData: any) => 
    api.put('/users/profile', userData),
  updatePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/password', { currentPassword, newPassword }),
  getStats: () => api.get('/users/stats'),
};

// Analysis API
export const analysisAPI = {
  getPortfolio: () => api.get<PortfolioData>('/analysis/portfolio'),
  getTransactionStats: (period: string = '30d') => 
    api.get<TransactionStats>(`/analysis/transactions?period=${period}`),
  getAssetHistory: (assetId: string, period: string = '30d') =>
    api.get(`/analysis/asset/${assetId}?period=${period}`),
};

export default api;
