
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function TimePicker({ date, onDateChange }: TimePickerProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(":").map(Number);
    
    if (date && !isNaN(hours) && !isNaN(minutes)) {
      const newDate = new Date(date);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      onDateChange(newDate);
    } else {
        // Handle case where date is not set yet
        const newDate = new Date();
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        onDateChange(newDate)
    }
  };

  return (
    <Input
      type="time"
      value={date ? format(date, "HH:mm") : ""}
      onChange={handleTimeChange}
      className="w-full"
    />
  );
}
