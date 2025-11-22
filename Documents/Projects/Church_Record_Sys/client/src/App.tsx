

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginForm } from './components/auth/LoginForm';
import { ToastProvider } from './components/common/ToastContainer';
import { useAuth } from './contexts/AuthContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { MemberList } from './components/members/MemberList';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { DepartmentList } from './components/departments/DepartmentList';
import { FinanceModule } from './components/finance/FinanceModule';
import { SMSModule } from './components/sms/SMSModule';
import { UserList } from './components/users/UserList';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="members" element={<MemberList />} />
            <Route path="departments" element={<DepartmentList />} />
            <Route path="finance" element={<FinanceModule />} />
            <Route path="sms" element={<SMSModule />} />
            <Route path="users" element={<UserList />} />
          </Route>
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
