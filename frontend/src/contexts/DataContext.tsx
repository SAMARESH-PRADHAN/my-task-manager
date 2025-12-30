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
  type: "job_seeker" | "student" | "gov_scheme";
  createdAt: Date;
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
  paymentStatus: "pending" | "completed";
  employeeId: string;
  employeeName: string;
  screenshotUrl?: string;
  createdAt: Date;
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
  paymentStatus: "pending" | "completed";
  employeeId: string;
  employeeName: string;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  createdAt: Date;
}

/* =========================
   CONTEXT TYPE (UNCHANGED)
========================= */
interface DataContextType {
  customers: Customer[];
  formFillingTasks: FormFillingTask[];
  xeroxTasks: XeroxTask[];
  employees: Employee[];

  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => Customer;

  addFormFillingTask: (task: any) => Promise<void>;
  addXeroxTask: (task: any) => Promise<void>;

  updateFormFillingTask: (id: string, updates: any) => Promise<void>;
  updateXeroxTask: (id: string, updates: any) => Promise<void>;

  deleteXeroxTask: (id: string) => void;

  addEmployee: (employee: Omit<Employee, "id" | "createdAt">) => Promise<void>;

  // getEmployeeTasks: (
  //   employeeId: string
  // ) => { formFilling: FormFillingTask[]; xerox: XeroxTask[] };

  getTodayStats: () => {
    formFilling: number;
    xerox: number;
    revenue: number;
  };
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;

}

const DataContext = createContext<DataContextType | undefined>(undefined);

/* =========================
   PROVIDER
========================= */
export const DataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formFillingTasks, setFormFillingTasks] = useState<FormFillingTask[]>([]);
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
          createdAt: new Date(e.created_at),
        }))
    );
  };

  useEffect(() => {
    fetchEmployees();
    fetchTasksFromDB();
  }, []);

  const addEmployee = async (employee: Omit<Employee, "id" | "createdAt">) => {
    await api.post("/users", employee);
    await fetchEmployees();
  };

  const updateEmployee = async (
  id: string,
  updates: Partial<Employee>
) => {
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
      const base = {
  id: String(t.id),
  customerId: String(t.customer_id),

  customerName: t.customer_name ?? "—",
  customerEmail: t.customer_email ?? "—",
  customerPhone: t.customer_phone ?? "—",

  amount: Number(t.total_amount ?? 0),
  deductionAmount: Number(t.deduction_amount ?? 0),
  revenue: Number(t.revenue ?? 0),

  description: t.description ?? "",
  paymentMode: t.payment_mode ?? "",
  paymentStatus: t.payment_status,

  employeeId: t.employee_id ? String(t.employee_id) : "",
  employeeName: "",

  createdAt: new Date(t.created_at),
};


      if (t.service_type === "form_filling") {
        ff.push({
          ...base,
          customerType: t.form_service_type ?? t.form_service_type ?? "unknown",
          serviceType: t.form_service_type?? "unknown",
          applicationId: t.application_id || "",
          password: t.application_password || "",
          workStatus: t.work_status,
          screenshotUrl: t.screenshot_url,
        });
      } else {
        xx.push(base as XeroxTask);
      }
    });

    setFormFillingTasks(ff);
    setXeroxTasks(xx);
  };

  /* =========================
     CUSTOMER (UI NEEDS THIS)
  ========================= */
 const addCustomer = async (
  customer: Omit<Customer, "id" | "createdAt">
) => {
  const res = await api.post("/customers", customer);

  const newCustomer: Customer = {
    id: String(res.data.id),              // ✅ REAL DB ID
    name: res.data.name,
    email: res.data.email,
    phone: res.data.phone,
    type: res.data.type,
    createdAt: new Date(res.data.created_at),
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
  const updateFormFillingTask = async (id: string, updates: any) => {
    await api.put(`/tasks/${id}`, {
      application_id: updates.applicationId,
      application_password: updates.password,
      payment_status: updates.paymentStatus,
      payment_mode: updates.paymentMode,
      work_status: updates.workStatus,
    });
    await fetchTasksFromDB();
  };

  const updateXeroxTask = async (id: string, updates: any) => {
    await api.put(`/tasks/${id}`, {
      payment_status: updates.paymentStatus,
      payment_mode: updates.paymentMode,
    });
    await fetchTasksFromDB();
  };

  const deleteXeroxTask = () => {};

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
        // addFormFillingTask,
        // addXeroxTask,
        // updateFormFillingTask,
        // updateXeroxTask,
        deleteXeroxTask,
        addEmployee,
        updateEmployee, // ✅ ADD THIS EXACT LINE
        getEmployeeTasks,
        getTodayStats,
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
