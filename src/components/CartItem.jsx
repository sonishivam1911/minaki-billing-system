import React from 'react';

/**
 * CartItem Component
 * Displays a cart item with quantity controls
 * 
 * @param {Object} props
 * @param {Object} props.item - Cart item data
 * @param {Function} props.onUpdateQuantity - Callback for quantity change
 * @param {Function} props.onRemove - Callback for removing item
 */
export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const {
    cart_item_id,
    id,
    name,
    price,
    quantity,
    purity,
    weight,
    image = '💎',
  } = item;

  const itemId = cart_item_id || id;
  
  console.log('🛒 CartItem - Item data:', {
    cart_item_id,
    id,
    itemId,
    name,
    fullItem: item
  });
  
  // Safely handle price and quantity with defaults
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  const safeQuantity = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
  const itemTotal = safePrice * safeQuantity;

  return (
    <div className="cart-item">
      <div className="cart-item-icon">{image}</div>

      <div className="cart-item-details">
        <h3>{name}</h3>
        <div className="cart-item-meta">
          {purity && <span>{purity}</span>}
          {purity && weight && <span>•</span>}
          {weight && <span>{weight}</span>}
          <span>•</span>
          <span>₹{safePrice.toLocaleString()} each</span>
        </div>
      </div>

      <div className="cart-item-quantity">
        <button
          className="qty-btn"
          onClick={() => onUpdateQuantity(itemId, safeQuantity - 1)}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="qty-display">{safeQuantity}</span>
        <button
          className="qty-btn"
          onClick={() => onUpdateQuantity(itemId, safeQuantity + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="cart-item-total">
        ₹{itemTotal.toLocaleString()}
      </div>

      <button
        className="cart-item-remove"
        onClick={() => {
          console.log('🗑️ Delete button clicked for item:', { itemId, name });
          onRemove(itemId);
        }}
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  );
};