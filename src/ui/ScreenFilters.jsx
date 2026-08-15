import React, { useEffect, useMemo, useState } from 'react';
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
import { reportsApi } from '../services/api';

const FILTER_FIELD_GRID = { xs: 12, sm: 6, md: 3 };

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

const toSelectOptions = (values = []) =>
  values
    .filter((value) => value != null && String(value).trim() !== '')
    .map((value) => ({ value: String(value), label: String(value) }));

/**
 * Generic MUI filters driven by a screen's filterFields() definition.
 * All select/text controls share the same grid size.
 */
export const ScreenFilters = ({ fields = [], filters = {}, onFiltersChange }) => {
  const [zakyaProductOptions, setZakyaProductOptions] = useState({});
  const [optionsLoading, setOptionsLoading] = useState(false);

  const needsZakyaProductOptions = useMemo(
    () => fields.some((field) => field.optionsSource === 'zakya_product'),
    [fields],
  );

  useEffect(() => {
    if (!needsZakyaProductOptions) return undefined;
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const data = await reportsApi.getZakyaProductFilterOptions();
        if (!cancelled) {
          setZakyaProductOptions(data || {});
        }
      } catch (error) {
        console.error('Failed to load Zakya product filter options:', error);
        if (!cancelled) {
          setZakyaProductOptions({});
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [needsZakyaProductOptions]);

  const updateFilters = (patch) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, ...patch });
    }
  };

  const resolveOptions = (field) => {
    if (Array.isArray(field.options) && field.options.length > 0) {
      return field.options;
    }
    if (field.optionsSource === 'zakya_product' && field.optionsKey) {
      return toSelectOptions(zakyaProductOptions[field.optionsKey] || []);
    }
    return [];
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
        <Grid item {...FILTER_FIELD_GRID} key={field.key}>
          <TextField
            fullWidth
            size="small"
            label={field.label}
            value={filters[field.key] || ''}
            onChange={(event) => updateFilters({ [field.key]: event.target.value })}
            sx={{ minWidth: 0 }}
          />
        </Grid>
      );
    }

    if (field.type === 'select') {
      const options = resolveOptions(field);
      return (
        <Grid item {...FILTER_FIELD_GRID} key={field.key}>
          <FormControl fullWidth size="small" sx={{ minWidth: 0 }}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={filters[field.key] || ''}
              label={field.label}
              disabled={Boolean(field.optionsSource === 'zakya_product' && optionsLoading)}
              onChange={(event) => updateFilters({ [field.key]: event.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              {options.map((option) => (
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
        <Grid container spacing={2} alignItems="flex-start">
          {fields.map((field) => renderField(field))}
        </Grid>
      </Paper>
    </Box>
  );
};
