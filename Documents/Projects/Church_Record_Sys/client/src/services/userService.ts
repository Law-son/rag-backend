import { api } from '../config/api';
import type { User, RegisterData } from '../types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data.data.users;
  },

  async createUser(userData: RegisterData): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data.data.user;
  },

  async updateUser(id: string, userData: Partial<RegisterData>): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data.user;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleUserStatus(id: string): Promise<User> {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data.data.user;
  },
};