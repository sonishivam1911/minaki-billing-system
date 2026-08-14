import React from 'react';
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { DateRangePicker } from '../components/reports/DateRangePicker';

const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateString = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return '';
};

/**
 * Generic MUI filters driven by a screen's filterFields() definition.
 */
export const ScreenFilters = ({ fields = [], filters = {}, onFiltersChange }) => {
  const updateFilters = (patch) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, ...patch });
    }
  };

  const renderField = (field) => {
    if (field.type === 'date_range') {
      return (
        <Grid item xs={12} key={field.key}>
          <DateRangePicker
            startDate={toDateOrNull(filters.start_date)}
            endDate={toDateOrNull(filters.end_date)}
            onStartDateChange={(nextDate) => updateFilters({ start_date: toDateString(nextDate) })}
            onEndDateChange={(nextDate) => updateFilters({ end_date: toDateString(nextDate) })}
            onRangeChange={(startDate, endDate) => updateFilters({
              start_date: toDateString(startDate),
              end_date: toDateString(endDate),
            })}
          />
        </Grid>
      );
    }

    if (field.type === 'text') {
      return (
        <Grid item xs={12} sm={6} md={4} key={field.key}>
          <TextField
            fullWidth
            size="small"
            label={field.label}
            value={filters[field.key] || ''}
            onChange={(event) => updateFilters({ [field.key]: event.target.value })}
          />
        </Grid>
      );
    }

    if (field.type === 'select') {
      return (
        <Grid item xs={12} sm={6} md={4} key={field.key}>
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={filters[field.key] || ''}
              label={field.label}
              onChange={(event) => updateFilters({ [field.key]: event.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {(field.options || []).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      );
    }

    return null;
  };

  if (!fields.length) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416', mb: 2 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          {fields.map((field) => renderField(field))}
        </Grid>
      </Paper>
    </Box>
  );
};
