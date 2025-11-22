import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye, Edit, Trash2, Users } from 'lucide-react';
import { memberService } from '../../services/memberService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../contexts/AuthContext';
import type { Member, FilterOptions, CreateMemberData } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../common/ToastContainer';
import { MemberForm } from './MemberForm';

interface MemberListProps {
  onCreateMember?: () => void;
  onEditMember?: (member: Member) => void;
  onViewMember?: (member: Member) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  onCreateMember,
  onEditMember,
  onViewMember,
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    member: Member | null;
  }>({ isOpen: false, member: null });
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Fetch members
  const {
    data: membersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['members', filters],
    queryFn: () => memberService.getMembers(filters),
  });

  // Fetch departments for filter
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getDepartments,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        // Use search endpoint for real-time search
        setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
      } else {
        setFilters(prev => {
          const { search, ...filtersWithoutSearch } = prev;
          return filtersWithoutSearch;
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreate = () => {
    setEditingMember(null);
    setShowForm(true);
    onCreateMember?.();
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setShowForm(true);
    onEditMember?.(member);
  };

  const handleFormSubmit = (data: CreateMemberData) => {
    setShowForm(false);
    setEditingMember(null);
    refetch();
  };

  const handleDeleteMember = async () => {
    if (!deleteDialog.member) return;

    try {
      await memberService.deleteMember(deleteDialog.member._id);
      addToast({
        type: 'success',
        title: 'Member deleted',
        message: 'Member has been successfully deleted',
      });
      refetch();
      setDeleteDialog({ isOpen: false, member: null });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: error.response?.data?.message || 'Failed to delete member',
      });
    }
  };

  const getBaptismBadgeVariant = (status: string) => {
    switch (status) {
      case 'Baptized':
        return 'success';
      case 'Planning to be Baptized':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getMaritalStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Married':
        return 'primary';
      case 'Single':
        return 'success';
      case 'Divorced':
        return 'warning';
      case 'Widowed':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Check if the date is valid
    if (isNaN(birthDate.getTime())) return 'N/A';
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If the birthday hasn't occurred this year yet, subtract 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load members. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">
            Manage church members and their information
          </p>
        </div>
        <Button onClick={handleCreate} className="mt-4 sm:mt-0">
          <Plus size={20} className="mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search members by name, phone, or location..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <Select
              placeholder="All Departments"
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...(departments?.map(dept => ({
                  value: dept._id,
                  label: dept.name,
                })) || []),
              ]}
            />
            <Select
              placeholder="Marital Status"
              value={filters.maritalStatus || ''}
              onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
              options={[
                { value: '', label: 'All Marital Status' },
                { value: 'Single', label: 'Single' },
                { value: 'Married', label: 'Married' },
                { value: 'Divorced', label: 'Divorced' },
                { value: 'Widowed', label: 'Widowed' },
              ]}
            />
            <Select
              placeholder="Baptism Status"
              value={filters.baptismStatus || ''}
              onChange={(e) => handleFilterChange('baptismStatus', e.target.value)}
              options={[
                { value: '', label: 'All Baptism Status' },
                { value: 'Baptized', label: 'Baptized' },
                { value: 'Not Baptized', label: 'Not Baptized' },
                { value: 'Planning to be Baptized', label: 'Planning to be Baptized' },
              ]}
            />
            <Select
              placeholder="Gender"
              value={filters.gender || ''}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              options={[
                { value: '', label: 'All Genders' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header w-16">#</th>
                    <th className="table-header">Name</th>
                    <th className="table-header">Department</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Marital Status</th>
                    <th className="table-header">Baptism Status</th>
                    <th className="table-header">Age</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {membersData?.data.map((member, index) => {
                    const rowNumber = ((membersData.pagination.current - 1) * membersData.pagination.limit) + index + 1;
                    return (
                      <tr key={member._id} className="hover:bg-gray-50">
                        <td className="table-cell w-16">
                          <span className="text-sm font-medium text-gray-500">
                            {rowNumber}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.gender}
                            </div>
                          </div>
                        </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {member.department.name}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {member.phoneNumber}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Badge variant={getMaritalStatusBadgeVariant(member.maritalStatus)}>
                          {member.maritalStatus}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <Badge variant={getBaptismBadgeVariant(member.baptismStatus)}>
                          {member.baptismStatus}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-900">
                          {calculateAge(member.dateOfBirth)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onViewMember?.(member)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit size={16} />
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="error"
                              onClick={() =>
                                setDeleteDialog({ isOpen: true, member })
                              }
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {membersData?.pagination && membersData.pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        page: Math.max((prev.page || 1) - 1, 1),
                      }))
                    }
                    disabled={membersData.pagination.current <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {membersData.pagination.current} of {membersData.pagination.pages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        page: (prev.page || 1) + 1,
                      }))
                    }
                    disabled={
                      membersData.pagination.current >= membersData.pagination.pages
                    }
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(membersData.pagination.current - 1) * membersData.pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(
                          membersData.pagination.current * membersData.pagination.limit,
                          membersData.pagination.total
                        )}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{membersData.pagination.total}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setFilters(prev => ({
                            ...prev,
                            page: Math.max((prev.page || 1) - 1, 1),
                          }))
                        }
                        disabled={membersData.pagination.current <= 1}
                        className="rounded-r-none"
                      >
                        Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, membersData.pagination.pages) }, (_, i) => {
                        const startPage = Math.max(1, membersData.pagination.current - 2);
                        const pageNumber = startPage + i;
                        if (pageNumber > membersData.pagination.pages) return null;
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() =>
                              setFilters(prev => ({
                                ...prev,
                                page: pageNumber,
                              }))
                            }
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNumber === membersData.pagination.current
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setFilters(prev => ({
                            ...prev,
                            page: (prev.page || 1) + 1,
                          }))
                        }
                        disabled={
                          membersData.pagination.current >= membersData.pagination.pages
                        }
                        className="rounded-l-none"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && (!membersData?.data || membersData.data.length === 0) && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.department || filters.maritalStatus
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first member.'}
            </p>
            {!filters.search && !filters.department && !filters.maritalStatus && (
              <div className="mt-6">
                <Button onClick={handleCreate}>
                  <Plus size={20} className="mr-2" />
                  Add Member
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Form Modal */}
      {showForm && (
        <MemberForm
          member={editingMember}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, member: null })}
        onConfirm={handleDeleteMember}
        title="Delete Member"
        message={`Are you sure you want to delete ${deleteDialog.member?.fullName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="error"
      />
    </div>
  );
};