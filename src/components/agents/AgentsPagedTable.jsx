import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Pagination, PAGE_SIZE_OPTIONS } from '../ui/pagination';

export const AGENTS_TABLE_PAGE_SIZES = PAGE_SIZE_OPTIONS;
export const AGENTS_TABLE_DEFAULT_PAGE_SIZE = 10;

export const AgentsPagedTable = ({
  columns = [],
  rows = [],
  selectedRowId,
  getRowId,
  onRowClick,
  emptyLabel = 'No rows',
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(AGENTS_TABLE_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, rows, pageSize]);

  if (!rows.length) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</p>;
  }

  return (
    <div className="minaki-ui space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.align === 'right' ? 'text-right' : undefined}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedRows.map((row, rowIndex) => {
            const rowId = getRowId ? getRowId(row) : row.id || rowIndex;
            const selected = selectedRowId != null && String(selectedRowId) === String(rowId);
            return (
              <TableRow
                key={rowId}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  onRowClick && 'cursor-pointer',
                  selected && 'bg-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/60'
                )}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.align === 'right' ? 'text-right tabular-nums' : undefined}>
                    {column.render ? column.render(row) : row[column.key] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        totalItems={rows.length}
      />
    </div>
  );
};
