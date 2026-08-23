import React from 'react';
import { cn } from '../../lib/utils';

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)]">
    <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-[var(--color-muted)]', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-muted)]/50',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-11 whitespace-nowrap px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn('px-4 py-3 align-middle', className)} {...props} />
));
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-[var(--color-muted-foreground)]', className)} {...props} />
));
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
