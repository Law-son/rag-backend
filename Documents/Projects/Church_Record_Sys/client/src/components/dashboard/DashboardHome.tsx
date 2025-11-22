import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Badge } from '../common/Badge';
import { 
  Users, 
  Building2, 
  DollarSign,
  Calendar,
  BarChart3,
  UserPlus
} from 'lucide-react';

export function DashboardHome() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

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
        <p className="text-red-600">Failed to load dashboard data</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

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

  const getDaysUntilBirthday = (birthdayThisYear: string) => {
    const today = new Date();
    const birthday = new Date(birthdayThisYear);
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome to All Nations Redeemers Chapel International</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Departments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalDepartments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Monthly Income</p>
              <p className="text-md font-semibold text-gray-900">{formatCurrency(stats.overview.monthlyIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Yearly Income</p>
              <p className="text-md font-semibold text-gray-900">{formatCurrency(stats.overview.yearlyIncome)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finance Summary */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Finance Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Tithe</span>
                <span className="font-semibold text-green-600">{formatCurrency(stats.finance.monthly.tithe)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Offering</span>
                <span className="font-semibold text-blue-600">{formatCurrency(stats.finance.monthly.offering)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Donations</span>
                <span className="font-semibold text-purple-600">{formatCurrency(stats.finance.monthly.donation)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Monthly Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(stats.finance.monthly.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Birthdays</h3>
          </div>
          <div className="p-6">
            {stats.upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingBirthdays.slice(0, 5).map((member) => {
                  const daysUntil = getDaysUntilBirthday(member.birthdayThisYear);
                  return (
                    <div key={member._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                        <p className="text-xs text-gray-500">{member.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{formatDate(member.birthdayThisYear)}</p>
                        <Badge 
                          variant={daysUntil <= 7 ? 'error' : daysUntil <= 30 ? 'warning' : 'default'}
                          size="sm"
                        >
                          {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming birthdays</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Members</h3>
          </div>
          <div className="p-6">
            {stats.recentMembers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentMembers.slice(0, 5).map((member) => (
                  <div key={member._id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserPlus className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                        <p className="text-xs text-gray-500">{member.department.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(member.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent members</p>
            )}
          </div>
        </div>

        {/* Members by Department */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Members by Department</h3>
          </div>
          <div className="p-6">
            {stats.membersByDepartment.length > 0 ? (
              <div className="space-y-3">
                {stats.membersByDepartment.map((dept) => (
                  <div key={dept._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{dept.name}</span>
                    <Badge variant="default" size="sm">{dept.count} members</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No department data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
