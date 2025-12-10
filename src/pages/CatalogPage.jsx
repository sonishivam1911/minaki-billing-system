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
  const [activeTab, setActiveTab] = useState('demified'); // 'real' or 'demified' - default to demified
  const [isSearching, setIsSearching] = useState(false);
  
  // Temporarily disable real products since /products endpoint is not ready
  // const { products: realProducts, loading: realLoading, error: realError, refetch: realRefetch } = useProducts();
  const realProducts = [];
  const realLoading = false;
  const realError = null;
  const realRefetch = () => {};
  
  const { 
    products: demifiedProducts, 
    loading: demifiedLoading, 
    error: demifiedError, 
    currentPage,
    totalPages,
    totalItems,
    refetch: demifiedRefetch,
    goToPage,
    searchProducts 
  } = useDemifiedProducts({ 
    initialPage: 1, 
    pageSize: 20 
  });
  
  const { addItem } = useCart();

  // Add logging for debugging
  console.log('📊 CatalogPage - Render state:');
  console.log('📊 demifiedProducts:', demifiedProducts);
  console.log('📊 demifiedProducts length:', demifiedProducts?.length);
  console.log('📊 demifiedLoading:', demifiedLoading);
  console.log('📊 demifiedError:', demifiedError);
  console.log('📊 activeTab:', activeTab);
  console.log('📊 currentPage:', currentPage);
  console.log('📊 totalPages:', totalPages);

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
    
    if (activeTab === 'demified') {
      if (query.trim()) {
        try {
          await searchProducts(query, 1);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        // If search is cleared, refetch original data
        try {
          await demifiedRefetch();
        } catch (err) {
          console.error('Refetch error:', err);
        }
      }
    }
    
    setIsSearching(false);
  };

  // Handle page changes
  const handlePageChange = async (page) => {
    if (searchQuery.trim()) {
      // If we're in search mode, search with the new page
      await searchProducts(searchQuery, page);
    } else {
      // Normal pagination
      await goToPage(page);
    }
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setIsSearching(false);
    // Reset to first page when changing tabs
    if (tab === 'demified') {
      goToPage(1);
    }
  };

  // Get current state based on active tab
  const currentProducts = activeTab === 'real' ? realProducts : demifiedProducts;
  const currentLoading = activeTab === 'real' ? realLoading : demifiedLoading || isSearching;
  const currentError = activeTab === 'real' ? realError : demifiedError;
  const currentRefetch = activeTab === 'real' ? realRefetch : demifiedRefetch;

  if (currentLoading) {
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
          <span className="tab-count">({totalItems || demifiedProducts.length})</span>
        </button>
        <button
          className={`tab-button disabled`}
          disabled
          title="Real jewellery endpoint not ready yet"
        >
          Real Jewellery (Coming Soon)
          <span className="tab-count">(0)</span>
        </button>
      </div>

      {/* Products Grid */}
      <div className="products-grid">
        {currentProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* Empty State */}
      {currentProducts.length === 0 && !currentLoading && (
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
      {activeTab === 'demified' && currentProducts.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          disabled={currentLoading}
          maxVisiblePages={7}
          showFirstLast={true}
        />
      )}
    </div>
  );
};