import React from 'react';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, Users, UserCheck, ListTodo, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Employees', url: '/admin/employees', icon: Users },
  { title: 'Customers', url: '/admin/customers', icon: UserCheck },
  { title: 'All Tasks', url: '/admin/all-tasks', icon: ListTodo },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
];

const AdminSidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <span className="text-lg font-bold text-sidebar-foreground">Admin Panel</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sidebar-foreground transition-all hover:bg-sidebar-accent'
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
