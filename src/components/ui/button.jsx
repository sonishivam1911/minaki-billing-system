import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          'btn-shimmer bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]',
        secondary:
          'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-90',
        outline:
          'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
        ghost: 'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
        destructive:
          'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:opacity-90',
        link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-4 py-2',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
