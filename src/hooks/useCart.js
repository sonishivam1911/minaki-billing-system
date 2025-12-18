import { useState, useEffect, useCallback, useMemo } from 'react';
import { cartApi } from '../services/api';

/**
 * Transform cart items from API response to normalized format
 */
const normalizeCartItems = (items) => {
  if (!Array.isArray(items)) {
    console.warn('🔄 normalizeCartItems - items is not an array:', items);
    return [];
  }
  
  if (items.length === 0) {
    console.log('🔄 normalizeCartItems - items array is empty');
    return [];
  }
  
  console.log('🔄 normalizeCartItems - Processing', items.length, 'items');
  
  return items.map((item, index) => {
    // Handle different possible field names from the API
    // Real jewelry items might have different structure than demistified items
    const normalizedItem = {
      id: item.id || item.item_id || item.variant_id || item.cart_item_id,
      cart_item_id: item.cart_item_id || item.id || item.item_id,
      name: item.name || item.item_name || item.product_name || item.title || 'Unknown Item',
      price: item.price || item.rate || item.unit_price || item.amount || item.final_price || 0,
      quantity: item.quantity || item.qty || 1,
      purity: item.purity || item.cf_finish || item.cf_work,
      weight: item.weight || item.net_weight || item.weight_g,
      image: item.image || (item.shopify_image && item.shopify_image.url) || '💎',
      // Keep original data for debugging
      _originalData: item
    };
    
    // Ensure price and quantity are numbers
    normalizedItem.price = typeof normalizedItem.price === 'number' 
      ? normalizedItem.price 
      : parseFloat(normalizedItem.price) || 0;
    normalizedItem.quantity = typeof normalizedItem.quantity === 'number' 
      ? normalizedItem.quantity 
      : parseInt(normalizedItem.quantity) || 1;
    
    // Validate that we have essential fields
    if (!normalizedItem.id) {
      console.warn(`🔄 normalizeCartItems - Item ${index} missing id:`, item);
    }
    if (!normalizedItem.cart_item_id) {
      console.warn(`🔄 normalizeCartItems - Item ${index} missing cart_item_id:`, item);
    }
    if (normalizedItem.price === 0) {
      console.warn(`🔄 normalizeCartItems - Item ${index} has zero price:`, item);
    }
    if (normalizedItem.quantity === 0) {
      console.warn(`🔄 normalizeCartItems - Item ${index} has zero quantity:`, item);
    }
    
    console.log(`🔄 Normalizing cart item ${index}:`, {
      original: item,
      normalized: normalizedItem,
      idFields: {
        item_id: item.id,
        cart_item_id: item.cart_item_id,
        item_id_field: item.item_id,
        variant_id: item.variant_id,
        finalId: normalizedItem.id,
        finalCartItemId: normalizedItem.cart_item_id
      },
      priceFields: {
        price: item.price,
        rate: item.rate,
        unit_price: item.unit_price,
        finalPrice: normalizedItem.price
      },
      quantityFields: {
        quantity: item.quantity,
        qty: item.qty,
        finalQuantity: normalizedItem.quantity
      }
    });
    
    return normalizedItem;
  });
};

/**
 * Custom Hook: useCart
 * Manages shopping cart state and operations with session persistence
 * 
 * @returns {Object} Cart state and methods
 */
export const useCart = () => {
  const [cartId, setCartId] = useState(() => {
    // Try to restore cart ID from session storage
    const savedCartId = sessionStorage.getItem('cartId');
    console.log('🛒 Restoring cart ID from session:', savedCartId);
    return savedCartId;
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save cart ID to session storage whenever it changes
  useEffect(() => {
    if (cartId) {
      sessionStorage.setItem('cartId', cartId);
      console.log('🛒 Saved cart ID to session:', cartId);
    }
  }, [cartId]);

  // Initialize cart on mount - only if we don't have a cart ID
  useEffect(() => {
    const initializeCart = async () => {
      // Check if we already have a cart ID
      if (cartId) {
        console.log('🛒 Cart already exists, skipping initialization. Cart ID:', cartId);
        // Try to refresh existing cart to get current items
        try {
          await refreshCart();
        } catch (err) {
          console.warn('🛒 Failed to refresh existing cart, creating new one:', err);
          // If existing cart is invalid, clear it and create new
          sessionStorage.removeItem('cartId');
          setCartId(null);
          // Recursive call will create new cart
          await initializeCart();
        }
        return;
      }

      try {
        setLoading(true);
        console.log('🛒 Initializing new cart...');
        
        // Add a small delay to ensure API is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const newCart = await cartApi.create();
        console.log('✅ Cart created successfully:', newCart);
        const newCartId = newCart.cart_id || newCart.id;
        setCartId(newCartId);
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
  }, []); // Remove cartId dependency to avoid infinite loops

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
      console.log('🛒 RefreshCart - Items count:', cartData.items?.length || 0);
      
      // Log each item to see what data we have
      if (cartData.items && cartData.items.length > 0) {
        cartData.items.forEach((item, index) => {
          console.log(`🛒 Item ${index}:`, {
            id: item.id,
            cart_item_id: item.cart_item_id,
            item_id: item.item_id,
            variant_id: item.variant_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            item_type: item.item_type,
            allKeys: Object.keys(item),
            fullItem: item
          });
        });
      } else {
        console.warn('🛒 RefreshCart - No items in cart response');
      }
      
      // Normalize cart items to ensure consistent data structure
      const normalizedItems = normalizeCartItems(cartData.items || []);
      console.log('🛒 RefreshCart - Normalized items count:', normalizedItems.length);
      console.log('🛒 RefreshCart - Normalized items:', normalizedItems);
      
      // Calculate totals before setting state for logging
      const itemCount = normalizedItems.reduce((sum, item) => {
        const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
        return sum + qty;
      }, 0);
      const subtotal = normalizedItems.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
        const qty = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 0;
        return sum + (price * qty);
      }, 0);
      
      console.log('🛒 RefreshCart - Calculated totals:', {
        itemCount,
        subtotal,
        itemsLength: normalizedItems.length
      });
      
      setItems(normalizedItems);
      setError(null);
      console.log('🛒 RefreshCart - State updated with', normalizedItems.length, 'items');
    } catch (err) {
      setError('Failed to refresh cart');
      console.error('❌ RefreshCart error:', err);
      // If cart doesn't exist anymore, clear the stored ID
      if (err.message.includes('404') || err.message.includes('not found')) {
        console.log('🛒 Cart no longer exists, clearing session storage');
        sessionStorage.removeItem('cartId');
        setCartId(null);
        setItems([]);
      }
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
      isDemistified: productData.isDemistified,
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
      console.log('🛒 Cart cleared successfully, keeping cart ID for reuse:', cartId);
    } catch (err) {
      setError('Failed to clear cart');
      console.error('Clear cart error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, items]);

  // Create new cart (for special cases like when current cart becomes invalid)
  const createNewCart = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🛒 Creating new cart...');
      
      const newCart = await cartApi.create();
      console.log('✅ New cart created successfully:', newCart);
      const newCartId = newCart.cart_id || newCart.id;
      setCartId(newCartId);
      setItems([]);
      setError(null);
      
      return newCartId;
    } catch (err) {
      const errorMessage = 'Failed to create new cart';
      setError(errorMessage);
      console.error('❌ Create new cart error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Calculate totals - use useMemo to ensure it updates when items change
  const totals = useMemo(() => {
    console.log('🛒 Calculating totals for', items.length, 'items');
    
    const itemCount = items.reduce((sum, item) => {
      const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : parseInt(item.quantity) || 0;
      return sum + safeQuantity;
    }, 0);
    
    const subtotal = items.reduce((sum, item) => {
      const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : parseFloat(item.price) || 0;
      const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : parseInt(item.quantity) || 0;
      const itemTotal = safePrice * safeQuantity;
      return sum + itemTotal;
    }, 0);
    
    const tax = subtotal * 0.03; // 3% GST
    const total = subtotal + tax;
    
    console.log('🛒 Totals calculated:', {
      itemCount,
      subtotal,
      tax,
      total,
      itemsLength: items.length,
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: (item.price || 0) * (item.quantity || 0)
      }))
    });
    
    return {
      itemCount,
      subtotal,
      tax,
      total
    };
  }, [items]);

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
    createNewCart,
    holdCart,
    resumeCart,
    refreshCart,
  };
};