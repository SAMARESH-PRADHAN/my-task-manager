import React from 'react';
import { FileText, Copy, IndianRupee, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import StatCard from '@/components/layout/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { formFillingTasks, xeroxTasks, getEmployeeTasks, getTodayStats } = useData();

  const employeeTasks = user ? getEmployeeTasks(user.id) : { formFilling: [], xerox: [] };
  // const todayStats = getTodayStats();

  // Today's tasks for this employee
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayFormFilling = employeeTasks.formFilling.filter(
    (t) => new Date(t.createdAt) >= today
  );
  const todayXerox = employeeTasks.xerox.filter((t) => new Date(t.createdAt) >= today);
// !changes here
 const todayRevenue =
  todayFormFilling.reduce((sum, t) => sum + t.revenue, 0) +
  todayXerox.reduce((sum, t) => sum + t.revenue, 0);

// !to here

  const completedTasks =
  todayFormFilling.filter(t => t.workStatus === 'completed').length +
  todayXerox.filter(t => t.paymentStatus === 'completed').length;


// !2nd change here 
  const pendingTasks =
  todayFormFilling.filter(t => t.workStatus === 'pending').length +
  todayXerox.filter(t => t.paymentStatus !== 'completed').length;

// !here
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
          title="Today's Form Filling"
          value={todayFormFilling.length}
          icon={FileText}
          iconClassName="bg-primary"
        />
        <StatCard
          title="Today's Xerox/Other"
          value={todayXerox.length}
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
            <CardTitle className="text-lg">Recent Form Filling Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {todayFormFilling.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No form filling tasks for today
              </p>
            ) : (
              <div className="space-y-4">
                {todayFormFilling.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{task.customerName}</p>
                      <p className="text-sm text-muted-foreground">{task.serviceType.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{task.amount}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.workStatus === 'completed'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {task.workStatus}
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
            <CardTitle className="text-lg">Recent Xerox/Other Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {todayXerox.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No xerox/other tasks for today
              </p>
            ) : (
              <div className="space-y-4">
                {todayXerox.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{task.customerName}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{task.amount}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.paymentStatus === 'completed'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {task.paymentStatus}
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
