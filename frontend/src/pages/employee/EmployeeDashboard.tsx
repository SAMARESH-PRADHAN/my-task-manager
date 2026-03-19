import React, { useState, useEffect } from 'react';
import { FileText, Copy, IndianRupee, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { api } from '@/lib/api';
import StatCard from '@/components/layout/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<{ formFilling: any[], xerox: any[] }>({ formFilling: [], xerox: [] });

  useEffect(() => {
    if (!user) return;
    // Fetch dashboard stats
    api.get("/tasks/stats/dashboard").then((res) => setStats(res.data));
    // Fetch today's recent tasks for display
    api.get("/tasks/my").then((res) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const ff = res.data.filter((t: any) => t.service_type === 'form_filling' && new Date(t.created_at) >= today);
      const xx = res.data.filter((t: any) => t.service_type === 'xerox' && new Date(t.created_at) >= today);
      setRecentTasks({ formFilling: ff, xerox: xx });
    });
  }, [user]);

  const todayRevenue = stats?.todayRevenue ?? 0;
  const pendingTasks = stats?.pendingCount ?? 0;
  const todayFormFillingCount = stats?.todayFormFilling ?? 0;
  const todayXeroxCount = stats?.todayXerox ?? 0;
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's your daily overview.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Today's Date</p>
          <p className="text-lg font-semibold text-foreground">
            {format(new Date(), 'dd MMM yyyy')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Online work"
          value={todayFormFillingCount}
          icon={FileText}
          iconClassName="bg-primary"
        />
        <StatCard
          title="Today's Offline Work"
          value={todayXeroxCount}
          icon={Copy}
          iconClassName="bg-accent"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${todayRevenue.toLocaleString()}`}
          icon={IndianRupee}
          iconClassName="bg-success"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          icon={TrendingUp}
          iconClassName="bg-warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Online Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.formFilling.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No Online tasks for today
              </p>
            ) : (
              <div className="space-y-4">
                {recentTasks.formFilling.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{task.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{(task.form_service_type || '').replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{task.total_amount ?? task.revenue ?? 0}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          (task.work_status || task.workStatus) === 'completed'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {task.work_status || task.workStatus || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Offline Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.xerox.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No Offline tasks for today
              </p>
            ) : (
              <div className="space-y-4">
                {recentTasks.xerox.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{task.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{task.total_amount ?? task.revenue ?? 0}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          (task.payment_status || task.paymentStatus) === 'completed'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {task.payment_status || task.paymentStatus || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;