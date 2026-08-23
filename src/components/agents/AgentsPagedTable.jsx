import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

export const AGENTS_TABLE_PAGE_SIZES = [10, 15, 20, 25, 30];
export const AGENTS_TABLE_DEFAULT_PAGE_SIZE = 10;

export const AgentsPagedTable = ({
  columns = [],
  rows = [],
  selectedRowId,
  getRowId,
  onRowClick,
  emptyLabel = 'No rows',
  size = 'small',
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(AGENTS_TABLE_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [rows.length]);

  const safeRowsPerPage = Math.min(30, Math.max(10, rowsPerPage));
  const pagedRows = useMemo(() => {
    const start = page * safeRowsPerPage;
    return rows.slice(start, start + safeRowsPerPage);
  }, [page, rows, safeRowsPerPage]);

  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size={size} stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align || 'left'}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((row, rowIndex) => {
              const rowId = getRowId ? getRowId(row) : row.id || rowIndex;
              const selected = selectedRowId != null && String(selectedRowId) === String(rowId);
              return (
                <TableRow
                  hover
                  key={rowId}
                  selected={selected}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align || 'left'}>
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={safeRowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={AGENTS_TABLE_PAGE_SIZES}
      />
    </Paper>
  );
};
