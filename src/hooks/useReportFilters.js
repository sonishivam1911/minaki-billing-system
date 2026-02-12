import { useState, useEffect, useCallback } from 'react';

/**
 * useReportFilters Hook
 * Manages filter state for reports, builds query params, and persists to localStorage
 * 
 * @param {string} reportType - Type of report (e.g., 'inventory', 'daily-sales')
 * @param {Object} defaultFilters - Default filter values
 * @returns {Object} Filter state and methods
 */
export const useReportFilters = (reportType, defaultFilters = {}) => {
  const storageKey = `report_filters_${reportType}`;

  // Load filters from localStorage or use defaults
  const getInitialFilters = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new filter fields
        return { ...defaultFilters, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
    return { ...defaultFilters };
  };

  const [filters, setFilters] = useState(getInitialFilters);
  const [activeFilters, setActiveFilters] = useState({});

  // Update active filters whenever filters change
  useEffect(() => {
    const active = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '' && 
          (!Array.isArray(value) || value.length > 0)) {
        active[key] = value;
      }
    });
    setActiveFilters(active);
  }, [filters]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters, storageKey]);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters });
  }, [defaultFilters]);

  // Remove a specific filter
  const removeFilter = useCallback((key) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Build query params object for API calls
  const buildQueryParams = useCallback(() => {
    const params = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      // Skip null, undefined, empty string, and empty arrays
      if (value === null || value === undefined || value === '') {
        return;
      }
      
      // Handle booleans - convert to string
      if (typeof value === 'boolean') {
        params[key] = value.toString();
        return;
      }
      
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length > 0) {
          // For arrays, join with comma (e.g., location_ids)
          params[key] = value.join(',');
        }
        return;
      }
      
      // Handle Date objects - format as YYYY-MM-DD
      if (value instanceof Date) {
        params[key] = value.toISOString().split('T')[0];
        return;
      }
      
      // Handle date strings - ensure they're in YYYY-MM-DD format
      if (key.includes('date') && typeof value === 'string') {
        // If it's already in YYYY-MM-DD format, use as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          params[key] = value;
        } else {
          // Try to parse and format
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              params[key] = date.toISOString().split('T')[0];
            }
          } catch (e) {
            // If parsing fails, use as is
            params[key] = value;
          }
        }
        return;
      }
      
      // Handle objects (like date ranges) - but API expects start_date and end_date directly
      if (typeof value === 'object' && !Array.isArray(value)) {
        // For date range objects, extract startDate/endDate
        if (value.startDate) {
          const startDate = value.startDate instanceof Date 
            ? value.startDate.toISOString().split('T')[0]
            : value.startDate;
          params['start_date'] = startDate;
        }
        if (value.endDate) {
          const endDate = value.endDate instanceof Date
            ? value.endDate.toISOString().split('T')[0]
            : value.endDate;
          params['end_date'] = endDate;
        }
        return;
      }
      
      // Regular values
      params[key] = value;
    });
    
    return params;
  }, [filters]);

  // Get count of active filters
  const getActiveFilterCount = useCallback(() => {
    return Object.keys(activeFilters).length;
  }, [activeFilters]);

  // Check if a specific filter is active
  const isFilterActive = useCallback((key) => {
    const value = filters[key];
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return true;
  }, [filters]);

  return {
    // State
    filters,
    activeFilters,
    
    // Methods
    updateFilter,
    updateFilters,
    resetFilters,
    removeFilter,
    clearFilters,
    buildQueryParams,
    getActiveFilterCount,
    isFilterActive,
  };
};

