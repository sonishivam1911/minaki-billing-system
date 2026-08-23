import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Marks content as agent/AI-generated. Sapphire per the gemstone accent
 * mapping (Agents/AI). Distinct from Badge's generic variants — this one
 * always carries the spark glyph so it reads at a glance in a dense table.
 */
function AgentBadge({ className, children = 'AI Agent', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-sapphire)_35%,transparent)]',
        'bg-[color-mix(in_srgb,var(--color-sapphire)_12%,transparent)] px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide',
        'text-[var(--color-sapphire)]',
        className
      )}
      {...props}
    >
      <Sparkles className="h-3 w-3" />
      {children}
    </span>
  );
}

export { AgentBadge };
