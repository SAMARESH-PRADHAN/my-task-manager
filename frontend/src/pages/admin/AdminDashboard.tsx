import React, { useState, useEffect } from "react";
import {
  FileText,
  IndianRupee,
  TrendingUp,
  Clock,
  Copy,
  Briefcase,
  GraduationCap,
  Building,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { api } from "@/lib/api";
import StatCard from "@/components/layout/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const AdminDashboard: React.FC = () => {
  const { employees } = useData();

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/tasks/stats/dashboard").then((res) => setStats(res.data));
  }, []);

  const todayRevenue = stats?.todayRevenue ?? 0;
  const totalPendingTasks = stats?.pendingCount ?? 0;
  const totalCustomers = stats?.totalCustomers ?? 0;
  const jobSeekerCount = stats?.serviceBreakdown?.job_seeker ?? 0;
  const studentCount = stats?.serviceBreakdown?.student ?? 0;
  const govSchemeCount = stats?.serviceBreakdown?.gov_scheme ?? 0;
  const xeroxCount = stats?.serviceBreakdown?.xerox ?? 0;
  const todayFormFillingCount = stats?.todayFormFilling ?? 0;
  const todayXeroxCount = stats?.todayXerox ?? 0;

  const serviceDistribution = [
    { name: "Job Seeker", value: jobSeekerCount, color: "hsl(var(--chart-1))" },
    { name: "Student", value: studentCount, color: "hsl(var(--chart-2))" },
    { name: "Gov Scheme", value: govSchemeCount, color: "hsl(var(--chart-3))" },
    { name: "Offline Work", value: xeroxCount, color: "hsl(var(--chart-4))" },
  ];

  const revenueByService = [
    { name: "Job Seeker", revenue: stats?.revenueByService?.job_seeker ?? 0, fill: "hsl(var(--chart-1))" },
    { name: "Student", revenue: stats?.revenueByService?.student ?? 0, fill: "hsl(var(--chart-2))" },
    { name: "Gov Scheme", revenue: stats?.revenueByService?.gov_scheme ?? 0, fill: "hsl(var(--chart-3))" },
    { name: "Offline Work", revenue: stats?.revenueByService?.xerox ?? 0, fill: "hsl(var(--chart-4))" },
  ];

  const employeePerformance = employees.map((emp) => {
    const empStats = stats?.employeeStats?.find(
      (e: any) => String(e.employeeId) === String(emp.id)
    );
    return {
      name: emp.name,
      revenue: empStats?.revenue ?? 0,
    };
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Daily overview and analytics</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Today's Date</p>
          <p className="text-lg font-semibold text-foreground">
            {format(new Date(), "dd MMM yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Tasks"
          value={totalPendingTasks}
          icon={Clock}
          iconClassName="bg-warning"
        />
        <StatCard
          title="Today's Tasks"
          value={todayFormFillingCount + todayXeroxCount}
          icon={FileText}
          iconClassName="bg-accent"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${todayRevenue.toLocaleString()}`}
          icon={IndianRupee}
          iconClassName="bg-success"
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={TrendingUp}
          iconClassName="bg-info"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Revenue by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByService}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                    fontWeight: 500,
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: 600,
                  }}
                  itemStyle={{
                    color: "hsl(var(--success))", // 🟢 green number
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Service Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Service Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      fontWeight: 400,
                    }}
                    itemStyle={{
                      color: "hsl(var(--foreground))",
                      fontWeight: 400,
                    }}
                    labelStyle={{
                      color: "hsl(var(--foreground))",
                      fontWeight: 600,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Briefcase className="h-5 w-5 text-chart-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Job Seeker</p>
                  <p className="font-semibold">{jobSeekerCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <GraduationCap className="h-5 w-5 text-chart-2" />
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-semibold">{studentCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building className="h-5 w-5 text-chart-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Gov Scheme</p>
                  <p className="font-semibold">{govSchemeCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Copy className="h-5 w-5 text-chart-4" />
                <div>
                  <p className="text-sm text-muted-foreground">Offline Work</p>
                  <p className="font-semibold">{xeroxCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Employee Performance (by Revenue)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeePerformance} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value) => [`₹${value}`, "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {employeePerformance.map((emp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-success font-semibold">
                    ₹{emp.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;