import React, { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  format,
  subDays,
  subWeeks,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";

type TimeRange = "daily" | "weekly" | "monthly";

const Analytics: React.FC = () => {
  const { formFillingTasks, xeroxTasks, employees } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  // const getDateRange = () => {
  //   const now = new Date();
  //   switch (timeRange) {
  //     case 'daily':
  //       return { start: startOfDay(now), end: endOfDay(now) };
  //     case 'weekly':
  //       return { start: startOfWeek(now), end: endOfWeek(now) };
  //     case 'monthly':
  //       return { start: startOfMonth(now), end: endOfMonth(now) };
  //   }
  // };
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case "daily":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "weekly":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "monthly":
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [timeRange]);

  const filteredData = useMemo(() => {
    const range = dateRange;

    const filteredFormFilling = formFillingTasks.filter((t) =>
      isWithinInterval(new Date(t.createdAt), range)
    );
    const filteredXerox = xeroxTasks.filter((t) =>
      isWithinInterval(new Date(t.createdAt), range)
    );

    return { formFilling: filteredFormFilling, xerox: filteredXerox };
  }, [formFillingTasks, xeroxTasks, timeRange]);

  // Service distribution
  const serviceDistribution = useMemo(() => {
    const jobSeekerCount = filteredData.formFilling.filter(
      (t) => t.serviceType === "job_seeker"
    ).length;
    const studentCount = filteredData.formFilling.filter(
      (t) => t.serviceType === "student"
    ).length;
    const govSchemeCount = filteredData.formFilling.filter(
      (t) => t.serviceType === "gov_scheme"
    ).length;
    const xeroxCount = filteredData.xerox.length;

    return [
      {
        name: "Job Seeker",
        value: jobSeekerCount,
        color: "hsl(var(--chart-1))",
      },
      { name: "Student", value: studentCount, color: "hsl(var(--chart-2))" },
      {
        name: "Gov Scheme",
        value: govSchemeCount,
        color: "hsl(var(--chart-3))",
      },
      { name: "Xerox/Other", value: xeroxCount, color: "hsl(var(--chart-4))" },
    ];
  }, [filteredData]);

  // Revenue by service type (using revenue field)
  const revenueByService = useMemo(() => {
    const jobSeekerRevenue = filteredData.formFilling
      .filter((t) => t.serviceType === "job_seeker")
      .reduce((sum, t) => sum + (t.revenue || t.amount), 0);
    const studentRevenue = filteredData.formFilling
      .filter((t) => t.serviceType === "student")
      .reduce((sum, t) => sum + (t.revenue || t.amount), 0);
    const govSchemeRevenue = filteredData.formFilling
      .filter((t) => t.serviceType === "gov_scheme")
      .reduce((sum, t) => sum + (t.revenue || t.amount), 0);
    const xeroxRevenue = filteredData.xerox.reduce(
      (sum, t) => sum + (t.revenue || t.amount),
      0
    );

    return [
      { name: "Job Seeker", revenue: jobSeekerRevenue },
      { name: "Student", revenue: studentRevenue },
      { name: "Gov Scheme", revenue: govSchemeRevenue },
      { name: "Xerox/Other", revenue: xeroxRevenue },
    ];
  }, [filteredData]);

  // Employee performance by revenue (using revenue field)
  const employeePerformance = useMemo(() => {
    return employees
      .map((emp) => {
        const formFillingRevenue = filteredData.formFilling
          .filter((t) => t.employeeId === emp.id)
          .reduce((sum, t) => sum + (t.revenue || t.amount), 0);
        const xeroxRevenue = filteredData.xerox
          .filter((t) => t.employeeId === emp.id)
          .reduce((sum, t) => sum + (t.revenue || t.amount), 0);

        return {
          name: emp.name,
          revenue: formFillingRevenue + xeroxRevenue,
          formFilling: formFillingRevenue,
          xerox: xeroxRevenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [employees, filteredData]);

  // Daily trend data (using revenue field)
  const trendData = useMemo(() => {
    const now = new Date();
    const data = [];

    if (timeRange === "daily") {
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayFormFilling = filteredData.formFilling.filter((t) =>
          isWithinInterval(new Date(t.createdAt), {
            start: dayStart,
            end: dayEnd,
          })
        );
        const dayXerox = filteredData.xerox.filter((t) =>
          isWithinInterval(new Date(t.createdAt), {
            start: dayStart,
            end: dayEnd,
          })
        );

        data.push({
          date: format(date, "dd MMM"),
          formFilling: dayFormFilling.reduce(
            (sum, t) => sum + (t.revenue || t.amount),
            0
          ),
          xerox: dayXerox.reduce((sum, t) => sum + (t.revenue || t.amount), 0),
        });
      }
    } else if (timeRange === "weekly") {
      for (let i = 3; i >= 0; i--) {
        const weekDate = subWeeks(now, i);
        const weekStart = startOfWeek(weekDate);
        const weekEnd = endOfWeek(weekDate);

        const weekFormFilling = formFillingTasks.filter((t) =>
          isWithinInterval(new Date(t.createdAt), {
            start: weekStart,
            end: weekEnd,
          })
        );
        const weekXerox = xeroxTasks.filter((t) =>
          isWithinInterval(new Date(t.createdAt), {
            start: weekStart,
            end: weekEnd,
          })
        );

        data.push({
          date: `Week ${4 - i}`,
          formFilling: weekFormFilling.reduce(
            (sum, t) => sum + (t.revenue || t.amount),
            0
          ),
          xerox: weekXerox.reduce((sum, t) => sum + (t.revenue || t.amount), 0),
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthFormFilling = formFillingTasks.filter((t) =>
          isWithinInterval(new Date(t.createdAt), {
            start: monthStart,
            end: monthEnd,
          })
        );
        const monthXerox = xeroxTasks.filter((t) =>
          isWithinInterval(new Date(t.createdAt), {
            start: monthStart,
            end: monthEnd,
          })
        );

        data.push({
          date: format(monthDate, "MMM"),
          formFilling: monthFormFilling.reduce(
            (sum, t) => sum + (t.revenue || t.amount),
            0
          ),
          xerox: monthXerox.reduce(
            (sum, t) => sum + (t.revenue || t.amount),
            0
          ),
        });
      }
    }

    return data;
  }, [formFillingTasks, xeroxTasks, timeRange]);

  // Total revenue using revenue field
  const totalRevenue =
    filteredData.formFilling.reduce(
      (sum, t) => sum + (t.revenue || t.amount),
      0
    ) + filteredData.xerox.reduce((sum, t) => sum + (t.revenue || t.amount), 0);

  const totalTasks =
    filteredData.formFilling.length + filteredData.xerox.length;

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and revenue metrics
          </p>
        </div>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={
                timeRange === range
                  ? "gradient-primary text-primary-foreground"
                  : ""
              }
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold text-foreground">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-3xl font-bold text-foreground">{totalTasks}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Form Filling</p>
            <p className="text-3xl font-bold text-foreground">
              {filteredData.formFilling.length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Xerox/Other</p>
            <p className="text-3xl font-bold text-foreground">
              {filteredData.xerox.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    cursor={false}
                    formatter={(value, _name, props: any) => {
                      const key = props.dataKey;

                      const label =
                        key === "formFilling"
                          ? "Form Filling"
                          : key === "xerox"
                          ? "Xerox / Other"
                          : key;

                      return [`₹${value}`, label];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="formFilling"
                    name="Form Filling"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="xerox"
                    name="Xerox/Other"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
          </CardContent>
        </Card>

        {/* Revenue by Service Type */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Revenue Analysis by Service Type
            </CardTitle>
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
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance by Revenue */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">
              Employee Performance by Revenue
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
                    cursor={false}
                    formatter={(value, _name, props: any) => {
                      const key = props.dataKey;

                      const label =
                        key === "formFilling"
                          ? "Form Filling"
                          : key === "xerox"
                          ? "Xerox / Other"
                          : key;

                      return [`₹${value}`, label];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="formFilling"
                    name="Form Filling"
                    stackId="a"
                    fill="hsl(var(--chart-1))"
                  />
                  <Bar
                    dataKey="xerox"
                    name="Xerox/Other"
                    stackId="a"
                    fill="hsl(var(--chart-2))"
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

export default Analytics;
