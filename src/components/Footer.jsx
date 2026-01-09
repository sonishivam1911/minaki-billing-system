import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Phone, Mail, MapPin, Clock, Shield, Award, Truck, ShoppingCart } from 'lucide-react';
import { Box, Container, Grid, Typography, Button, Divider, Link as MuiLink, useTheme, useMediaQuery } from '@mui/material';
import { useCart } from '../context/CartContext';

/**
 * Footer Component
 * Modern ecommerce-style footer with company info, links, features, and cart access
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { totals } = useCart();
  const hasItemsInCart = totals.itemCount > 0;
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const titleRef = useRef(null);
  const linkRef = useRef(null);
  const bodyRef = useRef(null);

  // #region agent log
  useEffect(() => {
    const logData = {
      location: 'Footer.jsx:useEffect',
      message: 'Footer mounted - checking breakpoints and computed styles (post-fix)',
      data: {
        windowWidth: window.innerWidth,
        breakpoints: theme.breakpoints.values,
        activeBreakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg+' : 'unknown',
        titleComputedFontSize: titleRef.current ? window.getComputedStyle(titleRef.current).fontSize : null,
        linkComputedFontSize: linkRef.current ? window.getComputedStyle(linkRef.current).fontSize : null,
        bodyComputedFontSize: bodyRef.current ? window.getComputedStyle(bodyRef.current).fontSize : null,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'post-fix',
      hypothesisId: 'A',
    };
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  }, [theme.breakpoints.values, isXs, isSm, isMd, isLg]);
  // #endregion

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#faf8f3',
        borderTop: '2px solid #8b6f47',
        mt: 'auto',
        pt: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 1.5, sm: 2 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Brand Section */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 1, sm: 2 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                '& svg': {
                  width: { xs: 24, sm: 28, md: 32 },
                  height: { xs: 24, sm: 28, md: 32 },
                }
              }}>
                <Gem color="#8b6f47" />
              </Box>
              <Box>
                <Typography 
                  ref={titleRef}
                  sx={{ 
                    fontWeight: 600, 
                    color: '#8b6f47',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Minaki Billing System
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem', lg: '0.875rem' }, lineHeight: 1.4 }}>
                  Point of Sale
                </Typography>
              </Box>
            </Box>
            <Typography 
              ref={bodyRef}
              variant="body2" 
              sx={{ 
                color: '#5d4e37', 
                mb: { xs: 1.5, sm: 2 }, 
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, 
                lineHeight: 1.6,
                '&.MuiTypography-body2': {
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' },
                },
              }}
            >
              Professional jewelry point of sale system designed for modern jewelry retailers. 
              Streamline your sales, manage inventory, and delight customers.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.25,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <Phone color="#6b7280" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, wordBreak: 'break-word', lineHeight: 1.5 }}>
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.25,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <Mail color="#6b7280" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, wordBreak: 'break-word', lineHeight: 1.5 }}>
                  support@minakibilling.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.25,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <MapPin color="#6b7280" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, wordBreak: 'break-word', lineHeight: 1.5 }}>
                  123 Business District, Mumbai 400001
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              sx={{ 
                fontWeight: 600, 
                mb: { xs: 1, sm: 2 }, 
                color: '#2c2416',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
                lineHeight: 1.2,
              }}
            >
              Quick Links
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <li>
                <MuiLink 
                  ref={linkRef}
                  component={Link} 
                  to="/catalog" 
                  sx={{ 
                    color: '#5d4e37', 
                    textDecoration: 'none', 
                    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, 
                    lineHeight: 1.5, 
                    '&:hover': { textDecoration: 'underline' },
                    '&.MuiLink-root': {
                      fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' },
                    },
                  }}
                >
                  Product Catalog
                </MuiLink>
              </li>
              <li>
                <MuiLink
                  component={Link}
                  to="/customers"
                  onClick={(e) => {
                    if (!hasItemsInCart) {
                      e.preventDefault();
                      alert('Add items to cart first to access customer management');
                    }
                  }}
                  sx={{
                    color: hasItemsInCart ? '#5d4e37' : '#9ca3af',
                    textDecoration: 'none',
                    cursor: hasItemsInCart ? 'pointer' : 'not-allowed',
                    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' },
                    lineHeight: 1.5,
                    '&:hover': { textDecoration: hasItemsInCart ? 'underline' : 'none' },
                  }}
                >
                  Customer Management
                </MuiLink>
              </li>
              <li>
                <MuiLink
                  component={Link}
                  to="/checkout"
                  onClick={(e) => {
                    if (!hasItemsInCart) {
                      e.preventDefault();
                      alert('Add items to cart first to proceed to checkout');
                    }
                  }}
                  sx={{
                    color: hasItemsInCart ? '#5d4e37' : '#9ca3af',
                    textDecoration: 'none',
                    cursor: hasItemsInCart ? 'pointer' : 'not-allowed',
                    fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' },
                    lineHeight: 1.5,
                    '&:hover': { textDecoration: hasItemsInCart ? 'underline' : 'none' },
                  }}
                >
                  Checkout & Billing
                </MuiLink>
              </li>
              <li>
                <MuiLink href="/reports" sx={{ color: '#5d4e37', textDecoration: 'none', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5, '&:hover': { textDecoration: 'underline' } }}>
                  Sales Reports
                </MuiLink>
              </li>
              <li>
                <MuiLink href="/inventory" sx={{ color: '#5d4e37', textDecoration: 'none', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5, '&:hover': { textDecoration: 'underline' } }}>
                  Inventory
                </MuiLink>
              </li>
            </Box>
          </Grid>

          {/* Features */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              sx={{ 
                fontWeight: 600, 
                mb: { xs: 1, sm: 2 }, 
                color: '#2c2416',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
                lineHeight: 1.2,
              }}
            >
              Features
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <Shield color="#8b6f47" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>
                  Secure Transactions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <Award color="#8b6f47" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>
                  Quality Assurance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <Truck color="#8b6f47" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>
                  Fast Processing
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  '& svg': {
                    width: { xs: 14, sm: 16 },
                    height: { xs: 14, sm: 16 },
                  }
                }}>
                  <Clock color="#8b6f47" />
                </Box>
                <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>
                  Real-time Updates
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Cart & Business Hours */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography 
              sx={{ 
                fontWeight: 600, 
                mb: { xs: 1, sm: 2 }, 
                color: '#2c2416',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
                lineHeight: 1.2,
              }}
            >
              Shopping Cart
            </Typography>
            <Button
              component={Link}
              to="/cart"
              variant={hasItemsInCart ? 'contained' : 'outlined'}
              startIcon={<ShoppingCart size={18} />}
              onClick={(e) => {
                if (!hasItemsInCart) {
                  e.preventDefault();
                  alert('Your cart is empty. Add items from the catalog first.');
                }
              }}
              disabled={!hasItemsInCart}
              fullWidth
              sx={{ 
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' },
                py: { xs: 0.75, sm: 1 },
              }}
            >
              {hasItemsInCart ? `View Cart (${totals.itemCount} items)` : 'Cart Empty'}
            </Button>
            {hasItemsInCart && (
              <Typography variant="body2" sx={{ color: '#5d4e37', fontWeight: 600, mb: 2, fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>
                Total: ₹{totals.subtotal?.toLocaleString() || '0'}
              </Typography>
            )}
            
            <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
              <Typography sx={{ fontWeight: 600, mb: 1, color: '#2c2416', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.2 }}>
                Business Hours
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>Monday - Friday</Typography>
                  <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>9:00 AM - 7:00 PM</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>Saturday</Typography>
                  <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>10:00 AM - 6:00 PM</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>Sunday</Typography>
                  <Typography variant="body2" sx={{ color: '#5d4e37', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>12:00 PM - 5:00 PM</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        {/* Footer Bottom */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: { xs: 1.5, sm: 2 },
        }}>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5 }}>
            &copy; {currentYear} Minaki Billing System. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
            <MuiLink href="/privacy" sx={{ color: '#5d4e37', textDecoration: 'none', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5, '&:hover': { textDecoration: 'underline' } }}>
              Privacy Policy
            </MuiLink>
            <MuiLink href="/terms" sx={{ color: '#5d4e37', textDecoration: 'none', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5, '&:hover': { textDecoration: 'underline' } }}>
              Terms of Service
            </MuiLink>
            <MuiLink href="/support" sx={{ color: '#5d4e37', textDecoration: 'none', fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem', lg: '1.0625rem' }, lineHeight: 1.5, '&:hover': { textDecoration: 'underline' } }}>
              Support
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
