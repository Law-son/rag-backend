import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../../services/departmentService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DepartmentForm } from './DepartmentForm';
import { 
  Plus, 
  Pencil, 
  Trash2,
  Building2,
  Users
} from 'lucide-react';
import type { Department, CreateDepartmentData } from '../../types';

interface DepartmentListProps {
  onCreateDepartment?: () => void;
  onEditDepartment?: (department: Department) => void;
  onViewDepartment?: (department: Department) => void;
}

export function DepartmentList({ 
  onCreateDepartment, 
  onEditDepartment, 
  onViewDepartment 
}: DepartmentListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: departments, isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeletingDepartment(null);
    },
  });

  const handleCreate = () => {
    setEditingDepartment(null);
    setShowForm(true);
    onCreateDepartment?.();
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowForm(true);
    onEditDepartment?.(department);
  };

  const handleDelete = (department: Department) => {
    setDeletingDepartment(department);
  };

  const confirmDelete = () => {
    if (deletingDepartment) {
      deleteMutation.mutate(deletingDepartment._id);
    }
  };

  const handleFormSubmit = (data: CreateDepartmentData) => {
    setShowForm(false);
    setEditingDepartment(null);
  };

  const filteredDepartments = departments?.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Failed to load departments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600">Manage church departments and their members</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleCreate} className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <div key={department._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    {department.description && (
                      <p className="text-sm text-gray-600 mt-1">{department.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(department)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Members</span>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium">{department.memberCount || 0}</span>
                  </div>
                </div>

                {department.head && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Head</span>
                    <span className="text-sm font-medium">{department.head.fullName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge variant={department.isActive ? 'success' : 'error'} size="sm">
                    {department.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onViewDepartment?.(department)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No departments match your search.' : 'Get started by creating your first department.'}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreate}>
              <Plus className="h-5 w-5 mr-2" />
              Add Department
            </Button>
          )}
        </div>
      )}

      {/* Department Form Modal */}
      {showForm && (
        <DepartmentForm
          department={editingDepartment}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingDepartment(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDepartment && (
        <ConfirmDialog
          title="Delete Department"
          message={`Are you sure you want to delete "${deletingDepartment.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingDepartment(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
