import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  Box,
  Collapse,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Typography,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import { locationsApi } from '../../services/locationsApi';
import { DateRangePicker } from './DateRangePicker';
import { FilterChip } from './FilterChip';

/**
 * ReportFilters Component
 * Comprehensive filter panel for reports with collapsible sections
 * 
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {Array} props.availableFilters - Array of filter types to show
 * @param {boolean} props.defaultOpen - Whether filters panel is open by default
 */
export const ReportFilters = ({
  filters = {},
  onFiltersChange,
  availableFilters = [],
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Category options
  const categoryOptions = [
    { value: 'ring', label: 'Rings' },
    { value: 'stud', label: 'Studs' },
    { value: 'earring', label: 'Earrings' },
    { value: 'necklace', label: 'Necklaces' },
  ];

  // Diamond Cut/Shape options
  const cutOptions = [
    { value: 'Round', label: 'Round' },
    { value: 'Oval', label: 'Oval' },
    { value: 'Pear', label: 'Pear' },
    { value: 'Radiant', label: 'Radiant' },
    { value: 'Square', label: 'Square' },
    { value: 'Princess', label: 'Princess' },
    { value: 'Emerald Cut', label: 'Emerald Cut' },
    { value: 'Marquise', label: 'Marquise' },
    { value: 'Heart', label: 'Heart' },
  ];

  // Diamond Color grades (GIA scale)
  const colorOptions = [
    { value: 'D', label: 'D (Colorless)' },
    { value: 'E', label: 'E (Colorless)' },
    { value: 'F', label: 'F (Colorless)' },
    { value: 'G', label: 'G (Near Colorless)' },
    { value: 'H', label: 'H (Near Colorless)' },
    { value: 'I', label: 'I (Near Colorless)' },
    { value: 'J', label: 'J (Near Colorless)' },
    { value: 'K', label: 'K (Faint Yellow)' },
    { value: 'L', label: 'L (Faint Yellow)' },
    { value: 'M', label: 'M (Faint Yellow)' },
  ];

  // Diamond Clarity grades (GIA scale)
  const clarityOptions = [
    { value: 'FL', label: 'FL (Flawless)' },
    { value: 'IF', label: 'IF (Internally Flawless)' },
    { value: 'VVS1', label: 'VVS1' },
    { value: 'VVS2', label: 'VVS2' },
    { value: 'VS1', label: 'VS1' },
    { value: 'VS2', label: 'VS2' },
    { value: 'SI1', label: 'SI1' },
    { value: 'SI2', label: 'SI2' },
    { value: 'I1', label: 'I1' },
    { value: 'I2', label: 'I2' },
    { value: 'I3', label: 'I3' },
  ];

  // Metal type options
  const metalTypeOptions = [
    { value: 'yellow_gold', label: 'Yellow Gold' },
    { value: 'white_gold', label: 'White Gold' },
    { value: 'platinum', label: 'Platinum' },
    { value: 'silver', label: 'Silver' },
  ];

  // Purity options
  const purityOptions = [
    { value: 14, label: '14K' },
    { value: 18, label: '18K' },
    { value: 22, label: '22K' },
    { value: 24, label: '24K' },
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
  ];

  // Invoice status options
  const invoiceStatusOptions = [
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  // Stock status options
  const stockStatusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  // Product type options — maps to backend data providers (billing_system, zakya)
  const productTypeOptions = [
    { value: 'real_jewelry', label: 'Billing System (Real Jewelry)' },
    { value: 'zakya_product', label: 'Zakya (Demystified Jewelry)' },
  ];

  // Group by options
  const groupByOptions = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  // Movement type options
  const movementTypeOptions = [
    { value: 'addition', label: 'Addition' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'sale', label: 'Sale' },
    { value: 'adjustment', label: 'Adjustment' },
  ];

  // Load locations on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        const data = await locationsApi.getAll();
        // locationsApi returns an array directly
        const locationsList = Array.isArray(data) ? data : [];
        setLocations(locationsList);
      } catch (error) {
        console.error('Error loading locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    if (availableFilters.includes('location') || availableFilters.includes('location_id')) {
      loadLocations();
    }
  }, [availableFilters]);

  const handleFilterChange = (key, value) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const handleRemoveFilter = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const handleClearAll = () => {
    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  const toDateString = (value) => {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    return '';
  };

  const renderDateRangeFilter = () => {
    if (!availableFilters.includes('date_range') && !availableFilters.includes('start_date')) {
      return null;
    }

    return (
      <Grid item xs={12}>
        <DateRangePicker
          startDate={filters.start_date}
          endDate={filters.end_date}
          onStartDateChange={(date) => handleFilterChange('start_date', toDateString(date))}
          onEndDateChange={(date) => handleFilterChange('end_date', toDateString(date))}
          onRangeChange={(startDate, endDate) => {
            handleFilterChange('start_date', toDateString(startDate));
            // Batch both dates in one update to avoid stale state
            if (onFiltersChange) {
              onFiltersChange({
                ...filters,
                start_date: toDateString(startDate),
                end_date: toDateString(endDate),
              });
            }
          }}
        />
      </Grid>
    );
  };

  const renderSingleDateFilter = () => {
    // Single date filter is handled separately in DailySalesReportPage
    // This component doesn't render it to avoid duplication
    return null;
  };

  const renderCategoryFilter = () => {
    if (!availableFilters.includes('category')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categoryOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderLocationFilter = () => {
    if (!availableFilters.includes('location') && !availableFilters.includes('location_id')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Location</InputLabel>
          <Select
            value={filters.location_id || ''}
            onChange={(e) => handleFilterChange('location_id', e.target.value)}
            label="Location"
            disabled={loading}
          >
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {location.name || location.location_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderPriceRangeFilter = () => {
    if (!availableFilters.includes('price_range')) {
      return null;
    }

    const minPrice = filters.min_price || 0;
    const maxPrice = filters.max_price || 1000000;

    return (
      <Grid item xs={12}>
        <Typography variant="body2" sx={{ mb: 1, color: '#6b7280' }}>
          Price Range: ₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()}
        </Typography>
        <Box sx={{ px: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Min Price"
                type="number"
                value={minPrice}
                onChange={(e) => handleFilterChange('min_price', parseFloat(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Max Price"
                type="number"
                value={maxPrice}
                onChange={(e) => handleFilterChange('max_price', parseFloat(e.target.value) || 1000000)}
              />
            </Grid>
          </Grid>
        </Box>
      </Grid>
    );
  };

  const renderDiamondFilters = () => {
    if (!availableFilters.includes('diamond_4c')) {
      return null;
    }

    return (
      <>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Min Carat"
            type="number"
            value={filters.min_carat || ''}
            onChange={(e) => handleFilterChange('min_carat', e.target.value ? parseFloat(e.target.value) : null)}
            inputProps={{ step: 0.01, min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Max Carat"
            type="number"
            value={filters.max_carat || ''}
            onChange={(e) => handleFilterChange('max_carat', e.target.value ? parseFloat(e.target.value) : null)}
            inputProps={{ step: 0.01, min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Cut</InputLabel>
            <Select
              value={filters.cut || ''}
              onChange={(e) => handleFilterChange('cut', e.target.value)}
              label="Cut"
            >
              <MenuItem value="">All Cuts</MenuItem>
              {cutOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Color</InputLabel>
            <Select
              value={filters.color || ''}
              onChange={(e) => handleFilterChange('color', e.target.value)}
              label="Color"
            >
              <MenuItem value="">All Colors</MenuItem>
              {colorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Clarity</InputLabel>
            <Select
              value={filters.clarity || ''}
              onChange={(e) => handleFilterChange('clarity', e.target.value)}
              label="Clarity"
            >
              <MenuItem value="">All Clarity</MenuItem>
              {clarityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </>
    );
  };

  const renderMetalFilters = () => {
    if (!availableFilters.includes('metal')) {
      return null;
    }

    return (
      <>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Metal Type</InputLabel>
            <Select
              value={filters.metal_type || ''}
              onChange={(e) => handleFilterChange('metal_type', e.target.value)}
              label="Metal Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {metalTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Purity</InputLabel>
            <Select
              value={filters.purity_k || ''}
              onChange={(e) => handleFilterChange('purity_k', e.target.value)}
              label="Purity"
            >
              <MenuItem value="">All Purity</MenuItem>
              {purityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </>
    );
  };

  const renderPaymentMethodFilter = () => {
    if (!availableFilters.includes('payment_method')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={filters.payment_method || ''}
            onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            label="Payment Method"
          >
            <MenuItem value="">All Methods</MenuItem>
            {paymentMethodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderInvoiceStatusFilter = () => {
    if (!availableFilters.includes('invoice_status')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Invoice Status</InputLabel>
          <Select
            value={filters.invoice_status || ''}
            onChange={(e) => handleFilterChange('invoice_status', e.target.value)}
            label="Invoice Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {invoiceStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderStockStatusFilter = () => {
    if (!availableFilters.includes('stock_status')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Stock Status</InputLabel>
          <Select
            value={filters.stock_status || ''}
            onChange={(e) => handleFilterChange('stock_status', e.target.value)}
            label="Stock Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {stockStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderProductSearchFilters = () => {
    const showSku = availableFilters.includes('sku');
    const showProductName = availableFilters.includes('product_name');
    if (!showSku && !showProductName) {
      return null;
    }

    return (
      <>
        {showSku && (
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="SKU"
              value={filters.sku || ''}
              onChange={(e) => handleFilterChange('sku', e.target.value)}
              placeholder="Exact SKU"
            />
          </Grid>
        )}
        {showProductName && (
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Product Name"
              value={filters.product_name || ''}
              onChange={(e) => handleFilterChange('product_name', e.target.value)}
              placeholder="Partial name match"
            />
          </Grid>
        )}
      </>
    );
  };

  const renderProductTypeFilter = () => {
    if (!availableFilters.includes('product_type')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Data Source</InputLabel>
          <Select
            value={filters.product_type || ''}
            onChange={(e) => handleFilterChange('product_type', e.target.value)}
            label="Data Source"
          >
            <MenuItem value="">All Sources</MenuItem>
            {productTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderGroupByFilter = () => {
    if (!availableFilters.includes('group_by')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Group By</InputLabel>
          <Select
            value={filters.group_by || ''}
            onChange={(e) => handleFilterChange('group_by', e.target.value)}
            label="Group By"
            required
          >
            {groupByOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderMovementTypeFilter = () => {
    if (!availableFilters.includes('movement_type')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Movement Type</InputLabel>
          <Select
            value={filters.movement_type || ''}
            onChange={(e) => handleFilterChange('movement_type', e.target.value)}
            label="Movement Type"
          >
            <MenuItem value="">All Types</MenuItem>
            {movementTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    );
  };

  const renderCompareWithPreviousFilter = () => {
    if (!availableFilters.includes('compare_with_previous')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.compare_with_previous === true}
              onChange={(e) => handleFilterChange('compare_with_previous', e.target.checked)}
            />
          }
          label="Compare with Previous Period"
        />
      </Grid>
    );
  };

  const renderIncludeRefundsFilter = () => {
    if (!availableFilters.includes('include_refunds')) {
      return null;
    }

    return (
      <Grid item xs={12} sm={6} md={3}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.include_refunds !== false}
              onChange={(e) => handleFilterChange('include_refunds', e.target.checked)}
            />
          }
          label="Include Refunds"
        />
      </Grid>
    );
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            cursor: 'pointer',
            backgroundColor: '#f9fafb',
            '&:hover': {
              backgroundColor: '#f3f4f6',
            },
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter size={20} color="#8b6f47" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416' }}>
              Filters
            </Typography>
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                sx={{
                  backgroundColor: '#8b6f47',
                  color: '#fff',
                  height: 20,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Box>

        <Collapse in={isOpen}>
          <Box sx={{ p: 3 }}>
            <FilterChip
              filters={filters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
            />

            <Grid container spacing={2}>
              {renderDateRangeFilter()}
              {renderSingleDateFilter()}
              {renderCategoryFilter()}
              {renderProductSearchFilters()}
              {renderLocationFilter()}
              {renderPriceRangeFilter()}
              {renderDiamondFilters()}
              {renderMetalFilters()}
              {renderPaymentMethodFilter()}
              {renderInvoiceStatusFilter()}
              {renderStockStatusFilter()}
              {renderProductTypeFilter()}
              {renderGroupByFilter()}
              {renderMovementTypeFilter()}
              {renderCompareWithPreviousFilter()}
              {renderIncludeRefundsFilter()}
            </Grid>
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

