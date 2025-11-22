import { api } from '../config/api';
import type { DashboardStats } from '../types';

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  },
};