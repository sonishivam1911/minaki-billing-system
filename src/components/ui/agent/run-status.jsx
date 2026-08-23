import React from 'react';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';

const STATUS_CONFIG = {
  queued: { label: 'Queued', color: 'var(--color-text-muted)', icon: Clock, pulse: false },
  running: { label: 'Running', color: 'var(--color-sapphire)', icon: Loader2, pulse: true },
  success: { label: 'Done', color: 'var(--color-emerald)', icon: Check, pulse: false },
  error: { label: 'Failed', color: 'var(--color-garnet)', icon: X, pulse: false },
};

/** A single status dot — for table cells and dense rows. */
function StatusDot({ status = 'queued', className }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', cfg.pulse && 'status-pulse-dot', className)}
      style={{ backgroundColor: cfg.color, color: cfg.color }}
      aria-hidden="true"
    />
  );
}

/** Dot + label, for card headers and run summaries. */
function RunStatus({ status = 'queued', className, showIcon = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 font-mono text-xs font-semibold', className)}
      style={{ color: cfg.color }}
    >
      {showIcon ? (
        <Icon className={cn('h-3.5 w-3.5', status === 'running' && 'animate-spin')} />
      ) : (
        <StatusDot status={status} />
      )}
      {cfg.label}
    </span>
  );
}

export { RunStatus, StatusDot, STATUS_CONFIG };
