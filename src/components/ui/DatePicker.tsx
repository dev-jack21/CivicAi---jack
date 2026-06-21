'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { format, isValid, isBefore, startOfDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  id?: string;
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  /** Show a warning when the selected date is in the past. Does not block selection. */
  warnIfPast?: boolean;
}

export default function DatePicker({
  id,
  label,
  error,
  value,
  onChange,
  disabled,
  required,
  placeholder = 'Select date...',
  className,
  warnIfPast,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDate = value && value.length > 0 ? new Date(value + 'T00:00:00') : undefined;
  const displayText =
    selectedDate && isValid(selectedDate) ? format(selectedDate, 'MMM d, yyyy') : '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPastDate = useMemo(() => {
    if (!value || !warnIfPast) return false;
    const date = new Date(value + 'T00:00:00');
    return isValid(date) && isBefore(startOfDay(date), startOfDay(new Date()));
  }, [value, warnIfPast]);

  const handleDaySelect = useCallback(
    (day: Date | undefined) => {
      if (day && isValid(day)) {
        onChange?.(format(day, 'yyyy-MM-dd'));
      }
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div className="relative" ref={popoverRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <button
        id={id}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-full inline-flex items-center justify-between rounded-md border bg-surface text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'px-3 py-2.5 text-sm',
          error
            ? 'border-red-400 focus:ring-red-500'
            : 'border-border-custom hover:border-primary/40',
          !displayText && 'text-text-muted',
          className
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{displayText || placeholder}</span>
        <div className="flex items-center gap-1 ml-2">
          <CalendarIcon
            className="w-4 h-4 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-surface border border-border-custom rounded-md shadow-lg">
          <DayPicker
            mode="single"
            selected={selectedDate && isValid(selectedDate) ? selectedDate : undefined}
            onSelect={handleDaySelect}
            defaultMonth={selectedDate && isValid(selectedDate) ? selectedDate : undefined}
            disabled={disabled}
            classNames={{
              root: 'p-3',
              chevron: 'w-4 h-4',
              caption_label: 'text-sm font-medium text-text-primary',
              month_grid: 'w-full border-collapse',
              weekday: 'text-xs font-medium text-text-muted pb-2 pt-1 w-10 h-8 text-center',
              day: 'w-10 h-10 text-sm text-text-primary rounded-md hover:bg-bg-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
              day_button: 'w-full h-full flex items-center justify-center',
              nav: 'flex items-center gap-1',
              button_previous:
                'inline-flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:bg-bg-base transition-colors',
              button_next:
                'inline-flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:bg-bg-base transition-colors',
              month: '',
              months: '',
              month_caption: 'flex items-center justify-between mb-2 px-1',
              selected: 'bg-primary text-white hover:bg-primary-dark !important rounded-md',
              today: 'font-semibold text-primary',
              outside: 'text-text-muted opacity-50',
              disabled: 'opacity-30 cursor-not-allowed hover:bg-transparent',
              range_start: 'bg-primary text-white rounded-l-md',
              range_end: 'bg-primary text-white rounded-r-md',
              range_middle: 'bg-primary/10 text-text-primary',
              hidden: 'hidden',
              focused: '',
              weeks: '',
              week: '',
              weekdays: '',
              week_number: '',
              week_number_header: '',
              dropdowns: '',
              dropdown: '',
              dropdown_root: '',
              footer: '',
              months_dropdown: '',
              years_dropdown: '',
              weeks_before_enter: '',
              weeks_before_exit: '',
              weeks_after_enter: '',
              weeks_after_exit: '',
              caption_after_enter: '',
              caption_after_exit: '',
              caption_before_enter: '',
              caption_before_exit: '',
            }}
          />
        </div>
      )}

      {isPastDate && !error && (
        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1.5" role="status">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          This date is in the past. Please confirm it is correct.
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-xs text-red-600 flex items-center gap-1.5"
          role="alert"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
