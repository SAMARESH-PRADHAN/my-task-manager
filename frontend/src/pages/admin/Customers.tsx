import React, { useState, useMemo } from "react";
import { Download, Send } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import DateFilter from "@/components/layout/shared/DateFilter";
import Pagination from "@/components/layout/shared/Pagination";
import { toast } from "sonner";
import { downloadExcel } from "@/utils/excel";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { formatToIST } from "@/utils/dateUtils";

const ITEMS_PER_PAGE = 10;

type CustomerTab = "all" | "job_seeker" | "student" | "gov_scheme";

const Customers: React.FC = () => {
  const { customers, formFillingTasks } = useData();

  const [activeTab, setActiveTab] = useState<CustomerTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  // Notify modal
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");

  // Get unique customers from form filling tasks
  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map();

    formFillingTasks.forEach((task) => {
      if (!customerMap.has(task.customerId)) {
        customerMap.set(task.customerId, {
          id: task.customerId,
          name: task.customerName,
          email: task.customerEmail,
          phone: task.customerPhone,
          type: task.customerType,
          createdAt: task.createdAt,
        });
      }
    });

    return Array.from(customerMap.values());
  }, [formFillingTasks, customers]);

  const filteredCustomers = useMemo(() => {
    return uniqueCustomers.filter((customer) => {
      // Tab filter
      if (activeTab !== "all" && customer.type !== activeTab) return false;

      // Search filter
      const matchesSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Date filter
      if (fromDate && toDate) {
        const customerISTDate = formatToIST(
          new Date(customer.createdAt),
          "Asia/Kolkata"
        );

        const isInRange = isWithinInterval(customerISTDate, {
          start: startOfDay(fromDate),
          end: endOfDay(toDate),
        });
        if (!isInRange) return false;
      }

      return true;
    });
  }, [uniqueCustomers, activeTab, searchQuery, fromDate, toDate]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownload = () => {
    const data = filteredCustomers.map((customer, index) => ({
      "Serial No": index + 1,
      "Customer Name": customer.name,
      Contact: customer.phone,
      Email: customer.email,
      Type: customer.type.replace("_", " "),
      "Created Date": formatToIST(customer.createdAt, "dd/MM/yyyy HH:mm"),
    }));

    downloadExcel(data, `customers_${activeTab}`);
    toast.success("Customers exported successfully!");
  };

  const handleNotifyAll = async () => {
    if (!notifyMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      await api.post("/notifications", {
        message: notifyMessage,
        targetType: activeTab, // all | job_seeker | student | gov_scheme
      });

      toast.success("Notification sent successfully");
      setIsNotifyModalOpen(false);
      setNotifyMessage("");
    } catch (error) {
      console.error("Notification failed:", error);
      toast.error("Failed to send notification");
    }
  };

  const getTabLabel = (tab: CustomerTab) => {
    switch (tab) {
      case "all":
        return "All Customers";
      case "job_seeker":
        return "Job Seeker";
      case "student":
        return "Student";
      case "gov_scheme":
        return "Gov Scheme";
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">Manage your customer database</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex flex-wrap gap-2">
        {(["all", "job_seeker", "student", "gov_scheme"] as CustomerTab[]).map(
          (tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={
                activeTab === tab
                  ? "gradient-primary text-primary-foreground"
                  : ""
              }
            >
              {getTabLabel(tab)}
            </Button>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search customers..."
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
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
          <Button
            onClick={() => setIsNotifyModalOpen(true)}
            className="gradient-primary text-primary-foreground"
          >
            <Send className="h-4 w-4 mr-2" />
            Notify All
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {customer.name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{customer.phone}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </TableCell>
                      {/* !chages here */}

                      <TableCell className="capitalize">
                        {(customer.type ?? "unknown").replace("_", " ")}
                      </TableCell>
                      {/* ! to here  */}
                      <TableCell>
                        <div>
                          <p>{formatToIST(customer.createdAt, "dd/MM/yyyy")}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatToIST(customer.createdAt, "HH:mm")}
                          </p>
                        </div>
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

      {/* Notify Modal */}
      <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This message will be sent to <b>{filteredCustomers.length}</b>{" "}
              {getTabLabel(activeTab)} customers.
            </p>

            <Textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={4}
            />
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsNotifyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNotifyAll}
                className="gradient-primary text-primary-foreground"
              >
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
