import { api } from '../config/api';
import type { FinanceRecord, CreateFinanceRecordData, PaginatedResponse, FilterOptions } from '../types';

export interface FinanceReport {
  reports: Array<{
    _id: {
      year: number;
      month?: number;
      week?: number;
      day?: number;
    };
    titheAmount: number;
    offeringAmount: number;
    donationAmount: number;
    totalAmount: number;
    totalRecords: number;
  }>;
  summary: {
    tithe: { amount: number; count: number };
    offering: { amount: number; count: number };
    donation: { amount: number; count: number };
    total: { amount: number; count: number };
  };
}

export const financeService = {
  async getFinanceRecords(filters: FilterOptions = {}): Promise<PaginatedResponse<FinanceRecord>> {
    const response = await api.get('/finance', { params: filters });
    return {
      data: response.data.data.records,
      pagination: response.data.data.pagination,
    };
  },

  async createFinanceRecord(recordData: CreateFinanceRecordData): Promise<FinanceRecord> {
    const response = await api.post('/finance', recordData);
    return response.data.data.record;
  },

  async updateFinanceRecord(
    id: string,
    recordData: Partial<CreateFinanceRecordData>
  ): Promise<FinanceRecord> {
    const response = await api.put(`/finance/${id}`, recordData);
    return response.data.data.record;
  },

  async deleteFinanceRecord(id: string): Promise<void> {
    await api.delete(`/finance/${id}`);
  },

  async getFinanceReports(filters: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'month' | 'week' | 'day';
  } = {}): Promise<FinanceReport> {
    const response = await api.get('/finance/reports', { params: filters });
    return response.data.data;
  },

  async generatePDFReport(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
  } = {}): Promise<Blob> {
    const response = await api.get('/finance/reports/pdf', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  async getFinanceReport(filters: {
    type: 'monthly' | 'yearly';
    year: number;
    month?: number;
  }): Promise<any> {
    const response = await api.get('/finance/reports', { params: filters });
    return response.data.data;
  },

  async exportFinanceReport(filters: {
    type: 'monthly' | 'yearly';
    year: number;
    month?: number;
  }): Promise<Blob> {
    const response = await api.get('/finance/reports/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};