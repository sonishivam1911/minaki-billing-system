import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  'group relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-md border p-4 shadow-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
  {
    variants: {
      variant: {
        default: 'border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]',
        success: 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]',
        destructive:
          'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant, className }))} {...props} />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'shrink-0 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-muted)]',
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('shrink-0 rounded-sm opacity-60 transition-opacity hover:opacity-100', className)}
    aria-label="Dismiss"
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
