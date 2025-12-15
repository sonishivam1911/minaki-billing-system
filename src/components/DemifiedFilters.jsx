import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { productFiltersApi } from '../services/api';

/**
 * DemifiedFilters Component
 * Provides filtering options for demified products
 * 
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFiltersChange - Callback when filters change
 */
export const DemifiedFilters = ({ filters = {}, onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    dropdown: {},
    range: {}
  });

  // Dropdown filter fields
  const dropdownFields = [
    { key: 'cf_collection', label: 'Collection' },
    { key: 'cf_gender', label: 'Gender' },
    { key: 'cf_work', label: 'Work' },
    { key: 'cf_finish', label: 'Finish' },
    { key: 'cf_finding', label: 'Finding' },
    { key: 'category_name', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'sku', label: 'SKU' }
  ];

  // Range filter fields
  const rangeFields = [
    { key: 'rate', label: 'Price', min: 0, max: 0 },
    { key: 'stock_on_hand', label: 'Stock on Hand', min: 0, max: 0 },
    { key: 'available_stock', label: 'Available Stock', min: 0, max: 0 }
  ];

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const allOptions = await productFiltersApi.getAllFilterOptions();
        
        console.log('🔍 Filter options response:', allOptions);
        
        // Transform the response to match our structure
        // Handle different possible response structures
        const dropdown = {};
        const range = {};
        
        // Process dropdown options
        // API returns: { success: true, dropdown_filters: { field_name: [...] } }
        // Also handle legacy formats: { dropdown: {...} } or direct { field_name: [...] }
        const dropdownData = allOptions.dropdown_filters || allOptions.dropdown || allOptions;
        dropdownFields.forEach(field => {
          const options = dropdownData[field.key] || [];
          dropdown[field.key] = Array.isArray(options) ? options : [];
        });
        
        // Process range options
        // API might return: { range_filters: {...} } or { range: {...} } or direct { field_name: { min, max } }
        const rangeData = allOptions.range_filters || allOptions.range || allOptions;
        rangeFields.forEach(field => {
          const fieldData = rangeData[field.key] || {};
          range[field.key] = {
            min: typeof fieldData.min === 'number' ? fieldData.min : (parseFloat(fieldData.min) || 0),
            max: typeof fieldData.max === 'number' ? fieldData.max : (parseFloat(fieldData.max) || 0)
          };
        });
        
        setFilterOptions({ dropdown, range });
      } catch (error) {
        console.error('Error loading filter options:', error);
        // Set empty options on error
        setFilterOptions({ dropdown: {}, range: {} });
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);

  // Handle dropdown filter change
  const handleDropdownChange = (field, value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
    }
    onFiltersChange(newFilters);
  };

  // Handle range filter change
  const handleRangeChange = (field, type, value) => {
    const newFilters = { ...filters };
    const rangeKey = `${field}_${type}`;
    
    if (value === '' || value === null || value === undefined) {
      delete newFilters[rangeKey];
    } else {
      newFilters[rangeKey] = parseFloat(value) || 0;
    }
    
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  // Count active filters
  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="demified-filters">
      <button
        className="filters-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter size={18} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount}</span>
        )}
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="filters-panel">
          {loading ? (
            <div className="filters-loading">Loading filter options...</div>
          ) : (
            <>
              {/* Dropdown Filters */}
              <div className="filters-section">
                <h3 className="filters-section-title">Filter by Category</h3>
                <div className="filters-grid">
                  {dropdownFields.map(field => (
                    <div key={field.key} className="filter-field">
                      <label className="filter-label">{field.label}</label>
                      <select
                        className="filter-select"
                        value={filters[field.key] || ''}
                        onChange={(e) => handleDropdownChange(field.key, e.target.value)}
                      >
                        <option value="">All {field.label}</option>
                        {(filterOptions.dropdown[field.key] || []).map(option => (
                          <option key={option} value={option}>
                            {option || '(Empty)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Range Filters */}
              <div className="filters-section">
                <h3 className="filters-section-title">Filter by Range</h3>
                <div className="filters-grid">
                  {rangeFields.map(field => {
                    const rangeData = filterOptions.range[field.key] || { min: 0, max: 0 };
                    const minValue = filters[`${field.key}_min`] ?? '';
                    const maxValue = filters[`${field.key}_max`] ?? '';
                    
                    return (
                      <div key={field.key} className="filter-field range-field">
                        <label className="filter-label">{field.label}</label>
                        <div className="range-inputs">
                          <input
                            type="number"
                            className="filter-input"
                            placeholder={`Min (${rangeData.min})`}
                            min={rangeData.min}
                            max={rangeData.max}
                            value={minValue}
                            onChange={(e) => handleRangeChange(field.key, 'min', e.target.value)}
                          />
                          <span className="range-separator">to</span>
                          <input
                            type="number"
                            className="filter-input"
                            placeholder={`Max (${rangeData.max})`}
                            min={rangeData.min}
                            max={rangeData.max}
                            value={maxValue}
                            onChange={(e) => handleRangeChange(field.key, 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <div className="filters-actions">
                  <button
                    className="btn btn-secondary btn-clear-filters"
                    onClick={handleClearFilters}
                  >
                    <X size={16} />
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

