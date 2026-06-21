'use client';

import { useState, useCallback, useRef } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: 'delete' | 'logout' | 'warning';
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  icon: 'delete' | 'logout' | 'warning';
}

const iconMap = {
  delete: Trash2,
  logout: LogOut,
  warning: AlertTriangle,
};

const iconBgMap = {
  delete: 'bg-red-100',
  logout: 'bg-amber-100',
  warning: 'bg-amber-100',
};

const iconColorMap = {
  delete: 'text-red-600',
  logout: 'text-amber-600',
  warning: 'text-amber-600',
};

const confirmBtnMap: Record<string, string> = {
  delete:
    'inline-flex items-center justify-center min-h-11 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer',
  logout:
    'inline-flex items-center justify-center min-h-11 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer',
  warning:
    'inline-flex items-center justify-center min-h-11 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer',
};

export function useConfirm() {
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ConfirmState>({
    title: 'Confirm',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    destructive: false,
    icon: 'warning',
  });

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        title: opts.title ?? 'Confirm',
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        destructive: opts.destructive ?? false,
        icon: opts.icon ?? 'warning',
      });
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setOpen(false);
  }, []);

  const Icon = iconMap[state.icon];

  const ConfirmModal = (
    <AlertDialog.Root
      open={open}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/40 transition-opacity duration-150',
            open ? 'opacity-100' : 'opacity-0'
          )}
        />
        <AlertDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[90vw] max-w-md rounded-xl bg-surface p-6 shadow-xl',
            'focus:outline-none',
            'transition-all duration-150',
            open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
        >
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full mb-4',
                iconBgMap[state.icon]
              )}
            >
              <Icon className={cn('w-5 h-5', iconColorMap[state.icon])} aria-hidden="true" />
            </div>

            <AlertDialog.Title className="text-lg font-semibold text-text-primary mb-2">
              {state.title}
            </AlertDialog.Title>

            <AlertDialog.Description className="text-sm text-text-secondary mb-6 leading-relaxed">
              {state.message}
            </AlertDialog.Description>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center min-h-11 px-4 py-2 border border-border-custom text-text-secondary hover:bg-bg-base rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
              >
                {state.cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button type="button" onClick={handleConfirm} className={confirmBtnMap[state.icon]}>
                {state.confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return { confirm, ConfirmModal };
}
