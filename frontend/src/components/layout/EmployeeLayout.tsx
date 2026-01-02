import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import EmployeeSidebar from './EmployeeSidebar';
import MobileNav from './MobileNav';

const EmployeeLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'employee') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
  {/* Navbar */}
  <Navbar />

  {/* Content area below navbar */}
  <div className="flex flex-1 overflow-hidden">
    {/* Sidebar */}
    <EmployeeSidebar />

    {/* Scrollable main content */}
    <main className="flex-1 p-6 overflow-y-auto">
      <Outlet />
    </main>
  </div>

  <MobileNav role="employee" />
</div>

  );
};

export default EmployeeLayout;
