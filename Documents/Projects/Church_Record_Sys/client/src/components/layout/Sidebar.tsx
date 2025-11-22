import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  DollarSign, 
  MessageSquare, 
  UserPlus,
  Church
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'data-entry'],
    },
    {
      name: 'Members',
      href: '/dashboard/members',
      icon: Users,
      roles: ['admin', 'data-entry'],
    },
    {
      name: 'Departments',
      href: '/dashboard/departments',
      icon: Building2,
      roles: ['admin', 'data-entry'],
    },
    {
      name: 'Finance',
      href: '/dashboard/finance',
      icon: DollarSign,
      roles: ['admin', 'data-entry'],
    },
    {
      name: 'SMS',
      href: '/dashboard/sms',
      icon: MessageSquare,
      roles: ['admin'],
    },
    {
      name: 'Users',
      href: '/dashboard/users',
      icon: UserPlus,
      roles: ['admin'],
    },
  ];

  const filteredNavigation = navigationItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-4 py-6 border-b border-gray-200">
            <Church className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Church CMS</h1>
              <p className="text-xs text-gray-500">All Nations Redeemers</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};