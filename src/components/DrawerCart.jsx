import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * DrawerCart Component
 * Sliding cart drawer that shows cart contents and allows quick actions
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the drawer is open
 * @param {Function} props.onClose - Function to close the drawer
 */
export const DrawerCart = ({ isOpen, onClose }) => {
  const { 
    items, 
    totals, 
    updateItemQuantity, 
    removeItem, 
    clearCart,
    loading 
  } = useCart();

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    console.log('🗑️ DrawerCart - Remove item called with:', itemId);
    try {
      await removeItem(itemId);
      console.log('✅ DrawerCart - Item removed successfully');
    } catch (err) {
      console.error('❌ DrawerCart - Failed to remove item:', err);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      try {
        await clearCart();
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    }
  };

  const handleCheckout = () => {
    onClose();
    // Navigation will be handled by the Link component
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-cart" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <ShoppingCart size={24} />
            <h2>Shopping Cart</h2>
            <span className="item-count">({totals.itemCount} items)</span>
          </div>
          <button className="drawer-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <ShoppingCart size={48} />
              <h3>Your cart is empty</h3>
              <p>Add items from the catalog to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="drawer-items">
                {items.map((item) => {
                  const itemId = item.cart_item_id || item.id;
                  const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                  const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                  const itemTotal = safePrice * safeQuantity;

                  return (
                    <div key={itemId} className="drawer-item">
                      <div className="drawer-item-image">
                        {item.image || '💎'}
                      </div>
                      
                      <div className="drawer-item-details">
                        <div className="drawer-item-name">{item.name}</div>
                        <div className="drawer-item-price">₹{safePrice.toLocaleString()}</div>
                        
                        {/* Quantity Controls */}
                        <div className="drawer-quantity">
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(itemId, Math.max(0, safeQuantity - 1))}
                            disabled={loading || safeQuantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="qty-display">{safeQuantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQuantity(itemId, safeQuantity + 1)}
                            disabled={loading}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="drawer-item-actions">
                        <div className="drawer-item-total">₹{itemTotal.toLocaleString()}</div>
                        <button
                          className="drawer-remove"
                          onClick={() => handleRemoveItem(itemId)}
                          disabled={loading}
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear Cart Button */}
              <div className="drawer-actions">
                <button 
                  className="btn-link drawer-clear"
                  onClick={handleClearCart}
                  disabled={loading}
                >
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="drawer-footer">
            {/* Cart Summary */}
            <div className="drawer-summary">
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal?.toLocaleString() || '0'}</span>
              </div>
              {totals.tax > 0 && (
                <div className="summary-line">
                  <span>Tax:</span>
                  <span>₹{totals.tax?.toLocaleString() || '0'}</span>
                </div>
              )}
              <div className="summary-line total">
                <span>Total:</span>
                <span>₹{totals.total?.toLocaleString() || '0'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="drawer-buttons">
              <Link 
                to="/cart" 
                className="btn-secondary btn-full"
                onClick={handleCheckout}
              >
                View Full Cart
              </Link>
              <Link 
                to="/checkout" 
                className="btn-primary btn-full"
                onClick={handleCheckout}
              >
                Checkout
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};