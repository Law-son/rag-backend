export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'data-entry';
  fullName: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'data-entry';
  isActive?: boolean;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  head?: {
    _id: string;
    fullName: string;
  };
  memberCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Member {
  _id: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  location: string;
  department: Department;
  phoneNumber: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  occupation?: string;
  emergencyContact: EmergencyContact;
  baptismStatus: 'Baptized' | 'Not Baptized' | 'Planning to be Baptized';
  joinDate: string;
  isActive: boolean;
  notes?: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateMemberData {
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  location: string;
  department: string;
  phoneNumber: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  occupation?: string;
  emergencyContact: EmergencyContact;
  baptismStatus: 'Baptized' | 'Not Baptized' | 'Planning to be Baptized';
  notes?: string;
}

export interface FinanceRecord {
  _id: string;
  amount: number;
  type: string;
  date: string;
  description?: string;
  member?: {
    _id: string;
    fullName: string;
  };
  donorName?: string;
  paymentMethod: string;
  receiptNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateFinanceRecordData {
  amount: number;
  type: string;
  date?: string;
  description?: string;
  member?: string;
  donorName?: string;
  paymentMethod?: string;
}

export interface SMSLog {
  _id: string;
  title: string;
  message: string;
  type: 'manual' | 'birthday' | 'announcement';
  status: 'pending' | 'sent' | 'failed';
  provider: 'twilio' | 'africastalking' | 'test';
  recipients: Array<{
    member?: {
      _id: string;
      fullName: string;
    };
    phone: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
  }>;
  sentBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface SendSMSData {
  title: string;
  message: string;
  recipients: string[];
}

export interface BulkSMSData {
  title: string;
  message: string;
  filters: {
    departments?: string[];
    maritalStatus?: string;
    baptismStatus?: string;
    gender?: string;
  };
}

export interface SMSProgress {
  sent: number;
  total: number;
  failed: number;
  isComplete: boolean;
}

export interface DashboardStats {
  overview: {
    totalMembers: number;
    totalDepartments: number;
    monthlyIncome: number;
    yearlyIncome: number;
  };
  finance: {
    monthly: {
      tithe: number;
      offering: number;
      donation: number;
      total: number;
    };
    yearly: {
      tithe: number;
      offering: number;
      donation: number;
      total: number;
    };
  };
  upcomingBirthdays: Array<{
    _id: string;
    fullName: string;
    dateOfBirth: string;
    birthdayThisYear: string;
    department: string;
  }>;
  recentMembers: Array<{
    _id: string;
    fullName: string;
    createdAt: string;
    department: {
      name: string;
    };
  }>;
  membersByDepartment: Array<{
    _id: string;
    name: string;
    count: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface APIResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface FilterOptions {
  department?: string;
  maritalStatus?: string;
  baptismStatus?: string;
  gender?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}