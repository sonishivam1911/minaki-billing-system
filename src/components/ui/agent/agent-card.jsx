import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Card } from '../card';
import { RunStatus } from './run-status';

/**
 * One tile in an Agent Workspace hub — the front door to a single agent
 * (Product Writer, Collection Builder, etc). Showcase card language: hover
 * lift, icon in a tinted sapphire tile, last-run status if available.
 */
function AgentCard({ icon: Icon, name, description, status, href, onClick, className }) {
  const Wrapper = href ? 'a' : 'div';
  return (
    <Card
      showcase
      className={cn('group cursor-pointer p-6', className)}
      onClick={onClick}
      role={onClick || href ? 'button' : undefined}
      tabIndex={onClick || href ? 0 : undefined}
    >
      <Wrapper href={href} className="flex h-full flex-col gap-4 no-underline">
        <div className="flex items-start justify-between gap-2">
          {Icon && (
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-sapphire)_14%,transparent)] text-[var(--color-sapphire)]">
              <Icon className="h-5 w-5" />
            </span>
          )}
          {status && <RunStatus status={status} />}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">{name}</h3>
          {description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>}
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold text-[var(--color-accent-primary)] opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Wrapper>
    </Card>
  );
}

export { AgentCard };
