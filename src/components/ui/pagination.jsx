import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';

const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 30];

/**
 * Shared table pagination: page-size select (10/15/20/25/30, default 10) + prev/next.
 * One component so every migrated table gets the same control instead of a
 * one-off per page (see the UI audit's TablePagination-adoption finding).
 */
function Pagination({
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  totalItems,
  className,
}) {
  const canPrev = page > 1;
  const canNext = pageCount ? page < pageCount : true;

  return (
    <div className={cn('flex flex-col-reverse items-center justify-between gap-3 rounded-md border border-[var(--color-border)] px-4 py-3 sm:flex-row', className)}>
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-9 w-[76px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {typeof totalItems === 'number' && (
          <span className="hidden sm:inline">&middot; {totalItems} total</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm tabular-nums text-[var(--color-muted-foreground)]">
          Page {page}
          {pageCount ? ` of ${pageCount}` : ''}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={!canPrev}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={!canNext}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export { Pagination, PAGE_SIZE_OPTIONS };
