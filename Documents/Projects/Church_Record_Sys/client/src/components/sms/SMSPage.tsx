import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '../../services/departmentService';
import { memberService } from '../../services/memberService';
import { smsService } from '../../services/smsService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  MessageSquare, 
  Users, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Department, Member, SMSLog, SMSProgress } from '../../types';

interface SMSPageProps {
  // Add any props if needed
}

export function SMSPage({}: SMSPageProps) {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [smsTitle, setSmsTitle] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [smsProgress, setSmsProgress] = useState<SMSProgress | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const queryClient = useQueryClient();

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getDepartments,
  });

  // Fetch members based on selected departments
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members-sms', selectedDepartments.sort().join(',')],
    queryFn: () => {
      if (selectedDepartments.length === 0) {
        // If no departments selected, get all members
        return memberService.getMembers({ limit: 1000 });
      } else {
        // Get members from selected departments (comma-separated)
        return memberService.getMembers({ 
          department: selectedDepartments.join(','), 
          limit: 1000 
        });
      }
    },
    enabled: true,
  });

  // Fetch SMS history with pagination
  const { data: smsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['sms-history', currentPage],
    queryFn: () => smsService.getSMSLogs({ page: currentPage, limit: 10 }),
  });

  const members = membersData?.data || [];
  const totalMembers = members.length;

  // SMS sending mutation
  const sendSMSMutation = useMutation({
    mutationFn: smsService.sendBulkSMS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-history'] });
      setIsSending(false);
      setSmsProgress(null);
      setSmsTitle('');
      setSmsMessage('');
      setSelectedDepartments([]);
    },
    onError: () => {
      setIsSending(false);
      setSmsProgress(null);
    },
  });

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setSelectedDepartments([]);
    } else if (!selectedDepartments.includes(value)) {
      setSelectedDepartments(prev => [...prev, value]);
    }
    // Reset the select to show placeholder
    e.target.value = '';
  };

  const removeDepartment = (departmentId: string) => {
    setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!smsTitle.trim()) {
      newErrors.title = 'SMS title is required';
    }

    if (!smsMessage.trim()) {
      newErrors.message = 'SMS message is required';
    } else if (smsMessage.trim().length > 160) {
      newErrors.message = 'Message must be 160 characters or less';
    }

    if (totalMembers === 0) {
      newErrors.recipients = 'No members found for selected departments';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendSMS = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSending(true);
    setSmsProgress({ sent: 0, total: totalMembers, failed: 0, isComplete: false });

    try {
      const result = await sendSMSMutation.mutateAsync({
        title: smsTitle.trim(),
        message: smsMessage.trim(),
        filters: {
          departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        },
      });

      // Start real-time progress tracking
      if (result.sessionId) {
        setCurrentSessionId(result.sessionId);
        startProgressTracking(result.sessionId);
      }
    } catch (error) {
      setIsSending(false);
      setSmsProgress(null);
    }
  };

  const startProgressTracking = (sessionId: string) => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = smsService.createProgressStream(sessionId);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const progress = JSON.parse(event.data);
        setSmsProgress({
          sent: progress.sent,
          total: progress.totalRecipients,
          failed: progress.failed,
          isComplete: progress.isComplete
        });

        if (progress.isComplete) {
          setIsSending(false);
          setSmsProgress(null);
          setCurrentSessionId(null);
          eventSource.close();
          eventSourceRef.current = null;
          
          // Refresh SMS history
          queryClient.invalidateQueries({ queryKey: ['sms-history'] });
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Progress stream error:', error);
      eventSource.close();
      eventSourceRef.current = null;
      setIsSending(false);
      setSmsProgress(null);
      setCurrentSessionId(null);
    };
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => d._id === departmentId);
    return department ? department.name : departmentId;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (!smsHistory?.pagination || smsHistory.pagination.pages <= 1) return null;

    const { current, pages } = smsHistory.pagination;
    const pagesToShow = [];
    
    // Show first page
    if (current > 3) {
      pagesToShow.push(1);
      if (current > 4) pagesToShow.push('...');
    }
    
    // Show pages around current
    for (let i = Math.max(1, current - 2); i <= Math.min(pages, current + 2); i++) {
      pagesToShow.push(i);
    }
    
    // Show last page
    if (current < pages - 2) {
      if (current < pages - 3) pagesToShow.push('...');
      pagesToShow.push(pages);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing {((current - 1) * 10) + 1} to {Math.min(current * 10, smsHistory.pagination.total)} of {smsHistory.pagination.total} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(current - 1)}
            disabled={current === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {pagesToShow.map((page, index) => (
            <Button
              key={index}
              variant={page === current ? "primary" : "secondary"}
              size="sm"
              onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
              disabled={typeof page !== 'number'}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePageChange(current + 1)}
            disabled={current === pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SMS Management</h1>
        <p className="text-gray-600">Send SMS notifications to church members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send SMS</h2>
          
          {/* Department Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Departments
            </label>
            <div className="space-y-3">
              <Select
                value=""
                onChange={handleDepartmentChange}
                placeholder="Select departments to send SMS to..."
                options={[
                  { value: 'all', label: 'All Members' },
                  ...departments.map(dept => ({
                    value: dept._id,
                    label: dept.name
                  }))
                ]}
                disabled={departmentsLoading}
              />
              
              {selectedDepartments.length > 0 && (
                <div className="space-y-2">
                  {selectedDepartments.map(deptId => (
                    <div key={deptId} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                      <span className="text-sm text-gray-900">{getDepartmentName(deptId)}</span>
                      <button
                        onClick={() => removeDepartment(deptId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedDepartments.length === 0 && (
                <div className="p-3 bg-gray-50 rounded border">
                  <span className="text-sm text-gray-600">All Members</span>
                </div>
              )}
            </div>
            
            {/* Member Count */}
            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  {totalMembers} members will receive this SMS
                </span>
              </div>
            </div>
            
            {errors.recipients && (
              <p className="mt-2 text-sm text-red-600">{errors.recipients}</p>
            )}
          </div>

          {/* SMS Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMS Title
            </label>
            <Input
              value={smsTitle}
              onChange={(e) => {
                setSmsTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="Enter SMS title (for identification)"
              error={errors.title}
            />
          </div>

          {/* SMS Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={smsMessage}
              onChange={(e) => {
                setSmsMessage(e.target.value);
                if (errors.message) setErrors(prev => ({ ...prev, message: '' }));
              }}
              placeholder="Enter your message..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.message ? 'border-red-300' : 'border-gray-300'
              } ${smsMessage.length > 160 ? 'border-red-300' : ''}`}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={errors.message ? 'text-red-600' : 'text-gray-500'}>
                {errors.message || ''}
              </span>
              <span className={smsMessage.length > 160 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                {smsMessage.length}/160 characters
              </span>
            </div>
            {smsMessage.length > 160 && (
              <div className="mt-1 flex items-center text-xs text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                Message exceeds 160 character limit
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {smsProgress && (
            <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">
                  {smsProgress.isComplete ? 'SMS Sending Complete!' : 'Sending SMS in batches...'}
                </span>
                <span className="text-sm text-blue-600">
                  {smsProgress.sent}/{smsProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(smsProgress.sent / smsProgress.total) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-blue-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {smsProgress.sent} sent
                  </div>
                  {smsProgress.failed > 0 && (
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      {smsProgress.failed} failed
                    </div>
                  )}
                </div>
                <div className="text-xs text-blue-600">
                  {Math.ceil(smsProgress.total / 100)} batches • 100 SMS per batch
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendSMS}
            disabled={isSending || totalMembers === 0 || smsMessage.length > 160}
            className="w-full flex items-center justify-center"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending SMS...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send SMS to {totalMembers} members
              </>
            )}
          </Button>
        </div>

        {/* SMS History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SMS History</h2>
          
          {historyLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : smsHistory?.data && smsHistory.data.length > 0 ? (
            <div className="space-y-4">
              {smsHistory.data.map((log: SMSLog) => (
                <div key={log._id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {log.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {log.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {log.recipients.length} recipients
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(log.status)} size="sm">
                      {log.status}
                    </Badge>
                  </div>
                  
                  {/* Recipients Summary */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      {log.recipients.filter(r => r.status === 'sent').length} sent
                    </div>
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      {log.recipients.filter(r => r.status === 'failed').length} failed
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                      {log.recipients.filter(r => r.status === 'pending').length} pending
                    </div>
                  </div>
                </div>
              ))}
              
              {renderPagination()}
            </div>
          ) : (
            <div className="text-center py-10">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SMS history found</h3>
              <p className="text-gray-600">SMS messages you send will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
