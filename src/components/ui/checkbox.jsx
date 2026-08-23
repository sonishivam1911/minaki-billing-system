import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-5 w-5 shrink-0 rounded border border-[var(--color-input)] bg-[var(--color-surface)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:border-[var(--color-primary)] data-[state=checked]:text-[var(--color-primary-foreground)]',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <Check className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
