import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, ChevronRight, Package, ShoppingCart, CreditCard, Users, Eye, BarChart3, FileText, TrendingUp, Move, DollarSign, MapPin, MessageCircle, Building2, UserPlus, ShoppingBag, Sparkles, PenLine, Tags, LayoutDashboard } from 'lucide-react';
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
      title: 'Product Billing Catalog',
      icon: Package,
      parent: null
    },
    '/inventory': {
      title: 'Inventory',
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
      parent: null
    },
    '/whatsapp-crm': {
      title: 'WhatsApp CRM',
      icon: MessageCircle,
      parent: null
    },
    '/store-locator': {
      title: 'Store Locator',
      icon: MapPin,
      parent: null
    },
    '/store-management': {
      title: 'Store Management',
      icon: Building2,
      parent: null
    },
    '/walk-ins': {
      title: 'Walk-ins',
      icon: UserPlus,
      parent: null
    },
    '/custom-products': {
      title: 'Custom Products',
      icon: ShoppingBag,
      parent: null
    },
    '/reports': {
      title: 'Reports',
      icon: BarChart3,
      parent: null
    },
    '/reports/inventory': {
      title: 'Inventory Report',
      icon: Package,
      parent: '/reports'
    },
    '/reports/daily-sales': {
      title: 'Daily Sales Report',
      icon: FileText,
      parent: '/reports'
    },
    '/reports/sales-performance': {
      title: 'Sales Performance Report',
      icon: TrendingUp,
      parent: '/reports'
    },
    '/reports/product-performance': {
      title: 'Product Performance Report',
      icon: BarChart3,
      parent: '/reports'
    },
    '/reports/customers': {
      title: 'Customer Report',
      icon: Users,
      parent: '/reports'
    },
    '/reports/stock-movement': {
      title: 'Stock Movement Report',
      icon: Move,
      parent: '/reports'
    },
    '/reports/financial': {
      title: 'Financial Report',
      icon: DollarSign,
      parent: '/reports'
    },
    '/reports/locations': {
      title: 'Location Report',
      icon: MapPin,
      parent: '/reports'
    },
    '/reports/shopify-commerce': {
      title: 'Shopify Commerce Report',
      icon: TrendingUp,
      parent: '/reports'
    },
    '/reports/zakya/zakya-invoice-register': {
      title: 'Zakya Invoice Register',
      icon: FileText,
      parent: '/reports'
    },
    '/reports/zakya/zakya-invoice-monthly': {
      title: 'Zakya Invoice Revenue by Month',
      icon: TrendingUp,
      parent: '/reports'
    },
    '/reports/zakya/zakya-invoice-product-sales': {
      title: 'Zakya Product Sales',
      icon: ShoppingCart,
      parent: '/reports'
    },
    '/reports/zakya/zakya-sales-order-register': {
      title: 'Zakya Sales Order Register',
      icon: FileText,
      parent: '/reports'
    },
    '/reports/zakya/zakya-sales-order-product-sales': {
      title: 'Zakya Products on Sales Orders',
      icon: Package,
      parent: '/reports'
    },
    '/reports/meta-marketing': {
      title: 'Meta Marketing Report',
      icon: TrendingUp,
      parent: '/reports'
    },
    '/agents/writer': {
      title: 'Product Writer',
      icon: PenLine,
      parent: null
    },
    '/agents/product-reviewer': {
      title: 'Product Reviewer',
      icon: Sparkles,
      parent: null
    },
    '/agents/keywords': {
      title: 'Keywords',
      icon: Tags,
      parent: null
    },
    '/agents/naming-teams': {
      title: 'Naming Teams',
      icon: Sparkles,
      parent: null
    },
    '/agents/collections': {
      title: 'Collection Pages',
      icon: LayoutDashboard,
      parent: null
    },
    '/agents/creative-pod': {
      title: 'Banner Generation',
      icon: Sparkles,
      parent: null
    },
    '/agents/marketing': {
      title: 'Meta Marketing',
      icon: Sparkles,
      parent: null
    },
    '/agents/settings': {
      title: 'Agent Settings',
      icon: Sparkles,
      parent: null
    }
  };

  // Check if this is a reports page
  const isReportPage = location.pathname.startsWith('/reports');
  const isAgentsPage = location.pathname.startsWith('/agents');
  
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
  // Exception: Always show breadcrumbs for reports pages
  if (!isReportPage && !isAgentsPage && (!currentConfig || (currentConfig.protected && !hasItemsInCart))) {
    return null;
  }
  
  // For reports pages, ensure we have a config
  if ((isReportPage || isAgentsPage) && !currentConfig) {
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
  // But always show for reports pages (even if just one item, show Reports > Current Report)
  if (!isReportPage && (breadcrumbs.length <= 1 || location.pathname === '/catalog')) {
    return null;
  }
  
  // For reports pages, ensure we have at least Reports > Current Report
  if (isReportPage && breadcrumbs.length === 0) {
    // Build breadcrumbs manually for reports
    const reportConfig = breadcrumbConfig[location.pathname];
    if (reportConfig) {
      breadcrumbs.push({
        path: '/reports',
        title: 'Reports',
        icon: BarChart3,
        protected: false
      });
      breadcrumbs.push({
        path: location.pathname,
        title: reportConfig.title,
        icon: reportConfig.icon,
        protected: false
      });
    }
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
