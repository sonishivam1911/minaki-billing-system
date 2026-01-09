import React from 'react';
import { Pagination as MuiPagination, Box, Typography } from '@mui/material';

/**
 * Pagination Component
 * Displays page numbers with navigation controls
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current active page (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {number} props.maxVisiblePages - Maximum number of page buttons to show (default: 5)
 * @param {boolean} props.showFirstLast - Show first/last page buttons (default: true)
 * @param {boolean} props.disabled - Disable all pagination controls (default: false)
 */
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  showFirstLast = true,
  disabled = false
}) => {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" sx={{ color: '#6b7280' }}>
        Page {currentPage} of {totalPages}
      </Typography>
      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={(event, value) => onPageChange(value)}
        disabled={disabled}
        color="primary"
        showFirstButton={showFirstLast}
        showLastButton={showFirstLast}
        siblingCount={Math.floor(maxVisiblePages / 2)}
        sx={{
          '& .MuiPaginationItem-root': {
            minHeight: '44px',
            minWidth: '44px',
          },
        }}
      />
    </Box>
  );
};
