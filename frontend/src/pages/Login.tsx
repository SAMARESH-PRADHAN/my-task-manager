import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Shield, User, Wifi } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"admin" | "employee">("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { refreshAll } = useData();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(adminEmail, adminPassword);
      if (!success) { toast.error("Invalid email or password"); return; }
      const storedUser = localStorage.getItem("user");
      if (!storedUser) { toast.error("Login failed. User not found."); return; }
      const user = JSON.parse(storedUser);
      if (user.role === "admin") {
        toast.success("Welcome back!");
        await refreshAll();
        navigate("/admin/dashboard");
      } else {
        toast.error("You are not authorized as admin");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(employeeEmail, employeePassword);
      if (!success) { toast.error("Invalid email or password"); return; }
      const storedUser = localStorage.getItem("user");
      if (!storedUser) { toast.error("Login failed. User not found."); return; }
      const user = JSON.parse(storedUser);
      if (user.role === "employee") {
        toast.success("Welcome back!");
        await refreshAll();
        navigate("/employee/dashboard");
      } else {
        toast.error("You are not authorized as employee");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center overflow-hidden p-12">
        {/* Animated mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0a0a0f] to-[#001233]" />
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-violet-600/20 blur-[80px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-600/15 blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-[60px] animate-pulse" style={{ animationDelay: "0.8s" }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "60px 60px"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center space-y-8 max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 blur-xl opacity-60" />
              <img
                src="/logo.jpg"
                alt="Cyber City"
                className="relative w-24 h-24 rounded-full object-cover border-2 border-white/10 shadow-2xl"
              />
            </div>
          </div>

          {/* Brand */}
          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Cyber
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                City
              </span>
            </h1>
            <p className="text-lg text-white/50 font-light tracking-widest uppercase ">
              Connecting People
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 items-center">
            {[
              { icon: Wifi, label: "Real-time task management" },
              { icon: Shield, label: "Role-based secure access" },
              { icon: User, label: "Team collaboration tools" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-sm">
                <Icon className="w-4 h-4 text-violet-400" />
                <span className="text-white/70 text-sm">{label}</span>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-white/20 text-xs leading-relaxed">
            CRM Tool — Proprietary Software of Blackmoon Tech.<br />
            © All rights reserved. Delivered to Cyber City.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-[#0d0d16]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-900/10 rounded-full blur-[120px]" />

        <div className="relative z-10 w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/logo.jpg" alt="Cyber City" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-white font-bold text-xl">Cyber City</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Welcome back
            </h2>
            <p className="text-white/40 text-sm">Sign in to your workspace</p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
            {(["admin", "employee"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab === "admin" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Forms */}
          {activeTab === "admin" ? (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  Admin Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@cybercity.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value.toLowerCase())}
                  required
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Admin Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmployeeLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  Employee Email
                </label>
                <Input
                  type="email"
                  placeholder="employee@cybercity.com"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value.toLowerCase())}
                  required
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showEmployeePassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showEmployeePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Employee Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom note */}
          <p className="mt-8 text-center text-white/20 text-xs">
            Unauthorized access is strictly prohibited
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;