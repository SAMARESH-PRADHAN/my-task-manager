import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import { lazy, Suspense } from "react";
import VersionNotification from "@/components/VersionNotification";

// Layouts
import EmployeeLayout from "@/components/layout/EmployeeLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// Pages (eager - always needed)
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Employee Pages (lazy)
const EmployeeDashboard = lazy(
  () => import("./pages/employee/EmployeeDashboard"),
);
const NewTask = lazy(() => import("./pages/employee/NewTask"));
const MyTasks = lazy(() => import("./pages/employee/MyTasks"));
const AllEmployeeTasks = lazy(
  () => import("./pages/employee/AllTasksEmployee"),
);

// Admin Pages (lazy)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AssignWork = lazy(() => import("./pages/admin/AssignWork"));
const Employees = lazy(() => import("./pages/admin/Employees"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const AllTasks = lazy(() => import("./pages/admin/AllTasks"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      {/* <VersionNotification /> */}
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen">
                    Loading...
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />

                  {/* Employee Routes */}
                  <Route path="/employee" element={<EmployeeLayout />}>
                    <Route
                      index
                      element={<Navigate to="/employee/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<EmployeeDashboard />} />
                    <Route path="new-task" element={<NewTask />} />
                    <Route path="my-tasks" element={<MyTasks />} />
                    <Route path="all-tasks" element={<AllEmployeeTasks />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route
                      index
                      element={<Navigate to="/admin/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="assign-work" element={<AssignWork />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="all-tasks" element={<AllTasks />} />
                    <Route path="analytics" element={<Analytics />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
