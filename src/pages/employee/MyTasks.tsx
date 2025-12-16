import React, { useState, useMemo } from 'react';
import { Edit, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, FormFillingTask, XeroxTask } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Pagination from '@/components/shared/Pagination';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const { getEmployeeTasks, updateFormFillingTask, updateXeroxTask } = useData();
  
  const [activeTab, setActiveTab] = useState<'form_filling' | 'xerox'>('form_filling');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FormFillingTask | XeroxTask | null>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    description: '',
    amount: 0,
    paymentMode: 'cash' as 'cash' | 'upi' | 'card',
    paymentStatus: 'pending' as 'pending' | 'completed',
    // Form filling specific
    serviceType: 'job_seeker' as 'job_seeker' | 'student' | 'gov_scheme',
    applicationId: '',
    password: '',
  });

  // Screenshot upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingTask, setUploadingTask] = useState<FormFillingTask | null>(null);

  const employeeTasks = user ? getEmployeeTasks(user.id) : { formFilling: [], xerox: [] };

  const filteredTasks = useMemo(() => {
    const tasks = activeTab === 'form_filling' ? employeeTasks.formFilling : employeeTasks.xerox;
    
    return tasks.filter((task) => {
      const matchesSearch =
        task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customerPhone.includes(searchQuery);

      const status = activeTab === 'form_filling' 
        ? (task as FormFillingTask).workStatus 
        : (task as XeroxTask).paymentStatus;
      
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeTab, employeeTasks, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEditClick = (task: FormFillingTask | XeroxTask) => {
    setEditingTask(task);
    setEditFormData({
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      customerEmail: task.customerEmail,
      description: task.description,
      amount: task.amount,
      paymentMode: task.paymentMode,
      paymentStatus: task.paymentStatus,
      serviceType: activeTab === 'form_filling' ? (task as FormFillingTask).serviceType : 'job_seeker',
      applicationId: activeTab === 'form_filling' ? (task as FormFillingTask).applicationId : '',
      password: activeTab === 'form_filling' ? (task as FormFillingTask).password : '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    if (activeTab === 'form_filling') {
      updateFormFillingTask(editingTask.id, {
        customerName: editFormData.customerName,
        customerPhone: editFormData.customerPhone,
        customerEmail: editFormData.customerEmail,
        description: editFormData.description,
        amount: editFormData.amount,
        paymentMode: editFormData.paymentMode,
        paymentStatus: editFormData.paymentStatus,
        serviceType: editFormData.serviceType,
        applicationId: editFormData.applicationId,
        password: editFormData.password,
      });
    } else {
      updateXeroxTask(editingTask.id, {
        customerName: editFormData.customerName,
        customerPhone: editFormData.customerPhone,
        customerEmail: editFormData.customerEmail,
        description: editFormData.description,
        amount: editFormData.amount,
        paymentMode: editFormData.paymentMode,
        paymentStatus: editFormData.paymentStatus,
      });
    }

    toast.success('Task updated successfully!');
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleUploadClick = (task: FormFillingTask) => {
    setUploadingTask(task);
    setIsUploadModalOpen(true);
  };

  const handleUploadScreenshot = () => {
    if (!uploadingTask) return;

    updateFormFillingTask(uploadingTask.id, {
      workStatus: 'completed',
      screenshotUrl: 'uploaded',
    });

    toast.success('Screenshot uploaded! Work status updated to completed.');
    setIsUploadModalOpen(false);
    setUploadingTask(null);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
        <p className="text-muted-foreground">View and manage your assigned tasks</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'form_filling' ? 'default' : 'outline'}
          onClick={() => {
            setActiveTab('form_filling');
            setCurrentPage(1);
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
          }}
          className={activeTab === 'xerox' ? 'gradient-primary text-primary-foreground' : ''}
        >
          Xerox/Printing/Passport Photo/Other Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by customer name or phone..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as 'all' | 'pending' | 'completed');
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border z-50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Customer Details</TableHead>
                  {activeTab === 'form_filling' && (
                    <>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Application No.</TableHead>
                      <TableHead>Password</TableHead>
                    </>
                  )}
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  {activeTab === 'form_filling' && <TableHead>Work Status</TableHead>}
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={activeTab === 'form_filling' ? 11 : 8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((task, index) => (
                    <TableRow key={task.id}>
                      <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{task.customerName}</p>
                          <p className="text-sm text-muted-foreground">{task.customerPhone}</p>
                          <p className="text-sm text-muted-foreground">{task.customerEmail}</p>
                        </div>
                      </TableCell>
                      {activeTab === 'form_filling' && (
                        <>
                          <TableCell className="capitalize">
                            {(task as FormFillingTask).serviceType.replace('_', ' ')}
                          </TableCell>
                          <TableCell>{(task as FormFillingTask).applicationId}</TableCell>
                          <TableCell>{(task as FormFillingTask).password}</TableCell>
                        </>
                      )}
                      <TableCell>₹{task.amount}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{task.description}</TableCell>
                      {activeTab === 'form_filling' && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={
                              (task as FormFillingTask).workStatus === 'completed'
                                ? 'bg-success/20 text-success hover:bg-success/30'
                                : 'bg-warning/20 text-warning hover:bg-warning/30'
                            }
                            onClick={() => {
                              if ((task as FormFillingTask).workStatus === 'pending') {
                                handleUploadClick(task as FormFillingTask);
                              }
                            }}
                          >
                            {(task as FormFillingTask).workStatus === 'pending' && (
                              <Upload className="h-4 w-4 mr-1" />
                            )}
                            {(task as FormFillingTask).workStatus}
                          </Button>
                        </TableCell>
                      )}
                      <TableCell className="capitalize">{task.paymentMode}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.paymentStatus === 'completed'
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {task.paymentStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Edit Modal - Full Edit */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editFormData.customerEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {activeTab === 'form_filling' && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select
                      value={editFormData.serviceType}
                      onValueChange={(value) => setEditFormData({ ...editFormData, serviceType: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border z-50">
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="gov_scheme">Gov Scheme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Application ID</Label>
                    <Input
                      value={editFormData.applicationId}
                      onChange={(e) => setEditFormData({ ...editFormData, applicationId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select
                    value={editFormData.paymentMode}
                    onValueChange={(value) => setEditFormData({ ...editFormData, paymentMode: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={editFormData.paymentStatus}
                    onValueChange={(value) => setEditFormData({ ...editFormData, paymentStatus: value as any })}
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

              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTask} className="gradient-primary text-primary-foreground">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Screenshot Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Upload Screenshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Upload a screenshot to mark this task as completed.
            </p>
            <Input type="file" accept="image/*" />
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadScreenshot} className="gradient-primary text-primary-foreground">
                Upload & Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTasks;