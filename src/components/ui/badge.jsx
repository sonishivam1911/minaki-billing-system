import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
        primary: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
        success: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
        warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
        destructive: 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
        outline: 'border border-[var(--color-border)] text-[var(--color-foreground)] font-sans normal-case text-xs font-semibold',
        /* Gemstone accent family — brand-lane / category tags, see design direction doc */
        ruby: 'bg-[var(--color-ruby)]/15 text-[var(--color-ruby)]',
        emerald: 'bg-[var(--color-emerald)]/15 text-[var(--color-emerald)]',
        sapphire: 'bg-[var(--color-sapphire)]/15 text-[var(--color-sapphire)]',
        amethyst: 'bg-[var(--color-amethyst)]/15 text-[var(--color-amethyst)]',
        citrine: 'bg-[var(--color-citrine)]/15 text-[var(--color-citrine)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
