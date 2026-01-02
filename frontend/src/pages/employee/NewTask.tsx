import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ServiceType = "form_filling" | "xerox";
type FormServiceType = "job_seeker" | "student" | "gov_scheme";
type PaymentMode = "cash" | "upi" | "card";

const NewTask: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCustomer, addFormFillingTask, addXeroxTask } = useData();

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Service selection
  const [serviceType, setServiceType] = useState<ServiceType | "">("");
  const [formServiceType, setFormServiceType] = useState<FormServiceType | "">(
    ""
  );

  // Form filling specific
  const [applicationId, setApplicationId] = useState("");
  const [password, setPassword] = useState("");

  // Common fields
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode | "">("");

  // Revenue calculation
  const revenue = useMemo(() => {
    const total = parseFloat(amount) || 0;
    const deduction = parseFloat(deductionAmount) || 0;
    return total - deduction;
  }, [amount, deductionAmount]);

  // 🔧 LOGIC FIX (async + await, UI untouched)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !serviceType) {
      toast.error(
        "Please fill all required fields (Customer Name, Phone, Service Type)"
      );
      return;
    }

    if (serviceType === "form_filling" && !formServiceType) {
      toast.error("Please select form service type");
      return;
    }

    try {
      const customerType = formServiceType || "job_seeker";

      const customer = await addCustomer({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        type: customerType,
      });

      const totalAmount = parseFloat(amount) || 0;
      const deduction = parseFloat(deductionAmount) || 0;
      const calculatedRevenue = totalAmount - deduction;

      if (serviceType === "form_filling") {
        await api.post("/tasks", {
          customer_id: customer.id,
          service_type: "form_filling",
          form_service_type: formServiceType,
          application_id: applicationId, // ✅ FIX
          application_password: password, // ✅ FIX
          description,
          total_amount: totalAmount,
          deduction_amount: deduction,
          revenue: calculatedRevenue,
          payment_mode: paymentMode,
        });
      } else {
        await api.post("/tasks", {
          customer_id: customer.id,
          service_type: "xerox",
          description,
          total_amount: totalAmount,
          deduction_amount: deduction,
          revenue: calculatedRevenue,
          payment_mode: paymentMode,
        });
      }

      toast.success("Task created successfully!");
      navigate("/employee/my-tasks");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task");
    }
  };

  const handleCancel = () => {
    navigate("/employee/dashboard");
  };

  // ✅ UI BELOW IS 100% ORIGINAL
  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
        <p className="text-muted-foreground">
          Fill in the details to create a new task
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setCustomerPhone(value);
                    }
                  }}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value.toLowerCase())}
                placeholder="Enter email address (optional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select
                value={serviceType}
                onValueChange={(value) => {
                  setServiceType(value as ServiceType);
                  if (value !== "form_filling") {
                    setFormServiceType("");
                    setApplicationId("");
                    setPassword("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="form_filling">Form Filling</SelectItem>
                  <SelectItem value="xerox">
                    Xerox / Printing / Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serviceType === "form_filling" && (
              <>
                <div className="space-y-2">
                  <Label>Form Service Type *</Label>
                  <Select
                    value={formServiceType}
                    onValueChange={(value) =>
                      setFormServiceType(value as FormServiceType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form service type" />
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application ID</Label>
                    <Input
                      id="applicationId"
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      placeholder="Enter application ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select
                value={paymentMode}
                onValueChange={(value) => setPaymentMode(value as PaymentMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Work Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.toUpperCase())}
                placeholder="ENTER WORK DESCRIPTION"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="appearance-none"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductionAmount">Deduction Amount (₹)</Label>
                <Input
                  id="deductionAmount"
                  type="number"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className="appearance-none"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Revenue (₹)</Label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center font-semibold text-primary">
                  ₹{revenue.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="gradient-primary text-primary-foreground"
          >
            Create Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewTask;
