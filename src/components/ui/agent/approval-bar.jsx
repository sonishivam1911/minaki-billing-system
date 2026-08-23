import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../button';

/**
 * The human-in-the-loop moment: an agent produced something and a person
 * needs to say yes/no before it goes live (publish to Shopify, send a
 * campaign, etc). Deliberately quieter than the destructive AlertDialog —
 * this is a routine review step, not a Void-Invoice-style irreversible
 * confirm.
 */
function ApprovalBar({ message, onApprove, onReject, approveLabel = 'Approve', rejectLabel = 'Reject', busy = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-md border border-[color-mix(in_srgb,var(--color-sapphire)_30%,var(--color-border-default))]',
        'bg-[color-mix(in_srgb,var(--color-sapphire)_6%,transparent)] p-5 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-sm text-[var(--color-text-primary)]">{message}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReject} disabled={busy}>
          <X className="h-3.5 w-3.5" />
          {rejectLabel}
        </Button>
        <Button size="sm" onClick={onApprove} disabled={busy}>
          <Check className="h-3.5 w-3.5" />
          {approveLabel}
        </Button>
      </div>
    </div>
  );
}

export { ApprovalBar };
