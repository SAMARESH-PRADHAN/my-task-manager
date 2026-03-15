import React, { useState, useMemo, useRef } from "react";
import { Edit, Trash2, Download } from "lucide-react";
import { useData, FormFillingTask, XeroxTask } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DateFilter from "@/components/layout/shared/DateFilter";
import Pagination from "@/components/layout/shared/Pagination";
import { toast } from "sonner";
import { downloadExcel } from "@/utils/excel";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { formatToIST } from "@/utils/dateUtils";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

const ITEMS_PER_PAGE = 10;

type TaskTab = "form_filling" | "xerox";
type StatusFilter = "all" | "pending" | "completed";

/* =========================
   EMPLOYEE DISPLAY HELPER
   Shows "X → Y" if reassigned, "X" if same person
========================= */
const EmployeeCell = ({
  employeeName,
  completedByName,
}: {
  employeeName: string;
  completedByName?: string;
}) => {
  const wasReassigned = completedByName && completedByName !== employeeName;

  return (
    <div className="space-y-1">
      {wasReassigned ? (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {employeeName}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-primary">
            {completedByName}
          </span>
        </div>
      ) : (
        <p className="text-sm font-medium text-foreground">{employeeName}</p>
      )}
      {wasReassigned && (
        <p className="text-xs text-muted-foreground">Reassigned</p>
      )}
    </div>
  );
};

const AllTasks: React.FC = () => {
  const {
    formFillingTasks,
    xeroxTasks,
    employees,
    updateTask,
    updateXeroxTask,
    deleteXeroxTask,
  } = useData();

  const [activeTab, setActiveTab] = useState<TaskTab>("form_filling");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [boards, setBoards] = useState<{ id: number; name: string }[]>([]);
  const [boardFilter, setBoardFilter] = useState("all");

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery, fromDate, toDate]);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFormTask, setEditingFormTask] =
    useState<FormFillingTask | null>(null);
  const [editingXeroxTask, setEditingXeroxTask] = useState<XeroxTask | null>(
    null,
  );

  //notification confirmation
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);

  // Delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const filteredFormFillingTasks = useMemo(() => {
    return formFillingTasks.filter((task) => {
      if (boardFilter !== "all" && task.boardName !== boardFilter) return false;
      if (statusFilter !== "all" && task.workStatus !== statusFilter)
        return false;

      const matchesSearch =
        (task.customerName ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (task.customerPhone ?? "").includes(searchQuery) ||
        (task.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (fromDate && toDate) {
        const isInRange = isWithinInterval(new Date(task.createdAt), {
          start: startOfDay(fromDate),
          end: endOfDay(toDate),
        });
        if (!isInRange) return false;
      }

      return true;
    });
  }, [
    formFillingTasks,
    statusFilter,
    searchQuery,
    fromDate,
    toDate,
    boardFilter,
  ]);

  const filteredXeroxTasks = useMemo(() => {
    return xeroxTasks.filter((task) => {
      if (statusFilter !== "all" && task.paymentStatus !== statusFilter)
        return false;

      const matchesSearch =
        task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerPhone.includes(searchQuery) ||
        (task.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (fromDate && toDate) {
        const isInRange = isWithinInterval(new Date(task.createdAt), {
          start: startOfDay(fromDate),
          end: endOfDay(toDate),
        });
        if (!isInRange) return false;
      }

      return true;
    });
  }, [xeroxTasks, statusFilter, searchQuery, fromDate, toDate]);

  const currentTasks =
    activeTab === "form_filling"
      ? filteredFormFillingTasks
      : filteredXeroxTasks;
  const totalPages = Math.ceil(currentTasks.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages]);
  const fetchBoards = async (serviceType?: string) => {
    try {
      const url = serviceType
        ? `/boards?service_type=${serviceType}`
        : "/boards";

      const res = await api.get(url);
      setBoards(res.data);
    } catch (err) {
      console.error("Failed to load boards", err);
    }
  };
  const paginatedTasks = currentTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleDownload = () => {
    if (activeTab === "form_filling") {
      const data = filteredFormFillingTasks.map((task, index) => ({
        "Serial No": index + 1,
        "Customer Name": task.customerName,
        Phone: task.customerPhone,
        Email: task.customerEmail,
        "Service Type": (task.serviceType ?? "unknown").replace("_", " "),
        Board: task.boardName || "-",
        "Assigned To": task.employeeName,
        "Completed By": task.completedByName || task.employeeName,
        "Application ID": task.applicationId,
        Password: task.password,
        "Total Amount": task.amount,
        Deduction: task.deductionAmount || 0,
        Revenue: task.revenue || task.amount,
        "Work Status": task.workStatus,
        "Payment Status": task.paymentStatus,
        Description: task.description.replace(/\n/g, " "),
        Date: formatToIST(task.createdAt, "dd/MM/yyyy HH:mm"),
      }));
      downloadExcel(data, "online_tasks");
    } else {
      const data = filteredXeroxTasks.map((task, index) => ({
        "Serial No": index + 1,
        "Customer Name": task.customerName,
        Phone: task.customerPhone,
        Email: task.customerEmail,
        "Assigned To": task.employeeName,
        "Completed By": task.completedByName || task.employeeName,
        "Total Amount": task.amount,
        Deduction: task.deductionAmount || 0,
        Revenue: task.revenue || task.amount,
        "Payment Status": task.paymentStatus,
        Description: task.description.replace(/\n/g, " "),
        Date: formatToIST(task.createdAt, "dd/MM/yyyy HH:mm"),
      }));
      downloadExcel(data, "xerox_tasks");
    }
    toast.success("Tasks exported successfully!");
  };

  //this function is use to send filter task notification system
  const handleNotifyFiltered = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Please enter notification message");
      return;
    }

    try {
      setSendingNotification(true);

      const phones =
        activeTab === "form_filling"
          ? filteredFormFillingTasks.map((t) => t.customerPhone)
          : filteredXeroxTasks.map((t) => t.customerPhone);

      // Remove duplicate numbers
      const uniquePhones = [...new Set(phones.filter(Boolean))];

      await api.post("/task-notifications", {
        message: notificationMessage,
        phones: uniquePhones,
      });

      toast.success(`Notification sent to ${uniquePhones.length} customers`);

      setNotificationMessage("");
      setIsNotifyModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notifications");
    } finally {
      setSendingNotification(false);
    }
  };

  const handleFormTaskAmountChange = (
    field: "amount" | "deductionAmount",
    value: number,
  ) => {
    if (!editingFormTask) return;
    const newTask = { ...editingFormTask, [field]: value };
    newTask.revenue = newTask.amount - (newTask.deductionAmount || 0);
    setEditingFormTask(newTask);
  };

  const handleXeroxTaskAmountChange = (
    field: "amount" | "deductionAmount",
    value: number,
  ) => {
    if (!editingXeroxTask) return;
    const newTask = { ...editingXeroxTask, [field]: value };
    newTask.revenue = newTask.amount - (newTask.deductionAmount || 0);
    setEditingXeroxTask(newTask);
  };

  const handleEditFormTask = async () => {
    if (!editingFormTask) return;
    try {
      await updateTask(editingFormTask.id, editingFormTask);
      toast.success("Task updated successfully!");
      setIsEditModalOpen(false);
      setEditingFormTask(null);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleEditXeroxTask = async () => {
    if (!editingXeroxTask) return;
    try {
      await updateXeroxTask(editingXeroxTask.id, editingXeroxTask);
      toast.success("Task updated successfully!");
      setIsEditModalOpen(false);
      setEditingXeroxTask(null);
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      await deleteXeroxTask(deletingTaskId);
      toast.success("Task deleted successfully!");
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingTaskId(null);
    }
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTable = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left:
          direction === "left"
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const isSearchMatch = (task: FormFillingTask | XeroxTask) => {
    if (!searchQuery) return false;
    const query = searchQuery.toLowerCase();
    return (
      task.customerName.toLowerCase().includes(query) ||
      task.customerPhone.includes(searchQuery) ||
      (task.description || "").toLowerCase().includes(query)
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Tasks</h1>
        <p className="text-muted-foreground">View and manage all tasks</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === "form_filling" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("form_filling");
            setCurrentPage(1);
            setStatusFilter("all");
          }}
          className={
            activeTab === "form_filling"
              ? "gradient-primary text-primary-foreground"
              : ""
          }
        >
          Online Service
        </Button>
        <Button
          variant={activeTab === "xerox" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("xerox");
            setCurrentPage(1);
            setStatusFilter("all");
          }}
          className={
            activeTab === "xerox"
              ? "gradient-primary text-primary-foreground"
              : ""
          }
        >
          Offline Service
        </Button>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as StatusFilter[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className="capitalize"
          >
            {status === "all" ? "All Status" : status}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search by customer name or phone or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-64"
          />
          <Select value={boardFilter} onValueChange={setBoardFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Boards</SelectItem>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        </div>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Excel
        </Button>
      </div>
      <Button
        onClick={() => setIsNotifyModalOpen(true)}
        className="gradient-primary text-primary-foreground"
      >
        Notify Customers
      </Button>
      {/* Table */}
      <Card className="shadow-card relative group">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30 invisible group-hover:visible">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-xl border bg-background/95 hover:bg-background"
            onClick={() => scrollTable("left")}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 invisible group-hover:visible">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-xl border bg-background/95 hover:bg-background"
            onClick={() => scrollTable("right")}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === "form_filling" ? (
              <Table ref={scrollContainerRef}>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Application Details</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Work Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paginatedTasks as FormFillingTask[]).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTasks as FormFillingTask[]).map((task, index) => (
                      <TableRow
                        key={task.id}
                        className={
                          isSearchMatch(task)
                            ? "bg-orange-100 dark:bg-orange-900/40 border-l-4 border-orange-500"
                            : ""
                        }
                      >
                        <TableCell>
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{task.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.customerPhone}
                            </p>
                            {task.customerEmail && (
                              <p className="text-sm text-muted-foreground">
                                {task.customerEmail}
                              </p>
                            )}
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary capitalize">
                              {(task.serviceType ?? "unknown").replace(
                                "_",
                                " ",
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* ✅ Employee column: X → Y */}
                        <TableCell>
                          <EmployeeCell
                            employeeName={task.employeeName}
                            completedByName={task.completedByName}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                App ID:
                              </span>{" "}
                              <span className="font-medium">
                                {task.applicationId || "-"}
                              </span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Password:
                              </span>{" "}
                              <span className="font-medium">
                                {task.password || "-"}
                              </span>
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{task.boardName || "-"}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {task.description || "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              task.workStatus === "completed"
                                ? "bg-success/20 text-success"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {task.workStatus}
                          </span>
                        </TableCell>
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
                        <TableCell>₹{task.amount}</TableCell>
                        <TableCell>₹{task.deductionAmount || 0}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          ₹{task.revenue || task.amount}
                        </TableCell>
                        <TableCell>
                          {formatToIST(task.createdAt, "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingFormTask(task);

                                // load boards based on this task's service type
                                fetchBoards(task.serviceType);

                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingTaskId(task.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paginatedTasks as XeroxTask[]).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTasks as XeroxTask[]).map((task, index) => (
                      <TableRow
                        key={task.id}
                        className={
                          isSearchMatch(task)
                            ? "bg-orange-100 dark:bg-orange-900/40 border-l-4 border-orange-500"
                            : ""
                        }
                      >
                        <TableCell>
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{task.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.customerPhone}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {task.customerEmail}
                            </p>
                          </div>
                        </TableCell>

                        {/* ✅ Employee column: X → Y */}
                        <TableCell>
                          <EmployeeCell
                            employeeName={task.employeeName}
                            completedByName={task.completedByName}
                          />
                        </TableCell>

                        <TableCell>₹{task.amount}</TableCell>
                        <TableCell>₹{task.deductionAmount || 0}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          ₹{task.revenue || task.amount}
                        </TableCell>
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
                        <TableCell className="max-w-[200px] truncate">
                          {task.description || "-"}
                        </TableCell>
                        <TableCell>
                          {formatToIST(task.createdAt, "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingXeroxTask(task);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingTaskId(task.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* =====================
          EDIT FORM TASK MODAL
      ===================== */}
      <Dialog
        open={isEditModalOpen && editingFormTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            setEditingFormTask(null);
          }
        }}
      >
        <DialogContent className="bg-card border border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Online Task</DialogTitle>
          </DialogHeader>
          {editingFormTask && (
            <div className="space-y-4">
              {/* REASSIGN SECTION */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Reassign Employee
                </p>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select
                    value={editingFormTask.employeeId}
                    onValueChange={(value) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        employeeId: value,
                        employeeName:
                          employees.find((e) => e.id === value)?.name ?? "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingFormTask.completedByName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Completed by:{" "}
                    <span className="font-medium text-primary">
                      {editingFormTask.completedByName}
                    </span>{" "}
                    (set automatically when employee marks complete)
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editingFormTask.customerName}
                    onChange={(e) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        customerName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    maxLength={10}
                    value={editingFormTask.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setEditingFormTask({
                        ...editingFormTask,
                        customerPhone: value,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editingFormTask.customerEmail}
                    onChange={(e) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        customerEmail: e.target.value.toLowerCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>

                  <Select
                    value={editingFormTask.serviceType || ""}
                    onValueChange={(value) => {
                      const serviceType = value as
                        | "job_seeker"
                        | "student"
                        | "gov_scheme";

                      setEditingFormTask({
                        ...editingFormTask,
                        serviceType,
                        boardName: "",
                      });

                      fetchBoards(serviceType); // load boards for selected service type
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>

                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="job_seeker">Job Seeker</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="gov_scheme">
                        Government Scheme
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Board</Label>
                  <Select
                    value={editingFormTask.boardName || ""}
                    onValueChange={(value) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        boardName: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Application ID</Label>
                  <Input
                    value={editingFormTask.applicationId}
                    onChange={(e) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        applicationId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    value={editingFormTask.password}
                    onChange={(e) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        password: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={
                      editingFormTask.amount === 0 ? "" : editingFormTask.amount
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      handleFormTaskAmountChange("amount", value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deduction Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter deduction"
                    value={
                      editingFormTask.deductionAmount === 0
                        ? ""
                        : editingFormTask.deductionAmount
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      handleFormTaskAmountChange("deductionAmount", value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue (₹)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center font-semibold text-primary">
                    ₹
                    {(
                      editingFormTask.revenue || editingFormTask.amount
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Work Status</Label>
                  <Select
                    value={editingFormTask.workStatus}
                    onValueChange={(value) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        workStatus: value as "pending" | "completed",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={editingFormTask.paymentStatus}
                    onValueChange={(value) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        paymentStatus: value as "pending" | "completed",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingFormTask.description}
                  onChange={(e) =>
                    setEditingFormTask({
                      ...editingFormTask,
                      description: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingFormTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditFormTask}
                  className="gradient-primary text-primary-foreground"
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =====================
          EDIT XEROX TASK MODAL
      ===================== */}
      <Dialog
        open={isEditModalOpen && editingXeroxTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            setEditingXeroxTask(null);
          }
        }}
      >
        <DialogContent className="bg-card border border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Offline Task</DialogTitle>
          </DialogHeader>
          {editingXeroxTask && (
            <div className="space-y-4">
              {/* REASSIGN SECTION */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Reassign Employee
                </p>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select
                    value={editingXeroxTask.employeeId}
                    onValueChange={(value) =>
                      setEditingXeroxTask({
                        ...editingXeroxTask,
                        employeeId: value,
                        employeeName:
                          employees.find((e) => e.id === value)?.name ?? "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editingXeroxTask.completedByName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    Completed by:{" "}
                    <span className="font-medium text-primary">
                      {editingXeroxTask.completedByName}
                    </span>{" "}
                    (set automatically when employee marks complete)
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editingXeroxTask.customerName}
                    onChange={(e) =>
                      setEditingXeroxTask({
                        ...editingXeroxTask,
                        customerName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingXeroxTask.customerPhone}
                    onChange={(e) =>
                      setEditingXeroxTask({
                        ...editingXeroxTask,
                        customerPhone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={
                      editingXeroxTask.amount === 0
                        ? ""
                        : editingXeroxTask.amount
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      handleXeroxTaskAmountChange("amount", value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deduction Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter deduction"
                    value={
                      editingXeroxTask.deductionAmount === 0
                        ? ""
                        : editingXeroxTask.deductionAmount
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      handleXeroxTaskAmountChange("deductionAmount", value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue (₹)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center font-semibold text-primary">
                    ₹
                    {(
                      editingXeroxTask.revenue || editingXeroxTask.amount
                    ).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={editingXeroxTask.paymentStatus}
                  onValueChange={(value) =>
                    setEditingXeroxTask({
                      ...editingXeroxTask,
                      paymentStatus: value as "pending" | "completed",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingXeroxTask.description}
                  onChange={(e) =>
                    setEditingXeroxTask({
                      ...editingXeroxTask,
                      description: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingXeroxTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditXeroxTask}
                  className="gradient-primary text-primary-foreground"
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/*notification box*/}
      <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
        <DialogContent className="bg-card border border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              This message will be sent to all customers currently visible in
              the filtered list.
            </div>

            <div className="space-y-2">
              <Label>Notification Message</Label>
              <Textarea
                placeholder="Type your notification message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="text-sm text-primary font-medium">
              Recipients: {currentTasks.length} customers
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsNotifyModalOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleNotifyFiltered}
                disabled={sendingNotification}
                className="gradient-primary text-primary-foreground"
              >
                {sendingNotification ? "Sending..." : "Send Notification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllTasks;
