import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Box,
  Typography,
} from '@mui/material';
import { ArrowUpDown } from 'lucide-react';

/**
 * ReportTable Component
 * Displays data in a sortable table format
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions { key, label, sortable, format }
 * @param {Array} props.data - Array of data objects
 * @param {Function} props.onSort - Callback when sorting changes
 * @param {string} props.sortBy - Current sort column
 * @param {string} props.sortOrder - Current sort order ('asc' | 'desc')
 * @param {boolean} props.loading - Loading state
 * @param {ReactNode} props.emptyMessage - Message to show when no data
 * @param {Function} props.onRowClick - Optional callback when a row is clicked (receives row data)
 */
export const ReportTable = ({
  columns = [],
  data = [],
  onSort,
  sortBy = null,
  sortOrder = 'asc',
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
}) => {
  const handleSort = (columnKey) => {
    if (!onSort) return;

    if (sortBy === columnKey) {
      // Toggle order if same column
      onSort(columnKey, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      onSort(columnKey, 'asc');
    }
  };

  const formatCellValue = (value, format) => {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (format === 'currency') {
      return `₹${parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (format === 'number') {
      return parseFloat(value).toLocaleString('en-IN');
    }

    if (format === 'date') {
      return new Date(value).toLocaleDateString();
    }

    if (format === 'datetime') {
      return new Date(value).toLocaleString();
    }

    if (format === 'percentage') {
      return `${parseFloat(value).toFixed(2)}%`;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        </Table>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Loading...
          </Typography>
        </Box>
      </TableContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        </Table>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {emptyMessage}
          </Typography>
        </Box>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sx={{
                  fontWeight: 600,
                  backgroundColor: '#f9fafb',
                  color: '#2c2416',
                }}
              >
                {col.sortable !== false && onSort ? (
                  <TableSortLabel
                    active={sortBy === col.key}
                    direction={sortBy === col.key ? sortOrder : 'asc'}
                    onClick={() => handleSort(col.key)}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        color: '#8b6f47 !important',
                      },
                    }}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow
              key={row.id || index}
              hover
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
                '&:nth-of-type(even)': {
                  backgroundColor: '#fafafa',
                },
              }}
            >
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : formatCellValue(row[col.key], col.format)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

