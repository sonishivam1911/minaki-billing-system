import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, ChevronRight, Package, ShoppingCart, CreditCard, Users, Eye } from 'lucide-react';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box, Chip } from '@mui/material';
import { useCart } from '../context/CartContext';

/**
 * Breadcrumbs Component
 * Shows navigation path and current page location
 */
export const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
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

  // Handle dynamic product routes
  const isProductRoute = location.pathname.match(/^\/product\/([^/]+)\/([^/]+)$/);
  let currentConfig = breadcrumbConfig[location.pathname];
  
  if (isProductRoute) {
    const [, type, id] = isProductRoute;
    const productType = type === 'demistified' ? 'Demistified' : 'Real';
    currentConfig = {
      title: `${productType} Product`,
      subtitle: `ID: ${decodeURIComponent(id)}`,
      icon: Eye,
      parent: '/catalog',
      protected: false
    };
  }
  
  // Don't show breadcrumbs for customers page (standalone page like checkout)
  if (location.pathname === '/customers') {
    return null;
  }

  // If no config found or it's a protected route without cart items, don't show breadcrumbs
  if (!currentConfig || (currentConfig.protected && !hasItemsInCart)) {
    return null;
  }

  // Build breadcrumb path
  const buildBreadcrumbPath = (pathname) => {
    const path = [];
    let current = pathname;
    
    // Handle product route first
    if (isProductRoute) {
      const [, type, id] = isProductRoute;
      const productType = type === 'demistified' ? 'Demistified' : 'Real';
      path.unshift({
        path: pathname,
        title: `${productType} Product`,
        subtitle: `${decodeURIComponent(id)}`,
        icon: Eye,
        protected: false
      });
      current = '/catalog';
    }
    
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
    <Box 
      sx={{ 
        px: { xs: 1, sm: 2 },
        py: 1,
        backgroundColor: '#faf8f3',
        borderBottom: '1px solid #e8e0d0',
      }}
    >
      <MuiBreadcrumbs
        separator={<ChevronRight size={16} />}
        aria-label="breadcrumb navigation"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            mx: 1,
            color: '#8b7355',
          },
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const Icon = crumb.icon;
          const isLast = index === breadcrumbs.length - 1;
          const isClickable = !isLast && (!crumb.protected || hasItemsInCart);

          return (
            <Box
              key={crumb.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: isLast ? '#2c2416' : isClickable ? '#8b6f47' : '#6b7280',
              }}
            >
              <Icon size={16} />
              {isClickable ? (
                <Typography
                  component={Link}
                  to={crumb.path}
                  sx={{
                    textDecoration: 'none',
                    color: '#8b6f47',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  }}
                >
                  {crumb.title}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    color: isLast ? '#2c2416' : '#6b7280',
                    fontWeight: isLast ? 600 : 400,
                    fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  }}
                >
                  {crumb.title}
                </Typography>
              )}
              {crumb.subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#6b7280',
                    ml: 0.5,
                    display: { xs: 'none', sm: 'inline' },
                  }}
                >
                  ({crumb.subtitle})
                </Typography>
              )}
            </Box>
          );
        })}
      </MuiBreadcrumbs>

      {/* Optional: Show cart status in breadcrumbs */}
      {hasItemsInCart && (location.pathname === '/cart' || location.pathname === '/checkout') && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${totals.itemCount} items`}
            size="small"
            sx={{ backgroundColor: '#f5f1e8', color: '#5d4e37' }}
          />
          <Chip
            label={`₹${totals.total?.toLocaleString() || '0'}`}
            size="small"
            sx={{ backgroundColor: '#e8e0d0', color: '#5d4e37', fontWeight: 600 }}
          />
        </Box>
      )}
    </Box>
  );
};
