import { api } from '../config/api';
import type { Department } from '../types';

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/departments');
    return response.data.data.departments;
  },

  async getDepartment(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data.data.department;
  },

  async createDepartment(departmentData: {
    name: string;
    description?: string;
    head?: string;
  }): Promise<Department> {
    const response = await api.post('/departments', departmentData);
    return response.data.data.department;
  },

  async updateDepartment(
    id: string,
    departmentData: Partial<{
      name: string;
      description?: string;
      head?: string;
    }>
  ): Promise<Department> {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data.data.department;
  },

  async deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
};