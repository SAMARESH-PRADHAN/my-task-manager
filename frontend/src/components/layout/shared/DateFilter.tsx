import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
// import React, { useState } from "react";

interface DateFilterProps {
  fromDate: Date | undefined;
  toDate: Date | undefined;
  onFromDateChange: (date: Date | undefined) => void;
  onToDateChange: (date: Date | undefined) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}) => {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !fromDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fromDate ? format(fromDate, "dd/MM/yyyy") : "From Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-popover border border-border z-50"
          align="start"
        >
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={(date) => {
              onFromDateChange(date);
              setFromOpen(false); // ✅ CLOSE AFTER SELECT
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">to</span>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !toDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {toDate ? format(toDate, "dd/MM/yyyy") : "To Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-popover border border-border z-50"
          align="start"
        >
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={(date) => {
              onToDateChange(date);
              setToOpen(false); // ✅ CLOSE AFTER SELECT
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateFilter;
