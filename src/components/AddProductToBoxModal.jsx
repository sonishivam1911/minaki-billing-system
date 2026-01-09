/**
 * AddProductToBoxModal - Modal for adding products to boxes
 * Search by SKU and auto-fill product details
 * Supports both Lab (real_jewelry) and Demistified (zakya_product) types
 */
import React, { useState, useEffect, useRef } from 'react';
import { useProductLocationTracking } from '../hooks';
import { productsApi, demistifiedProductsApi } from '../services/api';

const AddProductToBoxModal = ({ 
  isOpen, 
  onClose, 
  boxId, // Legacy prop name - maps to storageObjectId
  storageObjectId, // New prop name
  boxName, // Legacy prop name - maps to storageObjectName
  storageObjectName, // New prop name
  boxCapacity, // Legacy prop name - maps to storageObjectCapacity
  storageObjectCapacity, // New prop name
  storageTypeId, // For dropdown
  onProductAdded,
  loading = false 
}) => {
  // Support both legacy and new prop names
  const actualStorageObjectId = storageObjectId || boxId;
  const actualStorageObjectName = storageObjectName || boxName;
  const actualStorageObjectCapacity = storageObjectCapacity || boxCapacity;
  const [formData, setFormData] = useState({
    product_type: 'lab',
    product_id: '',
    product_name: '',
    sku: '',
    quantity: 1,
    metal_weight_g: null,
    purity_k: null
  });
  
  const [errors, setErrors] = useState({});
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Hooks
  const { 
    addProductToBox, 
    error: locationError, 
    loading: locationLoading 
  } = useProductLocationTracking();

  // Track if products have been loaded (cache flag)
  const productsLoadedRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        product_type: 'lab',
        product_id: '',
        product_name: '',
        sku: '',
        quantity: 1,
        metal_weight_g: null,
        purity_k: null
      });
      setErrors({});
      setSkuSearchQuery('');
      setFilteredProducts([]);
      setShowDropdown(false);
    } else {
      // Only fetch products if not already loaded (cache them)
      if (!productsLoadedRef.current && allProducts.length === 0) {
        loadAllProducts();
      }
    }
  }, [isOpen]);

  /**
   * Load all lab and demistified products using product APIs (like CatalogPage)
   * Filter out INACTIVE ones and extract just SKUs
   * Only loads once and caches the results
   * Fetches ALL products in a single call using large page_size
   */
  const loadAllProducts = async () => {
    try {
      setIsLoadingProducts(true);
      
      // Fetch lab products directly from Real Jewelry API (non-paginated)
      const labResponse = await productsApi.getAll(
        {}, false
      );
      const labProds = (labResponse?.products || []).map(p => ({ 
        ...p, 
        productType: 'lab',
        isDemistified: false
      }));

      // Fetch ALL demistified products in a single call - don't pass page/page_size to get all products
      // Don't include with_images for SKU dropdown
      const demistifiedResponse = await demistifiedProductsApi.getAll({
        with_images: false
        // Don't pass page or page_size - API returns all products when these are omitted
      });
      
      const demistifiedProds = (demistifiedResponse?.products || []).map(p => ({ 
        ...p, 
        productType: 'demistified',
        isDemistified: true
      }));

      // Combine and filter
      const allProds = [...labProds, ...demistifiedProds];
      
      // Filter out products with -INACTIVE suffix in SKU
      const activeProds = allProds.filter(p => {
        const sku = (p.sku || p.SKU || '').toString();
        return !sku.includes('-INACTIVE');
      });
      
      setAllProducts(activeProds);
      // Initialize filtered products with all active products for dropdown
      setFilteredProducts(activeProds);
      
      // Mark as loaded so we don't fetch again
      productsLoadedRef.current = true;
      
      console.log('✅ AddProductToBoxModal - Loaded products (cached):', {
        total: allProds.length,
        active: activeProds.length,
        lab: labProds.length,
        demistified: demistifiedProds.length,
        labSample: labProds.slice(0, 2),
        demistifiedSample: demistifiedProds.slice(0, 2)
      });
    } catch (err) {
      console.error('Error loading products:', err);
      setAllProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Filter products by SKU search query and product type
  useEffect(() => {
    const filterBySku = () => {
      // Filter by product type first - show only lab products for lab, demistified for demistified
      const typeFilteredProducts = allProducts.filter(product => {
        const productType = product.productType || (product.isDemistified ? 'demistified' : 'lab');
        return productType === formData.product_type;
      });
      
      // Apply search query if provided
      if (skuSearchQuery.trim().length < 1) {
        setFilteredProducts(typeFilteredProducts);
        return;
      }

      const query = skuSearchQuery.toLowerCase();
      const results = typeFilteredProducts.filter(product => {
        const productSku = (product.sku || product.SKU || '').toString().toLowerCase();
        const productName = (product.name || product.product_name || '').toString().toLowerCase();
        // Search by both SKU and product name
        return productSku.includes(query) || productName.includes(query);
      });
      
      setFilteredProducts(results);
    };

    const debounceTimer = setTimeout(filterBySku, 300);
    return () => clearTimeout(debounceTimer);
  }, [skuSearchQuery, allProducts, formData.product_type]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.product_name?.trim()) {
      newErrors.product_name = 'Product name is required';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.product_type === 'lab') {
      if (formData.metal_weight_g === null || formData.metal_weight_g <= 0) {
        newErrors.metal_weight_g = 'Metal weight is required for lab products';
      }

      if (formData.purity_k === null || formData.purity_k <= 0) {
        newErrors.purity_k = 'Purity is required for lab products';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? (value ? parseFloat(value) : null) : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field if it was set
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Handle product selection from dropdown
   * Auto-fill all product details based on selected product
   */
  const handleProductSelect = (product) => {
    // Determine product type from the selected product
    const productType = product.productType || (product.isDemistified ? 'demistified' : 'lab');
    
    setFormData(prev => ({
      ...prev,
      product_type: productType,
      product_id: product.id || product.product_id || '',
      product_name: product.name || product.product_name || '',
      sku: product.sku || product.SKU || '',
      ...(product.metal_weight_g && { metal_weight_g: product.metal_weight_g }),
      ...(product.purity_k && { purity_k: product.purity_k }),
      quantity: 1
    }));
    setSkuSearchQuery(product.sku || product.SKU || '');
    setShowDropdown(false);
  };

  const handleProductTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      product_type: type
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const productData = {
        storage_object_id: actualStorageObjectId,
        product_type: formData.product_type === 'lab' ? 'real_jewelry' : 'zakya_product',
        product_id: formData.product_id,
        product_name: formData.product_name,
        sku: formData.sku,
        quantity: formData.quantity,
        ...(formData.product_type === 'lab' && {
          metal_weight_g: formData.metal_weight_g,
          purity_k: formData.purity_k
        })
      };

      await addProductToBox(productData, 'app_user');

      // Reset form
      setFormData({
        product_type: 'lab',
        product_id: '',
        product_name: '',
        sku: '',
        quantity: 1,
        metal_weight_g: null,
        purity_k: null
      });
      setErrors({});
      setSkuSearchQuery('');

      if (onProductAdded) {
        onProductAdded();
      }

      onClose();
    } catch (err) {
      console.error('Error adding product:', err);
      setErrors({ submit: err.message || 'Failed to add product' });
    }
  };
  if (!isOpen) return null;

  const isLoading = loading || locationLoading;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content modal-medium" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>📦 Add Product to Storage Object</h2>
            {actualStorageObjectName && (
              <p className="modal-subtitle">{actualStorageObjectName} {actualStorageObjectCapacity && `(Capacity: ${actualStorageObjectCapacity})`}</p>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Product Type Toggle */}
        <div className="form-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${formData.product_type === 'lab' ? 'active' : ''}`}
            onClick={() => handleProductTypeChange('lab')}
            disabled={isLoading}
          >
            💍 Lab
          </button>
          <button
            type="button"
            className={`toggle-btn ${formData.product_type === 'demistified' ? 'active' : ''}`}
            onClick={() => handleProductTypeChange('demistified')}
            disabled={isLoading}
          >
            👜 Demistified
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* Error Message */}
          {(errors.submit || locationError) && (
            <div className="error-alert">
              {errors.submit || locationError}
            </div>
          )}

          {/* SKU Search - Dropdown */}
          <div className="form-group" ref={dropdownRef}>
            <label htmlFor="sku-select">
              Select Product by SKU *
            </label>
            <div className="search-input-wrapper">
              <input
                id="sku-select"
                type="text"
                placeholder={isLoadingProducts ? "Loading products..." : "Type SKU or product name..."}
                value={skuSearchQuery}
                onChange={(e) => {
                  setSkuSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={isLoading || isLoadingProducts}
                className={errors.sku ? 'input-error' : ''}
                autoComplete="off"
              />
              {isLoadingProducts && <span className="search-spinner">⏳</span>}
            </div>

            {/* SKU Dropdown List - Shows ALL products, scrollable */}
            {showDropdown && !isLoadingProducts && (
              <div className="sku-dropdown-container">
                {filteredProducts.length > 0 ? (
                  <ul className="sku-dropdown-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {filteredProducts.map((product) => (
                      <li
                        key={`${product.id}-${product.productType}`}
                        className="sku-dropdown-item"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="dropdown-item-sku">
                          <strong>{product.sku || product.SKU}</strong>
                        </div>
                        <div className="dropdown-item-details">
                          <span className="item-name">{product.name || product.product_name}</span>
                          <span className="item-type">
                            {product.productType === 'lab' ? '💍 Lab' : '👜 Demistified'}
                          </span>
                          {product.metal_weight_g && (
                            <span className="item-meta">⚖️ {product.metal_weight_g}g</span>
                          )}
                          {product.purity_k && (
                            <span className="item-meta">🔱 {product.purity_k}K</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : skuSearchQuery.length > 0 ? (
                  <div className="dropdown-no-results">
                    No products found matching "{skuSearchQuery}"
                  </div>
                ) : (
                  <div className="dropdown-hint">
                    {allProducts.length} active products available
                    {allProducts.length > 0 && (
                      <span style={{ display: 'block', fontSize: '0.85em', marginTop: '5px', color: '#666' }}>
                        💍 Lab: {allProducts.filter(p => p.productType === 'lab').length} | 
                        👜 Demistified: {allProducts.filter(p => p.productType === 'demistified').length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {errors.sku && <span className="error-text">{errors.sku}</span>}
          </div>

          {/* Product Name - Auto-filled */}
          <div className="form-group">
            <label htmlFor="product-name">Product Name *</label>
            <input
              id="product-name"
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              placeholder="Auto-filled when you select a product"
              disabled={true}
              className={errors.product_name ? 'input-error' : ''}
            />
            {errors.product_name && <span className="error-text">{errors.product_name}</span>}
          </div>

          {/* SKU Display - Auto-filled */}
          <div className="form-group">
            <label htmlFor="sku-display">SKU *</label>
            <input
              id="sku-display"
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Auto-filled when you select a product"
              disabled={true}
              className={errors.sku ? 'input-error' : ''}
            />
            {errors.sku && <span className="error-text">{errors.sku}</span>}
          </div>

          {/* Product ID - Auto-filled */}
          <div className="form-group">
            <label htmlFor="product-id">Product ID *</label>
            <input
              id="product-id"
              type="text"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              placeholder="Auto-filled when you select a product"
              disabled={true}
              className={errors.product_id ? 'input-error' : ''}
            />
            {errors.product_id && <span className="error-text">{errors.product_id}</span>}
          </div>

          {/* Quantity */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                disabled={isLoading}
                className={errors.quantity ? 'input-error' : ''}
              />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>

            {/* Lab-specific fields */}
            {formData.product_type === 'lab' && (
              <>
                <div className="form-group">
                  <label htmlFor="metal-weight">Metal Weight (g) *</label>
                  <input
                    id="metal-weight"
                    type="number"
                    name="metal_weight_g"
                    value={formData.metal_weight_g || ''}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    placeholder="Weight in grams"
                    disabled={isLoading}
                    className={errors.metal_weight_g ? 'input-error' : ''}
                  />
                  {errors.metal_weight_g && (
                    <span className="error-text">{errors.metal_weight_g}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="purity">Purity (K) *</label>
                  <input
                    id="purity"
                    type="number"
                    name="purity_k"
                    value={formData.purity_k || ''}
                    onChange={handleChange}
                    min="1"
                    max="24"
                    placeholder="Purity in karats"
                    disabled={isLoading}
                    className={errors.purity_k ? 'input-error' : ''}
                  />
                  {errors.purity_k && (
                    <span className="error-text">{errors.purity_k}</span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductToBoxModal;
