import React from 'react';
import { cn } from '../../../lib/utils';
import { StatusDot } from './run-status';

/**
 * Vertical activity timeline for agent run history — replaces a flat table
 * with something that reads as a sequence of events, which is what a run
 * history actually is. Each item gets a status-colored node on a connecting
 * line; content is freeform (title/description/metadata via children).
 */
function RunTimeline({ className, children }) {
  return <div className={cn('relative', className)}>{children}</div>;
}

function RunTimelineItem({ status = 'success', timestamp, title, description, actions, isLast = false, children }) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <span className="absolute left-[7px] top-5 h-[calc(100%-8px)] w-px bg-[var(--color-border-default)]" aria-hidden="true" />
      )}
      <div className="relative z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <StatusDot status={status} className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
          {timestamp && (
            <time className="shrink-0 font-mono text-[11px] text-[var(--color-text-muted)]">{timestamp}</time>
          )}
        </div>
        {description && <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>}
        {children && <div className="mt-2">{children}</div>}
        {actions && <div className="mt-2 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { RunTimeline, RunTimelineItem };
