import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Shield, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // const handleAdminLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   try {
  //     const success = await login(adminEmail, adminPassword);
  //     if (success) {
  //       const storedUser = localStorage.getItem('cafeconnect_user');
  //       if (storedUser) {
  //         const user = JSON.parse(storedUser);
  //         if (user.role === 'admin') {
  //           toast.success('Admin login successful!');
  //           navigate('/admin/dashboard');
  //         } else {
  //           toast.error('Invalid admin credentials');
  //           localStorage.removeItem('cafeconnect_user');
  //         }
  //       }
  //     } else {
  //       toast.error('Invalid email or password');
  //     }
  //   } catch (error) {
  //     toast.error('An error occurred. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleEmployeeLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);

  //   try {
  //     const success = await login(employeeEmail, employeePassword);
  //     if (success) {
  //       const storedUser = localStorage.getItem('cafeconnect_user');
  //       if (storedUser) {
  //         const user = JSON.parse(storedUser);
  //         if (user.role === 'employee') {
  //           toast.success('Employee login successful!');
  //           navigate('/employee/dashboard');
  //         } else {
  //           toast.error('Invalid employee credentials');
  //           localStorage.removeItem('cafeconnect_user');
  //         }
  //       }
  //     } else {
  //       toast.error('Invalid email or password');
  //     }
  //   } catch (error) {
  //     toast.error('An error occurred. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
// !changed some part from here to****
const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const success = await login(adminEmail, adminPassword);

    if (!success) {
      toast.error("Invalid email or password");
      return;
    }

    // ✅ FIX 1: correct localStorage key
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      toast.error("Login failed. User not found.");
      return;
    }

    const user = JSON.parse(storedUser);

    // ✅ FIX 2: backend decides role
    if (user.role === "admin") {
      toast.success("Admin login successful!");
      navigate("/admin/dashboard");
    } else {
      toast.error("You are not authorized as admin");
    }
  } catch (error: any) {
    // ✅ FIX 3: show real error
    console.error("Admin login error:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Network error. Please try again."
    );
  } finally {
    setIsLoading(false);
  }
};
const handleEmployeeLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const success = await login(employeeEmail, employeePassword);

    if (!success) {
      toast.error("Invalid email or password");
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      toast.error("Login failed. User not found.");
      return;
    }

    const user = JSON.parse(storedUser);

    if (user.role === "employee") {
      toast.success("Employee login successful!");
      navigate("/employee/dashboard");
    } else {
      toast.error("You are not authorized as employee");
    }
  } catch (error: any) {
    console.error("Employee login error:", error);
    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Network error. Please try again."
    );
  } finally {
    setIsLoading(false);
  }
};

// !here**
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-lg relative z-10 shadow-glow animate-scale-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">CC</span>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">Cyber City</CardTitle>
          <CardDescription className="text-muted-foreground font-bold">
            Connecting People
          </CardDescription>
          <CardDescription className="text-muted-foreground">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="employee" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee
              </TabsTrigger>
            </TabsList>

            {/* Admin Login */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showAdminPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Admin Sign In
                    </span>
                  )}
                </Button>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2"></p>
                  <p className="text-sm"></p>
                </div>
              </form>
            </TabsContent>

            {/* Employee Login */}
            <TabsContent value="employee">
              <form onSubmit={handleEmployeeLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="employee-email">Employee Email</Label>
                  <Input
                    id="employee-email"
                    type="email"
                    placeholder="Enter employee email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="employee-password"
                      type={showEmployeePassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={employeePassword}
                      onChange={(e) => setEmployeePassword(e.target.value)}
                      required
                      className="h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showEmployeePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-primary-foreground font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Employee Sign In
                    </span>
                  )}
                </Button>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2"></p>
                  <p className="text-sm"></p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;