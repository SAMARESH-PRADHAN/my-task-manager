import React, { useState } from 'react';
import { Plus, MoreVertical, Edit, Eye, Download, FileText, Clock, IndianRupee } from 'lucide-react';
import { useData, Employee, FormFillingTask, XeroxTask } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DateFilter from '@/components/shared/DateFilter';
import Pagination from '@/components/shared/Pagination';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { downloadExcel } from '@/utils/excel';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const ITEMS_PER_PAGE = 6;

const Employees: React.FC = () => {
  const { employees, formFillingTasks, xeroxTasks, addEmployee, updateEmployee } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Add employee modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });

  // Edit employee modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // View tasks modal
  const [isViewTasksModalOpen, setIsViewTasksModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [taskFromDate, setTaskFromDate] = useState<Date | undefined>();
  const [taskToDate, setTaskToDate] = useState<Date | undefined>();
  const [taskServiceType, setTaskServiceType] = useState<'all' | 'form_filling' | 'xerox'>('all');
  const [taskPage, setTaskPage] = useState(1);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Get employee stats
  const getEmployeeStats = (employeeId: string) => {
    const empFormFilling = formFillingTasks.filter((t) => t.employeeId === employeeId);
    const empXerox = xeroxTasks.filter((t) => t.employeeId === employeeId);
    
    const totalTasks = empFormFilling.length + empXerox.length;
    const pendingTasks = empFormFilling.filter((t) => t.workStatus === 'pending' || t.paymentStatus === 'pending').length 
      + empXerox.filter((t) => t.paymentStatus === 'pending').length;
    const totalRevenue = empFormFilling.reduce((sum, t) => sum + t.amount, 0) 
      + empXerox.reduce((sum, t) => sum + t.amount, 0);

    return { totalTasks, pendingTasks, totalRevenue };
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.phone || !newEmployee.password) {
      toast.error('Please fill all required fields');
      return;
    }

    addEmployee(newEmployee);
    toast.success('Employee added successfully!');
    setIsAddModalOpen(false);
    setNewEmployee({ name: '', email: '', phone: '', address: '', password: '' });
  };

  const handleEditEmployee = () => {
    if (!editingEmployee) return;

    updateEmployee(editingEmployee.id, {
      name: editingEmployee.name,
      email: editingEmployee.email,
      phone: editingEmployee.phone,
      address: editingEmployee.address,
      password: editingEmployee.password,
    });
    toast.success('Employee updated successfully!');
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const getEmployeeTasks = (employeeId: string) => {
    let formFilling = formFillingTasks.filter((t) => t.employeeId === employeeId);
    let xerox = xeroxTasks.filter((t) => t.employeeId === employeeId);

    // Apply date filter
    if (taskFromDate && taskToDate) {
      formFilling = formFilling.filter((t) =>
        isWithinInterval(new Date(t.createdAt), {
          start: startOfDay(taskFromDate),
          end: endOfDay(taskToDate),
        })
      );
      xerox = xerox.filter((t) =>
        isWithinInterval(new Date(t.createdAt), {
          start: startOfDay(taskFromDate),
          end: endOfDay(taskToDate),
        })
      );
    }

    if (taskServiceType === 'form_filling') return { formFilling, xerox: [] };
    if (taskServiceType === 'xerox') return { formFilling: [], xerox };
    return { formFilling, xerox };
  };

  const handleDownloadTasks = () => {
    if (!viewingEmployee) return;

    const tasks = getEmployeeTasks(viewingEmployee.id);
    const allTasks = [
      ...tasks.formFilling.map((t) => ({
        'Serial No': t.id,
        'Customer Name': t.customerName,
        'Phone': t.customerPhone,
        'Service Type': t.serviceType,
        'Amount': t.amount,
        'Work Status': t.workStatus,
        'Payment Status': t.paymentStatus,
        'Date': format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
      })),
      ...tasks.xerox.map((t) => ({
        'Serial No': t.id,
        'Customer Name': t.customerName,
        'Phone': t.customerPhone,
        'Service Type': 'Xerox/Other',
        'Amount': t.amount,
        'Work Status': 'N/A',
        'Payment Status': t.paymentStatus,
        'Date': format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
      })),
    ];

    downloadExcel(allTasks, `${viewingEmployee.name}_tasks`);
    toast.success('Tasks exported successfully!');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gradient-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Input
        placeholder="Search employees..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="max-w-sm"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedEmployees.map((employee) => {
          const stats = getEmployeeStats(employee.id);
          return (
            <Card key={employee.id} className="shadow-card animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                      <p className="text-sm text-muted-foreground">{employee.phone}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover border border-border z-50" align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingEmployee(employee);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setViewingEmployee(employee);
                          setIsViewTasksModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Tasks
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Employee Stats */}
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <FileText className="h-4 w-4 text-primary mb-1" />
                    <span className="text-lg font-bold text-foreground">{stats.totalTasks}</span>
                    <span className="text-xs text-muted-foreground">Total Tasks</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-warning mb-1" />
                    <span className="text-lg font-bold text-foreground">{stats.pendingTasks}</span>
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                    <IndianRupee className="h-4 w-4 text-success mb-1" />
                    <span className="text-lg font-bold text-foreground">₹{stats.totalRevenue}</span>
                    <span className="text-xs text-muted-foreground">Revenue</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">{employee.address}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newEmployee.address}
                onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} className="gradient-primary text-primary-foreground">
                Add Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={editingEmployee.phone}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={editingEmployee.address}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={editingEmployee.password}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, password: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditEmployee} className="gradient-primary text-primary-foreground">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Tasks Modal */}
      <Dialog open={isViewTasksModalOpen} onOpenChange={setIsViewTasksModalOpen}>
        <DialogContent className="bg-card border border-border max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingEmployee?.name}'s Tasks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <DateFilter
                fromDate={taskFromDate}
                toDate={taskToDate}
                onFromDateChange={setTaskFromDate}
                onToDateChange={setTaskToDate}
              />
              <Select
                value={taskServiceType}
                onValueChange={(value) => setTaskServiceType(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="form_filling">Form Filling</SelectItem>
                  <SelectItem value="xerox">Xerox/Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownloadTasks} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            </div>

            {viewingEmployee && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const tasks = getEmployeeTasks(viewingEmployee.id);
                      const allTasks = [
                        ...tasks.formFilling.map((t) => ({ ...t, type: 'form_filling' as const })),
                        ...tasks.xerox.map((t) => ({ ...t, type: 'xerox' as const })),
                      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                      if (allTasks.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No tasks found
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return allTasks.map((task, index) => (
                        <TableRow key={task.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{task.customerName}</TableCell>
                          <TableCell className="capitalize">
                            {task.type === 'form_filling'
                              ? (task as FormFillingTask).serviceType.replace('_', ' ')
                              : 'Xerox/Other'}
                          </TableCell>
                          <TableCell>₹{task.amount}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                task.paymentStatus === 'completed'
                                  ? 'bg-success/20 text-success'
                                  : 'bg-warning/20 text-warning'
                              }`}
                            >
                              {task.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;