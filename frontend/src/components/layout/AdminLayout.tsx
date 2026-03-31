import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import MobileNav from './MobileNav';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  useInactivityLogout();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav role="admin" />
    </div>
  );
};

export default AdminLayout;