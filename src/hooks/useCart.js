import { useState, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';

/**
 * Transform cart items from API response to normalized format
 */
const normalizeCartItems = (items) => {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    // Handle different possible field names from the API
    const normalizedItem = {
      id: item.id || item.item_id,
      cart_item_id: item.cart_item_id || item.id,
      name: item.name || item.item_name || item.product_name || 'Unknown Item',
      price: item.price || item.rate || item.unit_price || item.amount || 0,
      quantity: item.quantity || item.qty || 1,
      purity: item.purity || item.cf_finish || item.cf_work,
      weight: item.weight || item.net_weight,
      image: item.image || (item.shopify_image && item.shopify_image.url) || '💎',
      // Keep original data for debugging
      _originalData: item
    };
    
    // Ensure price and quantity are numbers
    normalizedItem.price = typeof normalizedItem.price === 'number' ? normalizedItem.price : parseFloat(normalizedItem.price) || 0;
    normalizedItem.quantity = typeof normalizedItem.quantity === 'number' ? normalizedItem.quantity : parseInt(normalizedItem.quantity) || 1;
    
    console.log('🔄 Normalizing cart item:', {
      original: item,
      normalized: normalizedItem,
      idFields: {
        item_id: item.id,
        cart_item_id: item.cart_item_id,
        item_id_field: item.item_id,
        finalId: normalizedItem.id,
        finalCartItemId: normalizedItem.cart_item_id
      }
    });
    
    return normalizedItem;
  });
};

/**
 * Custom Hook: useCart
 * Manages shopping cart state and operations
 * 
 * @returns {Object} Cart state and methods
 */
export const useCart = () => {
  const [cartId, setCartId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize cart on mount
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setLoading(true);
        console.log('🛒 Initializing cart...');
        
        // Add a small delay to ensure API is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const newCart = await cartApi.create();
        console.log('✅ Cart created successfully:', newCart);
        setCartId(newCart.cart_id || newCart.id); // Handle both possible response formats
        setError(null);
      } catch (err) {
        const errorMessage = 'Failed to initialize cart';
        setError(errorMessage);
        console.error('❌ Cart initialization error:', err);
        console.error('❌ Error details:', {
          message: err.message,
          stack: err.stack
        });
        
        // Show error to user
        alert(`Cart initialization failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    console.log('🛒 Starting cart initialization...');
    initializeCart();
  }, []);

  // Refresh cart data
  const refreshCart = useCallback(async () => {
    if (!cartId) {
      console.log('🛒 RefreshCart - No cartId available');
      return;
    }

    try {
      setLoading(true);
      console.log('🛒 RefreshCart - Fetching cart data for cartId:', cartId);
      const cartData = await cartApi.getById(cartId);
      console.log('🛒 RefreshCart - Cart data received:', cartData);
      console.log('🛒 RefreshCart - Items structure:', cartData.items);
      
      // Log each item to see what data we have
      if (cartData.items && cartData.items.length > 0) {
        cartData.items.forEach((item, index) => {
          console.log(`🛒 Item ${index}:`, {
            id: item.id,
            cart_item_id: item.cart_item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            fullItem: item
          });
        });
      }
      
      // Normalize cart items to ensure consistent data structure
      const normalizedItems = normalizeCartItems(cartData.items || []);
      setItems(normalizedItems);
      setError(null);
      console.log('🛒 RefreshCart - Normalized items set:', normalizedItems);
    } catch (err) {
      setError('Failed to refresh cart');
      console.error('❌ RefreshCart error:', err);
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  // Add item to cart
  const addItem = useCallback(async (productId, quantity = 1, productData = {}) => {
    console.log('🛒 Add to cart called:', { productId, quantity, cartId, productData });
    console.log('🛒 Product data structure:', {
      id: productData.id,
      price: productData.price,
      name: productData.name,
      isDemified: productData.isDemified,
      item_id: productData.item_id,
      sku: productData.sku,
      fullData: productData
    });
    
    if (!cartId) {
      const error = 'Cart not initialized';
      setError(error);
      console.error('❌ Add to cart error:', error);
      return;
    }

    try {
      setLoading(true);
      console.log('🛒 Making API call to add item...');
      const result = await cartApi.addItem(cartId, productId, quantity, productData);
      console.log('✅ Add item API response:', result);
      
      await refreshCart();
      setError(null);
      console.log('✅ Cart refreshed successfully');
    } catch (err) {
      const error = 'Failed to add item to cart';
      setError(error);
      console.error('❌ Add to cart error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        cartId,
        productId,
        quantity,
        productData
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, refreshCart]);

  // Update item quantity
  const updateItemQuantity = useCallback(async (itemId, quantity) => {
    if (!cartId) {
      setError('Cart not initialized');
      return;
    }

    try {
      setLoading(true);
      
      if (quantity === 0) {
        await cartApi.removeItem(cartId, itemId);
      } else {
        await cartApi.updateItem(cartId, itemId, quantity);
      }
      
      await refreshCart();
      setError(null);
    } catch (err) {
      setError('Failed to update item quantity');
      console.error('Update quantity error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, refreshCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId) => {
    console.log('🗑️ Remove item called with:', { itemId, cartId });
    
    if (!cartId) {
      setError('Cart not initialized');
      console.error('❌ Remove item failed: Cart not initialized');
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Making API call to remove item...');
      console.log('🗑️ API call parameters:', { cartId, itemId });
      
      await cartApi.removeItem(cartId, itemId);
      console.log('✅ Remove item API call successful');
      
      await refreshCart();
      console.log('✅ Cart refreshed after removal');
      setError(null);
    } catch (err) {
      setError('Failed to remove item');
      console.error('❌ Remove item error:', err);
      console.error('❌ Remove item error details:', {
        message: err.message,
        stack: err.stack,
        cartId,
        itemId
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, refreshCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!cartId) return;

    try {
      setLoading(true);
      
      // Remove all items one by one
      for (const item of items) {
        await cartApi.removeItem(cartId, item.cart_item_id || item.id);
      }
      
      setItems([]);
      setError(null);
    } catch (err) {
      setError('Failed to clear cart');
      console.error('Clear cart error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, items]);

  // Hold cart transaction
  const holdCart = useCallback(async () => {
    if (!cartId) return;

    try {
      setLoading(true);
      await cartApi.hold(cartId);
      setError(null);
    } catch (err) {
      setError('Failed to hold cart');
      console.error('Hold cart error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  // Resume held cart
  const resumeCart = useCallback(async () => {
    if (!cartId) return;

    try {
      setLoading(true);
      await cartApi.resume(cartId);
      await refreshCart();
      setError(null);
    } catch (err) {
      setError('Failed to resume cart');
      console.error('Resume cart error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, refreshCart]);

  // Calculate totals
  const totals = {
    itemCount: items.reduce((sum, item) => {
      const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      return sum + safeQuantity;
    }, 0),
    subtotal: items.reduce((sum, item) => {
      const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      return sum + (safePrice * safeQuantity);
    }, 0),
    get tax() {
      return this.subtotal * 0.03; // 3% GST
    },
    get total() {
      return this.subtotal + this.tax;
    },
  };

  return {
    cartId,
    items,
    loading,
    error,
    totals,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    holdCart,
    resumeCart,
    refreshCart,
  };
};