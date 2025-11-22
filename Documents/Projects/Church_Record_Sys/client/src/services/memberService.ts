import { api } from '../config/api';
import type { Member, CreateMemberData, PaginatedResponse, FilterOptions } from '../types';

export const memberService = {
  async getMembers(filters: FilterOptions = {}): Promise<PaginatedResponse<Member>> {
    const response = await api.get('/members', { params: filters });
    return {
      data: response.data.data.members,
      pagination: response.data.data.pagination,
    };
  },

  async getMember(id: string): Promise<Member> {
    const response = await api.get(`/members/${id}`);
    return response.data.data.member;
  },

  async createMember(memberData: CreateMemberData): Promise<Member> {
    const response = await api.post('/members', memberData);
    return response.data.data.member;
  },

  async updateMember(id: string, memberData: Partial<CreateMemberData>): Promise<Member> {
    const response = await api.put(`/members/${id}`, memberData);
    return response.data.data.member;
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/members/${id}`);
  },

  async searchMembers(query: string, limit: number = 10): Promise<Member[]> {
    const response = await api.get('/members/search', { 
      params: { q: query, limit } 
    });
    return response.data.data.members;
  },

  async getMembersByDepartment(departmentId: string): Promise<Member[]> {
    const response = await api.get(`/members/department/${departmentId}`);
    return response.data.data.members;
  },
};