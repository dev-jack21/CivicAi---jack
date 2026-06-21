'use client';

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
  containerClassName?: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  /** react-hook-form register onChange – converted internally */
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
}

export default function Select({
  id,
  label,
  error,
  options,
  placeholder,
  size = 'md',
  containerClassName = '',
  className = '',
  value,
  onValueChange,
  defaultValue,
  disabled,
  required,
  name,
  onChange,
  onBlur,
}: SelectProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-1.5 text-sm pr-8' : 'px-3 py-2 text-sm pr-10';
  const triggerHeight = size === 'sm' ? 'h-8' : 'h-10';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const itemPadding = size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2';

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    if (onChange) {
      const syntheticEvent = {
        target: { value: newValue, name: name || id || '' },
        currentTarget: { value: newValue, name: name || id || '' },
        type: 'change',
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={`relative ${containerClassName}`}>
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

      <SelectPrimitive.Root
        value={value}
        onValueChange={handleValueChange}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        name={name}
        onOpenChange={() => onBlur?.()}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            'w-full inline-flex items-center justify-between rounded-md border shadow-sm',
            'bg-surface text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'data-[placeholder]:text-text-muted',
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-border-custom hover:border-primary/40',
            triggerHeight,
            sizeClass,
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon
            className={cn(
              'pointer-events-none flex items-center text-text-secondary ml-2',
              iconSize
            )}
          >
            <ChevronDown aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            sideOffset={4}
            position="popper"
            className={cn(
              'relative z-50 min-w-[var(--radix-select-trigger-width)] max-h-96 overflow-auto rounded-md border border-border-custom bg-surface shadow-lg',
              'focus:outline-none'
            )}
          >
            <SelectPrimitive.Viewport className={cn('p-1', 'text-sm')}>
              {placeholder && (
                <SelectPrimitive.Item value="" disabled>
                  <SelectPrimitive.ItemText className="text-text-muted">
                    {placeholder}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              )}
              <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-border-custom" />
              <SelectPrimitive.Group>
                {options.map((opt) => (
                  <SelectPrimitive.Item
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center rounded-sm',
                      itemPadding,
                      'outline-none',
                      'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
                      'data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary',
                      'data-[state=checked]:bg-primary/10'
                    )}
                  >
                    <SelectPrimitive.ItemIndicator
                      className={cn('pointer-events-none flex items-center mr-2', iconSize)}
                    >
                      <Check className="text-primary" aria-hidden="true" />
                    </SelectPrimitive.ItemIndicator>
                    <SelectPrimitive.ItemText className="truncate">
                      {opt.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
