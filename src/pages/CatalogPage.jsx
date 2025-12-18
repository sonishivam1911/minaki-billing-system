import React, { useState } from 'react';
import { useProducts, useDemistifiedProducts } from '../hooks';
import { useCart } from '../context/CartContext';
import { ProductCard, SearchBar, LoadingSpinner, ErrorMessage, DemistifiedFilters, Pagination } from '../components';

/**
 * CatalogPage Component
 * Displays product catalog for both Lab (Real) and Demistified (Zoho) jewellery with filters
 */
export const CatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({});
  const [productType, setProductType] = useState('lab'); // 'lab' or 'demistified'
  
  // Real products (Lab) - auto-fetch on mount since lab is default tab
  const realProductsHook = useProducts({ autoFetch: true });
  
  // Demistified products (Zoho) - don't auto-fetch, only fetch when user clicks demistified tab
  const demistifiedProductsHook = useDemistifiedProducts({ autoFetch: false });
  
  // Get the active hook based on product type
  const activeHook = productType === 'lab' ? realProductsHook : demistifiedProductsHook;

  const { addItem } = useCart();

  const handleAddToCart = async (product) => {
    try {
      const productId = product.variant_id || product.id || product.item_id || product.sku;
      await addItem(productId, 1, product);
      alert('Item added to cart successfully!');
    } catch (err) {
      alert(`Failed to add item to cart: ${err.message}`);
    }
  };

  // Handle product type toggle
  const handleProductTypeChange = async (type) => {
    setProductType(type);
    setSearchQuery(''); // Clear search when switching types
    setFilters({}); // Clear filters when switching types
    
    // If switching to demistified tab and it hasn't been loaded yet, fetch it
    if (type === 'demistified' && !demistifiedProductsHook.hasInitiallyLoaded) {
      try {
        await demistifiedProductsHook.refetch();
      } catch (err) {
        console.error('Error loading demistified products:', err);
      }
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    try {
      if (query.trim()) {
        await activeHook.searchProducts(query);
      } else {
        // If search is cleared, refetch with current filters
        await activeHook.refetch();
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    
    setIsSearching(false);
  };

  // Handle filter changes
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    try {
      // Apply filters to demistified products
      if (productType === 'demistified') {
        await demistifiedProductsHook.applyFilters(newFilters);
      } else {
        // For lab products, refetch with new filters
        await realProductsHook.refetch();
      }
    } catch (err) {
      console.error('Filter error:', err);
    }
  };

  // Handle page change
  const handlePageChange = async (page) => {
    try {
      await activeHook.goToPage(page);
    } catch (err) {
      console.error('Page change error:', err);
    }
  };

  // Show loading spinner when loading
  const shouldShowFullPageLoader = activeHook.loading;

  if (shouldShowFullPageLoader) {
    return <LoadingSpinner message="Loading products..." />;
  }

  if (activeHook.error) {
    return <ErrorMessage message={activeHook.error} onRetry={() => activeHook.refetch()} />;
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Product Catalog</h1>
          <p className="screen-subtitle">Browse and add items to cart</p>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by name, category, brand, or purity..."
        />
      </div>

      {/* Product Type Toggle */}
      <div className="form-mode-toggle" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <button
          type="button"
          className={`toggle-btn ${productType === 'lab' ? 'active' : ''}`}
          onClick={() => handleProductTypeChange('lab')}
          disabled={shouldShowFullPageLoader}
        >
          💍 Lab
        </button>
        <button
          type="button"
          className={`toggle-btn ${productType === 'demistified' ? 'active' : ''}`}
          onClick={() => handleProductTypeChange('demistified')}
          disabled={shouldShowFullPageLoader}
        >
          👜 Demistified
        </button>
      </div>

      {/* Filters - show for demistified products */}
      {productType === 'demistified' && (
        <DemistifiedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      )}

      {/* Inline loading indicator for search */}
      {(isSearching || (activeHook.loading && !shouldShowFullPageLoader)) && (
        <div className="inline-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Products Grid */}
      {!shouldShowFullPageLoader && (
        <div className="products-grid">
          {(activeHook.products || []).map((product) => (
            <ProductCard
              key={`${product.id}-${productType}`}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!shouldShowFullPageLoader && activeHook.totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination
            currentPage={activeHook.currentPage}
            totalPages={activeHook.totalPages}
            onPageChange={handlePageChange}
            disabled={activeHook.loading || isSearching}
          />
        </div>
      )}

      {/* Empty State */}
      {(!activeHook.products || activeHook.products.length === 0) && !shouldShowFullPageLoader && !isSearching && !activeHook.loading && (
        <div className="empty-state">
          <p>No {productType === 'lab' ? 'lab' : 'demistified'} products found {searchQuery && `matching "${searchQuery}"`}</p>
          {searchQuery && (
            <button 
              className="btn btn-secondary" 
              onClick={() => handleSearch('')}
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};