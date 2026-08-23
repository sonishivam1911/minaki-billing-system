import React from 'react';
import { Check, RotateCw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { IconButton } from '../icon-button';

/**
 * Grid of generated variants (banners, images, copy blocks) — each tile
 * settles in with a staggered reveal, shows a selected ring instead of a
 * checkbox, and surfaces a regenerate action on hover rather than a
 * permanent toolbar. This is the "pick the best one" moment agent pages
 * keep re-implementing ad hoc; this component is that moment done once.
 */
function GenerationGallery({ className, children }) {
  return <div className={cn('grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4', className)}>{children}</div>;
}

function GenerationTile({
  index = 0,
  image,
  label,
  selected = false,
  onSelect,
  onRegenerate,
  children,
  className,
}) {
  return (
    <div
      className={cn(
        'stagger-in group relative overflow-hidden rounded-md border bg-[var(--color-surface)] transition-all',
        selected
          ? 'border-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)]'
          : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50',
        onSelect && 'cursor-pointer',
        className
      )}
      style={{ '--stagger-index': index }}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {image ? (
        <div className="aspect-square overflow-hidden bg-[var(--color-muted)]">
          <img
            src={image}
            alt={label || `Variant ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-[var(--color-muted)] p-3 text-sm text-[var(--color-text-secondary)]">
          {children}
        </div>
      )}

      {selected && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-primary)] text-[var(--color-primary-foreground)] shadow-sm">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      {onRegenerate && (
        <IconButton
          aria-label="Regenerate this variant"
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          className="absolute bottom-2 right-2 h-8 w-8 bg-[var(--color-surface)]/90 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </IconButton>
      )}

      {label && image && (
        <div className="border-t border-[var(--color-border-default)] px-2 py-1.5 text-center text-xs text-[var(--color-text-secondary)]">
          {label}
        </div>
      )}
    </div>
  );
}

export { GenerationGallery, GenerationTile };
