import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { storesApi } from '../services/api';
import '../styles/ProductFilters.css';

/**
 * ProductFilters Component
 * Provides filtering options for products: category, diamond size, price, and location
 * 
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {Array} props.products - Products array (for calculating price/diamond size ranges)
 */
export const ProductFilters = ({ filters = {}, onFiltersChange, products = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);

  // Category options
  const categoryOptions = [
    { value: 'ring', label: 'Rings' },
    { value: 'stud', label: 'Studs' },
    { value: 'earring', label: 'Earrings' },
    { value: 'necklace', label: 'Necklaces' },
  ];

  // Diamond size ranges (in carats)
  const diamondSizeRanges = [
    { value: '0-0.5', label: '0 - 0.5 CT', min: 0, max: 0.5 },
    { value: '0.5-1', label: '0.5 - 1 CT', min: 0.5, max: 1 },
    { value: '1-2', label: '1 - 2 CT', min: 1, max: 2 },
    { value: '2-3', label: '2 - 3 CT', min: 2, max: 3 },
    { value: '3+', label: '3+ CT', min: 3, max: null },
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
    { value: 'VVS1', label: 'VVS1 (Very Very Slightly Included)' },
    { value: 'VVS2', label: 'VVS2 (Very Very Slightly Included)' },
    { value: 'VS1', label: 'VS1 (Very Slightly Included)' },
    { value: 'VS2', label: 'VS2 (Very Slightly Included)' },
    { value: 'SI1', label: 'SI1 (Slightly Included)' },
    { value: 'SI2', label: 'SI2 (Slightly Included)' },
    { value: 'I1', label: 'I1 (Included)' },
    { value: 'I2', label: 'I2 (Included)' },
    { value: 'I3', label: 'I3 (Included)' },
  ];

  // Load stores/locations on mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true);
        const data = await storesApi.getAll();
        const storesList = Array.isArray(data) ? data : data.items || data.stores || [];
        setStores(storesList);
      } catch (error) {
        console.error('Error loading stores:', error);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, []);

  // Calculate price range from products
  const calculatePriceRange = () => {
    if (!products || products.length === 0) {
      return { min: 0, max: 100000 };
    }

    const prices = products
      .map(p => p.final_price || p.price || p.rate || 0)
      .filter(p => p > 0);

    if (prices.length === 0) {
      return { min: 0, max: 100000 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  };

  const priceRange = calculatePriceRange();

  // Handle category filter change
  const handleCategoryChange = (value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters.category;
    } else {
      newFilters.category = value;
    }
    onFiltersChange(newFilters);
  };

  // Handle diamond size filter change
  const handleDiamondSizeChange = (value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters.diamondSize;
    } else {
      const range = diamondSizeRanges.find(r => r.value === value);
      if (range) {
        newFilters.diamondSize = {
          min: range.min,
          max: range.max,
        };
      }
    }
    onFiltersChange(newFilters);
  };

  // Handle diamond cut filter change
  const handleDiamondCutChange = (value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters.diamondCut;
    } else {
      newFilters.diamondCut = value;
    }
    onFiltersChange(newFilters);
  };

  // Handle diamond color filter change
  const handleDiamondColorChange = (value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters.diamondColor;
    } else {
      newFilters.diamondColor = value;
    }
    onFiltersChange(newFilters);
  };

  // Handle diamond clarity filter change
  const handleDiamondClarityChange = (value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters.diamondClarity;
    } else {
      newFilters.diamondClarity = value;
    }
    onFiltersChange(newFilters);
  };

  // Handle price filter change
  const handlePriceChange = (type, value) => {
    const newFilters = { ...filters };
    if (!newFilters.price) {
      newFilters.price = {};
    }

    if (value === '' || value === null || value === undefined) {
      delete newFilters.price[type];
      if (Object.keys(newFilters.price).length === 0) {
        delete newFilters.price;
      }
    } else {
      newFilters.price[type] = parseFloat(value) || 0;
    }

    onFiltersChange(newFilters);
  };

  // Handle location filter change
  const handleLocationChange = (value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters.location;
    } else {
      newFilters.location = value;
    }
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'price' && filters.price) {
      return Object.keys(filters.price).length > 0;
    }
    if (key === 'diamondSize' && filters.diamondSize) {
      return filters.diamondSize.min !== undefined || filters.diamondSize.max !== undefined;
    }
    if (key === 'diamondCut' || key === 'diamondColor' || key === 'diamondClarity') {
      return filters[key] !== undefined && filters[key] !== null && filters[key] !== '';
    }
    return filters[key] !== undefined && filters[key] !== null && filters[key] !== '';
  }).length;

  return (
    <div className="product-filters">
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
          {/* Category Filter */}
          <div className="filters-section">
            <h3 className="filters-section-title">Product Category</h3>
            <div className="filter-field">
              <label className="filter-label">Category</label>
              <select
                className="filter-select"
                value={filters.category || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">All Categories</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Diamond 4C's Filters */}
          <div className="filters-section">
            <h3 className="filters-section-title">Diamond 4C's</h3>
            
            {/* Carat (Size) Filter */}
            <div className="filter-field">
              <label className="filter-label">Carat (Size)</label>
              <select
                className="filter-select"
                value={
                  filters.diamondSize
                    ? diamondSizeRanges.find(
                        r => r.min === filters.diamondSize.min && r.max === filters.diamondSize.max
                      )?.value || ''
                    : ''
                }
                onChange={(e) => handleDiamondSizeChange(e.target.value)}
              >
                <option value="">All Sizes</option>
                {diamondSizeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cut Filter */}
            <div className="filter-field">
              <label className="filter-label">Cut (Shape)</label>
              <select
                className="filter-select"
                value={filters.diamondCut || ''}
                onChange={(e) => handleDiamondCutChange(e.target.value)}
              >
                <option value="">All Cuts</option>
                {cutOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Filter */}
            <div className="filter-field">
              <label className="filter-label">Color</label>
              <select
                className="filter-select"
                value={filters.diamondColor || ''}
                onChange={(e) => handleDiamondColorChange(e.target.value)}
              >
                <option value="">All Colors</option>
                {colorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clarity Filter */}
            <div className="filter-field">
              <label className="filter-label">Clarity</label>
              <select
                className="filter-select"
                value={filters.diamondClarity || ''}
                onChange={(e) => handleDiamondClarityChange(e.target.value)}
              >
                <option value="">All Clarity Grades</option>
                {clarityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Filter */}
          <div className="filters-section">
            <h3 className="filters-section-title">Price Range</h3>
            <div className="filter-field range-field">
              <label className="filter-label">Price (₹)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  className="filter-input"
                  placeholder={`Min (₹${priceRange.min.toLocaleString()})`}
                  min={priceRange.min}
                  max={priceRange.max}
                  value={filters.price?.min || ''}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                />
                <span className="range-separator">to</span>
                <input
                  type="number"
                  className="filter-input"
                  placeholder={`Max (₹${priceRange.max.toLocaleString()})`}
                  min={priceRange.min}
                  max={priceRange.max}
                  value={filters.price?.max || ''}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div className="filters-section">
            <h3 className="filters-section-title">Location</h3>
            <div className="filter-field">
              <label className="filter-label">Store/Location</label>
              {loading ? (
                <div className="filter-loading">Loading locations...</div>
              ) : (
                <select
                  className="filter-select"
                  value={filters.location || ''}
                  onChange={(e) => handleLocationChange(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {stores.map(store => (
                    <option key={store.id || store.location_id} value={store.id || store.location_id}>
                      {store.location_name || store.name || `Store ${store.id}`}
                    </option>
                  ))}
                </select>
              )}
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
        </div>
      )}
    </div>
  );
};

