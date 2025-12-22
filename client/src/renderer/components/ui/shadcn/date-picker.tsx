"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

interface DatePickerProps {
  label?: string;
  value?: string | Date;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  inputClassName = "",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const getDateValue = () => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const date = new Date(value);
      return isValidDate(date) ? date : undefined;
    }
    return undefined;
  };

  const [date, setDate] = React.useState<Date | undefined>(getDateValue());
  const [month, setMonth] = React.useState<Date | undefined>(getDateValue());
  const [inputValue, setInputValue] = React.useState(
    formatDate(getDateValue())
  );

  React.useEffect(() => {
    const newDate = getDateValue();
    setDate(newDate);
    setMonth(newDate);
    setInputValue(formatDate(newDate));
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setMonth(selectedDate);
    const formattedDate = formatDate(selectedDate);
    setInputValue(formattedDate);
    setOpen(false);

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const localDate = `${year}-${month}-${day}`;
      onChange(localDate);
    } else {
      onChange("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    if (inputVal && /^\d{4}-\d{2}-\d{2}$/.test(inputVal)) {
      const [year, month, day] = inputVal.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day);
      if (isValidDate(parsedDate)) {
        setDate(parsedDate);
        setMonth(parsedDate);
        onChange(inputVal);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          placeholder={placeholder}
          readOnly
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 ${inputClassName}`}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-md transition-colors duration-200"
            >
              <CalendarIcon className="size-4 text-gray-500" />
              <span className="sr-only">Select date</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0 border border-gray-200 shadow-xl rounded-lg bg-white"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <div className="p-3">
              <Calendar
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={handleDateSelect}
                className="rounded-lg border-0 bg-white"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Legacy export for backward compatibility
export function Calendar28() {
  const [date, setDate] = React.useState<string>("");

  return (
    <DatePicker
      label="Subscription Date"
      placeholder="June 01, 2025"
      value={date}
      onChange={setDate}
    />
  );
}
