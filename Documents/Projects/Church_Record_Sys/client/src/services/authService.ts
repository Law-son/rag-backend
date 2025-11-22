import { api } from '../config/api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },

  async register(userData: RegisterData): Promise<{ user: User }> {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.data.user;
  },

  async updateProfile(userData: { firstName: string; lastName: string }): Promise<User> {
    const response = await api.put('/auth/profile', userData);
    return response.data.data.user;
  },
};