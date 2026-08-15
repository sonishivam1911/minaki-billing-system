import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  Box,
  Button,
  TextField,
  Menu,
  MenuItem,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO, isValid } from 'date-fns';

const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const parsedIso = /^\d{4}-\d{2}-\d{2}/.test(value) ? parseISO(value.slice(0, 10)) : new Date(value);
    return isValid(parsedIso) ? parsedIso : null;
  }
  return null;
};

/**
 * DateRangePicker Component
 * Provides date range selection with presets and custom range
 * 
 * @param {Object} props
 * @param {Date|string|null} props.startDate - Start date
 * @param {Date|string|null} props.endDate - End date
 * @param {Function} props.onStartDateChange - Callback when start date changes
 * @param {Function} props.onEndDateChange - Callback when end date changes
 * @param {Function} props.onRangeChange - Callback when both dates change (for presets)
 * @param {boolean} props.required - Whether date range is required
 */
export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRangeChange,
  required = false,
}) => {
  const [presetMenuAnchor, setPresetMenuAnchor] = useState(null);
  const resolvedStartDate = toDateOrNull(startDate);
  const resolvedEndDate = toDateOrNull(endDate);

  const handlePresetClick = (event) => {
    setPresetMenuAnchor(event.currentTarget);
  };

  const handlePresetClose = () => {
    setPresetMenuAnchor(null);
  };

  const applyPreset = (presetFn) => {
    const { start, end } = presetFn();
    if (onRangeChange) {
      onRangeChange(start, end);
    } else {
      if (onStartDateChange) onStartDateChange(start);
      if (onEndDateChange) onEndDateChange(end);
    }
    handlePresetClose();
  };

  const presets = [
    {
      label: 'Today',
      getRange: () => {
        const today = new Date();
        return { start: today, end: today };
      },
    },
    {
      label: 'Yesterday',
      getRange: () => {
        const yesterday = subDays(new Date(), 1);
        return { start: yesterday, end: yesterday };
      },
    },
    {
      label: 'Last 7 Days',
      getRange: () => {
        const end = new Date();
        const start = subDays(end, 6);
        return { start, end };
      },
    },
    {
      label: 'Last 30 Days',
      getRange: () => {
        const end = new Date();
        const start = subDays(end, 29);
        return { start, end };
      },
    },
    {
      label: 'Last 90 Days',
      getRange: () => {
        const end = new Date();
        const start = subDays(end, 89);
        return { start, end };
      },
    },
    {
      label: 'This Month',
      getRange: () => {
        const today = new Date();
        return {
          start: startOfMonth(today),
          end: endOfMonth(today),
        };
      },
    },
    {
      label: 'Last Month',
      getRange: () => {
        const today = new Date();
        const lastMonth = subDays(startOfMonth(today), 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth),
        };
      },
    },
    {
      label: 'This Week',
      getRange: () => {
        const today = new Date();
        return {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 }),
        };
      },
    },
    {
      label: 'Custom Range',
      getRange: null, // Special case - opens date pickers
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={handlePresetClick}
            startIcon={<Calendar size={18} />}
            endIcon={<ChevronDown size={18} />}
            sx={{
              borderColor: '#8b6f47',
              color: '#8b6f47',
              '&:hover': {
                borderColor: '#6b5638',
                backgroundColor: '#f5f1e8',
              },
            }}
          >
            Quick Select
          </Button>
          <Menu
            anchorEl={presetMenuAnchor}
            open={Boolean(presetMenuAnchor)}
            onClose={handlePresetClose}
          >
            {presets.map((preset) => (
              <MenuItem
                key={preset.label}
                onClick={() => {
                  if (preset.getRange) {
                    applyPreset(preset.getRange);
                  } else {
                    handlePresetClose();
                  }
                }}
              >
                {preset.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              value={resolvedStartDate}
              onChange={(newValue) => {
                if (onStartDateChange) onStartDateChange(newValue);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required,
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={resolvedEndDate}
              onChange={(newValue) => {
                if (onEndDateChange) onEndDateChange(newValue);
              }}
              minDate={resolvedStartDate || undefined}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required,
                  size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                    },
                  },
                },
              }}
            />
          </Grid>
        </Grid>

        {resolvedStartDate && resolvedEndDate && (
          <Typography variant="caption" sx={{ color: '#6b7280', mt: 1, display: 'block' }}>
            Selected: {format(resolvedStartDate, 'MMM dd, yyyy')} - {format(resolvedEndDate, 'MMM dd, yyyy')}
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
};

