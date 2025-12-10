import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, CreditCard, User, Clock, Gem } from 'lucide-react';

/**
 * Navigation Component
 * Top navigation bar with logo, restricted nav links based on workflow, and cart
 * 
 * @param {Object} props
 * @param {number} props.cartItemCount - Number of items in cart
 * @param {Function} props.onCartClick - Function to open cart drawer
 */
export const Navigation = ({ cartItemCount = 0, onCartClick }) => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());

  // Update clock every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => location.pathname === path;
  const hasItemsInCart = cartItemCount > 0;

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!hasItemsInCart) {
      alert('Add items to cart first');
      return;
    }
    onCartClick();
  };

  return (
    <nav className="nav-container">
      <div className="nav-brand">
        <Gem size={32} />
        <div>
          <div className="brand-name">Minaki Billing System</div>
          <div className="brand-tagline">Point of Sale</div>
        </div>
      </div>

      <div className="nav-user">
        <button 
          className={`cart-icon ${!hasItemsInCart ? 'disabled' : ''}`}
          onClick={handleCartClick}
          disabled={!hasItemsInCart}
        >
          <ShoppingCart size={24} />
          {cartItemCount > 0 && (
            <span className="cart-badge">{cartItemCount}</span>
          )}
        </button>
        <div className="nav-time">
          <Clock size={18} />
          <span>{currentTime}</span>
        </div>
      </div>
    </nav>
  );
};