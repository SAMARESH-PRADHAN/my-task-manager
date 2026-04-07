import React, { useState, useMemo, useRef, useEffect } from "react";
import { Edit, Trash2, Download, Loader2 } from "lucide-react";
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

/* =========================
   WHATSAPP BUTTON (Form Filling)
   Opens WA with pre-filled application details message
========================= */
const WhatsAppButton = ({ task }: { task: FormFillingTask }) => {
  const handleClick = () => {
    const message =
      `✅ *Application Submitted Successfully*\n\n` +
      `Dear ${task.customerName},\n\n` +
      `Greetings from *Cyber City*! We are pleased to inform you that your application has been successfully submitted.\n\n` +
      `📋 *Application Details*\n` +
      `- Portal: ${task.boardName || "N/A"}\n` +
      `- Service: ${task.description || "N/A"}\n` +
      `- Application ID: \`${task.applicationId || "N/A"}\`\n` +
      `- Password: \`${task.password || "N/A"}\`\n\n` +
      `👤 *Submitted By:* ${task.completedByName || task.employeeName || "Cyber City Team"}\n\n` +
      `For any queries, feel free to contact us.\n\n` +
      `*Thank you for choosing Cyber City!*`;

    const phone = task.customerPhone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      title="Send WhatsApp message"
      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 transition-all ml-1 shrink-0"
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </button>
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
    fetchTasksFromDB,
    totalTasks,
  } = useData();

  const [activeTab, setActiveTab] = useState<TaskTab>("form_filling");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [updatingFormTask, setUpdatingFormTask] = useState(false);
  const [updatingXeroxTask, setUpdatingXeroxTask] = useState(false);
  //notification confirmation
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notifyStep, setNotifyStep] = useState<"compose" | "sending" | "done">(
    "compose",
  );
  const [notifyProgress, setNotifyProgress] = useState({
    sent: 0,
    failed: 0,
    total: 0,
  });
  const [notifyFailedNumbers, setNotifyFailedNumbers] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const filteredFormFillingTasks = useMemo(() => {
    return formFillingTasks.filter((task) => {
      if (
        boardFilter !== "all" &&
        !(task.boardName ?? "")
          .toLowerCase()
          .includes(boardFilter.toLowerCase())
      )
        return false;
      if (statusFilter === "pending") {
        const isPending =
          task.workStatus === "pending" || task.paymentStatus === "pending";
        if (!isPending) return false;
      } else if (statusFilter === "completed") {
        if (task.workStatus !== "completed") return false;
      }

      const matchesSearch =
        (task.customerName ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (task.customerPhone ?? "").includes(searchQuery) ||
        (task.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Life-long pending: skip date filter when pending tab is active
      if (statusFilter !== "pending" && fromDate && toDate) {
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
      if (statusFilter === "pending") {
        const isPending = task.paymentStatus === "pending";
        if (!isPending) return false;
      } else if (statusFilter === "completed") {
        if (task.paymentStatus === "completed") return false;
      }

      const matchesSearch =
        task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerPhone.includes(searchQuery) ||
        (task.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Life-long pending: skip date filter when pending tab is active
      if (statusFilter !== "pending" && fromDate && toDate) {
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
  const totalPages = Math.ceil(totalTasks / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    setIsFetching(true);
    fetchTasksFromDB(
      currentPage,
      ITEMS_PER_PAGE,
      searchQuery,
      fromDate,
      toDate,
      boardFilter,
      activeTab,
      statusFilter,
    ).finally(() => setIsFetching(false));
  }, [currentPage]);

  // Refetch when any filter or tab changes
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);
    setIsFetching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      setCurrentPage(1);
      await fetchTasksFromDB(
        1,
        ITEMS_PER_PAGE,
        searchQuery,
        fromDate,
        toDate,
        boardFilter,
        activeTab,
        statusFilter,
      );
      setIsSearching(false);
      setIsFetching(false);
    }, 400);
  }, [searchQuery, fromDate, toDate, boardFilter, activeTab, statusFilter]);
  const boardsCache = useRef<{ [key: string]: any[] }>({});
  const skipNextFetch = useRef(false);

  const fetchBoards = async (serviceType?: string) => {
    const key = serviceType || "all";

    if (boardsCache.current[key]) {
      setBoards(boardsCache.current[key]);
      return;
    }

    try {
      const url = serviceType
        ? `/boards?service_type=${serviceType}`
        : "/boards";

      const res = await api.get(url);

      boardsCache.current[key] = res.data;
      setBoards(res.data);
    } catch (err) {
      console.error("Failed to load boards", err);
    }
  };
  const paginatedTasks = currentTasks;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      if (activeTab === "form_filling") {
        const dlParams = new URLSearchParams({
          limit: "10000",
          offset: "0",
          service_type: "form_filling",
        });
        if (searchQuery) dlParams.set("search", searchQuery);
        if (fromDate) dlParams.set("from_date", fromDate.toISOString());
        if (toDate) {
          const e = new Date(toDate);
          e.setHours(23, 59, 59, 999);
          dlParams.set("to_date", e.toISOString());
        }
        if (boardFilter && boardFilter !== "all")
          dlParams.set("board", boardFilter);
        const res = await api.get(`/tasks?${dlParams.toString()}`);
        const allFF = res.data.tasks
          .filter((t: any) => t.service_type === "form_filling")
          .filter((t: any) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
              (t.customer_name ?? "").toLowerCase().includes(q) ||
              (t.customer_phone ?? "").includes(searchQuery) ||
              (t.application_id ?? "").toLowerCase().includes(q)
            );
          });
        const data = allFF.map((task: any, index: number) => ({
          "Serial No": index + 1,
          "Customer Name": task.customer_name ?? task.customerName ?? "",
          Phone: task.customer_phone ?? task.customerPhone ?? "",
          Email: task.customer_email ?? task.customerEmail ?? "",
          "Service Type": (
            task.form_service_type ??
            task.serviceType ??
            "unknown"
          ).replace(/_/g, " "),
          Board: task.board_name ?? task.boardName ?? "-",
          "Assigned To": task.employee_name ?? task.employeeName ?? "",
          "Completed By":
            task.completed_by_name ??
            task.completedByName ??
            task.employee_name ??
            task.employeeName ??
            "",
          "Application ID": task.application_id ?? task.applicationId ?? "",
          Password: task.application_password ?? task.password ?? "",
          "Total Amount": task.total_amount ?? task.amount ?? 0,
          Deduction: task.deduction_amount ?? task.deductionAmount ?? 0,
          Revenue: task.revenue ?? 0,
          "Work Status": task.work_status ?? task.workStatus ?? "",
          "Payment Status": task.payment_status ?? task.paymentStatus ?? "",
          "Payment Mode": task.payment_mode ?? task.paymentMode ?? "",
          Description: (task.description ?? "").replace(/\n/g, " "),
          Date: formatToIST(
            task.created_at ?? task.createdAt,
            "dd/MM/yyyy HH:mm",
          ),
        }));
        downloadExcel(data, "online_tasks");
      } else {
        const dlParams2 = new URLSearchParams({
          limit: "10000",
          offset: "0",
          service_type: "xerox",
        });
        if (searchQuery) dlParams2.set("search", searchQuery);
        if (fromDate) dlParams2.set("from_date", fromDate.toISOString());
        if (toDate) {
          const e2 = new Date(toDate);
          e2.setHours(23, 59, 59, 999);
          dlParams2.set("to_date", e2.toISOString());
        }
        if (boardFilter && boardFilter !== "all")
          dlParams2.set("board", boardFilter);
        const res2 = await api.get(`/tasks?${dlParams2.toString()}`);
        const allXX = res2.data.tasks
          .filter((t: any) => t.service_type === "xerox")
          .filter((t: any) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
              (t.customer_name ?? "").toLowerCase().includes(q) ||
              (t.customer_phone ?? "").includes(searchQuery) ||
              (t.description ?? "").toLowerCase().includes(q)
            );
          });
        const data = allXX.map((task: any, index: number) => ({
          "Serial No": index + 1,
          "Customer Name": task.customer_name ?? task.customerName ?? "",
          Phone: task.customer_phone ?? task.customerPhone ?? "",
          Email: task.customer_email ?? task.customerEmail ?? "",
          "Assigned To": task.employee_name ?? task.employeeName ?? "",
          "Completed By":
            task.completed_by_name ??
            task.completedByName ??
            task.employee_name ??
            task.employeeName ??
            "",
          "Total Amount": task.total_amount ?? task.amount ?? 0,
          Deduction: task.deduction_amount ?? task.deductionAmount ?? 0,
          Revenue: task.revenue ?? 0,
          "Payment Status": task.payment_status ?? task.paymentStatus ?? "",
          "Payment Mode": task.payment_mode ?? task.paymentMode ?? "",
          Description: (task.description ?? "").replace(/\n/g, " "),
          Date: formatToIST(
            task.created_at ?? task.createdAt,
            "dd/MM/yyyy HH:mm",
          ),
        }));
        downloadExcel(data, "xerox_tasks");
      }
      toast.success("Tasks exported successfully!");
    } catch (err) {
      toast.error("Failed to export tasks");
    } finally {
      setIsDownloading(false);
    }
  };

  // Total recipient count for the notification modal (fetched from backend)
  const [notifyRecipientCount, setNotifyRecipientCount] = useState<
    number | null
  >(null);

  // Fetch recipient count whenever the notify modal opens or filters change
  useEffect(() => {
    if (!isNotifyModalOpen) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const params = new URLSearchParams();
        params.set("service_type", activeTab);
        if (searchQuery) params.set("search", searchQuery);
        if (fromDate) params.set("from_date", fromDate.toISOString());
        if (toDate) {
          const e = new Date(toDate);
          e.setHours(23, 59, 59, 999);
          params.set("to_date", e.toISOString());
        }
        if (boardFilter && boardFilter !== "all")
          params.set("board", boardFilter);
        if (statusFilter !== "all") params.set("status_filter", statusFilter);
        const res = await api.get(`/tasks/phones?${params.toString()}`);
        if (!cancelled) setNotifyRecipientCount(res.data.total);
      } catch {
        if (!cancelled) setNotifyRecipientCount(null);
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, [
    isNotifyModalOpen,
    activeTab,
    searchQuery,
    fromDate,
    toDate,
    boardFilter,
    statusFilter,
  ]);

  // Open modal with clean state
  const openNotifyModal = () => {
    setNotifyStep("compose");
    setNotifyProgress({ sent: 0, failed: 0, total: 0 });
    setNotifyFailedNumbers([]);
    setShowPreview(false);
    setNotificationMessage("");
    setIsNotifyModalOpen(true);
  };

  //this function is use to send filter task notification system
  const handleNotifyFiltered = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Please enter notification message");
      return;
    }

    // Fetch ALL matching phones
    const params = new URLSearchParams();
    params.set("service_type", activeTab);
    if (searchQuery) params.set("search", searchQuery);
    if (fromDate) params.set("from_date", fromDate.toISOString());
    if (toDate) {
      const e = new Date(toDate);
      e.setHours(23, 59, 59, 999);
      params.set("to_date", e.toISOString());
    }
    if (boardFilter && boardFilter !== "all") params.set("board", boardFilter);
    if (statusFilter !== "all") params.set("status_filter", statusFilter);

    let uniquePhones: string[] = [];
    try {
      const phonesRes = await api.get(`/tasks/phones?${params.toString()}`);
      uniquePhones = phonesRes.data.phones;
    } catch (err) {
      toast.error("Failed to fetch recipient list");
      return;
    }

    if (uniquePhones.length === 0) {
      toast.error("No customers found for the current filters");
      return;
    }

    // Switch to sending step
    setSendingNotification(true);
    setNotifyProgress({ sent: 0, failed: 0, total: uniquePhones.length });
    setNotifyStep("sending");

    try {
      const token = localStorage.getItem("token");
      const baseUrl = (api.defaults?.baseURL ?? "").replace(/\/$/, "");

      const response = await fetch(`${baseUrl}/task-notifications/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: notificationMessage,
          phones: uniquePhones,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5).trim());
            if (event.type === "progress") {
              setNotifyProgress({
                sent: event.sent,
                failed: event.failed,
                total: event.total,
              });
            } else if (event.type === "done") {
              setNotifyProgress({
                sent: event.sent,
                failed: event.failed,
                total: event.total,
              });
              setNotifyFailedNumbers(event.failedNumbers ?? []);
              setNotifyStep("done");
            } else if (event.type === "error") {
              toast.error(event.message ?? "Stream error");
              setNotifyStep("compose");
            }
          } catch {
            // malformed event line — skip
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notifications");
      setNotifyStep("compose");
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
      setUpdatingFormTask(true);
      await updateTask(editingFormTask.id, editingFormTask);
      toast.success("Task updated successfully!");
      setIsEditModalOpen(false);
      setEditingFormTask(null);
    } catch {
      toast.error("Failed to update task");
    } finally {
      setUpdatingFormTask(false);
    }
  };

  const handleEditXeroxTask = async () => {
    if (!editingXeroxTask) return;
    try {
      setUpdatingXeroxTask(true);
      await updateXeroxTask(editingXeroxTask.id, editingXeroxTask);
      toast.success("Task updated successfully!");
      setIsEditModalOpen(false);
      setEditingXeroxTask(null);
    } catch {
      toast.error("Failed to update task");
    } finally {
      setUpdatingXeroxTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      skipNextFetch.current = true;
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
          {activeTab === "form_filling" && isFetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Online Service"
          )}
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
          {activeTab === "xerox" && isFetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Offline Service"
          )}
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
          <div className="relative w-64">
            <Input
              placeholder="Search by name, phone, description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pr-8"
            />
            {isSearching && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {activeTab === "form_filling" && (
            <div className="relative w-48">
              <Input
                placeholder="Search board..."
                value={boardFilter === "all" ? "" : boardFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  setBoardFilter(value === "" ? "all" : value);
                  setCurrentPage(1);
                }}
                className="w-full pr-8"
              />
              {isSearching && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
          <DateFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        </div>
        <Button
          onClick={handleDownload}
          variant="outline"
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? "Downloading..." : "Download Excel"}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Button
          onClick={openNotifyModal}
          className="gradient-primary text-primary-foreground"
        >
          Notify Customers
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isFetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <span>
              {totalTasks > 0
                ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, totalTasks)} of ${totalTasks} results`
                : "No results found"}
            </span>
          )}
        </div>
      </div>
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
          <div className="overflow-x-auto relative">
            {isFetching && (
              <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[1px] flex items-center justify-center rounded-b-lg">
                <div className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 shadow-lg text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading...</span>
                </div>
              </div>
            )}
            {activeTab === "form_filling" ? (
              <Table ref={scrollContainerRef}>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Application Details</TableHead>

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

                        {/* ✅ Customer Details with WhatsApp button next to phone */}
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{task.customerName}</p>
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-muted-foreground">
                                {task.customerPhone}
                              </p>
                              <WhatsAppButton task={task} />
                            </div>
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
                        <TableCell>{task.boardName || "-"}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {task.description || "-"}
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
                          {formatToIST(
                            new Date(task.completedAt || task.createdAt),
                            "dd MMM yyyy hh:mm a",
                          )}
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
                          {formatToIST(
                            new Date(task.completedAt || task.createdAt),
                            "dd MMM yyyy hh:mm a",
                          )}
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
        <div className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
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
                  disabled={updatingFormTask}
                  className="gradient-primary text-primary-foreground"
                >
                  {updatingFormTask ? "Updating..." : "Update"}
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
                  disabled={updatingXeroxTask}
                  className="gradient-primary text-primary-foreground"
                >
                  {updatingXeroxTask ? "Updating..." : "Update"}
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
      <Dialog
        open={isNotifyModalOpen}
        onOpenChange={(open) => {
          // Prevent closing while sending
          if (!open && notifyStep === "sending") return;
          setIsNotifyModalOpen(open);
        }}
      >
        <DialogContent className="bg-card border border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {notifyStep === "compose" && "Send Notification"}
              {notifyStep === "sending" && "Sending Messages..."}
              {notifyStep === "done" && "All Done!"}
            </DialogTitle>
          </DialogHeader>

          {/* ── STEP 1: COMPOSE ── */}
          {notifyStep === "compose" && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                This message will be sent to all customers in the filtered list.
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Notification Message</Label>
                  <span
                    className={`text-xs ${notificationMessage.length > 900 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {notificationMessage.length} / 1000
                  </span>
                </div>
                <Textarea
                  placeholder="Type your notification message..."
                  value={notificationMessage}
                  onChange={(e) =>
                    setNotificationMessage(e.target.value.slice(0, 1000))
                  }
                  rows={4}
                />
              </div>

              {/* WhatsApp-style preview */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPreview((p) => !p)}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {showPreview ? "Hide preview" : "Preview message"}
                </button>
                {showPreview && (
                  <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      WhatsApp Preview
                    </p>
                    <div className="flex justify-end">
                      <div
                        className="max-w-[85%] rounded-tl-2xl rounded-tr-sm rounded-b-2xl px-4 py-2 text-sm shadow"
                        style={{ backgroundColor: "#dcf8c6", color: "#111" }}
                      >
                        {notificationMessage.trim() ? (
                          <p className="whitespace-pre-wrap break-words">
                            {notificationMessage}
                          </p>
                        ) : (
                          <p className="italic opacity-40">
                            Your message will appear here...
                          </p>
                        )}
                        <p className="text-right text-xs mt-1 opacity-60">
                          {new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          ✓✓
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-primary font-medium">
                Recipients:{" "}
                {notifyRecipientCount === null
                  ? "Loading..."
                  : `${notifyRecipientCount} customers`}
                {boardFilter !== "all" && (
                  <span className="ml-1 text-muted-foreground font-normal">
                    (board &ldquo;{boardFilter}&rdquo;)
                  </span>
                )}
                {notifyRecipientCount !== null && notifyRecipientCount > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    · ~{Math.ceil((notifyRecipientCount * 1.5) / 60)} min
                  </span>
                )}
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
                  disabled={!notificationMessage.trim()}
                  className="gradient-primary text-primary-foreground"
                >
                  Send Notification
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: SENDING ── */}
          {notifyStep === "sending" && (
            <div className="space-y-5 py-2">
              <div className="text-sm text-muted-foreground text-center">
                Please keep this window open while messages are being sent.
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>
                    {notifyProgress.sent + notifyProgress.failed} /{" "}
                    {notifyProgress.total}
                  </span>
                  <span className="text-muted-foreground">
                    ~
                    {Math.ceil(
                      ((notifyProgress.total -
                        notifyProgress.sent -
                        notifyProgress.failed) *
                        1.5) /
                        60,
                    )}{" "}
                    min left
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: notifyProgress.total
                        ? `${(((notifyProgress.sent + notifyProgress.failed) / notifyProgress.total) * 100).toFixed(1)}%`
                        : "0%",
                      backgroundColor: "hsl(var(--primary))",
                    }}
                  />
                </div>
              </div>

              {/* Counters */}
              <div className="flex justify-center gap-8 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {notifyProgress.sent}
                  </p>
                  <p className="text-muted-foreground">Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {notifyProgress.failed}
                  </p>
                  <p className="text-muted-foreground">Failed</p>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground animate-pulse">
                Sending messages, please wait...
              </p>
            </div>
          )}

          {/* ── STEP 3: DONE ── */}
          {notifyStep === "done" && (
            <div className="space-y-5 py-2 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-9 h-9 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-xl font-bold">
                  {notifyProgress.sent} message
                  {notifyProgress.sent !== 1 ? "s" : ""} sent!
                </p>
                {notifyProgress.failed > 0 && (
                  <p className="text-sm text-destructive mt-1">
                    {notifyProgress.failed} failed
                  </p>
                )}
              </div>

              {notifyFailedNumbers.length > 0 && (
                <div className="text-left bg-muted rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Failed numbers:
                  </p>
                  {notifyFailedNumbers.map((n) => (
                    <p key={n} className="text-xs text-destructive font-mono">
                      {n}
                    </p>
                  ))}
                </div>
              )}

              <Button
                onClick={() => setIsNotifyModalOpen(false)}
                className="gradient-primary text-primary-foreground w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllTasks;