import React from 'react';
import { cva } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const alertVariants = cva('relative flex gap-3 rounded-md border p-4 text-sm', {
  variants: {
    variant: {
      default: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]',
      info: 'border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]',
      success: 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]',
      warning: 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
      destructive:
        'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
    },
  },
  defaultVariants: { variant: 'default' },
});

const ICONS = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

/**
 * The one alert/error surface for the app. Replaces window.alert(), the
 * hand-built checkout error banner, and the .alert-error CSS classes
 * flagged as duplicate patterns in the UI audit.
 */
const Alert = React.forwardRef(({ className, variant = 'default', title, children, ...props }, ref) => {
  const Icon = ICONS[variant] || Info;
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant, className }))} {...props}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold leading-none">{title}</p>}
        {children && <div className="text-[var(--color-foreground)]/90">{children}</div>}
      </div>
    </div>
  );
});
Alert.displayName = 'Alert';

export { Alert, alertVariants };
