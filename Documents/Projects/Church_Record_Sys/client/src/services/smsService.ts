import { api } from '../config/api';
import type { SMSLog, SendSMSData, BulkSMSData, PaginatedResponse, FilterOptions } from '../types';

export const smsService = {
  async sendSMS(smsData: SendSMSData): Promise<{
    results: Array<{
      member: string;
      phone: string;
      status: 'sent' | 'failed';
      error?: string;
    }>;
  }> {
    const response = await api.post('/sms/send', smsData);
    return response.data.data;
  },

  async sendBulkSMS(smsData: BulkSMSData): Promise<{
    recipientCount: number;
    success: boolean;
  }> {
    const response = await api.post('/sms/bulk', smsData);
    return response.data.data;
  },

  async getSMSHistory(filters: FilterOptions = {}): Promise<PaginatedResponse<SMSLog>> {
    const response = await api.get('/sms/history', { params: filters });
    return {
      data: response.data.data.smsLogs,
      pagination: response.data.data.pagination,
    };
  },

  async getSMSLogs(filters: FilterOptions = {}): Promise<PaginatedResponse<SMSLog>> {
    const response = await api.get('/sms/history', { params: filters });
    return {
      data: response.data.data.smsLogs,
      pagination: response.data.data.pagination,
    };
  },

  async testSMS(phoneNumber: string): Promise<any> {
    const response = await api.post('/sms/test', { phoneNumber });
    return response.data.data;
  },

  async getSMSBalance(): Promise<{ balance: number; currency: string }> {
    const response = await api.get('/sms/balance');
    return response.data.data;
  },

  async getSMSProgress(sessionId: string): Promise<any> {
    const response = await api.get(`/sms/progress/${sessionId}`);
    return response.data.data;
  },

  createProgressStream(sessionId: string): EventSource {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return new EventSource(`${baseUrl}/sms/progress/${sessionId}/stream`);
  },
};