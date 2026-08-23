import React from 'react';
import { Wrench, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible';
import { RunStatus } from './run-status';

/**
 * Shows what the agent actually did — tool name, arguments, result — as a
 * collapsed-by-default log, the pattern users of coding/agent tools already
 * recognize (Claude Code, Cursor, etc). Keeps the page calm while still
 * making agent behavior inspectable, not a black box.
 */
function ToolCallLog({ className, children }) {
  return <div className={cn('divide-y divide-[var(--color-border-default)] rounded-md border border-[var(--color-border-default)]', className)}>{children}</div>;
}

function ToolCallItem({ name, status = 'success', durationMs, params, result, defaultOpen = false }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--color-muted)] [&[data-state=open]>svg]:rotate-180">
        <Wrench className="h-3.5 w-3.5 shrink-0 text-[var(--color-sapphire)]" />
        <span className="flex-1 truncate font-mono text-xs font-semibold text-[var(--color-text-primary)]">{name}</span>
        {typeof durationMs === 'number' && (
          <span className="font-mono text-[11px] tabular-nums text-[var(--color-text-muted)]">{durationMs}ms</span>
        )}
        <RunStatus status={status} className="text-[11px]" />
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0">
        <div className="space-y-3 border-t border-[var(--color-border-default)] bg-[var(--color-muted)]/40 px-4 py-4">
          {params !== undefined && (
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Arguments</p>
              <pre className="overflow-x-auto rounded bg-[var(--color-surface)] p-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
                {typeof params === 'string' ? params : JSON.stringify(params, null, 2)}
              </pre>
            </div>
          )}
          {result !== undefined && (
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Result</p>
              <pre className="overflow-x-auto rounded bg-[var(--color-surface)] p-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ToolCallLog, ToolCallItem };
