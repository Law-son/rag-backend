import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '../../services/memberService';
import { departmentService } from '../../services/departmentService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Modal } from '../common/Modal';
import type { Member, CreateMemberData, Department } from '../../types';

interface MemberFormProps {
  member?: Member | null;
  onSubmit: (data: CreateMemberData) => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState<CreateMemberData>({
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    location: '',
    department: '',
    phoneNumber: '',
    maritalStatus: 'Single',
    occupation: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    baptismStatus: 'Not Baptized',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: memberService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSubmit(formData);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateMemberData }) =>
      memberService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSubmit(formData);
    },
  });

  // Load departments for dropdown
  useEffect(() => {
    departmentService.getDepartments().then(response => {
      setDepartments(response);
    }).catch(() => {
      // Handle error silently
    });
  }, []);

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth.split('T')[0],
        location: member.location,
        department: member.department._id,
        phoneNumber: member.phoneNumber,
        maritalStatus: member.maritalStatus,
        occupation: member.occupation || '',
        emergencyContact: member.emergencyContact,
        baptismStatus: member.baptismStatus,
        notes: member.notes || '',
      });
    }
  }, [member]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!formData.emergencyContact.name.trim()) {
      newErrors['emergencyContact.name'] = 'Emergency contact name is required';
    }

    if (!formData.emergencyContact.phone.trim()) {
      newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.emergencyContact.phone)) {
      newErrors['emergencyContact.phone'] = 'Please enter a valid phone number';
    }

    if (!formData.emergencyContact.relationship.trim()) {
      newErrors['emergencyContact.relationship'] = 'Emergency contact relationship is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      fullName: formData.fullName.trim(),
      location: formData.location.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      occupation: formData.occupation?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      emergencyContact: {
        name: formData.emergencyContact.name.trim(),
        phone: formData.emergencyContact.phone.trim(),
        relationship: formData.emergencyContact.relationship.trim(),
      },
    };

    if (member) {
      updateMutation.mutate({ id: member._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: keyof CreateMemberData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmergencyContactChange = (field: keyof typeof formData.emergencyContact, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
    if (errors[`emergencyContact.${field}`]) {
      setErrors(prev => ({ ...prev, [`emergencyContact.${field}`]: '' }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      title={member ? 'Edit Member' : 'Add Member'}
      onClose={onCancel}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={errors.fullName}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                required
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                error={errors.dateOfBirth}
                required
              />
            </div>

            <div>
              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                error={errors.location}
                placeholder="Enter location"
                required
              />
            </div>

            <div>
              <Input
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                error={errors.phoneNumber}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <Select
                label="Marital Status"
                value={formData.maritalStatus}
                onChange={(e) => handleChange('maritalStatus', e.target.value)}
                required
                options={[
                  { value: 'Single', label: 'Single' },
                  { value: 'Married', label: 'Married' },
                  { value: 'Divorced', label: 'Divorced' },
                  { value: 'Widowed', label: 'Widowed' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Occupation"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="Enter occupation (optional)"
              />
            </div>

            <div>
              <Select
                label="Baptism Status"
                value={formData.baptismStatus}
                onChange={(e) => handleChange('baptismStatus', e.target.value)}
                required
                options={[
                  { value: 'Baptized', label: 'Baptized' },
                  { value: 'Not Baptized', label: 'Not Baptized' },
                  { value: 'Planning to be Baptized', label: 'Planning to be Baptized' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Department Assignment */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Department Assignment</h3>
          <div>
            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              error={errors.department}
              placeholder="Select department"
              required
              options={departments.map(dept => ({
                value: dept._id,
                label: dept.name
              }))}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                label="Contact Name"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                error={errors['emergencyContact.name']}
                placeholder="Enter contact name"
                required
              />
            </div>

            <div>
              <Input
                label="Contact Phone"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                error={errors['emergencyContact.phone']}
                placeholder="Enter contact phone"
                required
              />
            </div>

            <div>
              <Input
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                error={errors['emergencyContact.relationship']}
                placeholder="e.g., Spouse, Parent, Sibling"
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter any additional notes about this member..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
                {member ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              member ? 'Update Member' : 'Create Member'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
