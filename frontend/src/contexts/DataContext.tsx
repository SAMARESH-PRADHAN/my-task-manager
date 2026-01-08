import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { api } from "@/lib/api";

/* =========================
   TYPES (UNCHANGED – UI SAFE)
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
   CONTEXT TYPE (UNCHANGED)
========================= */
interface DataContextType {
  customers: Customer[];
  formFillingTasks: FormFillingTask[];
  xeroxTasks: XeroxTask[];
  employees: Employee[];

  addCustomer: (
    customer: Omit<Customer, "id" | "createdAt">
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* =========================
   PROVIDER
========================= */
export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formFillingTasks, setFormFillingTasks] = useState<FormFillingTask[]>(
    []
  );
  const [xeroxTasks, setXeroxTasks] = useState<XeroxTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  /* =========================
     EMPLOYEES (UNCHANGED)
  ========================= */
  const fetchEmployees = async () => {
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
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchEmployees(),
      fetchTasksFromDB(),
      fetchCustomersFromDB(),
    ]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const addEmployee = async (employee: Omit<Employee, "id" | "createdAt">) => {
    await api.post("/users", employee);
    await fetchEmployees();
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await api.put(`/users/${id}`, updates);
    await fetchEmployees(); // refresh employee list
  };

  /* =========================
     FETCH TASKS FROM DB
  ========================= */
  const fetchTasksFromDB = async () => {
    const res = await api.get("/tasks");

    const ff: FormFillingTask[] = [];
    const xx: XeroxTask[] = [];

    res.data.forEach((t: any) => {
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
          amount: Number(t.total_amount ?? 0),
          deductionAmount: Number(t.deduction_amount ?? 0),
          revenue: Number(t.revenue ?? 0),
          workStatus: t.work_status ?? "pending",
          paymentStatus:
            t.payment_status === "unpaid"
              ? "pending"
              : t.payment_status ?? "pending",

          paymentMode: t.payment_mode ?? "",
          description: t.description ?? "",
          employeeId: t.employee_id ? String(t.employee_id) : "",
          employeeName: t.employee_name ?? "....",
          screenshotUrl: t.screenshot_url,
          createdAt: t.created_at, // Keep as string if your interface uses string
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
            t.payment_status === "unpaid" ? "pending" : t.payment_status ?? "pending",
          paymentMode: t.payment_mode ?? "",
          description: t.description ?? "",
          employeeId: t.employee_id ? String(t.employee_id) : "",
          employeeName: t.employee_name ?? "....",
          createdAt: t.created_at, // Keep as string if your interface uses string
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
  };

  /* =========================
     CUSTOMER (UI NEEDS THIS)
  ========================= */
  const addCustomer = async (customer: Omit<Customer, "id" | "createdAt">) => {
    const res = await api.post("/customers", customer);
    await refreshAll();

    const newCustomer: Customer = {
      id: String(res.data.id), // ✅ REAL DB ID
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
     CREATE TASK (DB)
  ========================= */
  const addFormFillingTask = async (task: any) => {
    await api.post("/tasks", {
      customer_id: task.customerId,
      employee_id: task.employeeId,
      service_type: "form_filling",
      form_service_type: task.serviceType,
      application_id: task.applicationId,
      application_password: task.password,
      description: task.description,
      total_amount: task.amount,
      deduction_amount: task.deductionAmount,
      revenue: task.revenue,
      payment_mode: task.paymentMode,
    });
    await fetchTasksFromDB();
    await refreshAll();
  };

  const addXeroxTask = async (task: any) => {
    await api.post("/tasks", {
      customer_id: task.customerId,
      employee_id: task.employeeId,
      service_type: "xerox",
      description: task.description,
      total_amount: task.amount,
      deduction_amount: task.deductionAmount,
      revenue: task.revenue,
      payment_mode: task.paymentMode,
    });
    await fetchTasksFromDB();
  };

  /* =========================
     UPDATE TASK (DB)
  ========================= */
  // const updateFormFillingTask = async (id: string, updates: any) => {
  //   await api.put(`/tasks/${id}`, {
  //     application_id: updates.applicationId,
  //     application_password: updates.password,
  //     payment_status: updates.paymentStatus,
  //     payment_mode: updates.paymentMode,
  //     work_status: updates.workStatus,
  //   });
  //   await fetchTasksFromDB();
  // };
  const updateTask = async (id: string, updates: any) => {
    try {
      await api.put(`/tasks/${id}`, {
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

      // refresh from DB (SAFEST)
      await fetchTasksFromDB();
      await refreshAll();
    } catch (error) {
      console.error("Update form filling task failed", error);
      throw error;
    }
  };

  // const updateXeroxTask = async (id: string, updates: any) => {
  //   await api.put(`/tasks/${id}`, {
  //     payment_status: updates.paymentStatus,
  //     payment_mode: updates.paymentMode,
  //   });
  //   await fetchTasksFromDB();
  // };
  const updateXeroxTask = async (id: string, updates: any) => {
    try {
      await api.put(`/tasks/${id}`, {
        customer_name: updates.customerName,
        customer_phone: updates.customerPhone,
        customer_email: updates.customerEmail,
        total_amount: updates.amount,
        deduction_amount: updates.deductionAmount,
        revenue: updates.revenue,
        payment_status: updates.paymentStatus,
        description: updates.description,
      });

      await fetchTasksFromDB();
    } catch (error) {
      console.error("Update xerox task failed", error);
      throw error;
    }
  };

  const deleteXeroxTask = async (id: string) => {
    try {
      await api.delete(`/tasks/${id}`);
      await fetchTasksFromDB(); // refresh UI
      await refreshAll();
    } catch (error) {
      console.error("Delete task failed", error);
      throw error;
    }
  };

  /* =========================
     UI HELPERS (UNCHANGED)
  ========================= */
  // !changes here
  const getEmployeeTasks = (employeeId: string) => ({
    formFilling: formFillingTasks.filter(
      (t) => String(t.employeeId) === String(employeeId)
    ),
    xerox: xeroxTasks.filter(
      (t) => String(t.employeeId) === String(employeeId)
    ),
  });

  const getEmployeePendingCount = (employeeId: string) => {
    // 1️⃣ Form Filling – work pending
    const formWorkPending = formFillingTasks.filter(
      (t) =>
        String(t.employeeId) === String(employeeId) &&
        t.workStatus === "pending"
    ).length;

    // 2️⃣ Form Filling – payment pending
    const formPaymentPending = formFillingTasks.filter(
      (t) =>
        String(t.employeeId) === String(employeeId) &&
        (t.paymentStatus === "pending" || t.paymentStatus === "unpaid")
    ).length;

    // 3️⃣ Xerox – payment pending
    const xeroxPaymentPending = xeroxTasks.filter(
      (t) =>
        String(t.employeeId) === String(employeeId) &&
        t.paymentStatus === "pending"
    ).length;

    return formWorkPending + formPaymentPending + xeroxPaymentPending;
  };

  // ! changes here
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
        updateEmployee, // ✅ ADD THIS EXACT LINE
        getEmployeeTasks,
        getEmployeePendingCount,
        getTodayStats,
        refreshAll,
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
