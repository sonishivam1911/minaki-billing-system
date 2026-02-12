import React from 'react';
import { X } from 'lucide-react';
import { Chip, Box, Typography } from '@mui/material';

/**
 * FilterChip Component
 * Displays active filters as removable chips
 * 
 * @param {Object} props
 * @param {Object} props.filters - Active filters object
 * @param {Function} props.onRemove - Callback when a filter is removed
 * @param {Function} props.onClearAll - Callback to clear all filters
 */
export const FilterChip = ({ filters = {}, onRemove, onClearAll }) => {
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (value instanceof Date) {
      return true;
    }
    if (typeof value === 'object' && (value.startDate || value.endDate)) {
      return true;
    }
    return true;
  });

  if (activeFilters.length === 0) {
    return null;
  }

  const formatFilterValue = (key, value) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'object' && value.startDate && value.endDate) {
      return `${value.startDate.toLocaleDateString()} - ${value.endDate.toLocaleDateString()}`;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  const formatFilterLabel = (key) => {
    const labelMap = {
      start_date: 'Start Date',
      end_date: 'End Date',
      date: 'Date',
      category: 'Category',
      location_id: 'Location',
      storage_type_id: 'Storage Type',
      storage_object_id: 'Storage Object',
      metal_type: 'Metal Type',
      purity_k: 'Purity',
      min_carat: 'Min Carat',
      max_carat: 'Max Carat',
      cut: 'Cut',
      color: 'Color',
      clarity: 'Clarity',
      min_price: 'Min Price',
      max_price: 'Max Price',
      stock_status: 'Stock Status',
      product_type: 'Product Type',
      payment_method: 'Payment Method',
      customer_id: 'Customer',
      invoice_status: 'Invoice Status',
      user_id: 'User',
      group_by: 'Group By',
      movement_type: 'Movement Type',
      product_id: 'Product',
      sku: 'SKU',
    };
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
      <Typography variant="body2" sx={{ color: '#6b7280', mr: 1 }}>
        Active Filters:
      </Typography>
      {activeFilters.map(([key, value]) => (
        <Chip
          key={key}
          label={`${formatFilterLabel(key)}: ${formatFilterValue(key, value)}`}
          onDelete={onRemove ? () => onRemove(key) : undefined}
          deleteIcon={<X size={16} />}
          size="small"
          sx={{
            backgroundColor: '#f5f1e8',
            color: '#8b6f47',
            '& .MuiChip-deleteIcon': {
              color: '#8b6f47',
              '&:hover': {
                color: '#6b5638',
              },
            },
          }}
        />
      ))}
      {onClearAll && activeFilters.length > 1 && (
        <Chip
          label="Clear All"
          onClick={onClearAll}
          size="small"
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #8b6f47',
            color: '#8b6f47',
            '&:hover': {
              backgroundColor: '#f5f1e8',
            },
          }}
        />
      )}
    </Box>
  );
};

