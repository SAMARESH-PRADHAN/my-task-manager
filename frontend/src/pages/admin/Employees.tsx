import React, { useState, useEffect } from "react";
import {
  Plus,
  MoreVertical,
  Edit,
  Eye,
  Download,
  FileText,
  Clock,
  IndianRupee,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  useData,
  Employee,
  FormFillingTask,
  XeroxTask,
} from "@/contexts/DataContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DateFilter from "@/components/layout/shared/DateFilter";
import Pagination from "@/components/layout/shared/Pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { downloadExcel } from "@/utils/excel";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";

const ITEMS_PER_PAGE = 6;

// ─── Shimmer Skeleton Helpers ────────────────────────────────────────────────

const shimmerStyle: React.CSSProperties = {
  background:
    "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground)/0.1) 50%, hsl(var(--muted)) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  borderRadius: "6px",
};

if (typeof document !== "undefined" && !document.getElementById("shimmer-style")) {
  const style = document.createElement("style");
  style.id = "shimmer-style";
  style.textContent = `
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

const Shimmer: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = "100%",
  height = "16px",
  className = "",
}) => (
  <div style={{ ...shimmerStyle, width, height }} className={className} />
);

const EmployeeCardSkeleton: React.FC = () => (
  <Card className="shadow-card">
    <CardContent className="p-6">
      {/* Header row: avatar + name/email/phone + menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            style={{ ...shimmerStyle, width: 56, height: 56, borderRadius: "50%" }}
          />
          <div className="space-y-2">
            <Shimmer width="130px" height="18px" />
            <Shimmer width="160px" height="13px" />
            <Shimmer width="100px" height="13px" />
          </div>
        </div>
        <Shimmer width="28px" height="28px" className="rounded-md" />
      </div>

      {/* Stats grid */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-2 bg-muted/50 rounded-lg gap-2">
            <Shimmer width="20px" height="20px" className="rounded-full" />
            <Shimmer width="60px" height="20px" />
            <Shimmer width="80px" height="11px" />
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="mt-3 pt-3 border-t border-border">
        <Shimmer width="70%" height="13px" />
      </div>
    </CardContent>
  </Card>
);

const EmployeesSkeleton: React.FC = () => (
  <div className="space-y-6 pb-20 lg:pb-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Shimmer width="160px" height="32px" />
        <Shimmer width="200px" height="14px" />
      </div>
      <Shimmer width="140px" height="38px" className="rounded-md" />
    </div>

    {/* Search bar */}
    <Shimmer width="320px" height="38px" className="rounded-md" />

    {/* Filters row */}
    <div className="flex flex-wrap items-center gap-4">
      <Shimmer width="80px" height="13px" />
      <Shimmer width="130px" height="38px" className="rounded-md" />
      <Shimmer width="100px" height="38px" className="rounded-md" />
      <Shimmer width="80px" height="34px" className="rounded-md" />
    </div>

    {/* Employee cards grid */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <EmployeeCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Employees: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
  } = useData();

  const [allTasks, setAllTasks] = useState<any[] | null>(null);

  useEffect(() => {
    api.get("/tasks/stats/employees").then((res) => {
      // Flatten all tasks from all employees into one array
      const flat: any[] = [];
      Object.values(res.data).forEach((emp: any) => {
        emp.tasks.forEach((t: any) => flat.push({
          ...t,
          employeeId: String(t.employee_id),
          workStatus: t.work_status,
          paymentStatus: t.payment_status === 'unpaid' ? 'pending' : t.payment_status,
          serviceType: t.service_type,
          createdAt: t.created_at,
          revenue: Number(t.revenue || t.total_amount || 0),
          amount: Number(t.total_amount || 0),
        }));
      });
      setAllTasks(flat);
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Month/year selector state — defaults to current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isMonthFilterActive, setIsMonthFilterActive] = useState(false);
  // Card quick filter — affects task counts shown on employee cards
  // const [cardFilter, setCardFilter] = useState<"all" | "daily" | "monthly">(
  //   "all",
  // );

  // Add employee modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  // Edit employee modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // View tasks modal
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [taskFromDate, setTaskFromDate] = useState<Date | undefined>();
  const [taskToDate, setTaskToDate] = useState<Date | undefined>();
  const [taskServiceType, setTaskServiceType] = useState<
    "all" | "form_filling" | "xerox"
  >("all");
  const [taskPage, setTaskPage] = useState(1);
  const [taskQuickFilter, setTaskQuickFilter] = useState<
    "all" | "daily" | "monthly"
  >("all");

  // Show skeleton while data is loading (after all hooks)
  if (allTasks === null) return <EmployeesSkeleton />;

  const formFillingTasks = allTasks.filter(t => t.serviceType === 'form_filling');
  const xeroxTasks = allTasks.filter(t => t.serviceType === 'xerox');

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery),
  );

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get employee stats — revenue based on selected month/year, counts based on cardFilter
  const getEmployeeStats = (employeeId: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    };

    const isYesterday = (dateStr: string) => {
      const d = new Date(dateStr);
      return (
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear()
      );
    };

    const isSelectedMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    };

    const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    const isPrevMonth = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear;
    };

    const empFormFilling = formFillingTasks.filter(
      (t) => t.employeeId === employeeId,
    );

    const empXerox = xeroxTasks.filter((t) => t.employeeId === employeeId);

    // const usingCurrentMonth =
    //   selectedMonth === today.getMonth() &&
    //   selectedYear === today.getFullYear();

    let filteredFF: FormFillingTask[] = [];
    let filteredXerox: XeroxTask[] = [];

    if (!isMonthFilterActive) {
      filteredFF = empFormFilling.filter((t) => isToday(t.createdAt));
      filteredXerox = empXerox.filter((t) => isToday(t.createdAt));
    } else {
      filteredFF = empFormFilling.filter((t) => isSelectedMonth(t.createdAt));
      filteredXerox = empXerox.filter((t) => isSelectedMonth(t.createdAt));
    }

    const totalTasks = filteredFF.length + filteredXerox.length;

    const pendingTasks =
      filteredFF.filter(
        (t) => t.workStatus === "pending" || t.paymentStatus === "pending",
      ).length +
      filteredXerox.filter((t) => t.paymentStatus === "pending").length;

    let thisRevenue = 0;
    let prevRevenue = 0;

    if (!isMonthFilterActive) {
      thisRevenue =
        empFormFilling
          .filter((t) => isToday(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0) +
        empXerox
          .filter((t) => isToday(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0);

      prevRevenue =
        empFormFilling
          .filter((t) => isYesterday(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0) +
        empXerox
          .filter((t) => isYesterday(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0);
    } else {
      thisRevenue =
        empFormFilling
          .filter((t) => isSelectedMonth(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0) +
        empXerox
          .filter((t) => isSelectedMonth(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0);

      prevRevenue =
        empFormFilling
          .filter((t) => isPrevMonth(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0) +
        empXerox
          .filter((t) => isPrevMonth(t.createdAt))
          .reduce((s, t) => s + t.revenue, 0);
    }

    return {
      totalTasks,
      pendingTasks,
      thisMonthRevenue: thisRevenue,
      lastMonthRevenue: prevRevenue,
    };
  };

  const handleAddEmployee = () => {
    if (
      !newEmployee.name ||
      !newEmployee.email ||
      !newEmployee.phone ||
      !newEmployee.password
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    addEmployee(newEmployee);
    toast.success("Employee added successfully!");
    setIsAddModalOpen(false);
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    });
  };

  const handleEditEmployee = () => {
    if (!editingEmployee) return;

    updateEmployee(editingEmployee.id, {
      name: editingEmployee.name,
      email: editingEmployee.email,
      phone: editingEmployee.phone,
      address: editingEmployee.address,
      password: editingEmployee.password,
    });
    toast.success("Employee updated successfully!");
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const getEmployeeTasks = (employeeId: string) => {
    let formFilling = formFillingTasks.filter(
      (t) => t.employeeId === employeeId,
    );
    let xerox = xeroxTasks.filter((t) => t.employeeId === employeeId);

    // Quick filter: daily or monthly
    const today = new Date();
    if (taskQuickFilter === "daily") {
      const start = startOfDay(today);
      const end = endOfDay(today);
      formFilling = formFilling.filter((t) =>
        isWithinInterval(new Date(t.createdAt), { start, end }),
      );
      xerox = xerox.filter((t) =>
        isWithinInterval(new Date(t.createdAt), { start, end }),
      );
    } else if (taskQuickFilter === "monthly") {
      formFilling = formFilling.filter((t) => {
        const d = new Date(t.createdAt);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });
      xerox = xerox.filter((t) => {
        const d = new Date(t.createdAt);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });
    }

    // Apply custom date filter (only when not using quick filter)
    if (taskQuickFilter === "all" && taskFromDate && taskToDate) {
      formFilling = formFilling.filter((t) =>
        isWithinInterval(new Date(t.createdAt), {
          start: startOfDay(taskFromDate),
          end: endOfDay(taskToDate),
        }),
      );
      xerox = xerox.filter((t) =>
        isWithinInterval(new Date(t.createdAt), {
          start: startOfDay(taskFromDate),
          end: endOfDay(taskToDate),
        }),
      );
    }

    if (taskServiceType === "form_filling") return { formFilling, xerox: [] };
    if (taskServiceType === "xerox") return { formFilling: [], xerox };
    return { formFilling, xerox };
  };

  const handleDownloadTasks = () => {
    if (!viewingEmployee) return;

    const tasks = getEmployeeTasks(viewingEmployee.id);
    const mergedTasks = [
      ...tasks.formFilling.map((t) => ({
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        serviceType: t.serviceType,
        amount: t.revenue,
        workStatus: t.workStatus,
        paymentStatus: t.paymentStatus,
        createdAt: t.createdAt,
      })),
      ...tasks.xerox.map((t) => ({
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        serviceType: "Xerox/Other",
        amount: t.revenue,
        workStatus: "N/A",
        paymentStatus: t.paymentStatus,
        createdAt: t.createdAt,
      })),
    ];

    const allTasksExport = mergedTasks.map((task, index) => ({
      "Serial No": index + 1,
      "Customer Name": task.customerName,
      Phone: task.customerPhone,
      "Service Type": task.serviceType,
      Amount: task.amount,
      "Work Status": task.workStatus,
      "Payment Status": task.paymentStatus,
      Date: format(new Date(task.createdAt), "dd/MM/yyyy HH:mm"),
    }));

    downloadExcel(allTasksExport, `${viewingEmployee.name}_tasks`);
    toast.success("Tasks exported successfully!");
  };

  // Label for the selected month shown on cards
  const selectedMonthLabel =
    selectedMonth !== null && selectedYear !== null
      ? new Date(selectedYear, selectedMonth).toLocaleString("default", {
          month: "short",
        })
      : "";

  const today = new Date();

  const isCurrentMonthSelected =
    selectedMonth === today.getMonth() && selectedYear === today.getFullYear();

  // Label for previous month shown on cards
  const prevMonthDate = new Date(selectedYear, selectedMonth - 1, 1);
  const prevMonthLabel = prevMonthDate.toLocaleString("default", {
    month: "short",
  });
  const prevMonthYear = prevMonthDate.getFullYear();

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gradient-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Input
        placeholder="Search employees..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="max-w-sm"
      />

      {/* Task count filter + Month/Year revenue selector */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Quick filter for task counts on cards */}
        {/* <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            Tasks:
          </span>
          {(["all", "daily", "monthly"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={cardFilter === f ? "default" : "outline"}
              className={
                cardFilter === f
                  ? "gradient-primary text-primary-foreground"
                  : ""
              }
              onClick={() => setCardFilter(f)}
            >
              {f === "all"
                ? "All Time"
                : f === "daily"
                  ? "Today"
                  : "This Month"}
            </Button>
          ))}
        </div> */}

        {/* Divider */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Month/Year selector for revenue */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            Monthly Data:
          </span>
          <Select
          value={selectedMonth !== null ? String(selectedMonth) : ""}
            onValueChange={(v) => {
              setSelectedMonth(Number(v));
              if (selectedYear !== null) {
                setIsMonthFilterActive(true);
              }
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {new Date(2000, i).toLocaleString("default", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear !== null ? String(selectedYear) : ""}
            onValueChange={(v) => {
              setSelectedYear(Number(v));
              if (selectedMonth !== null) {
                setIsMonthFilterActive(true);
              }
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {Array.from({ length: 3 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMonth(null);
              setSelectedYear(null);
              setIsMonthFilterActive(false);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedEmployees.map((employee) => {
          const stats = getEmployeeStats(employee.id);
          const diff = stats.thisMonthRevenue - stats.lastMonthRevenue;
          return (
            <Card key={employee.id} className="shadow-card animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {employee.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {employee.phone}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-popover border border-border z-50"
                      align="end"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingEmployee(employee);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setViewingEmployee(employee);
                          setTaskQuickFilter("all");
                          setTaskFromDate(undefined);
                          setTaskToDate(undefined);
                          setIsViewTasksModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Tasks
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Employee Stats */}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
                  {/* Total Tasks */}
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-primary mb-1" />
                    <span className="text-lg font-bold text-foreground">
                      {stats.totalTasks}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {!isMonthFilterActive ? "Today's Tasks" : "Month Tasks"}
                    </span>
                  </div>

                  {/* Pending */}
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-warning mb-1" />
                    <span className="text-lg font-bold text-foreground">
                      {stats.pendingTasks}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {!isMonthFilterActive
                        ? "Today's Pending"
                        : "Month Pending"}
                    </span>
                  </div>

                  {/* Selected month revenue with trend */}
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <IndianRupee className="h-4 w-4 text-success" />
                      {diff > 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : diff < 0 ? (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      ) : null}
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      ₹{stats.thisMonthRevenue.toFixed(2)}
                    </span>
                    {diff !== 0 && (
                      <span
                        className={`text-xs font-medium ${
                          diff > 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}₹{diff.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {!isMonthFilterActive
                        ? "Today Revenue"
                        : `${selectedMonthLabel} ${selectedYear}`}
                    </span>
                  </div>

                  {/* Previous month revenue */}
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <IndianRupee className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-lg font-bold text-foreground">
                      ₹{stats.lastMonthRevenue.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {!isMonthFilterActive
                        ? "Yesterday Revenue"
                        : `${prevMonthLabel} ${prevMonthYear}`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {employee.address}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newEmployee.address}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, address: e.target.value })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={newEmployee.password}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, password: e.target.value })
                }
                placeholder="Enter password"
              />
            </div>
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddEmployee}
                className="gradient-primary text-primary-foreground"
              >
                Add Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={editingEmployee.phone}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editingEmployee.address}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={editingEmployee.password}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      password: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditEmployee}
                  className="gradient-primary text-primary-foreground"
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Tasks Modal */}
      <Dialog
        open={isViewTasksModalOpen}
        onOpenChange={setIsViewTasksModalOpen}
      >
        <DialogContent className="bg-card border border-border max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingEmployee?.name}'s Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quick filter buttons */}
            <div className="flex gap-2">
              {(["all", "daily", "monthly"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={taskQuickFilter === f ? "default" : "outline"}
                  className={
                    taskQuickFilter === f
                      ? "gradient-primary text-primary-foreground"
                      : ""
                  }
                  onClick={() => {
                    setTaskQuickFilter(f);
                    // clear custom date range when picking a quick filter
                    if (f !== "all") {
                      setTaskFromDate(undefined);
                      setTaskToDate(undefined);
                    }
                  }}
                >
                  {f === "all"
                    ? "All Time"
                    : f === "daily"
                      ? "Today"
                      : "This Month"}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div
                className={
                  taskQuickFilter !== "all"
                    ? "opacity-40 pointer-events-none"
                    : ""
                }
              >
                <DateFilter
                  fromDate={taskFromDate}
                  toDate={taskToDate}
                  onFromDateChange={(d) => {
                    setTaskFromDate(d);
                    setTaskQuickFilter("all");
                  }}
                  onToDateChange={(d) => {
                    setTaskToDate(d);
                    setTaskQuickFilter("all");
                  }}
                />
              </div>
              <Select
                value={taskServiceType}
                onValueChange={(value) => setTaskServiceType(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="form_filling">Online service</SelectItem>
                  <SelectItem value="xerox">Offline service</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownloadTasks} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            </div>

            {viewingEmployee &&
              (() => {
                const tasks = getEmployeeTasks(viewingEmployee.id);
                const total = tasks.formFilling.length + tasks.xerox.length;
                const revenue =
                  tasks.formFilling.reduce((s, t) => s + t.revenue, 0) +
                  tasks.xerox.reduce((s, t) => s + t.revenue, 0);
                const label =
                  taskQuickFilter === "daily"
                    ? "Today"
                    : taskQuickFilter === "monthly"
                      ? "This Month"
                      : "Filtered";
                return (
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {label}:{" "}
                      <span className="font-semibold text-foreground">
                        {total} tasks
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Revenue:{" "}
                      <span className="font-semibold text-primary">
                        ₹{revenue.toFixed(2)}
                      </span>
                    </span>
                  </div>
                );
              })()}

            {viewingEmployee && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const tasks = getEmployeeTasks(viewingEmployee.id);
                      const allTasksInModal = [
                        ...tasks.formFilling.map((t) => ({
                          ...t,
                          type: "form_filling" as const,
                        })),
                        ...tasks.xerox.map((t) => ({
                          ...t,
                          type: "xerox" as const,
                        })),
                      ].sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      );

                      if (allTasksInModal.length === 0) {
                        return (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No tasks found
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return allTasksInModal.map((task, index) => (
                        <TableRow key={task.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{task.customerName}</TableCell>
                          <TableCell className="capitalize">
                            {task.type === "form_filling"
                              ? (task as FormFillingTask).serviceType.replace(
                                  "_",
                                  " ",
                                )
                              : "Xerox/Other"}
                          </TableCell>
                          <TableCell>₹{task.revenue}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                task.paymentStatus === "completed"
                                  ? "bg-success/20 text-success"
                                  : "bg-warning/20 text-warning"
                              }`}
                            >
                              {task.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(task.createdAt),
                              "dd/MM/yyyy HH:mm",
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;