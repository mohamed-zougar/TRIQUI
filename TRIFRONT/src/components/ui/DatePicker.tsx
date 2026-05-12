"use client";

import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  X 
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore, 
  startOfToday 
} from "date-fns";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

interface DatePickerProps {
  value?: string; // ISO string or YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
}

export function DatePicker({ value, onChange, label, placeholder = "Select a date", minDate = startOfToday() }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  
  const selectedDate = value ? new Date(value) : null;

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let day = startDate;

    while (day <= endDate) {
      rows.push(day);
      day = addDays(day, 1);
    }
    return rows;
  }, [currentMonth]);

  const handleDateClick = (date: Date) => {
    if (minDate && isBefore(date, minDate) && !isSameDay(date, minDate)) return;
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 text-sm transition-colors text-left",
            isOpen ? "border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)]" : "border-[var(--color-border)]",
            !value && "text-[var(--color-fg-subtle)]"
          )}
        >
          <CalendarIcon size={16} className="text-[var(--color-fg-muted)]" />
          <span className="flex-1 truncate">
            {value ? format(new Date(value), "PPP") : placeholder}
          </span>
          {value && (
            <X 
              size={14} 
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          )}
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/5 sm:hidden" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute left-0 mt-2 z-50 w-[300px] rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-fg-primary)]">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] text-[var(--color-fg-secondary)]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] text-[var(--color-fg-secondary)]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-[var(--color-fg-muted)] py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isPast = minDate && isBefore(day, minDate) && !isSameDay(day, minDate);

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        "h-9 w-9 rounded-xl text-sm transition-all flex items-center justify-center relative",
                        !isCurrentMonth && "text-[var(--color-fg-muted)] opacity-30",
                        isToday && !isSelected && "text-[var(--color-brand-600)] font-bold",
                        isSelected && "bg-[var(--color-brand-600)] text-white shadow-md shadow-[var(--color-brand-100)] transform scale-110 z-10",
                        !isSelected && !isPast && "hover:bg-[var(--color-brand-50)] hover:text-[var(--color-brand-700)]",
                        isPast && "text-[var(--color-fg-muted)] cursor-not-allowed opacity-20"
                      )}
                    >
                      {format(day, "d")}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-brand-600)]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onChange(format(new Date(), "yyyy-MM-dd"));
                    setIsOpen(false);
                  }}
                  className="text-xs font-semibold text-[var(--color-brand-600)] hover:underline"
                >
                  Select Today
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
