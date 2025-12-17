import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Download } from 'lucide-react';
import { useData, FormFillingTask, XeroxTask } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DateFilter from '@/components/shared/DateFilter';
import Pagination from '@/components/shared/Pagination';
import { toast } from 'sonner';
import { downloadExcel } from '@/utils/excel';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const ITEMS_PER_PAGE = 10;

type TaskTab = 'form_filling' | 'xerox';
type StatusFilter = 'all' | 'pending' | 'completed';

const AllTasks: React.FC = () => {
  const {
    formFillingTasks,
    xeroxTasks,
    updateFormFillingTask,
    updateXeroxTask,
    deleteXeroxTask,
  } = useData();

  const [activeTab, setActiveTab] = useState<TaskTab>('form_filling');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFormTask, setEditingFormTask] = useState<FormFillingTask | null>(null);
  const [editingXeroxTask, setEditingXeroxTask] = useState<XeroxTask | null>(null);

  // Delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const filteredFormFillingTasks = useMemo(() => {
    return formFillingTasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.workStatus !== statusFilter) return false;

      // Search filter
      const matchesSearch =
        task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerPhone.includes(searchQuery);
      if (!matchesSearch) return false;

      // Date filter
      if (fromDate && toDate) {
        const isInRange = isWithinInterval(new Date(task.createdAt), {
          start: startOfDay(fromDate),
          end: endOfDay(toDate),
        });
        if (!isInRange) return false;
      }

      return true;
    });
  }, [formFillingTasks, statusFilter, searchQuery, fromDate, toDate]);

  const filteredXeroxTasks = useMemo(() => {
    return xeroxTasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'all' && task.paymentStatus !== statusFilter) return false;

      // Search filter
      const matchesSearch =
        task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerPhone.includes(searchQuery);
      if (!matchesSearch) return false;

      // Date filter
      if (fromDate && toDate) {
        const isInRange = isWithinInterval(new Date(task.createdAt), {
          start: startOfDay(fromDate),
          end: endOfDay(toDate),
        });
        if (!isInRange) return false;
      }

      return true;
    });
  }, [xeroxTasks, statusFilter, searchQuery, fromDate, toDate]);

  const currentTasks = activeTab === 'form_filling' ? filteredFormFillingTasks : filteredXeroxTasks;
  const totalPages = Math.ceil(currentTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = currentTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownload = () => {
    if (activeTab === 'form_filling') {
      const data = filteredFormFillingTasks.map((task, index) => ({
        'Serial No': index + 1,
        'Customer Name': task.customerName,
        'Phone': task.customerPhone,
        'Email': task.customerEmail,
        'Service Type': task.serviceType.replace('_', ' '),
        'Employee': task.employeeName,
        'Application ID': task.applicationId,
        'Password': task.password,
        'Total Amount': task.amount,
        'Deduction': task.deductionAmount || 0,
        'Revenue': task.revenue || task.amount,
        'Work Status': task.workStatus,
        'Payment Status': task.paymentStatus,
        'Description': task.description,
        'Date': format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm'),
      }));
      downloadExcel(data, 'form_filling_tasks');
    } else {
      const data = filteredXeroxTasks.map((task, index) => ({
        'Serial No': index + 1,
        'Customer Name': task.customerName,
        'Phone': task.customerPhone,
        'Email': task.customerEmail,
        'Total Amount': task.amount,
        'Deduction': task.deductionAmount || 0,
        'Revenue': task.revenue || task.amount,
        'Payment Status': task.paymentStatus,
        'Description': task.description,
        'Date': format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm'),
      }));
      downloadExcel(data, 'xerox_tasks');
    }
    toast.success('Tasks exported successfully!');
  };

  const handleFormTaskAmountChange = (field: 'amount' | 'deductionAmount', value: number) => {
    if (!editingFormTask) return;
    const newTask = { ...editingFormTask, [field]: value };
    newTask.revenue = newTask.amount - (newTask.deductionAmount || 0);
    setEditingFormTask(newTask);
  };

  const handleXeroxTaskAmountChange = (field: 'amount' | 'deductionAmount', value: number) => {
    if (!editingXeroxTask) return;
    const newTask = { ...editingXeroxTask, [field]: value };
    newTask.revenue = newTask.amount - (newTask.deductionAmount || 0);
    setEditingXeroxTask(newTask);
  };

  const handleEditFormTask = () => {
    if (!editingFormTask) return;
    updateFormFillingTask(editingFormTask.id, editingFormTask);
    toast.success('Task updated successfully!');
    setIsEditModalOpen(false);
    setEditingFormTask(null);
  };

  const handleEditXeroxTask = () => {
    if (!editingXeroxTask) return;
    updateXeroxTask(editingXeroxTask.id, editingXeroxTask);
    toast.success('Task updated successfully!');
    setIsEditModalOpen(false);
    setEditingXeroxTask(null);
  };

  const handleDeleteTask = () => {
    if (!deletingTaskId) return;
    deleteXeroxTask(deletingTaskId);
    toast.success('Task deleted successfully!');
    setIsDeleteDialogOpen(false);
    setDeletingTaskId(null);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">All Tasks</h1>
        <p className="text-muted-foreground">View and manage all tasks</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'form_filling' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('form_filling');
            setCurrentPage(1);
            setStatusFilter('all');
          }}
          className={activeTab === 'form_filling' ? 'gradient-primary text-primary-foreground' : ''}
        >
          Form Filling
        </Button>
        <Button
          variant={activeTab === 'xerox' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('xerox');
            setCurrentPage(1);
            setStatusFilter('all');
          }}
          className={activeTab === 'xerox' ? 'gradient-primary text-primary-foreground' : ''}
        >
          Xerox/Printing/Passport Photo/Other Service
        </Button>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'pending', 'completed'] as StatusFilter[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className="capitalize"
          >
            {status === 'all' ? 'All Status' : status}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-64"
          />
          <DateFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        </div>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Excel
        </Button>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === 'form_filling' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Work Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paginatedTasks as FormFillingTask[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTasks as FormFillingTask[]).map((task, index) => (
                      <TableRow key={task.id}>
                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{task.customerName}</p>
                            <p className="text-sm text-muted-foreground">{task.customerPhone}</p>
                            <p className="text-sm text-muted-foreground">{task.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{task.serviceType.replace('_', ' ')}</TableCell>
                        <TableCell>{task.employeeName}</TableCell>
                        <TableCell>{task.applicationId || '-'}</TableCell>
                        <TableCell>{task.password || '-'}</TableCell>
                        <TableCell>₹{task.amount}</TableCell>
                        <TableCell>₹{task.deductionAmount || 0}</TableCell>
                        <TableCell className="font-semibold text-primary">₹{task.revenue || task.amount}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              task.workStatus === 'completed'
                                ? 'bg-success/20 text-success'
                                : 'bg-warning/20 text-warning'
                            }`}
                          >
                            {task.workStatus}
                          </span>
                        </TableCell>
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
                        <TableCell className="max-w-[150px] truncate">{task.description || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p>{format(new Date(task.createdAt), 'dd/MM/yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(task.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingFormTask(task);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Customer Details</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paginatedTasks as XeroxTask[]).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No tasks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (paginatedTasks as XeroxTask[]).map((task, index) => (
                      <TableRow key={task.id}>
                        <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{task.customerName}</p>
                            <p className="text-sm text-muted-foreground">{task.customerPhone}</p>
                            <p className="text-sm text-muted-foreground">{task.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>₹{task.amount}</TableCell>
                        <TableCell>₹{task.deductionAmount || 0}</TableCell>
                        <TableCell className="font-semibold text-primary">₹{task.revenue || task.amount}</TableCell>
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
                        <TableCell className="max-w-[200px] truncate">{task.description || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p>{format(new Date(task.createdAt), 'dd/MM/yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(task.createdAt), 'HH:mm')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingXeroxTask(task);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingTaskId(task.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Edit Form Task Modal */}
      <Dialog
        open={isEditModalOpen && editingFormTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            setEditingFormTask(null);
          }
        }}
      >
        <DialogContent className="bg-card border border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form Filling Task</DialogTitle>
          </DialogHeader>
          {editingFormTask && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editingFormTask.customerName}
                    onChange={(e) =>
                      setEditingFormTask({ ...editingFormTask, customerName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingFormTask.customerPhone}
                    onChange={(e) =>
                      setEditingFormTask({ ...editingFormTask, customerPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Application ID</Label>
                  <Input
                    value={editingFormTask.applicationId}
                    onChange={(e) =>
                      setEditingFormTask({ ...editingFormTask, applicationId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    value={editingFormTask.password}
                    onChange={(e) =>
                      setEditingFormTask({ ...editingFormTask, password: e.target.value })
                    }
                  />
                </div>
              </div>
              
              {/* Amount Section with Revenue */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editingFormTask.amount}
                    onChange={(e) => handleFormTaskAmountChange('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deduction Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editingFormTask.deductionAmount || 0}
                    onChange={(e) => handleFormTaskAmountChange('deductionAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue (₹)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center font-semibold text-primary">
                    ₹{(editingFormTask.revenue || editingFormTask.amount).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Work Status</Label>
                  <Select
                    value={editingFormTask.workStatus}
                    onValueChange={(value) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        workStatus: value as 'pending' | 'completed',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={editingFormTask.paymentStatus}
                    onValueChange={(value) =>
                      setEditingFormTask({
                        ...editingFormTask,
                        paymentStatus: value as 'pending' | 'completed',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingFormTask.description}
                  onChange={(e) =>
                    setEditingFormTask({ ...editingFormTask, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingFormTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditFormTask} className="gradient-primary text-primary-foreground">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Xerox Task Modal */}
      <Dialog
        open={isEditModalOpen && editingXeroxTask !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false);
            setEditingXeroxTask(null);
          }
        }}
      >
        <DialogContent className="bg-card border border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Xerox Task</DialogTitle>
          </DialogHeader>
          {editingXeroxTask && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editingXeroxTask.customerName}
                    onChange={(e) =>
                      setEditingXeroxTask({ ...editingXeroxTask, customerName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={editingXeroxTask.customerPhone}
                    onChange={(e) =>
                      setEditingXeroxTask({ ...editingXeroxTask, customerPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Amount Section with Revenue */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editingXeroxTask.amount}
                    onChange={(e) => handleXeroxTaskAmountChange('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deduction Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editingXeroxTask.deductionAmount || 0}
                    onChange={(e) => handleXeroxTaskAmountChange('deductionAmount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Revenue (₹)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center font-semibold text-primary">
                    ₹{(editingXeroxTask.revenue || editingXeroxTask.amount).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={editingXeroxTask.paymentStatus}
                  onValueChange={(value) =>
                    setEditingXeroxTask({
                      ...editingXeroxTask,
                      paymentStatus: value as 'pending' | 'completed',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingXeroxTask.description}
                  onChange={(e) =>
                    setEditingXeroxTask({ ...editingXeroxTask, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingXeroxTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditXeroxTask} className="gradient-primary text-primary-foreground">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllTasks;
