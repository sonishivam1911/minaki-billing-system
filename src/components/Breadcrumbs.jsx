import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight, Package, ShoppingCart, CreditCard, Users } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * Breadcrumbs Component
 * Shows navigation path and current page location
 */
export const Breadcrumbs = () => {
  const location = useLocation();
  const { totals } = useCart();
  const hasItemsInCart = totals.itemCount > 0;

  // Define breadcrumb configurations for each route
  const breadcrumbConfig = {
    '/': {
      title: 'Home',
      icon: Home,
      parent: null
    },
    '/catalog': {
      title: 'Product Catalog',
      icon: Package,
      parent: null
    },
    '/cart': {
      title: 'Shopping Cart',
      icon: ShoppingCart,
      parent: '/catalog',
      protected: true
    },
    '/checkout': {
      title: 'Checkout',
      icon: CreditCard,
      parent: '/cart',
      protected: true
    },
    '/customers': {
      title: 'Customer Management',
      icon: Users,
      parent: '/checkout',
      protected: true
    }
  };

  // Get current page config
  const currentConfig = breadcrumbConfig[location.pathname];
  
  // If no config found or it's a protected route without cart items, don't show breadcrumbs
  if (!currentConfig || (currentConfig.protected && !hasItemsInCart)) {
    return null;
  }

  // Build breadcrumb path
  const buildBreadcrumbPath = (pathname) => {
    const path = [];
    let current = pathname;
    
    while (current && breadcrumbConfig[current]) {
      const config = breadcrumbConfig[current];
      
      // Skip protected routes if cart is empty
      if (config.protected && !hasItemsInCart && current !== pathname) {
        break;
      }
      
      path.unshift({
        path: current,
        title: config.title,
        icon: config.icon,
        protected: config.protected
      });
      
      current = config.parent;
    }
    
    return path;
  };

  const breadcrumbs = buildBreadcrumbPath(location.pathname);

  // Don't render if only one item (current page) or if we're on catalog/home
  if (breadcrumbs.length <= 1 || location.pathname === '/catalog') {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {breadcrumbs.map((crumb, index) => {
          const Icon = crumb.icon;
          const isLast = index === breadcrumbs.length - 1;
          const isClickable = !isLast && (!crumb.protected || hasItemsInCart);

          return (
            <li key={crumb.path} className="breadcrumb-item">
              {index > 0 && (
                <ChevronRight size={16} className="breadcrumb-separator" />
              )}
              
              {isClickable ? (
                <Link 
                  to={crumb.path} 
                  className="breadcrumb-link"
                  aria-label={`Go to ${crumb.title}`}
                >
                  <Icon size={16} />
                  <span>{crumb.title}</span>
                </Link>
              ) : (
                <span 
                  className={`breadcrumb-current ${!isClickable && crumb.protected ? 'disabled' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  <Icon size={16} />
                  <span>{crumb.title}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Optional: Show cart status in breadcrumbs */}
      {hasItemsInCart && (location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname === '/customers') && (
        <div className="breadcrumb-status">
          <span className="cart-items-count">{totals.itemCount} items</span>
          <span className="cart-total">₹{totals.total?.toLocaleString() || '0'}</span>
        </div>
      )}
    </nav>
  );
};