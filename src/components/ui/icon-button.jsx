import React from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';

/**
 * Compact icon-only action (MINAKI spec §6: IconButton). Thin wrapper over
 * Button's `icon` size — requires `aria-label` since there's no visible text.
 */
const IconButton = React.forwardRef(({ className, variant = 'ghost', 'aria-label': ariaLabel, ...props }, ref) => {
  if (!ariaLabel && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('IconButton: missing aria-label — icon-only buttons need one for screen readers.');
  }
  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      aria-label={ariaLabel}
      className={cn('shrink-0', className)}
      {...props}
    />
  );
});
IconButton.displayName = 'IconButton';

export { IconButton };
