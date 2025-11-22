import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { departmentService } from '../../services/departmentService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import type { BulkSMSData, Department } from '../../types';

interface BulkSMSFormProps {
  onSubmit: (data: BulkSMSData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BulkSMSForm({ onSubmit, onCancel, isLoading = false }: BulkSMSFormProps) {
  const [formData, setFormData] = useState<BulkSMSData>({
    message: '',
    filters: {
      departments: [],
      maritalStatus: '',
      baptismStatus: '',
      gender: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);

  // Load departments for selection
  useEffect(() => {
    departmentService.getDepartments().then(response => {
      setDepartments(response);
    }).catch(() => {
      // Handle error silently
    });
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 160) {
      newErrors.message = 'Message must be less than 160 characters';
    }

    if (formData.filters.departments.length === 0 && 
        !formData.filters.maritalStatus && 
        !formData.filters.baptismStatus && 
        !formData.filters.gender) {
      newErrors.filters = 'At least one filter criteria is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      message: formData.message.trim(),
      filters: {
        departments: formData.filters.departments.length > 0 ? formData.filters.departments : undefined,
        maritalStatus: formData.filters.maritalStatus || undefined,
        baptismStatus: formData.filters.baptismStatus || undefined,
        gender: formData.filters.gender || undefined,
      },
    });
  };

  const handleMessageChange = (value: string) => {
    setFormData(prev => ({ ...prev, message: value }));
    if (errors.message) {
      setErrors(prev => ({ ...prev, message: '' }));
    }
  };

  const handleDepartmentChange = (value: string) => {
    if (value && !formData.filters.departments.includes(value)) {
      setFormData(prev => ({
        ...prev,
        filters: {
          ...prev.filters,
          departments: [...prev.filters.departments, value]
        }
      }));
    }
    if (errors.filters) {
      setErrors(prev => ({ ...prev, filters: '' }));
    }
  };

  const removeDepartment = (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        departments: prev.filters.departments.filter(id => id !== departmentId)
      }
    }));
  };

  const handleFilterChange = (field: keyof typeof formData.filters, value: string) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [field]: value
      }
    }));
    if (errors.filters) {
      setErrors(prev => ({ ...prev, filters: '' }));
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d._id === departmentId);
    return department ? department.name : departmentId;
  };

  return (
    <Modal
      isOpen={true}
      title="Send Bulk SMS"
      onClose={onCancel}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder="Enter your message..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.message ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>{errors.message || ''}</span>
            <span>{formData.message.length}/160 characters</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Recipients</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select criteria to filter members who will receive this message. At least one filter is required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departments
            </label>
            <Select
              value=""
              onChange={handleDepartmentChange}
              placeholder="Select departments..."
              options={departments
                .filter(dept => !formData.filters.departments.includes(dept._id))
                .map(dept => ({
                  value: dept._id,
                  label: dept.name
                }))
              }
            />
            {formData.filters.departments.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.filters.departments.map((deptId) => (
                  <div key={deptId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{getDepartmentName(deptId)}</span>
                    <button
                      type="button"
                      onClick={() => removeDepartment(deptId)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marital Status
            </label>
            <Select
              value={formData.filters.maritalStatus}
              onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
              placeholder="Select marital status..."
              options={[
                { value: 'Single', label: 'Single' },
                { value: 'Married', label: 'Married' },
                { value: 'Divorced', label: 'Divorced' },
                { value: 'Widowed', label: 'Widowed' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baptism Status
            </label>
            <Select
              value={formData.filters.baptismStatus}
              onChange={(e) => handleFilterChange('baptismStatus', e.target.value)}
              placeholder="Select baptism status..."
              options={[
                { value: 'Baptized', label: 'Baptized' },
                { value: 'Not Baptized', label: 'Not Baptized' },
                { value: 'Planning to be Baptized', label: 'Planning to be Baptized' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <Select
              value={formData.filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              placeholder="Select gender..."
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
              ]}
            />
          </div>
        </div>

        {errors.filters && (
          <p className="text-sm text-red-600">{errors.filters}</p>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Bulk SMS Notice
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This message will be sent to all members matching the selected criteria. 
                  Please review your filters carefully before sending.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              'Send Bulk SMS'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
