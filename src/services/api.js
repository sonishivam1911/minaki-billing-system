// API Base URL - update this to your backend URL
// In development, use proxy. In production, use full URL
let VITE_API_URL = import.meta.env.VITE_API_URL;

// Force relative URL for development to ensure proxy works
if (!VITE_API_URL || VITE_API_URL.startsWith('http://localhost:')) {
  VITE_API_URL = null; // Use the default relative path
}

const API_BASE_URL = VITE_API_URL || '/billing_system/api';

console.log('🌐 API_BASE_URL:', API_BASE_URL);
console.log('🌐 Environment variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  forcedRelative: !VITE_API_URL
});


/**
 * API Service Layer
 * Handles all HTTP requests to the FastAPI backend
 */

// Products API
export const productsApi = {
  /**
   * Fetch all products (Real Jewelry)
   * GET /products
   */
  getAll: async (params = {}, isPaginated = true) => {
    try {
      // Set default parameters
      const defaultParams = isPaginated ? {
        page: '1',
        page_size: '20',
      } : {};

      // Merge with provided params
      const finalParams = { ...defaultParams, ...params };
      const queryString = new URLSearchParams(finalParams).toString();
      const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;
      
      console.log('💎 Real Jewelry API - Fetching URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      
      console.log('💎 Real Jewelry API - Raw response:', {
        hasProducts: !!data.products,
        productsLength: data.products?.length,
        total: data.total,
        page: data.page,
        page_size: data.page_size
      });

      // Transform API response to match frontend structure
      const transformedProducts = data.products?.map(product => {
        // Get the first variant for display
        const variant = product.variants?.[0];
        const pricingBreakdown = variant?.pricing_breakdown;
        
        return {
          id: product.id,
          variant_id: variant?.id,
          name: product.title,
          description: product.description,
          vendor: product.vendor,
          category: product.product_type,
          price: parseFloat(pricingBreakdown?.final_price || variant?.price || 0),
          base_price: parseFloat(variant?.base_cost || variant?.price || 0),
          sku: variant?.sku,
          sku_name: variant?.sku_name,
          handle: product.handle,
          
          // Weight and purity information
          weight: parseFloat(variant?.weight_g || 0),
          net_weight: parseFloat(variant?.net_weight_g || 0),
          purity: `${variant?.purity_k}K`,
          
          // Pricing breakdown
          metal_cost: parseFloat(pricingBreakdown?.metal_cost || 0),
          stone_cost: parseFloat(pricingBreakdown?.stone_cost || 0),
          making_charges: parseFloat(pricingBreakdown?.making_charges || 0),
          gst_amount: parseFloat(pricingBreakdown?.gst_amount || 0),
          
          // Metal and diamond components
          metal_components: variant?.metal_components || [],
          diamond_components: variant?.diamond_components || [],
          
          // Status and metadata
          status: variant?.status,
          tags: product.tags || [],
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          
          // Stock information
          stock: 1, // Jewelry items are typically unique pieces
          track_serials: variant?.track_serials || false,
          
          // Display image (placeholder for now)
          image: '💍',
          
          // Flag to identify as real jewelry
          isRealJewelry: true,
          isDemified: false,
          
          // Full product and variant data for cart operations
          productData: product,
          variantData: variant
        };
      }) || [];

      console.log('💎 Real Jewelry API - Transformed products:', {
        transformedCount: transformedProducts.length,
        firstProduct: transformedProducts[0] ? {
          id: transformedProducts[0].id,
          name: transformedProducts[0].name,
          price: transformedProducts[0].price
        } : null
      });

      // Return both products and metadata - simplified structure
      const result = {
        products: transformedProducts,
        total: data.total || 0,
        page: parseInt(data.page) || 1,
        page_size: parseInt(data.page_size) || 20,
        pagination: {
          currentPage: parseInt(data.page) || 1,
          totalPages: Math.ceil((data.total || 0) / parseInt(data.page_size || 20)),
          totalItems: data.total || 0,
          pageSize: parseInt(data.page_size) || 20
        }
      };

      console.log('💎 Real Jewelry API - Final result:', {
        hasProducts: result.products && result.products.length > 0,
        productCount: result.products?.length,
        total: result.total,
        pagination: result.pagination
      });

      // For backwards compatibility, return just the products array if called in simple mode
      return result;
    } catch (error) {
      console.error('🚨 Real Jewelry API - Error in getAll:', error);
      throw error;
    }
  },

  /**
   * Get product by ID
   * GET /api/products/{id}
   */
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const data = await response.json();
    
    // Transform the API response to match our product structure
    const product = data.product || data;
    const variant = product.variants?.[0];
    const pricingBreakdown = variant?.pricing_breakdown;
    
    return {
      id: product.id,
      variant_id: variant?.id,
      name: product.title,
      description: product.description,
      vendor: product.vendor,
      category: product.product_type,
      price: parseFloat(pricingBreakdown?.final_price || variant?.price || 0),
      base_price: parseFloat(variant?.base_cost || variant?.price || 0),
      sku: variant?.sku,
      sku_name: variant?.sku_name,
      handle: product.handle,
      
      // Weight and purity information
      weight: parseFloat(variant?.weight_g || 0),
      net_weight: parseFloat(variant?.net_weight_g || 0),
      purity: `${variant?.purity_k}K`,
      
      // Pricing breakdown
      metal_cost: parseFloat(pricingBreakdown?.metal_cost || 0),
      stone_cost: parseFloat(pricingBreakdown?.stone_cost || 0),
      making_charges: parseFloat(pricingBreakdown?.making_charges || 0),
      gst_amount: parseFloat(pricingBreakdown?.gst_amount || 0),
      
      // Metal and diamond components
      metal_components: variant?.metal_components || [],
      diamond_components: variant?.diamond_components || [],
      
      // Status and metadata
      status: variant?.status,
      tags: product.tags || [],
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
      
      // Stock information
      stock: 1, // Jewelry items are typically unique pieces
      track_serials: variant?.track_serials || false,
      
      // Display image (placeholder for now)
      image: '💍',
      
      // Flag to identify as real jewelry
      isRealJewelry: true,
      isDemified: false,
      
      // Full product and variant data for cart operations
      productData: product,
      variantData: variant
    };
  },

  /**
   * Create new product
   * POST /api/products
   */
  create: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  /**
   * Update product
   * PUT /api/products/{id}
   */
  update: async (id, productData) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error('Failed to update product');
    return response.json();
  },

  /**
   * Delete product
   * DELETE /api/products/{id}
   */
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete product');
    return response.json();
  },

  /**
   * Search products
   * GET /api/products/search
   */
  search: async (query, params = {}) => {
    const searchParams = new URLSearchParams({
      q: query,
      ...params
    });
    const response = await fetch(`${API_BASE_URL}/products/search?${searchParams}`);
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  },
};

// Demified Products API
export const demifiedProductsApi = {
  /**
   * Fetch all demified products with optional filters
   * GET /products/zakya/products
   */
  getAll: async (params = {}) => {
    try {
      // Build params - only include page/page_size if explicitly provided
      // Backend returns ALL products when page/page_size are omitted
      const finalParams = {
        with_images: 'true',
        ...params
      };
      
      // Remove page/page_size if they're null/undefined to get all products
      if (finalParams.page === null || finalParams.page === undefined) {
        delete finalParams.page;
      }
      if (finalParams.page_size === null || finalParams.page_size === undefined) {
        delete finalParams.page_size;
      }
      
      const queryString = new URLSearchParams(finalParams).toString();
      const url = `${API_BASE_URL}/products/zakya/products${queryString ? `?${queryString}` : ''}`;
      
      console.log('🌐 Demified API - Fetching URL:', url);
      console.log('🌐 Demified API - Full URL construction:', {
        API_BASE_URL,
        finalUrl: url,
        isRelativeUrl: !url.startsWith('http'),
        willUseProxy: !url.startsWith('http')
      });
      console.log('🌐 Demified API - Parameters:', finalParams);
      
      const response = await fetch(url);
      
      console.log('🌐 Demified API - Response status:', response.status, response.statusText);
      console.log('🌐 Demified API - Response headers:', {
        contentType: response.headers.get('content-type'),
        server: response.headers.get('server'),
        date: response.headers.get('date')
      });
      
      if (!response.ok) {
        console.error('🚨 Demified API - Response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch demified products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('🗂️ Demified API - Raw response structure:', {
        hasProducts: !!data.products,
        productsLength: data.products?.length,
        totalPages: data.total_pages,
        currentPage: data.current_page,
        totalItems: data.total_items,
        pageSize: data.page_size,
        hasNext: data.has_next,
        hasPrev: data.has_prev,
        otherKeys: Object.keys(data).filter(key => !['products', 'total_pages', 'current_page', 'total_items', 'page_size', 'has_next', 'has_prev'].includes(key))
      });

      // Transform API response to match our product structure
      const transformedProducts = data.products?.map(product => ({
        id: product.item_id,
        name: product.name || product.item_name,
        category: product.category_name || 'Uncategorized',
        price: product.rate || 0,
        stock: product.available_stock || 0,
        weight: null, // Not provided in API
        purity: product.cf_finish || product.cf_work,
        image: product.shopify_image?.url || '💎',
        brand: product.brand,
        description: product.description,
        sku: product.sku,
        gender: product.cf_gender,
        work: product.cf_work,
        finish: product.cf_finish,
        finding: product.cf_finding,
        collection: product.cf_collection,
        isDemified: true, // Flag to identify demified products
      })) || [];

      // Return both products and pagination metadata
      return {
        products: transformedProducts,
        pagination: {
          currentPage: data.current_page || parseInt(finalParams.page) || 1,
          totalPages: data.total_pages || 1,
          totalItems: data.total_items || transformedProducts.length,
          pageSize: data.page_size || parseInt(finalParams.page_size) || 20,
          hasNext: data.has_next || false,
          hasPrev: data.has_prev || false
        },
        rawCount: transformedProducts.length
      };
    } catch (error) {
      console.error('🚨 Demified API - Error in getAll:', error);
      throw error;
    }
  },

  /**
   * Search demified products
   * GET /products/zakya/products with search_query
   */
  search: async (searchQuery, additionalParams = {}) => {
    return await demifiedProductsApi.getAll({
      search_query: searchQuery,
      with_images: 'true',
      ...additionalParams
    });
  },

  /**
   * Get products by category
   * GET /products/zakya/products with category filtering
   */
  getByCategory: async (categories, additionalParams = {}) => {
    const categoryList = Array.isArray(categories) ? categories.join(',') : categories;
    return await demifiedProductsApi.getAll({
      category_list: categoryList,
      with_images: 'true',
      ...additionalParams
    });
  },

  /**
   * Get products by price range
   * GET /products/zakya/products with price filtering
   */
  getByPriceRange: async (minPrice, maxPrice, additionalParams = {}) => {
    return await demifiedProductsApi.getAll({
      price_min: minPrice,
      price_max: maxPrice,
      with_images: 'true',
      ...additionalParams
    });
  },

  /**
   * Get single demified product by SKU
   * GET /products/zakya/products/{sku}?with_image=true
   */
  getById: async (sku) => {
    try {
      const url = `${API_BASE_URL}/products/zakya/products/${encodeURIComponent(sku)}?with_image=true`;
      console.log('🚀 Demified API - Get single product URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('🚨 Demified API - Single product response not ok:', response.status, response.statusText);
        throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🗂️ Demified API - Single product response:', data);

      // Transform single product response to match our structure
      const product = data.product || data;
      return {
        id: product.item_id,
        name: product.name || product.item_name,
        category: product.category_name || 'Uncategorized',
        price: product.rate || 0,
        rate: product.rate || 0,
        stock: product.available_stock || product.stock_on_hand || 0,
        stock_on_hand: product.available_stock || product.stock_on_hand || 0,
        weight: null, // Not provided in API
        purity: product.cf_finish || product.cf_work,
        image: product.shopify_image?.url || '💎',
        brand: product.brand,
        description: product.description,
        sku: product.sku,
        gender: product.cf_gender,
        work: product.cf_work,
        finish: product.cf_finish,
        finding: product.cf_finding,
        collection: product.cf_collection,
        isDemified: true, // Flag to identify demified products
      };
    } catch (error) {
      console.error('🚨 Demified API - Error in getById:', error);
      throw error;
    }
  },

  /**
   * Update single demified product
   * PATCH /products/zakya/products/{sku}
   */
  update: async (sku, updates) => {
    try {
      const params = new URLSearchParams();
      
      // Add updates as query parameters
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const url = `${API_BASE_URL}/products/zakya/products/${encodeURIComponent(sku)}?${params.toString()}`;
      console.log('🚀 Demified API - Update product URL:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        console.error('🚨 Demified API - Update response not ok:', response.status, response.statusText);
        throw new Error(`Failed to update product: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🗂️ Demified API - Update response:', data);
      return data;
    } catch (error) {
      console.error('🚨 Demified API - Error in update:', error);
      throw error;
    }
  },

  /**
   * Bulk update demified products
   * PATCH /products/zakya/products/bulk-update
   */
  bulkUpdate: async (filterCriteria, updates) => {
    try {
      const url = `${API_BASE_URL}/products/zakya/products/bulk-update`;
      console.log('🚀 Demified API - Bulk update URL:', url);
      
      const body = {
        filter_criteria: filterCriteria,
        updates: updates
      };
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        console.error('🚨 Demified API - Bulk update response not ok:', response.status, response.statusText);
        throw new Error(`Failed to bulk update products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🗂️ Demified API - Bulk update response:', data);
      return data;
    } catch (error) {
      console.error('🚨 Demified API - Error in bulkUpdate:', error);
      throw error;
    }
  },
};

// Cart API
export const cartApi = {
  /**
   * Create new cart
   * POST /api/carts
   */
  create: async () => {
    // Generate a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const url = `${API_BASE_URL}/carts`;
    const body = { session_id: sessionId };
    
    console.log('🛒 Cart API - Create cart request:', {
      url,
      method: 'POST',
      body
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    console.log('🛒 Cart API - Create cart response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🛒 Cart API - Create cart error response:', errorText);
      throw new Error(`Failed to create cart: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🛒 Cart API - Create cart success:', result);
    return result;
  },

  /**
   * Get cart by ID
   * GET /api/carts/{id}
   */
  getById: async (cartId) => {
    const url = `${API_BASE_URL}/carts/${cartId}`;
    
    console.log('🛒 Cart API - Get cart request:', {
      url,
      method: 'GET',
      cartId
    });
    
    const response = await fetch(url);
    
    console.log('🛒 Cart API - Get cart response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🛒 Cart API - Get cart error response:', errorText);
      throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🛒 Cart API - Get cart success:', result);
    
    // Log the structure of items to understand what's missing
    if (result.items && result.items.length > 0) {
      console.log('🛒 Cart API - Items analysis:');
      result.items.forEach((item, index) => {
        console.log(`🛒 Cart API - Item ${index}:`, {
          hasId: !!item.id,
          hasCartItemId: !!item.cart_item_id,
          hasName: !!item.name,
          hasPrice: !!item.price,
          priceValue: item.price,
          priceType: typeof item.price,
          hasQuantity: !!item.quantity,
          quantityValue: item.quantity,
          quantityType: typeof item.quantity,
          allKeys: Object.keys(item),
          item: item
        });
      });
    }
    
    return result;
  },

  /**
   * Add item to cart - Updated for new polymorphic API
   * POST /api/carts/{id}/items
   */
  addItem: async (cartId, productId, quantity = 1, productData = {}) => {
    const url = `${API_BASE_URL}/carts/${cartId}/items`;
    
    // Determine the correct format based on product data
    // IMPORTANT: Check for real jewelry FIRST before demified products
    let body;
    
    if (productData.isRealJewelry || productData.variant_id) {
      // Real jewelry with variant - check this FIRST
      body = {
        item_type: "real_jewelry", 
        item_id: productData.variant_id || productId,
        quantity: quantity,
        discount_percent: 0,
        unit_price: productData.price || 0,
        item_name: productData.name
      };
    } else if (productData.isDemified) {
      // Zakya/Demified product - explicitly check isDemified flag
      body = {
        item_type: "zakya_product",
        item_id: productId,
        quantity: quantity,
        discount_percent: 0,
        // Add price as fallback if backend doesn't fetch it properly
        unit_price: productData.price || productData.rate || 0,
        item_name: productData.name
      };
    } else if (productData.sku && !productData.variant_id) {
      // Use SKU auto-detection (for demified products without variant_id)
      body = {
        sku: productData.sku,
        quantity: quantity,
        discount_percent: 0,
        unit_price: productData.price || productData.rate || 0,
        item_name: productData.name
      };
    } else {
      // Fallback: assume it's a zakya product and use productId
      body = {
        item_type: "zakya_product",
        item_id: productId,
        quantity: quantity,
        discount_percent: 0,
        unit_price: productData.price || productData.rate || 0,
        item_name: productData.name
      };
    }
    
    console.log('🛒 Cart API - Add item request:', {
      url,
      method: 'POST',
      body,
      cartId,
      productId,
      quantity,
      productData
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    console.log('🛒 Cart API - Add item response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🛒 Cart API - Add item error response:', errorText);
      throw new Error(`Failed to add item to cart: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🛒 Cart API - Add item success:', result);
    return result;
  },

  /**
   * Update cart item quantity
   * PUT /api/carts/{cartId}/items/{itemId}
   */
  updateItem: async (cartId, itemId, quantity) => {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    return response.json();
  },

  /**
   * Remove item from cart
   * DELETE /api/carts/{cartId}/items/{itemId}
   */
  removeItem: async (cartId, itemId) => {
    const url = `${API_BASE_URL}/carts/${cartId}/items/${itemId}`;
    
    console.log('🛒 Cart API - Remove item request:', {
      url,
      method: 'DELETE',
      cartId,
      itemId
    });
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    console.log('🛒 Cart API - Remove item response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🛒 Cart API - Remove item error response:', errorText);
      throw new Error(`Failed to remove item from cart: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🛒 Cart API - Remove item success:', result);
    return result;
  },

  /**
   * Hold/pause cart transaction
   * POST /api/carts/{id}/hold
   */
  hold: async (cartId) => {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/hold`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to hold cart');
    return response.json();
  },

  /**
   * Resume held cart
   * POST /api/carts/{id}/resume
   */
  resume: async (cartId) => {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/resume`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to resume cart');
    return response.json();
  },

  /**
   * Clear cart
   * DELETE /api/carts/{id}
   */
  clear: async (cartId) => {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to clear cart');
    return response.json();
  },
};

// Customers API
export const customersApi = {
  /**
   * Get all customers
   * GET /billing_system/api/customers
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams({
      limit: '50',
      offset: '0',
      status: 'Active',
      ...params
    }).toString();
    const url = `${API_BASE_URL}/customers${queryString ? `?${queryString}` : ''}`;
    
    console.log('👥 Customers API - Get all request:', { url, params });
    
    const response = await fetch(url);
    console.log('👥 Customers API - Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Error response:', errorText);
      throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Get all success:', result);
    return result;
  },

  /**
   * Search customers
   * GET /billing_system/api/customers/search
   */
  search: async (searchParams = {}) => {
    const queryString = new URLSearchParams(searchParams).toString();
    const url = `${API_BASE_URL}/customers/search${queryString ? `?${queryString}` : ''}`;
    
    console.log('👥 Customers API - Search request:', { url, searchParams });
    
    const response = await fetch(url);
    console.log('👥 Customers API - Search response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Search error response:', errorText);
      throw new Error(`Failed to search customers: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Search success:', result);
    return result;
  },

  /**
   * Get customer by Contact ID
   * GET /billing_system/api/customers/by-contact-id/{contact_id}
   */
  getByContactId: async (contactId) => {
    const url = `${API_BASE_URL}/customers/by-contact-id/${contactId}`;
    
    console.log('👥 Customers API - Get by contact ID request:', { url, contactId });
    
    const response = await fetch(url);
    console.log('👥 Customers API - Get by contact ID response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Get by contact ID error response:', errorText);
      throw new Error(`Failed to fetch customer: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Get by contact ID success:', result);
    return result;
  },

  /**
   * Get customer by Customer Number
   * GET /billing_system/api/customers/by-number/{customer_number}
   */
  getByCustomerNumber: async (customerNumber) => {
    const url = `${API_BASE_URL}/customers/by-number/${customerNumber}`;
    
    console.log('👥 Customers API - Get by customer number request:', { url, customerNumber });
    
    const response = await fetch(url);
    console.log('👥 Customers API - Get by customer number response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Get by customer number error response:', errorText);
      throw new Error(`Failed to fetch customer: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Get by customer number success:', result);
    return result;
  },

  /**
   * Create new customer
   * POST /billing_system/api/customers
   */
  create: async (customerData) => {
    const url = `${API_BASE_URL}/customers`;
    
    // Transform frontend data to API format
    const apiData = {
      full_name: customerData.name,
      email: customerData.email || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || '',
      state: customerData.state || '',
      postal_code: customerData.postal_code || '',
      customer_type: customerData.customer_type || 'regular'
    };
    
    console.log('👥 Customers API - Create request:', { url, customerData, apiData });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });
    
    console.log('👥 Customers API - Create response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Create error response:', errorText);
      throw new Error(`Failed to create customer: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Create success:', result);
    
    // Return the customer data from the response
    return result.customer_data || result;
  },

  /**
   * Update customer
   * PATCH /billing_system/api/customers/contact-id/{contact_id}
   */
  update: async (contactId, customerData) => {
    const url = `${API_BASE_URL}/customers/contact-id/${contactId}`;
    
    // Transform frontend data to API format
    const apiData = {
      full_name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      postal_code: customerData.postal_code,
      customer_type: customerData.customer_type
    };
    
    console.log('👥 Customers API - Update request:', { url, contactId, customerData, apiData });
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });
    
    console.log('👥 Customers API - Update response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Update error response:', errorText);
      throw new Error(`Failed to update customer: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Update success:', result);
    return result;
  },

  /**
   * Update customer status
   * POST /billing_system/api/customers/contact-id/{contact_id}/status
   */
  updateStatus: async (contactId, status) => {
    const url = `${API_BASE_URL}/customers/contact-id/${contactId}/status?status=${encodeURIComponent(status)}`;
    
    console.log('👥 Customers API - Update status request:', { url, contactId, status });
    
    const response = await fetch(url, {
      method: 'POST',
    });
    
    console.log('👥 Customers API - Update status response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Update status error response:', errorText);
      throw new Error(`Failed to update customer status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Update status success:', result);
    return result;
  },

  /**
   * Get customer purchase history
   * GET /billing_system/api/customers/contact-id/{contact_id}/purchases
   */
  getPurchaseHistory: async (contactId) => {
    const url = `${API_BASE_URL}/customers/contact-id/${contactId}/purchases`;
    
    console.log('👥 Customers API - Get purchase history request:', { url, contactId });
    
    const response = await fetch(url);
    console.log('👥 Customers API - Get purchase history response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Get purchase history error response:', errorText);
      throw new Error(`Failed to fetch purchase history: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Get purchase history success:', result);
    return result;
  },

  /**
   * Update customer GST information
   * POST /billing_system/api/customers/contact-id/{contact_id}/gst
   */
  updateGst: async (contactId, gstin, gstTreatment = 'Regular') => {
    const queryString = new URLSearchParams({
      gstin: gstin,
      gst_treatment: gstTreatment
    }).toString();
    const url = `${API_BASE_URL}/customers/contact-id/${contactId}/gst?${queryString}`;
    
    console.log('👥 Customers API - Update GST request:', { url, contactId, gstin, gstTreatment });
    
    const response = await fetch(url, {
      method: 'POST',
    });
    
    console.log('👥 Customers API - Update GST response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Update GST error response:', errorText);
      throw new Error(`Failed to update GST information: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Update GST success:', result);
    return result;
  },

  /**
   * Get customers by location
   * GET /billing_system/api/customers/location
   */
  getByLocation: async (state, city) => {
    const params = {};
    if (state) params.state = state;
    if (city) params.city = city;
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/customers/location${queryString ? `?${queryString}` : ''}`;
    
    console.log('👥 Customers API - Get by location request:', { url, state, city });
    
    const response = await fetch(url);
    console.log('👥 Customers API - Get by location response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Customers API - Get by location error response:', errorText);
      throw new Error(`Failed to fetch customers by location: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('👥 Customers API - Get by location success:', result);
    return result;
  },

  // Legacy methods for backwards compatibility
  getById: async (id) => {
    // Try to determine if it's a contact ID or customer number
    if (typeof id === 'number' || /^\d+$/.test(id)) {
      return customersApi.getByContactId(id);
    } else {
      return customersApi.getByCustomerNumber(id);
    }
  },

  delete: async (contactId) => {
    // Since there's no explicit delete endpoint, we'll set status to Inactive
    return customersApi.updateStatus(contactId, 'Inactive');
  },

  getLoyaltyPoints: async (contactId) => {
    // This could be part of the purchase history or customer details
    const customer = await customersApi.getByContactId(contactId);
    return customer.loyalty_points || 0;
  },
};

// Checkout API
export const checkoutApi = {
  /**
   * Calculate cart totals with tax and discounts
   * POST /api/checkout/calculate
   */
  calculate: async (cartId) => {
    const response = await fetch(`${API_BASE_URL}/checkout/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId }),
    });
    if (!response.ok) throw new Error('Failed to calculate total');
    return response.json();
  },

  /**
   * Complete sale transaction
   * POST /api/checkout/process
   */
  completeSale: async (checkoutData) => {
    const response = await fetch(`${API_BASE_URL}/checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData),
    });
    if (!response.ok) throw new Error('Failed to complete sale');
    return response.json();
  },

  /**
   * Hold/park a transaction for later completion
   * POST /api/checkout/hold
   */
  hold: async (holdData) => {
    const response = await fetch(`${API_BASE_URL}/checkout/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(holdData),
    });
    if (!response.ok) throw new Error('Failed to hold transaction');
    return response.json();
  },

  /**
   * Get all held/parked transactions
   * GET /api/checkout/held
   */
  getHeldTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/checkout/held`);
    if (!response.ok) throw new Error('Failed to get held transactions');
    return response.json();
  },

  /**
   * Calculate change for cash payment
   * GET /api/checkout/cash-payment
   */
  calculateChange: async (totalAmount, amountTendered) => {
    const response = await fetch(
      `${API_BASE_URL}/checkout/cash-payment?total_amount=${totalAmount}&amount_tendered=${amountTendered}`
    );
    if (!response.ok) throw new Error('Failed to calculate change');
    return response.json();
  },
};

// Payments API
export const paymentsApi = {
  /**
   * Process payment
   * POST /api/payments
   */
  process: async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error('Failed to process payment');
    return response.json();
  },

  /**
   * Get payment details
   * GET /api/payments/{id}
   */
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch payment');
    return response.json();
  },
};

// Discounts API
export const discountsApi = {
  /**
   * Get all discounts
   * GET /api/discounts
   */
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/discounts`);
    if (!response.ok) throw new Error('Failed to fetch discounts');
    return response.json();
  },

  /**
   * Create discount
   * POST /api/discounts
   */
  create: async (discountData) => {
    const response = await fetch(`${API_BASE_URL}/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discountData),
    });
    if (!response.ok) throw new Error('Failed to create discount');
    return response.json();
  },

  /**
   * Apply discount to cart
   * POST /api/carts/{id}/discount
   */
  applyToCart: async (cartId, discountId) => {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discount_id: discountId }),
    });
    if (!response.ok) throw new Error('Failed to apply discount');
    return response.json();
  },

  /**
   * Remove discount from cart
   * DELETE /api/carts/{id}/discount
   */
  removeFromCart: async (cartId) => {
    const response = await fetch(`${API_BASE_URL}/carts/${cartId}/discount`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove discount');
    return response.json();
  },
};

// Invoices API
export const invoicesApi = {
  /**
   * Get all invoices
   * GET /api/invoices
   */
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/invoices`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },

  /**
   * Get invoice by ID
   * GET /api/invoices/{id}
   */
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
    if (!response.ok) throw new Error('Failed to fetch invoice');
    return response.json();
  },

  /**
   * Download invoice PDF
   * GET /api/invoices/{id}/pdf
   * Returns: Direct PDF file download
   */
  downloadPDF: async (invoiceId) => {
    try {
      console.log('📄 Invoice API - Download PDF request:', { invoiceId });
      
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`);
      console.log('📄 Invoice API - Download PDF response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📄 Invoice API - Download PDF error response:', errorText);
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📄 Invoice API - Download PDF success:', { blobSize: blob.size, blobType: blob.type });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'PDF downloaded successfully' };
    } catch (error) {
      console.error('📄 Invoice API - Download PDF error:', error);
      throw error;
    }
  },

  /**
   * Send invoice via WhatsApp
   * POST /api/invoices/{id}/send/whatsapp
   */
  sendWhatsApp: async (invoiceId, phoneNumber, message = null) => {
    try {
      console.log('📱 Invoice API - Send WhatsApp request:', { invoiceId, phoneNumber, message });
      
      const body = { phone_number: phoneNumber };
      if (message) {
        body.message = message;
      }
      
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/send/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      console.log('📱 Invoice API - Send WhatsApp response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 Invoice API - Send WhatsApp error response:', errorText);
        throw new Error(`Failed to send WhatsApp: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📱 Invoice API - Send WhatsApp success:', result);
      return result;
    } catch (error) {
      console.error('📱 Invoice API - Send WhatsApp error:', error);
      throw error;
    }
  },

  /**
   * Send invoice via Email
   * POST /api/invoices/{id}/send/email
   */
  sendEmail: async (invoiceId, email, subject = null, message = null) => {
    try {
      console.log('📧 Invoice API - Send Email request:', { invoiceId, email, subject, message });
      
      const body = { email };
      if (subject) {
        body.subject = subject;
      }
      if (message) {
        body.message = message;
      }
      
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/send/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      console.log('📧 Invoice API - Send Email response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📧 Invoice API - Send Email error response:', errorText);
        throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📧 Invoice API - Send Email success:', result);
      return result;
    } catch (error) {
      console.error('📧 Invoice API - Send Email error:', error);
      throw error;
    }
  },

  /**
   * Print invoice
   * POST /api/invoices/{id}/print
   */
  print: async (id) => {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/print`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to print invoice');
    return response.json();
  },

  /**
   * Email invoice to customer (legacy method for backwards compatibility)
   * POST /api/invoices/{id}/email
   */
  email: async (id, emailAddress) => {
    return await invoicesApi.sendEmail(id, emailAddress);
  },

  /**
   * Get next invoice number
   * GET /api/invoices/number/next
   */
  getNextNumber: async () => {
    const response = await fetch(`${API_BASE_URL}/invoices/number/next`);
    if (!response.ok) throw new Error('Failed to get next invoice number');
    return response.json();
  },
};

// Inventory API
export const inventoryApi = {
  /**
   * Get all inventory items
   * GET /api/inventory
   */
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/inventory`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
  },

  /**
   * Get inventory item by ID
   * GET /api/inventory/{id}
   */
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`);
    if (!response.ok) throw new Error('Failed to fetch inventory item');
    return response.json();
  },

  /**
   * Add inventory item
   * POST /api/inventory
   */
  add: async (inventoryData) => {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData),
    });
    if (!response.ok) throw new Error('Failed to add inventory');
    return response.json();
  },

  /**
   * Update inventory
   * PUT /api/inventory/{id}
   */
  update: async (id, inventoryData) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inventoryData),
    });
    if (!response.ok) throw new Error('Failed to update inventory');
    return response.json();
  },

  /**
   * Remove from inventory
   * DELETE /api/inventory/{id}
   */
  remove: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove from inventory');
    return response.json();
  },

  /**
   * Search product locations by SKU or product name
   * GET /billing_system/api/inventory/products/search
   */
  searchLocations: async (query, filters = {}) => {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory/products/search${queryString ? `?${queryString}` : ''}`;
    console.log('📦 Inventory API - Search locations:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search locations');
    return response.json();
  },

  /**
   * Get all products in a specific store
   * GET /billing_system/api/inventory/store/{store_id}
   */
  getByStore: async (storeId, filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/inventory/store/${storeId}${queryString ? `?${queryString}` : ''}`;
    console.log('📦 Inventory API - Get by store:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch store inventory');
    return response.json();
  },

  /**
   * Get all products in a specific section
   * GET /billing_system/api/inventory/section/{section_id}
   */
  getBySection: async (sectionId) => {
    const url = `${API_BASE_URL}/inventory/section/${sectionId}`;
    console.log('📦 Inventory API - Get by section:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch section inventory');
    return response.json();
  },

  /**
   * Get all locations for a specific product
   * GET /billing_system/api/inventory/product/{variant_id}
   */
  getLocations: async (variantId) => {
    const url = `${API_BASE_URL}/inventory/product/${variantId}`;
    console.log('📦 Inventory API - Get locations:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch product locations');
    return response.json();
  },

  /**
   * Update quantity at a location
   * PATCH /billing_system/api/inventory/location/{location_id}
   */
  updateLocation: async (locationId, quantityData) => {
    const url = `${API_BASE_URL}/inventory/location/${locationId}`;
    console.log('📦 Inventory API - Update location:', url);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quantityData),
    });
    if (!response.ok) throw new Error('Failed to update location');
    return response.json();
  },

  /**
   * Transfer stock between locations
   * POST /billing_system/api/inventory/transfer
   */
  transfer: async (transferData) => {
    const url = `${API_BASE_URL}/inventory/transfer`;
    console.log('📦 Inventory API - Transfer:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    });
    if (!response.ok) throw new Error('Failed to transfer stock');
    return response.json();
  },

  /**
   * Get inventory summary
   * GET /billing_system/api/inventory/summary
   */
  getSummary: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const url = `${API_BASE_URL}/inventory/summary${queryString ? `?${queryString}` : ''}`;
    console.log('📦 Inventory API - Get summary:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch inventory summary');
    return response.json();
  },
};

// Stores/Locations API
export const storesApi = {
  /**
   * Get all stores
   * GET /billing_system/api/stores
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/stores${queryString ? `?${queryString}` : ''}`;
    console.log('🏢 Stores API - Get all:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch stores');
    return response.json();
  },

  /**
   * Get store by ID
   * GET /billing_system/api/stores/{id}
   */
  getById: async (id) => {
    const url = `${API_BASE_URL}/stores/${id}`;
    console.log('🏢 Stores API - Get by ID:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch store');
    return response.json();
  },

  /**
   * Get sections for a specific store
   * GET /billing_system/api/stores/{id}/sections
   */
  getSections: async (storeId) => {
    const url = `${API_BASE_URL}/stores/${storeId}/sections`;
    console.log('🏢 Stores API - Get sections:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch store sections');
    return response.json();
  },

  /**
   * Create new store
   * POST /billing_system/api/stores
   */
  create: async (storeData) => {
    const url = `${API_BASE_URL}/stores`;
    console.log('🏢 Stores API - Create:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData),
    });
    if (!response.ok) throw new Error('Failed to create store');
    return response.json();
  },

  /**
   * Update store
   * PATCH /billing_system/api/stores/{id}
   */
  update: async (id, storeData) => {
    const url = `${API_BASE_URL}/stores/${id}`;
    console.log('🏢 Stores API - Update:', url);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData),
    });
    if (!response.ok) throw new Error('Failed to update store');
    return response.json();
  },

  /**
   * Delete store
   * DELETE /billing_system/api/stores/{id}
   */
  delete: async (id) => {
    const url = `${API_BASE_URL}/stores/${id}`;
    console.log('🏢 Stores API - Delete:', url);
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete store');
    return response.json();
  },
};

// Reports API
export const reportsApi = {
  /**
   * Get sales reports
   * GET /api/reports/sales
   */
  getSalesReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/reports/sales${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch sales report');
    return response.json();
  },
};

// Export all APIs as a single object for convenience
export default {
  products: productsApi,
  demifiedProducts: demifiedProductsApi,
  cart: cartApi,
  customers: customersApi,
  checkout: checkoutApi,
  payments: paymentsApi,
  discounts: discountsApi,
  invoices: invoicesApi,
  inventory: inventoryApi,
  stores: storesApi,
  reports: reportsApi,
};