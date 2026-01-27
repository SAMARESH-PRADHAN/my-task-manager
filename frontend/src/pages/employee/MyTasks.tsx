import React, { useState, useMemo, useEffect, useRef } from "react";
import { Edit, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData, FormFillingTask, XeroxTask } from "@/contexts/DataContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Pagination from "@/components/layout/shared/Pagination";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const MyTasks: React.FC = () => {
  const { user } = useAuth();
  //  const { updateXeroxTask } = useData(); // ✅ getEmployeeTasks removed

  const [activeTab, setActiveTab] = useState<"form_filling" | "xerox">(
    "form_filling",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<
    FormFillingTask | XeroxTask | null
  >(null);
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    description: "",
    amount: 0,
    deductionAmount: 0,
    revenue: 0,
    paymentMode: "cash" as "cash" | "upi" | "card" | "",
    paymentStatus: "pending" as "pending" | "completed",
    serviceType: "job_seeker" as "job_seeker" | "student" | "gov_scheme",
    applicationId: "",
    password: "",
  });

  // Screenshot upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingTask, setUploadingTask] = useState<FormFillingTask | null>(
    null,
  );

  // ✅ Backend task state
  const [formFillingTasks, setFormFillingTasks] = useState<FormFillingTask[]>(
    [],
  );
  const [xeroxTasks, setXeroxTasks] = useState<XeroxTask[]>([]);

  const fetchMyTasks = async () => {
    try {
      const res = await api.get("/tasks/my");

      const ff: FormFillingTask[] = [];
      const xx: XeroxTask[] = [];

      res.data.forEach((t: any) => {
        const base = {
          id: String(t.id),
          customerId: String(t.customer_id),
          customerName: t.customer_name || "",
          customerPhone: t.customer_phone || "",
          customerEmail: t.customer_email || "",
          amount: Number(t.total_amount || 0),
          deductionAmount: Number(t.deduction_amount || 0),
          revenue: Number(t.revenue || 0),
          description: t.description || "",
          paymentMode: t.payment_mode || "",
          paymentStatus:
            t.payment_status === "unpaid" ? "pending" : t.payment_status,
          createdAt: t.created_at,
        };

        if (t.service_type === "form_filling") {
          ff.push({
            ...base,
            customerType: t.customer_type || "",
            employeeId: String(t.employee_id),
            employeeName: user?.name || "",
            serviceType: t.form_service_type,
            applicationId: t.application_id || "",
            password: t.application_password || "",
            workStatus: t.work_status,
          });
        } else {
          xx.push(base as XeroxTask);
        }
      });

      setFormFillingTasks(ff);
      setXeroxTasks(xx);
    } catch (err) {
      console.error("FETCH MY TASKS ERROR", err);
      toast.error("Failed to load tasks");
    }
  };
  // useEffect(() => {
  //   console.log("USER IN MYTASKS:", user);
  //   if (!user) return;
  //   fetchMyTasks();
  // }, [user]);

  // ✅ FETCH TASKS FROM BACKEND
  useEffect(() => {
    if (!user) return;

    const fetchMyTasks = async () => {
      try {
        const res = await api.get("/tasks/my");

        const ff: FormFillingTask[] = [];
        const xx: XeroxTask[] = [];

        res.data.forEach((t: any) => {
          const base = {
            id: String(t.id),
            customerId: String(t.customer_id),
            customerName: t.customer_name || "",
            customerPhone: t.customer_phone || "",
            customerEmail: t.customer_email || "",
            amount: Number(t.total_amount || 0),
            deductionAmount: Number(t.deduction_amount || 0),
            revenue: Number(t.revenue || 0),
            description: t.description || "",
            paymentMode: t.payment_mode || "",
            paymentStatus: t.payment_status,
            createdAt: t.created_at,
          };

          if (t.service_type === "form_filling") {
            ff.push({
              ...base,

              // ✅ required by FormFillingTask
              customerType: t.customer_type || "",
              employeeId: String(t.employee_id),
              employeeName: user?.name || "",

              // ✅ form filling specific
              serviceType: t.form_service_type,
              applicationId: t.application_id || "",
              password: t.application_password || "",
              workStatus: t.work_status,
            });
          } else {
            xx.push(base as XeroxTask);
          }
        });

        setFormFillingTasks(ff);
        setXeroxTasks(xx);
      } catch (err) {
        console.error("FETCH MY TASKS ERROR", err);
        toast.error("Failed to load tasks");
      }
    };

    fetchMyTasks();
  }, [user]);

  // ✅ unified task source
  const employeeTasks = {
    formFilling: formFillingTasks,
    xerox: xeroxTasks,
  };

  const filteredTasks = useMemo(() => {
    const tasks =
      activeTab === "form_filling"
        ? employeeTasks.formFilling
        : employeeTasks.xerox;

    return tasks.filter((task) => {
      const matchesSearch =
        task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerPhone.includes(searchQuery) ||
        (task.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const status =
        activeTab === "form_filling"
          ? (task as FormFillingTask).workStatus
          : (task as XeroxTask).paymentStatus;

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeTab, employeeTasks, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleEditClick = (task: FormFillingTask | XeroxTask) => {
    setEditingTask(task);

    setEditFormData({
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      customerEmail: task.customerEmail,

      description: task.description,
      amount: task.amount,
      deductionAmount: task.deductionAmount || 0,
      revenue: task.revenue || task.amount,

      paymentMode: task.paymentMode,
      paymentStatus:
        task.paymentStatus === "unpaid" ? "pending" : task.paymentStatus,

      serviceType:
        activeTab === "form_filling"
          ? (task as FormFillingTask).serviceType
          : "job_seeker",

      applicationId:
        activeTab === "form_filling"
          ? ((task as FormFillingTask).applicationId ?? "")
          : "",

      password:
        activeTab === "form_filling"
          ? ((task as FormFillingTask).password ?? "")
          : "",
    });

    setIsEditModalOpen(true);
  };

  // const handleAmountChange = (
  //   field: "amount" | "deductionAmount",
  //   value: number
  // ) => {
  //   const newData = { ...editFormData, [field]: value };
  //   newData.revenue = newData.amount - newData.deductionAmount;
  //   setEditFormData(newData);
  // };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      await api.put(`/tasks/${editingTask.id}`, {
        /* ================= TASK TABLE ================= */
        description: editFormData.description,

        total_amount: Number(editFormData.amount || 0),
        deduction_amount: Number(editFormData.deductionAmount || 0),
        revenue:
          Number(editFormData.amount || 0) -
          Number(editFormData.deductionAmount || 0),

        payment_mode: editFormData.paymentMode,
        payment_status: editFormData.paymentStatus,

        form_service_type:
          activeTab === "form_filling" ? editFormData.serviceType : null,

        application_id:
          activeTab === "form_filling" ? editFormData.applicationId : null,

        application_password:
          activeTab === "form_filling" ? editFormData.password : null,

        /* ================= CUSTOMER TABLE ================= */
        customer_name: editFormData.customerName,
        customer_phone: editFormData.customerPhone,
        customer_email: editFormData.customerEmail,
      });

      toast.success("Task updated successfully!");
      await fetchMyTasks();

      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task");
    }
  };

  const handleUploadClick = (task: FormFillingTask) => {
    setUploadingTask(task);
    setIsUploadModalOpen(true);
  };

  const handleUploadScreenshot = async () => {
    if (!uploadingTask) return;

    try {
      // ⚠️ This ONLY updates status (no real file upload)
      await api.put(`/tasks/${uploadingTask.id}`, {
        work_status: "completed",
      });

      toast.success("Work marked as completed!");
      await fetchMyTasks();

      setIsUploadModalOpen(false);
      setUploadingTask(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update work status");
    }
  };

  // Inside MyTasks component...
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTable = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Pixels to move
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
        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground">
          View and manage your assigned tasks
        </p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === "form_filling" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("form_filling");
            setCurrentPage(1);
          }}
          className={
            activeTab === "form_filling"
              ? "gradient-primary text-primary-foreground"
              : ""
          }
        >
          Form Filling
        </Button>
        <Button
          variant={activeTab === "xerox" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("xerox");
            setCurrentPage(1);
          }}
          className={
            activeTab === "xerox"
              ? "gradient-primary text-primary-foreground"
              : ""
          }
        >
          Xerox/Printing/Passport Photo/Other Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by customer name or phone or desc..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "all" | "pending" | "completed");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-card relative group">
        {/* LEFT BUTTON - Constant Position */}
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

        {/* RIGHT BUTTON - Constant Position */}
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
          {/* Pass the ref to the Table component */}
          <Table ref={scrollContainerRef}>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Customer Details</TableHead>
                {activeTab === "form_filling" && (
                  <TableHead>Application Details</TableHead>
                )}
                <TableHead>Total Amount</TableHead>
                <TableHead>Deduction</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Description</TableHead>
                {activeTab === "form_filling" && (
                  <TableHead>Work Status</TableHead>
                )}
                <TableHead>Payment</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === "form_filling" ? 10 : 9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task, index) => (
                  <TableRow
                    key={task.id}
                    className={
                      isSearchMatch(task)
                        ? "bg-success/20 hover:bg-success/30 transition-colors"
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

                        <p className="text-sm text-muted-foreground">
                          {task.customerEmail}
                        </p>

                        {activeTab === "form_filling" && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                            {(task as FormFillingTask).serviceType?.replace(
                              "_",
                              " ",
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {activeTab === "form_filling" && (
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">App ID:</span>{" "}
                            {(task as FormFillingTask).applicationId || "-"}
                          </p>
                          <p>
                            <span className="font-medium">Password:</span>{" "}
                            {(task as FormFillingTask).password || "-"}
                          </p>
                        </div>
                      </TableCell>
                    )}

                    <TableCell>₹{task.amount}</TableCell>
                    <TableCell>₹{task.deductionAmount || 0}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      ₹{task.revenue || task.amount}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {task.description || "-"}
                    </TableCell>
                    {activeTab === "form_filling" && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={
                            (task as FormFillingTask).workStatus === "completed"
                              ? "bg-success/20 text-success hover:bg-success/30"
                              : "bg-warning/20 text-warning hover:bg-warning/30"
                          }
                          onClick={() => {
                            if (
                              (task as FormFillingTask).workStatus === "pending"
                            ) {
                              handleUploadClick(task as FormFillingTask);
                            }
                          }}
                        >
                          {(task as FormFillingTask).workStatus ===
                            "pending" && <Upload className="h-4 w-4 mr-1" />}
                          {(task as FormFillingTask).workStatus}
                        </Button>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="space-y-1">
                        <p className="capitalize font-medium">
                          {task.paymentMode || "Not Selected"}
                        </p>

                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            task.paymentStatus === "completed"
                              ? "bg-success/20 text-success"
                              : "bg-warning/20 text-warning"
                          }`}
                        >
                          {task.paymentStatus}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Edit Modal - Full Edit */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editFormData.customerName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        customerName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editFormData.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setEditFormData({
                        ...editFormData,
                        customerPhone: value,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editFormData.customerEmail}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        customerEmail: e.target.value.toLowerCase(),
                      })
                    }
                  />
                </div>
              </div>

              {activeTab === "form_filling" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select
                      value={editFormData.serviceType}
                      onValueChange={(value) =>
                        setEditFormData({
                          ...editFormData,
                          serviceType: value as any,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border z-50">
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="gov_scheme">Gov Scheme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Application ID</Label>
                    <Input
                      value={editFormData.applicationId}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          applicationId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value.toUpperCase(),
                    })
                  }
                  rows={3}
                />
              </div>

              {/* Amount Section with Revenue Calculation */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={editFormData.amount === 0 ? "" : editFormData.amount}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);

                      setEditFormData({
                        ...editFormData,
                        amount: value,
                        revenue: value - editFormData.deductionAmount,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deduction Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter deduction"
                    value={
                      editFormData.deductionAmount === 0
                        ? ""
                        : editFormData.deductionAmount
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? 0 : Number(e.target.value);

                      setEditFormData({
                        ...editFormData,
                        deductionAmount: value,
                        revenue: editFormData.amount - value,
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue (₹)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center font-semibold text-primary">
                    ₹{editFormData.revenue.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={editFormData.paymentMode || "none"}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        paymentMode: value === "none" ? "" : (value as any),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="none">Not Selected</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={editFormData.paymentStatus}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        paymentStatus: value as any,
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTask}
                  className="gradient-primary text-primary-foreground"
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Screenshot Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Upload Screenshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Upload a screenshot to mark this task as completed.
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleUploadScreenshot}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadScreenshot}
                className="gradient-primary text-primary-foreground"
              >
                Upload & Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTasks;
