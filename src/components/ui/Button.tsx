'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, children, className, ...props },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center font-medium rounded-md',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transition-colors duration-150',
    ];

    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-dark border border-transparent',
      secondary: 'bg-bg-base text-text-primary hover:bg-zinc-100 border border-border-custom',
      outline: 'bg-transparent text-primary hover:bg-primary/5 border border-primary',
      ghost:
        'bg-transparent text-text-secondary hover:bg-zinc-100 hover:text-text-primary border border-transparent',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px] gap-1.5',
      md: 'px-4 py-2.5 text-sm min-h-11 gap-2',
      lg: 'px-6 py-3 text-base min-h-12 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
