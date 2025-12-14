import React from 'react';
import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, PlusCircle, ListTodo, Users, UserCheck, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  role: 'employee' | 'admin';
}

const employeeItems = [
  { title: 'Dashboard', url: '/employee/dashboard', icon: LayoutDashboard },
  { title: 'New Task', url: '/employee/new-task', icon: PlusCircle },
  { title: 'My Tasks', url: '/employee/my-tasks', icon: ListTodo },
];

const adminItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Employees', url: '/admin/employees', icon: Users },
  { title: 'Customers', url: '/admin/customers', icon: UserCheck },
  { title: 'Tasks', url: '/admin/all-tasks', icon: ListTodo },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
];

const MobileNav: React.FC<MobileNavProps> = ({ role }) => {
  const items = role === 'employee' ? employeeItems : adminItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors'
            )}
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
