import React, { useState, useEffect } from 'react';
import { useProducts, useDemifiedProducts } from '../hooks';
import { useCart } from '../context/CartContext';
import { ProductCard, SearchBar, LoadingSpinner, ErrorMessage, Pagination } from '../components';

/**
 * CatalogPage Component
 * Displays product catalog with tabs for Real and Demified jewellery with pagination
 */
export const CatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('demified'); // Default to demified jewelry which will auto-load
  const [isSearching, setIsSearching] = useState(false);
  
  // Demified products - auto-fetch since it's the default tab
  const demifiedProductsHook = useDemifiedProducts({ 
    initialPage: 1, 
    pageSize: 20,
    autoFetch: true // Auto-fetch since demified is the default
  });

  // Real products - lazy loaded only when user clicks the Real tab
  const realProductsHook = useProducts({ autoFetch: false });

  // Real products state tracking
  const [realProductsLoaded, setRealProductsLoaded] = useState(false); // Set to false since no auto-fetch
  const [demifiedProductsLoaded, setDemifiedProductsLoaded] = useState(true); // Set to true since auto-fetch is enabled

  const { addItem } = useCart();

  // Load real products when needed
  const loadRealProducts = async () => {
    if (realProductsLoaded || realProductsHook.loading) {
      console.log('📦 Real products already loaded or loading, skipping...');
      return;
    }

    console.log('📦 Loading real products for the first time...');
    
    try {
      await realProductsHook.forceRefetch();
      setRealProductsLoaded(true);
      console.log('✅ Real products loaded successfully:', realProductsHook.products?.length, 'items');
    } catch (err) {
      console.error('❌ Failed to load real products:', err);
    }
  };

  // Load demified products when needed
  const loadDemifiedProducts = async () => {
    if (demifiedProductsLoaded || demifiedProductsHook.loading) {
      console.log('📦 Demified products already loaded or loading, skipping...');
      return;
    }

    console.log('📦 Loading demified products for the first time...');
    
    try {
      await demifiedProductsHook.refetch();
      setDemifiedProductsLoaded(true);
      console.log('✅ Demified products loaded successfully:', demifiedProductsHook.products?.length, 'items');
    } catch (err) {
      console.error('❌ Failed to load demified products:', err);
    }
  };

  // Handle tab switching with lazy loading
  const handleTabSwitch = (tab) => {
    console.log(`📊 Switching to ${tab} tab`);
    setActiveTab(tab);
    
    // Clear search when switching tabs
    setSearchQuery('');
    setIsSearching(false);
    
    // Load real products only when user clicks the real tab for the first time
    if (tab === 'real' && !realProductsLoaded) {
      console.log('🔍 Real tab selected but not loaded, loading...');
      loadRealProducts();
    }
    // Demified products auto-load since autoFetch is true
  };

  const handleAddToCart = async (product) => {
    console.log('🛍️ CatalogPage - handleAddToCart called with product:', product);
    try {
      console.log('🛍️ CatalogPage - calling addItem with product.id:', product.id);
      // Pass the complete product object as productData for the new API
      await addItem(product.id, 1, product);
      console.log('✅ CatalogPage - addItem completed successfully');
      alert('Item added to cart successfully!'); // Temporary success feedback
    } catch (err) {
      console.error('❌ CatalogPage - handleAddToCart error:', err);
      alert(`Failed to add item to cart: ${err.message}`);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    try {
      if (activeTab === 'demified') {
        // Demified products should already be loaded since autoFetch is true
        if (query.trim()) {
          await demifiedProductsHook.searchProducts(query, 1);
        } else {
          // If search is cleared, refetch original data
          await demifiedProductsHook.refetch();
        }
      } else if (activeTab === 'real') {
        // Ensure real products are loaded before searching
        if (!realProductsLoaded) {
          await loadRealProducts();
        }
        
        if (query.trim()) {
          await realProductsHook.searchProducts(query);
        } else {
          // If search is cleared, refetch original data
          await realProductsHook.refetch();
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    
    setIsSearching(false);
  };

  // Handle tab changes with lazy loading
  const handleTabChange = (tab) => {
    console.log(`🔄 Switching to ${tab} tab...`);
    setActiveTab(tab);
    setSearchQuery('');
    setIsSearching(false);
    
    // Lazy load real products only when user clicks on real tab for the first time
    if (tab === 'real' && !realProductsLoaded) {
      console.log('🚀 First time accessing Real tab, loading products...');
      loadRealProducts();
    }
    // Demified products auto-load since autoFetch is true
    
    console.log(`✅ Switched to ${tab} tab`);
  };

  // Handle page changes (only for demified products)
  const handlePageChange = async (page) => {
    if (activeTab !== 'demified') return; // Only handle pagination for demified products
    
    if (searchQuery.trim()) {
      // If we're in search mode, search with the new page
      await demifiedProductsHook.searchProducts(searchQuery, page);
    } else {
      // Normal pagination
      await demifiedProductsHook.goToPage(page);
    }
  };

  // Get current state based on active tab
  const currentProducts = activeTab === 'real' ? realProductsHook.products : demifiedProductsHook.products;
  const currentLoading = activeTab === 'real' ? 
    (realProductsHook.loading && !realProductsLoaded) : 
    demifiedProductsHook.loading;
  const currentError = activeTab === 'real' ? realProductsHook.error : demifiedProductsHook.error;
  const currentRefetch = activeTab === 'real' ? () => loadRealProducts() : () => demifiedProductsHook.refetch();
  const currentPagination = activeTab === 'real' ? 
    { 
      currentPage: realProductsHook.currentPage, 
      totalPages: realProductsHook.totalPages, 
      totalItems: realProductsHook.totalItems 
    } :
    { 
      currentPage: demifiedProductsHook.currentPage, 
      totalPages: demifiedProductsHook.totalPages, 
      totalItems: demifiedProductsHook.totalItems 
    };

  // Show loading spinner only for initial loads
  const shouldShowFullPageLoader = currentLoading;

  // Show load button only for real products when not loaded
  const shouldShowLoadButton = (
    activeTab === 'real' && !realProductsLoaded && !realProductsHook.loading
  ) && !searchQuery;

  if (shouldShowFullPageLoader) {
    return <LoadingSpinner message={`Loading ${activeTab} products...`} />;
  }

  if (currentError) {
    return <ErrorMessage message={currentError} onRetry={currentRefetch} />;
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

      {/* Product Tabs */}
      <div className="product-tabs">
        <button
          className={`tab-button ${activeTab === 'demified' ? 'active' : ''}`}
          onClick={() => handleTabChange('demified')}
        >
          Demified Jewellery
          <span className="tab-count">({demifiedProductsHook.totalItems || demifiedProductsHook.products?.length || 0})</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'real' ? 'active' : ''}`}
          onClick={() => handleTabChange('real')}
        >
          Real Jewellery
          <span className="tab-count">
            {realProductsLoaded ? `(${realProductsHook.totalItems || realProductsHook.products?.length || 0})` : '(...)'}
          </span>
        </button>
      </div>

      {/* Inline loading indicator for search/pagination */}
      {(isSearching || (demifiedProductsHook.loading && demifiedProductsLoaded)) && (
        <div className="inline-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Load Products Button - only for Real Jewellery */}
      {shouldShowLoadButton && (
        <div className="load-products-container">
          <div className="load-products-message">
            <h3>Ready to browse real jewellery?</h3>
            <p>Click the button below to load real products</p>
            <button 
              className="btn btn-primary btn-large"
              onClick={() => loadRealProducts()}
            >
              Load Real Jewellery
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!shouldShowLoadButton && (
        <div className="products-grid">
          {(currentProducts || []).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {(!currentProducts || currentProducts.length === 0) && !shouldShowFullPageLoader && !isSearching && !shouldShowLoadButton && !(demifiedProductsHook.loading) && (
        <div className="empty-state">
          <p>No {activeTab} products found {searchQuery && `matching "${searchQuery}"`}</p>
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

      {/* Pagination - only show for demified products when we have results */}
      {activeTab === 'demified' && currentProducts && currentProducts.length > 0 && currentPagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPagination.currentPage}
          totalPages={currentPagination.totalPages}
          onPageChange={handlePageChange}
          disabled={currentLoading}
          maxVisiblePages={7}
          showFirstLast={true}
        />
      )}
    </div>
  );
};