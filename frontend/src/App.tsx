import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";

// Layouts
import EmployeeLayout from "@/components/layout/EmployeeLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import NewTask from "./pages/employee/NewTask";
import MyTasks from "./pages/employee/MyTasks";
import AllEmployeeTasks from "./pages/employee/AllTasksEmployee"

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AssignWork from "./pages/admin/AssignWork";
import Employees from "./pages/admin/Employees";
import Customers from "./pages/admin/Customers";
import AllTasks from "./pages/admin/AllTasks";
import Analytics from "./pages/admin/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />

                {/* Employee Routes */}
                <Route path="/employee" element={<EmployeeLayout />}>
                  <Route index element={<Navigate to="/employee/dashboard" replace />} />
                  <Route path="dashboard" element={<EmployeeDashboard />} />
                  <Route path="new-task" element={<NewTask />} />
                  <Route path="my-tasks" element={<MyTasks />} />
                  <Route path="all-tasks" element={<AllEmployeeTasks />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="assign-work" element={<AssignWork />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="all-tasks" element={<AllTasks />} />
                  <Route path="analytics" element={<Analytics />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
