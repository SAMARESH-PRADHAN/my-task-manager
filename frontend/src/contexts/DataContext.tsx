import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { api } from "@/lib/api";

/* =========================
   TYPES
========================= */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: "job_seeker" | "student" | "gov_scheme" | "xerox";
  createdAt: string;
}

export interface FormFillingTask {
  id: string;
  customerId: string;
  customerName: string;
  boardName?: string;
  customerEmail: string;
  customerPhone: string;
  customerType: "job_seeker" | "student" | "gov_scheme";
  serviceType: "job_seeker" | "student" | "gov_scheme";
  applicationId: string;
  password: string;
  amount: number;
  deductionAmount: number;
  revenue: number;
  description: string;
  paymentMode: "cash" | "upi" | "card" | "";
  workStatus: "pending" | "completed";
  paymentStatus: "pending" | "completed" | "unpaid";
  employeeId: string;
  employeeName: string;
  completedById?: string; // ✅ NEW
  completedByName?: string; // ✅ NEW
  screenshotUrl?: string;
  createdAt: string;
}

export interface XeroxTask {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  deductionAmount: number;
  revenue: number;
  description: string;
  paymentMode: "cash" | "upi" | "card" | "";
  paymentStatus: "pending" | "completed" | "unpaid";
  employeeId: string;
  employeeName: string;
  completedById?: string; // ✅ NEW
  completedByName?: string; // ✅ NEW
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  createdAt: string;
}

/* =========================
   CONTEXT TYPE
========================= */
interface DataContextType {
  customers: Customer[];
  formFillingTasks: FormFillingTask[];
  xeroxTasks: XeroxTask[];
  employees: Employee[];

  addCustomer: (
    customer: Omit<Customer, "id" | "createdAt">,
  ) => Promise<Customer>;

  addFormFillingTask: (task: any) => Promise<void>;
  addXeroxTask: (task: any) => Promise<void>;

  updateTask: (id: string, updates: any) => Promise<void>;
  updateXeroxTask: (id: string, updates: any) => Promise<void>;

  deleteXeroxTask: (id: string) => Promise<void>;

  addEmployee: (employee: Omit<Employee, "id" | "createdAt">) => Promise<void>;

  getEmployeeTasks: (employeeId: string) => {
    formFilling: FormFillingTask[];
    xerox: XeroxTask[];
  };
  getEmployeePendingCount: (employeeId: string) => number;

  getTodayStats: () => {
    formFilling: number;
    xerox: number;
    revenue: number;
  };
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;

  refreshAll: () => Promise<void>;
  fetchTasksFromDB: (page?: number, limit?: number, search?: string, fromDate?: Date, toDate?: Date, board?: string, serviceType?: string) => Promise<void>;
  totalTasks: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* =========================
   PROVIDER
========================= */
export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [formFillingTasks, setFormFillingTasks] = useState<FormFillingTask[]>(
    [],
  );
  const [xeroxTasks, setXeroxTasks] = useState<XeroxTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);

  /* =========================
     EMPLOYEES
  ========================= */
  const fetchEmployees = async () => {
    if (employeesLoaded) return;

    const res = await api.get("/users");

    setEmployees(
      res.data
        .filter((u: any) => u.role === "employee")
        .map((e: any) => ({
          id: String(e.id),
          name: e.name,
          email: e.email,
          phone: e.phone,
          address: e.address,
          password: "",
          createdAt: e.created_at,
        }))
    );

    setEmployeesLoaded(true);
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchEmployees(),
      fetchCustomersFromDB(),
    ]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const addEmployee = async (employee: Omit<Employee, "id" | "createdAt">) => {
    await api.post("/users", employee);
    setEmployees((prev) => [
      ...prev,
      { ...employee, id: Date.now().toString(), createdAt: new Date().toISOString() }
    ]);
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await api.put(`/users/${id}`, updates);
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  /* =========================
     FETCH TASKS FROM DB
  ========================= */
  const fetchTasksFromDB = async (page = 1, limit = 10, search = '', fromDate?: Date, toDate?: Date, board?: string, serviceType?: string) => {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    if (search) params.set('search', search);
    if (fromDate) params.set('from_date', fromDate.toISOString());
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      params.set('to_date', end.toISOString());
    }
    if (board && board !== 'all') params.set('board', board);
    if (serviceType) params.set('service_type', serviceType);

    const res = await api.get(`/tasks?${params.toString()}`);

    const { tasks: rawTasks, total } = res.data;
    setTotalTasks(total);

    const ff: FormFillingTask[] = [];
    const xx: XeroxTask[] = [];

    rawTasks.forEach((t: any) => {
      if (t.service_type === "form_filling") {
        ff.push({
          id: String(t.id),
          customerId: String(t.customer_id),
          customerName: t.customer_name ?? "—",
          customerEmail: t.customer_email ?? "—",
          customerPhone: t.customer_phone ?? "—",
          customerType: t.form_service_type ?? "unknown",
          serviceType: t.form_service_type ?? "unknown",
          applicationId: t.application_id || "",
          password: t.application_password || "",
          boardName: t.board_name || "",
          amount: Number(t.total_amount ?? 0),
          deductionAmount: Number(t.deduction_amount ?? 0),
          revenue: Number(t.revenue ?? 0),
          workStatus: t.work_status ?? "pending",
          paymentStatus:
            t.payment_status === "unpaid"
              ? "pending"
              : (t.payment_status ?? "pending"),
          paymentMode: t.payment_mode ?? "",
          description: t.description ?? "",
          employeeId: t.employee_id ? String(t.employee_id) : "",
          employeeName: t.employee_name ?? "—",
          completedById: t.completed_by ? String(t.completed_by) : undefined, // ✅ NEW
          completedByName: t.completed_by_name ?? undefined, // ✅ NEW
          screenshotUrl: t.screenshot_url,
          createdAt: t.created_at,
        });
      } else if (t.service_type === "xerox") {
        xx.push({
          id: String(t.id),
          customerId: String(t.customer_id),
          customerName: t.customer_name ?? "—",
          customerEmail: t.customer_email ?? "—",
          customerPhone: t.customer_phone ?? "—",
          amount: Number(t.total_amount ?? 0),
          deductionAmount: Number(t.deduction_amount ?? 0),
          revenue: Number(t.revenue ?? 0),
          paymentStatus:
            t.payment_status === "unpaid"
              ? "pending"
              : (t.payment_status ?? "pending"),
          paymentMode: t.payment_mode ?? "",
          description: t.description ?? "",
          employeeId: t.employee_id ? String(t.employee_id) : "",
          employeeName: t.employee_name ?? "—",
          completedById: t.completed_by ? String(t.completed_by) : undefined, // ✅ NEW
          completedByName: t.completed_by_name ?? undefined, // ✅ NEW
          createdAt: t.created_at,
        });
      }
    });

    setFormFillingTasks(ff);
    setXeroxTasks(xx);
  };

  /* =========================
     FETCH CUSTOMERS FROM DB
  ========================= */
  const fetchCustomersFromDB = async () => {
    if (customersLoaded) return;

    const res = await api.get("/customers");

    const list: Customer[] = res.data.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      email: c.email,
      phone: c.phone,
      type: c.type,
      createdAt: c.created_at,
    }));

    setCustomers(list);
    setCustomersLoaded(true);
  };

  /* =========================
     CUSTOMER
  ========================= */
  const addCustomer = async (customer: Omit<Customer, "id" | "createdAt">) => {
    const res = await api.post("/customers", customer);

    const newCustomer: Customer = {
      id: String(res.data.id),
      name: res.data.name,
      email: res.data.email,
      phone: res.data.phone,
      type: res.data.type,
      createdAt: res.data.created_at,
    };

    setCustomers((p) => [...p, newCustomer]);
    return newCustomer;
  };

  /* =========================
     CREATE TASK
  ========================= */
  const addFormFillingTask = async (task: any) => {
    const res = await api.post("/tasks", {
      customer_id: task.customerId,
      employee_id: task.employeeId,
      service_type: "form_filling",
      form_service_type: task.serviceType,
      board_name: task.boardName,
      application_id: task.applicationId,
      application_password: task.password,
      description: task.description,
      total_amount: task.amount,
      deduction_amount: task.deductionAmount,
      revenue: task.revenue,
      payment_mode: task.paymentMode,
    });

    const t = res.data;

    const newTask: FormFillingTask = {
      id: String(t.id),
      customerId: String(t.customer_id),
      customerName: task.customerName || "—",
      customerEmail: task.customerEmail || "—",
      customerPhone: task.customerPhone || "—",
      customerType: t.form_service_type,
      serviceType: t.form_service_type,
      applicationId: t.application_id || "",
      password: t.application_password || "",
      boardName: t.board_name || "",
      amount: Number(t.total_amount || 0),
      deductionAmount: Number(t.deduction_amount || 0),
      revenue: Number(t.revenue || 0),
      workStatus: t.work_status,
      paymentStatus: t.payment_status === "unpaid" ? "pending" : t.payment_status,
      paymentMode: t.payment_mode || "",
      description: t.description || "",
      employeeId: String(t.employee_id),
      employeeName:
        employees.find((e) => e.id === String(t.employee_id))?.name || "—",
      createdAt: t.created_at,
    };

    setFormFillingTasks((prev) => [newTask, ...prev]);
  };

  const addXeroxTask = async (task: any) => {
    const res = await api.post("/tasks", {
      customer_id: task.customerId,
      employee_id: task.employeeId,
      service_type: "xerox",
      description: task.description,
      total_amount: task.amount,
      deduction_amount: task.deductionAmount,
      revenue: task.revenue,
      payment_mode: task.paymentMode,
    });

    const t = res.data;

    const newTask: XeroxTask = {
      id: String(t.id),
      customerId: String(t.customer_id),
      customerName: task.customerName || "—",
      customerEmail: task.customerEmail || "—",
      customerPhone: task.customerPhone || "—",
      amount: Number(t.total_amount || 0),
      deductionAmount: Number(t.deduction_amount || 0),
      revenue: Number(t.revenue || 0),
      paymentStatus: t.payment_status === "unpaid" ? "pending" : t.payment_status,
      paymentMode: t.payment_mode || "",
      description: t.description || "",
      employeeId: String(t.employee_id),
      employeeName:
        employees.find((e) => e.id === String(t.employee_id))?.name || "—",
      createdAt: t.created_at,
    };

    setXeroxTasks((prev) => [newTask, ...prev]);
  };

  /* =========================
     UPDATE TASK
  ========================= */
  const updateTask = async (id: string, updates: any) => {
    try {
      await api.put(`/tasks/${id}`, {
        service_type: "form_filling",
        form_service_type: updates.serviceType,
        board_name: updates.boardName,
        employee_id: updates.employeeId ?? undefined, // ✅ reassign
        completed_by: updates.completedById ?? undefined, // ✅ completed by
        customer_name: updates.customerName,
        customer_phone: updates.customerPhone,
        customer_email: updates.customerEmail,
        application_id: updates.applicationId,
        application_password: updates.password,
        total_amount: updates.amount,
        deduction_amount: updates.deductionAmount,
        revenue: updates.revenue,
        work_status: updates.workStatus,
        payment_status: updates.paymentStatus,
        description: updates.description,
      });
      setFormFillingTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updates,
                revenue:
                  (updates.amount ?? t.amount) -
                  (updates.deductionAmount ?? (t.deductionAmount || 0)),
              }
            : t
        )
      );
    } catch (error) {
      console.error("Update form filling task failed", error);
      throw error;
    }
  };

  const updateXeroxTask = async (id: string, updates: any) => {
    try {
      await api.put(`/tasks/${id}`, {
        employee_id: updates.employeeId ?? undefined, // ✅ reassign
        completed_by: updates.completedById ?? undefined, // ✅ completed by
        customer_name: updates.customerName,
        customer_phone: updates.customerPhone,
        customer_email: updates.customerEmail,
        total_amount: updates.amount,
        deduction_amount: updates.deductionAmount,
        revenue: updates.revenue,
        payment_status: updates.paymentStatus,
        description: updates.description,
      });
      setXeroxTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...updates,
                revenue:
                  (updates.amount ?? t.amount) -
                  (updates.deductionAmount ?? (t.deductionAmount || 0)),
              }
            : t
        )
      );
    } catch (error) {
      console.error("Update xerox task failed", error);
      throw error;
    }
  };

  const deleteXeroxTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      setXeroxTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Delete task failed", error);
      throw error;
    }
  };

  /* =========================
     UI HELPERS
  ========================= */
  const getEmployeeTasks = (employeeId: string) => ({
    formFilling: formFillingTasks.filter(
      (t) => String(t.employeeId) === String(employeeId),
    ),
    xerox: xeroxTasks.filter(
      (t) => String(t.employeeId) === String(employeeId),
    ),
  });

  const getEmployeePendingCount = (employeeId: string) => {
    const formWorkPending = formFillingTasks.filter(
      (t) =>
        String(t.employeeId) === String(employeeId) &&
        t.workStatus === "pending",
    ).length;

    const formPaymentPending = formFillingTasks.filter(
      (t) =>
        String(t.employeeId) === String(employeeId) &&
        (t.paymentStatus === "pending" || t.paymentStatus === "unpaid"),
    ).length;

    const xeroxPaymentPending = xeroxTasks.filter(
      (t) =>
        String(t.employeeId) === String(employeeId) &&
        t.paymentStatus === "pending",
    ).length;

    return formWorkPending + formPaymentPending + xeroxPaymentPending;
  };

  const getTodayStats = () => {
    const revenue =
      formFillingTasks.reduce((s, t) => s + t.revenue, 0) +
      xeroxTasks.reduce((s, t) => s + t.revenue, 0);

    return {
      formFilling: formFillingTasks.length,
      xerox: xeroxTasks.length,
      revenue,
    };
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        formFillingTasks,
        xeroxTasks,
        employees,
        addCustomer,
        addFormFillingTask,
        addXeroxTask,
        updateTask,
        updateXeroxTask,
        deleteXeroxTask,
        addEmployee,
        updateEmployee,
        getEmployeeTasks,
        getEmployeePendingCount,
        getTodayStats,
        refreshAll,
        fetchTasksFromDB,
        totalTasks,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};