import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { memberService } from '../../services/memberService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import type { SendSMSData, Member } from '../../types';

interface SMSFormProps {
  onSubmit: (data: SendSMSData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SMSForm({ onSubmit, onCancel, isLoading = false }: SMSFormProps) {
  const [formData, setFormData] = useState<SendSMSData>({
    message: '',
    recipients: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);

  // Load members for selection
  useEffect(() => {
    memberService.getMembers({ limit: 1000 }).then(response => {
      setMembers(response.data);
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

    if (formData.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
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
      recipients: formData.recipients,
    });
  };

  const handleMessageChange = (value: string) => {
    setFormData(prev => ({ ...prev, message: value }));
    if (errors.message) {
      setErrors(prev => ({ ...prev, message: '' }));
    }
  };

  const handleRecipientChange = (value: string) => {
    if (value && !formData.recipients.includes(value)) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, value]
      }));
    }
    if (errors.recipients) {
      setErrors(prev => ({ ...prev, recipients: '' }));
    }
  };

  const removeRecipient = (recipient: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  const getMemberName = (memberId: string) => {
    const member = members.find(m => m._id === memberId);
    return member ? `${member.fullName} (${member.phoneNumber})` : memberId;
  };

  return (
    <Modal
      isOpen={true}
      title="Send SMS"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Recipients
          </label>
          <Select
            value=""
            onChange={handleRecipientChange}
            placeholder="Select a member to add..."
            options={members
              .filter(member => !formData.recipients.includes(member._id))
              .map(member => ({
                value: member._id,
                label: `${member.fullName} (${member.phoneNumber})`
              }))
            }
          />
          {errors.recipients && (
            <p className="mt-1 text-sm text-red-600">{errors.recipients}</p>
          )}
        </div>

        {/* Selected Recipients */}
        {formData.recipients.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Recipients ({formData.recipients.length})
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.recipients.map((recipient) => (
                <div key={recipient} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-900">{getMemberName(recipient)}</span>
                  <button
                    type="button"
                    onClick={() => removeRecipient(recipient)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
              `Send SMS (${formData.recipients.length} recipients)`
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
