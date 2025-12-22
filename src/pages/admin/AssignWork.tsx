import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type ServiceType = 'form_filling' | 'xerox';
type FormServiceType = 'job_seeker' | 'student' | 'gov_scheme';
type PaymentMode = 'cash' | 'upi' | 'card';

const AssignWork: React.FC = () => {
  const navigate = useNavigate();
  const { employees, addCustomer, addFormFillingTask, addXeroxTask } = useData();

  // Employee selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Service selection
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [formServiceType, setFormServiceType] = useState<FormServiceType | ''>('');

  // Form filling specific (optional)
  const [applicationId, setApplicationId] = useState('');
  const [password, setPassword] = useState('');

  // Common fields
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode | ''>('');

  // Calculate revenue
  const revenue = useMemo(() => {
    const totalAmount = parseFloat(amount) || 0;
    const deduction = parseFloat(deductionAmount) || 0;
    return totalAmount - deduction;
  }, [amount, deductionAmount]);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory fields: Customer Name, Phone Number, Service Type, Employee
    if (!customerName || !customerPhone || !serviceType || !selectedEmployeeId) {
      toast.error('Please fill all required fields (Customer Name, Phone, Service Type, Employee)');
      return;
    }

    if (serviceType === 'form_filling' && !formServiceType) {
      toast.error('Please select form service type');
      return;
    }

    // Create or find customer
    const customerType = formServiceType || 'job_seeker';
    const customer = addCustomer({
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      type: customerType,
    });

    const totalAmount = parseFloat(amount) || 0;
    const deduction = parseFloat(deductionAmount) || 0;
    const calculatedRevenue = totalAmount - deduction;

    if (serviceType === 'form_filling') {
      addFormFillingTask({
        customerId: customer.id,
        customerName,
        customerEmail,
        customerPhone,
        customerType,
        serviceType: formServiceType as FormServiceType,
        applicationId,
        password,
        amount: totalAmount,
        deductionAmount: deduction,
        revenue: calculatedRevenue,
        description,
        paymentMode: paymentMode as PaymentMode | '',
        workStatus: 'pending',
        paymentStatus: 'pending',
        employeeId: selectedEmployeeId,
        employeeName: selectedEmployee?.name || '',
      });
    } else {
      addXeroxTask({
        customerId: customer.id,
        customerName,
        customerEmail,
        customerPhone,
        amount: totalAmount,
        deductionAmount: deduction,
        revenue: calculatedRevenue,
        description,
        paymentMode: paymentMode as PaymentMode | '',
        paymentStatus: 'pending',
        employeeId: selectedEmployeeId,
        employeeName: selectedEmployee?.name || '',
      });
    }

    toast.success(`Task assigned to ${selectedEmployee?.name} successfully!`);
    navigate('/admin/all-tasks');
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Assign Work</h1>
        <p className="text-muted-foreground">Assign a task to an employee</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Select Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Assign To Employee *</Label>
              <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
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
                onChange={(e) => setCustomerEmail(e.target.value)}
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
                  if (value !== 'form_filling') {
                    setFormServiceType('');
                    setApplicationId('');
                    setPassword('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="form_filling">Form Filling</SelectItem>
                  <SelectItem value="xerox">Xerox/Printing/Passport Photo/Other Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serviceType === 'form_filling' && (
              <>
                <div className="space-y-2">
                  <Label>Form Service Type *</Label>
                  <Select
                    value={formServiceType}
                    onValueChange={(value) => setFormServiceType(value as FormServiceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form service type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="job_seeker">Job Seeker</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="gov_scheme">Government Scheme</SelectItem>
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
                      placeholder="Enter application ID (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (optional)"
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
                  <SelectValue placeholder="Select payment mode (optional)" />
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
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter work description (optional)"
                rows={3}
              />
            </div>

            {/* Amount Section */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter total amount"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductionAmount">Deduction Amount (₹)</Label>
                <Input
                  id="deductionAmount"
                  type="number"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  placeholder="Enter deduction"
                  min="0"
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

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" className="gradient-primary text-primary-foreground">
            Assign Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AssignWork;
