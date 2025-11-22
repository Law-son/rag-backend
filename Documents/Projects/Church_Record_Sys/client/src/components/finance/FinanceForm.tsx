import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../services/financeService';
import { memberService } from '../../services/memberService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Modal } from '../common/Modal';
import type { FinanceRecord, CreateFinanceRecordData, Member } from '../../types';

interface FinanceFormProps {
  record?: FinanceRecord | null;
  onSubmit: (data: CreateFinanceRecordData) => void;
  onCancel: () => void;
}

export function FinanceForm({ record, onSubmit, onCancel }: FinanceFormProps) {
  const [formData, setFormData] = useState<CreateFinanceRecordData>({
    amount: 0,
    type: 'Tithe',
    date: new Date().toISOString().split('T')[0],
    description: '',
    member: '',
    donorName: '',
    paymentMethod: 'Cash',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [customType, setCustomType] = useState('');
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [showCustomPaymentMethod, setShowCustomPaymentMethod] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: financeService.createFinanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      onSubmit(formData);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFinanceRecordData }) =>
      financeService.updateFinanceRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      onSubmit(formData);
    },
  });

  // Load members for dropdown
  useEffect(() => {
    memberService.getMembers({ limit: 1000 }).then(response => {
      setMembers(response.data);
    }).catch(() => {
      // Handle error silently
    });
  }, []);

  useEffect(() => {
    if (record) {
      // Check if type is a custom type (not in predefined list)
      const predefinedTypes = ['Tithe', 'Offering', 'Donation'];
      const isCustomType = !predefinedTypes.includes(record.type);
      
      // Check if payment method is custom (not in predefined list)
      const predefinedPaymentMethods = ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque'];
      const isCustomPaymentMethod = !predefinedPaymentMethods.includes(record.paymentMethod);
      
      setFormData({
        amount: record.amount,
        type: isCustomType ? '' : record.type,
        date: record.date.split('T')[0],
        description: record.description || '',
        member: record.member?._id || '',
        donorName: record.donorName || '',
        paymentMethod: isCustomPaymentMethod ? '' : record.paymentMethod,
      });
      
      // Set custom values if they exist
      if (isCustomType) {
        setCustomType(record.type);
        setShowCustomType(true);
      }
      
      if (isCustomPaymentMethod) {
        setCustomPaymentMethod(record.paymentMethod);
        setShowCustomPaymentMethod(true);
      }
    }
  }, [record]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    // Member and donor are now optional - no validation needed

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
      description: formData.description?.trim() || undefined,
      donorName: formData.donorName?.trim() || undefined,
      member: formData.member || undefined,
    };

    if (record) {
      updateMutation.mutate({ id: record._id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field: keyof CreateFinanceRecordData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMemberChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      member: value,
      donorName: value ? '' : prev.donorName // Clear donor name if member is selected
    }));
    if (errors.member) {
      setErrors(prev => ({ ...prev, member: '' }));
    }
  };

  const handleDonorNameChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      donorName: value,
      member: value ? '' : prev.member // Clear member if donor name is entered
    }));
    if (errors.member) {
      setErrors(prev => ({ ...prev, member: '' }));
    }
  };

  const handleTypeChange = (value: string) => {
    if (value === 'Custom') {
      setShowCustomType(true);
      setFormData(prev => ({ ...prev, type: '' }));
    } else {
      setShowCustomType(false);
      setCustomType('');
      setFormData(prev => ({ ...prev, type: value }));
    }
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: '' }));
    }
  };

  const handleCustomTypeChange = (value: string) => {
    setCustomType(value);
    setFormData(prev => ({ ...prev, type: value }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: '' }));
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === 'Custom') {
      setShowCustomPaymentMethod(true);
      setFormData(prev => ({ ...prev, paymentMethod: '' }));
    } else {
      setShowCustomPaymentMethod(false);
      setCustomPaymentMethod('');
      setFormData(prev => ({ ...prev, paymentMethod: value }));
    }
    if (errors.paymentMethod) {
      setErrors(prev => ({ ...prev, paymentMethod: '' }));
    }
  };

  const handleCustomPaymentMethodChange = (value: string) => {
    setCustomPaymentMethod(value);
    setFormData(prev => ({ ...prev, paymentMethod: value }));
    if (errors.paymentMethod) {
      setErrors(prev => ({ ...prev, paymentMethod: '' }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      title={record ? 'Edit Finance Record' : 'Add Finance Record'}
      onClose={onCancel}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              error={errors.amount}
              placeholder="0.00"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              error={errors.type}
              required
              options={[
                { value: 'Tithe', label: 'Tithe' },
                { value: 'Offering', label: 'Offering' },
                { value: 'Donation', label: 'Donation' },
                { value: 'Custom', label: 'Custom (specify below)' },
              ]}
            />
            {showCustomType && (
              <div className="mt-2">
                <Input
                  label="Custom Type"
                  value={customType}
                  onChange={(e) => handleCustomTypeChange(e.target.value)}
                  placeholder="Enter custom type..."
                  required={showCustomType}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              error={errors.date}
              required
            />
          </div>

          <div>
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              error={errors.paymentMethod}
              required
              options={[
                { value: 'Cash', label: 'Cash' },
                { value: 'Bank Transfer', label: 'Bank Transfer' },
                { value: 'Mobile Money', label: 'Mobile Money' },
                { value: 'Cheque', label: 'Cheque' },
                { value: 'Custom', label: 'Custom (specify below)' },
              ]}
            />
            {showCustomPaymentMethod && (
              <div className="mt-2">
                <Input
                  label="Custom Payment Method"
                  value={customPaymentMethod}
                  onChange={(e) => handleCustomPaymentMethodChange(e.target.value)}
                  placeholder="Enter custom payment method..."
                  required={showCustomPaymentMethod}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Member or Donor (Optional)
          </label>
          <div className="space-y-3">
            <Select
              label="Select Member"
              value={formData.member}
              onChange={handleMemberChange}
              placeholder="Choose a member (optional)..."
              options={members.map(member => ({
                value: member._id,
                label: `${member.fullName} (${member.department.name})`
              }))}
            />
            <div className="text-center text-sm text-gray-500">OR</div>
            <Input
              label="Donor Name"
              value={formData.donorName}
              onChange={handleDonorNameChange}
              placeholder="Enter donor name (optional)"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            You can leave both fields empty if the transaction is anonymous or from a non-member donor.
          </p>
          {errors.member && (
            <p className="mt-1 text-sm text-red-600">{errors.member}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Enter description..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
                {record ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              record ? 'Update Record' : 'Create Record'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
