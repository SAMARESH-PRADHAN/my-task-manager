import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'job_seeker' | 'student' | 'gov_scheme';
  createdAt: Date;
}

export interface FormFillingTask {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerType: 'job_seeker' | 'student' | 'gov_scheme';
  serviceType: 'job_seeker' | 'student' | 'gov_scheme';
  applicationId: string;
  password: string;
  amount: number;
  description: string;
  paymentMode: 'cash' | 'upi' | 'card';
  workStatus: 'pending' | 'completed';
  paymentStatus: 'pending' | 'completed';
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
  description: string;
  paymentMode: 'cash' | 'upi' | 'card';
  paymentStatus: 'pending' | 'completed';
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

interface DataContextType {
  customers: Customer[];
  formFillingTasks: FormFillingTask[];
  xeroxTasks: XeroxTask[];
  employees: Employee[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  addFormFillingTask: (task: Omit<FormFillingTask, 'id' | 'createdAt'>) => void;
  addXeroxTask: (task: Omit<XeroxTask, 'id' | 'createdAt'>) => void;
  updateFormFillingTask: (id: string, updates: Partial<FormFillingTask>) => void;
  updateXeroxTask: (id: string, updates: Partial<XeroxTask>) => void;
  deleteXeroxTask: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployeeTasks: (employeeId: string) => { formFilling: FormFillingTask[]; xerox: XeroxTask[] };
  getTodayStats: () => { formFilling: number; xerox: number; revenue: number };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Generate mock data
const generateMockData = () => {
  const customers: Customer[] = [
    { id: '1', name: 'Rahul Kumar', email: 'rahul@email.com', phone: '9876543001', type: 'job_seeker', createdAt: new Date() },
    { id: '2', name: 'Priya Sharma', email: 'priya@email.com', phone: '9876543002', type: 'student', createdAt: new Date() },
    { id: '3', name: 'Amit Singh', email: 'amit@email.com', phone: '9876543003', type: 'gov_scheme', createdAt: new Date() },
    { id: '4', name: 'Sneha Patel', email: 'sneha@email.com', phone: '9876543004', type: 'job_seeker', createdAt: new Date() },
    { id: '5', name: 'Vijay Reddy', email: 'vijay@email.com', phone: '9876543005', type: 'student', createdAt: new Date() },
  ];

  const formFillingTasks: FormFillingTask[] = [
    {
      id: '1',
      customerId: '1',
      customerName: 'Rahul Kumar',
      customerEmail: 'rahul@email.com',
      customerPhone: '9876543001',
      customerType: 'job_seeker',
      serviceType: 'job_seeker',
      applicationId: 'APP001',
      password: 'pass123',
      amount: 500,
      description: 'Job application form',
      paymentMode: 'upi',
      workStatus: 'completed',
      paymentStatus: 'completed',
      employeeId: '2',
      employeeName: 'John Employee',
      createdAt: new Date(),
    },
    {
      id: '2',
      customerId: '2',
      customerName: 'Priya Sharma',
      customerEmail: 'priya@email.com',
      customerPhone: '9876543002',
      customerType: 'student',
      serviceType: 'student',
      applicationId: 'STU001',
      password: 'student123',
      amount: 300,
      description: 'Scholarship application',
      paymentMode: 'cash',
      workStatus: 'pending',
      paymentStatus: 'pending',
      employeeId: '2',
      employeeName: 'John Employee',
      createdAt: new Date(),
    },
  ];

  const xeroxTasks: XeroxTask[] = [
    {
      id: '1',
      customerId: '3',
      customerName: 'Amit Singh',
      customerEmail: 'amit@email.com',
      customerPhone: '9876543003',
      amount: 150,
      description: 'Document xerox - 30 pages',
      paymentMode: 'cash',
      paymentStatus: 'completed',
      employeeId: '3',
      employeeName: 'Jane Employee',
      createdAt: new Date(),
    },
  ];

  const employees: Employee[] = [
    {
      id: '2',
      name: 'John Employee',
      email: 'john@cafeconnect.com',
      phone: '9876543211',
      address: '456 Employee Lane, City',
      password: 'employee123',
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Jane Employee',
      email: 'jane@cafeconnect.com',
      phone: '9876543212',
      address: '789 Worker Ave, City',
      password: 'employee123',
      createdAt: new Date(),
    },
  ];

  return { customers, formFillingTasks, xeroxTasks, employees };
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState(generateMockData);

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setData((prev) => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    return newCustomer;
  };

  const addFormFillingTask = (task: Omit<FormFillingTask, 'id' | 'createdAt'>) => {
    const newTask: FormFillingTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setData((prev) => ({ ...prev, formFillingTasks: [...prev.formFillingTasks, newTask] }));
  };

  const addXeroxTask = (task: Omit<XeroxTask, 'id' | 'createdAt'>) => {
    const newTask: XeroxTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setData((prev) => ({ ...prev, xeroxTasks: [...prev.xeroxTasks, newTask] }));
  };

  const updateFormFillingTask = (id: string, updates: Partial<FormFillingTask>) => {
    setData((prev) => ({
      ...prev,
      formFillingTasks: prev.formFillingTasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  };

  const updateXeroxTask = (id: string, updates: Partial<XeroxTask>) => {
    setData((prev) => ({
      ...prev,
      xeroxTasks: prev.xeroxTasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  };

  const deleteXeroxTask = (id: string) => {
    setData((prev) => ({
      ...prev,
      xeroxTasks: prev.xeroxTasks.filter((task) => task.id !== id),
    }));
  };

  const addEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setData((prev) => ({ ...prev, employees: [...prev.employees, newEmployee] }));
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updates } : emp
      ),
    }));
  };

  const deleteEmployee = (id: string) => {
    setData((prev) => ({
      ...prev,
      employees: prev.employees.filter((emp) => emp.id !== id),
    }));
  };

  const getEmployeeTasks = (employeeId: string) => {
    return {
      formFilling: data.formFillingTasks.filter((t) => t.employeeId === employeeId),
      xerox: data.xeroxTasks.filter((t) => t.employeeId === employeeId),
    };
  };

  const getTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFormFilling = data.formFillingTasks.filter(
      (t) => new Date(t.createdAt) >= today
    );
    const todayXerox = data.xeroxTasks.filter((t) => new Date(t.createdAt) >= today);

    const revenue =
      todayFormFilling.reduce((sum, t) => sum + t.amount, 0) +
      todayXerox.reduce((sum, t) => sum + t.amount, 0);

    return {
      formFilling: todayFormFilling.length,
      xerox: todayXerox.length,
      revenue,
    };
  };

  return (
    <DataContext.Provider
      value={{
        ...data,
        addCustomer,
        addFormFillingTask,
        addXeroxTask,
        updateFormFillingTask,
        updateXeroxTask,
        deleteXeroxTask,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getEmployeeTasks,
        getTodayStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
