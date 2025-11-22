import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'error';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${variant === 'error' ? 'bg-error-100' : 'bg-warning-100'}
        `}>
          <AlertTriangle 
            className={`h-5 w-5 ${variant === 'error' ? 'text-error-600' : 'text-warning-600'}`} 
          />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          variant={variant === 'error' ? 'error' : 'warning'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};