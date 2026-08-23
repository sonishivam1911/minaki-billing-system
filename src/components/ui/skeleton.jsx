import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Loading placeholder. Uses the brass shimmer sweep (design direction's
 * motion language), not a generic grey pulse — see .skeleton-shimmer in
 * tailwind.css.
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-md', className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

export { Skeleton };
