import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ChevronUp, ChevronDown, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * CartPreviewStrip Component
 * Fixed bottom cart preview that shows items horizontally
 * 
 * @param {Object} props
 * @param {Function} props.onCartClick - Function to open the main cart drawer
 */
export const CartPreviewStrip = ({ onCartClick }) => {
  const { items, totals, updateItemQuantity, removeItem, loading } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  // Hide on checkout page or if cart is empty
  if (items.length === 0 || location.pathname === '/checkout') {
    return null;
  }

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const hidePreview = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`cart-preview-strip ${isExpanded ? 'expanded' : ''}`}>
      {/* Main Preview Bar */}
      <div className="preview-header" onClick={toggleExpanded}>
        <div className="preview-summary">
          <div className="preview-icon">
            <ShoppingCart size={20} />
            <span className="preview-count">{totals.itemCount}</span>
          </div>
          <div className="preview-info">
            <span className="preview-items">{totals.itemCount} items in cart</span>
            <span className="preview-total">₹{totals.total?.toLocaleString() || '0'}</span>
          </div>
        </div>
        
        <div className="preview-actions">
          <button className="preview-toggle" aria-label="Toggle cart preview">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
          <button className="preview-hide" onClick={(e) => {
            e.stopPropagation();
            hidePreview();
          }} aria-label="Hide cart preview">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="preview-content">
          {/* Items Carousel */}
          <div className="preview-items-container">
            <div className="preview-items-scroll">
              {items.map((item) => {
                const itemId = item.cart_item_id || item.id;
                const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                const itemTotal = safePrice * safeQuantity;

                return (
                  <div key={itemId} className="preview-item">
                    <div className="preview-item-image">
                      {item.image || '💎'}
                    </div>
                    
                    <div className="preview-item-details">
                      <div className="preview-item-name">{item.name}</div>
                      <div className="preview-item-price">₹{safePrice.toLocaleString()}</div>
                      
                      {/* Quantity Controls */}
                      <div className="preview-quantity">
                        <button
                          className="qty-btn-small"
                          onClick={() => handleUpdateQuantity(itemId, Math.max(0, safeQuantity - 1))}
                          disabled={loading || safeQuantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-display-small">{safeQuantity}</span>
                        <button
                          className="qty-btn-small"
                          onClick={() => handleUpdateQuantity(itemId, safeQuantity + 1)}
                          disabled={loading}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="preview-item-actions">
                      <div className="preview-item-total">₹{itemTotal.toLocaleString()}</div>
                      <button
                        className="preview-remove"
                        onClick={() => handleRemoveItem(itemId)}
                        disabled={loading}
                        aria-label="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="preview-footer">
            <div className="preview-totals">
              <div className="total-line">
                <span>Subtotal: ₹{totals.subtotal?.toLocaleString() || '0'}</span>
              </div>
              {totals.tax > 0 && (
                <div className="total-line">
                  <span>Tax: ₹{totals.tax?.toLocaleString() || '0'}</span>
                </div>
              )}
              <div className="total-line final">
                <span>Total: ₹{totals.total?.toLocaleString() || '0'}</span>
              </div>
            </div>
            
            <div className="preview-buttons">
              <button 
                className="btn-secondary btn-compact"
                onClick={onCartClick}
              >
                <ShoppingCart size={16} />
                View Cart
              </button>
              <Link 
                to="/checkout" 
                className="btn-primary btn-compact"
                onClick={() => setIsExpanded(false)}
              >
                Checkout
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};