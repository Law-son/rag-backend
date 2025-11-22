import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../../services/financeService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FinanceForm } from './FinanceForm';
import { 
  Plus, 
  Pencil, 
  Trash2,
  DollarSign,
  Download
} from 'lucide-react';
import type { FinanceRecord, CreateFinanceRecordData, FilterOptions } from '../../types';

export function FinanceModule() {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<FinanceRecord | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: financeData, isLoading, error } = useQuery({
    queryKey: ['finance-records', filters],
    queryFn: () => financeService.getFinanceRecords(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: financeService.deleteFinanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      setDeletingRecord(null);
    },
  });

  const handleCreate = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEdit = (record: FinanceRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = (record: FinanceRecord) => {
    setDeletingRecord(record);
  };

  const confirmDelete = () => {
    if (deletingRecord) {
      deleteMutation.mutate(deletingRecord._id);
    }
  };

  const handleFormSubmit = (data: CreateFinanceRecordData) => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Tithe':
        return 'success';
      case 'Offering':
        return 'info';
      case 'Donation':
        return 'warning';
      default:
        return 'default';
    }
  };

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
        <p className="text-red-600">Failed to load finance records</p>
      </div>
    );
  }

  const records = financeData?.data || [];
  const pagination = financeData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600">Track tithes, offerings, and donations</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleCreate} className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange({ type: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Tithe">Tithe</option>
              <option value="Offering">Offering</option>
              <option value="Donation">Donation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member/Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record, index) => {
                const rowNumber = ((pagination?.current || 1) - 1) * (pagination?.limit || 10) + index + 1;
                return (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap w-16">
                      <span className="text-sm font-medium text-gray-500">
                        {rowNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getTypeColor(record.type)} size="sm">
                      {record.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(record.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.member ? record.member.fullName : record.donorName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="secondary"
                onClick={() => handleFilterChange({ page: (pagination.current || 1) - 1 })}
                disabled={pagination.current === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleFilterChange({ page: (pagination.current || 1) + 1 })}
                disabled={pagination.current === pagination.pages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="secondary"
                    onClick={() => handleFilterChange({ page: Math.max(pagination.current - 1, 1) })}
                    disabled={pagination.current <= 1}
                    className="rounded-r-none"
                  >
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const startPage = Math.max(1, pagination.current - 2);
                    const pageNumber = startPage + i;
                    if (pageNumber > pagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handleFilterChange({ page: pageNumber })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === pagination.current
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
                    onClick={() => handleFilterChange({ page: Math.min(pagination.current + 1, pagination.pages) })}
                    disabled={pagination.current >= pagination.pages}
                    className="rounded-l-none"
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Finance Form Modal */}
      {showForm && (
        <FinanceForm
          record={editingRecord}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}


      {/* Delete Confirmation Dialog */}
      {deletingRecord && (
        <ConfirmDialog
          title="Delete Finance Record"
          message={`Are you sure you want to delete this ${deletingRecord.type.toLowerCase()} record of ${formatCurrency(deletingRecord.amount)}?`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingRecord(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
