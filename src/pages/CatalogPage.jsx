import React, { useState, useMemo } from 'react';
import { useProducts, useDemistifiedProducts } from '../hooks';
import { useCart } from '../context/CartContext';
import { ProductCard, SearchBar, LoadingSpinner, ErrorMessage, DemistifiedFilters, Pagination, CreateLabProductModal } from '../components';
import { ProductFilters } from '../components/ProductFilters';
import { QRScanner } from '../components/QRScanner';
import { ProductCardDetailed } from '../components/ProductCardDetailed';
import { productsApi } from '../services/api';
import { useProductLocations } from '../hooks/useProductLocation';
import { applyProductFilters } from '../utils/productUtils';
import { Plus, QrCode, Grid, List } from 'lucide-react';
import '../styles/CatalogPage.css';

/**
 * CatalogPage Component
 * Displays product catalog for both Lab (Real) and Demistified (Zoho) jewellery with filters
 */
export const CatalogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({});
  const [productType, setProductType] = useState('lab'); // 'lab' or 'demistified'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'detailed'
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  
  // Real products (Lab) - auto-fetch on mount since lab is default tab
  const realProductsHook = useProducts({ autoFetch: true });
  
  // Demistified products (Zoho) - don't auto-fetch, only fetch when user clicks demistified tab
  const demistifiedProductsHook = useDemistifiedProducts({ autoFetch: false });
  
  // Get the active hook based on product type
  const activeHook = productType === 'lab' ? realProductsHook : demistifiedProductsHook;

  // Fetch locations for products (only for lab products in detailed view)
  const { locationsMap, getLocation, loading: locationsLoading } = useProductLocations(
    viewMode === 'detailed' && productType === 'lab' ? (activeHook.products || []) : []
  );

  const { addItem } = useCart();

  // Apply client-side filters for lab products
  const filteredProducts = useMemo(() => {
    if (productType === 'demistified') {
      // Demistified products use their own filter system
      return activeHook.products || [];
    }

    // For lab products, apply client-side filters
    if (Object.keys(filters).length === 0) {
      return activeHook.products || [];
    }

    return applyProductFilters(activeHook.products || [], filters);
  }, [activeHook.products, filters, productType]);

  const handleAddToCart = async (product) => {
    try {
      console.log('🛒 handleAddToCart called:', { productType, product });
      
      // For lab-grown products (real jewelry), we MUST use variant_id
      // For demistified products, we can use item_id, id, or sku
      let productId;
      if (productType === 'lab' && !product.isDemistified) {
        // Lab-grown products require variant_id
        // Check multiple possible locations for variant_id
        const variantId = product.variant_id || 
                         product.variantData?.id || 
                         product.variant?.id ||
                         product.productData?.variants?.[0]?.id;
        
        console.log('🔍 Checking for variant_id:', {
          variant_id: product.variant_id,
          variantData_id: product.variantData?.id,
          variant_id_direct: product.variant?.id,
          productData_variants: product.productData?.variants,
          productData_variants_0_id: product.productData?.variants?.[0]?.id,
          foundVariantId: variantId
        });
        
        if (!variantId) {
          // If no variant_id found, create a synthetic one using product.id
          // Format: "variant_{product_id}" to make it clear it's synthetic
          if (!product.id) {
            const errorMsg = `Error: This product "${product.name || 'Unknown'}" is missing both variant_id and product ID. Cannot add to cart.`;
            console.error('❌ Cannot add product - missing both variant_id and product.id');
            alert(errorMsg);
            return;
          }
          
          // Create synthetic variant_id
          const syntheticVariantId = `variant_${product.id}`;
          console.warn('⚠️ Lab-grown product missing variant_id, creating synthetic variant:', {
            productId: product.id,
            productName: product.name,
            syntheticVariantId,
            hasVariantId: !!product.variant_id,
            hasVariantData: !!product.variantData,
            hasVariant: !!product.variant,
            hasProductData: !!product.productData,
            hasVariants: product.productData?.variants?.length > 0,
            variantsCount: product.productData?.variants?.length || 0
          });
          
          productId = syntheticVariantId;
          console.log('✅ Using synthetic variant_id for lab product without variant:', productId);
        } else {
          productId = variantId;
          console.log('✅ Using variant_id for lab product:', productId);
        }
      } else {
        // Demistified products can use item_id, id, or sku
        productId = product.item_id || product.id || product.sku;
        console.log('✅ Using productId for demistified product:', productId);
      }
      
      // Ensure product data has the correct flags for cart API
      const productData = {
        ...product,
        // Explicitly set flags based on product type
        isRealJewelry: productType === 'lab' && !product.isDemistified,
        isDemistified: productType === 'demistified' || product.isDemistified || false,
        // Ensure variant_id is set for real jewellery - check multiple sources
        variant_id: productType === 'lab' && !product.isDemistified 
          ? (product.variant_id || product.variantData?.id || product.variant?.id || product.productData?.variants?.[0]?.id)
          : product.variant_id,
        // Ensure price is set
        price: product.price || product.final_price || product.rate || 0,
        // Ensure name is set
        name: product.name || product.title || 'Unknown Product',
        // Preserve original product and variant data if available
        productData: product.productData || product,
        variantData: product.variantData || product.variant || product.productData?.variants?.[0]
      };
      
      console.log('🛒 Calling addItem with:', { productId, productData });
      
      await addItem(productId, 1, productData);
      alert('Item added to cart successfully!');
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        product: product,
        productId: productId
      });
      
      const errorMessage = err.message || 'Failed to add item to cart';
      
      // Show the actual error message from backend, don't mask it
      // Only provide helpful context if it's a variant-related error
      let userMessage = errorMessage;
      if (errorMessage.includes('variant_id') || errorMessage.includes('variant')) {
        // Check if product has variant_id or if we're using fallback
        const hasVariant = product.variant_id || product.variantData?.id || product.variant?.id || product.productData?.variants?.[0]?.id;
        if (!hasVariant) {
          userMessage = `This product doesn't have a variant. The backend may require variants for real jewelry products. Error: ${errorMessage}`;
        } else {
          userMessage = `Variant error: ${errorMessage}`;
        }
      }
      
      alert(`Failed to add item to cart: ${userMessage}`);
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
      }
      // For lab products, filters are applied client-side via useMemo
    } catch (err) {
      console.error('Filter error:', err);
    }
  };

  // Handle QR scan success
  const handleQRScanSuccess = async (scannedText) => {
    try {
      setIsSearching(true);
      // Try to search for the product using the scanned QR code
      if (productType === 'lab') {
        await realProductsHook.searchProducts(scannedText);
      } else {
        await demistifiedProductsHook.searchProducts(scannedText);
      }
      setSearchQuery(scannedText);
    } catch (err) {
      console.error('QR scan search error:', err);
      alert(`Product not found for QR code: ${scannedText}`);
    } finally {
      setIsSearching(false);
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

  // Handle create product
  const handleCreateProduct = async (productData, images) => {
    setIsCreating(true);
    try {
      // Step 1: Create the product (without images)
      const response = await productsApi.createLabGrownProduct(productData);
      
      // Step 2: Upload images if provided (using SKU from first variant)
      if (images && images.length > 0 && response.product_summary && response.product_summary.variants && response.product_summary.variants.length > 0) {
        const firstVariant = response.product_summary.variants[0];
        const sku = firstVariant.sku;
        
        if (sku) {
          try {
            await productsApi.uploadImagesForSku(sku, images, {
              compress: true,
              makePublic: true
            });
            console.log(`Images uploaded successfully for SKU: ${sku}`);
          } catch (imageErr) {
            console.error('Error uploading images:', imageErr);
            // Don't fail the whole operation if image upload fails
            alert(`Product created but image upload failed: ${imageErr.message}`);
          }
        } else {
          console.warn('No SKU found in response, skipping image upload');
        }
      }
      
      // Refresh the product list
      await realProductsHook.refetch();
      alert(`Product created successfully! ${response.message || ''}`);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating product:', err);
      alert(`Failed to create product: ${err.message}`);
      throw err; // Re-throw to let modal handle it
    } finally {
      setIsCreating(false);
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

      {/* Product Type Toggle and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '20px', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="form-mode-toggle">
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div className="form-mode-toggle" style={{ marginRight: '0.5rem' }}>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
              title="Detailed View"
            >
              <List size={16} />
            </button>
          </div>

          {/* QR Scanner Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsQRScannerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <QrCode size={18} />
            Scan QR
          </button>

          {/* Create Product Button - Only show on Lab tab */}
          {productType === 'lab' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} />
              Create Product
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {productType === 'demistified' ? (
        <DemistifiedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      ) : (
        <ProductFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          products={activeHook.products || []}
        />
      )}

      {/* Inline loading indicator for search */}
      {(isSearching || (activeHook.loading && !shouldShowFullPageLoader)) && (
        <div className="inline-loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      {/* Products Grid/List */}
      {!shouldShowFullPageLoader && (
        <div className={viewMode === 'detailed' ? 'products-list-detailed' : 'products-grid'}>
          {filteredProducts.map((product) => {
            const productId = product.variant_id || product.id || product.sku;
            const location = viewMode === 'detailed' && productType === 'lab' ? getLocation(productId) : null;

            return viewMode === 'detailed' ? (
              <ProductCardDetailed
                key={`${product.id}-${productType}-detailed`}
                product={product}
                location={location}
                onAddToCart={handleAddToCart}
              />
            ) : (
              <ProductCard
                key={`${product.id}-${productType}`}
                product={product}
                onAddToCart={handleAddToCart}
              />
            );
          })}
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
      {(!filteredProducts || filteredProducts.length === 0) && !shouldShowFullPageLoader && !isSearching && !activeHook.loading && (
        <div className="empty-state">
          <p>No {productType === 'lab' ? 'lab' : 'demistified'} products found {searchQuery && `matching "${searchQuery}"`} {Object.keys(filters).length > 0 && 'with selected filters'}</p>
          {(searchQuery || Object.keys(filters).length > 0) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {searchQuery && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleSearch('')}
                >
                  Clear Search
                </button>
              )}
              {Object.keys(filters).length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleFiltersChange({})}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />

      {/* Create Lab Product Modal */}
      <CreateLabProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
        loading={isCreating}
      />
    </div>
  );
};