import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Percent } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CartItem, OrderSummary } from '../components';

/**
 * CartPage Component
 * Displays shopping cart with items and order summary
 */
export const CartPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    totals, 
    updateItemQuantity, 
    removeItem, 
    clearCart,
    loading 
  } = useCart();

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      try {
        await clearCart();
      } catch (err) {
        alert('Failed to clear cart');
      }
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await updateItemQuantity(itemId, newQuantity);
    } catch (err) {
      alert('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    console.log('🗑️ CartPage - Remove item called with:', itemId);
    try {
      await removeItem(itemId);
      console.log('✅ CartPage - Item removed successfully');
    } catch (err) {
      console.error('❌ CartPage - Failed to remove item:', err);
      alert('Failed to remove item');
    }
  };

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Shopping Cart</h1>
          <p className="screen-subtitle">{totals.itemCount} items in cart</p>
        </div>

        {items.length > 0 && (
          <button 
            className="btn-secondary" 
            onClick={handleClearCart}
            disabled={loading}
          >
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={64} />
          <h2>Your cart is empty</h2>
          <p>Add items from the catalog to get started</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/catalog')}
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <CartItem
                key={item.cart_item_id || item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          <div className="cart-summary">
            <OrderSummary
              items={items}
              subtotal={totals.subtotal}
              tax={totals.tax}
              total={totals.total}
              itemCount={totals.itemCount}
            />

            <button
              className="btn-primary btn-full"
              onClick={() => navigate('/checkout')}
              disabled={loading}
            >
              Proceed to Checkout
            </button>

            <button className="btn-secondary btn-full">
              <Percent size={18} />
              Apply Discount
            </button>
          </div>
        </div>
      )}
    </div>
  );
};