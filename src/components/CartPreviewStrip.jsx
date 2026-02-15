import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ChevronUp, ChevronDown, X, Plus, Minus, ArrowRight } from 'lucide-react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Button,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCart } from '../context/CartContext';

/**
 * CartPreviewStrip Component
 * Fixed bottom cart preview that shows items horizontally
 * 
 * @param {Object} props
 * @param {Function} props.onCartClick - Function to open the main cart drawer
 */
export const CartPreviewStrip = ({ onCartClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: '#ffffff',
        borderTop: '2px solid #8b6f47',
        borderRadius: 0,
        maxHeight: isExpanded ? { xs: '70vh', sm: '60vh' } : 'auto',
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.3s ease',
      }}
    >
      {/* Main Preview Bar */}
      <Box
        onClick={toggleExpanded}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: { xs: 1, sm: 1.5 },
          cursor: 'pointer',
          backgroundColor: '#faf8f3',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexGrow: 1 }}>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ShoppingCart size={isMobile ? 18 : 20} color="#8b6f47" />
            <Chip
              label={totals.itemCount}
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                minWidth: 20,
                height: 20,
                fontSize: '0.7rem',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#2c2416', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {totals.itemCount} items in cart
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#8b6f47', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              ₹{totals.total?.toLocaleString() || '0'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={toggleExpanded}
            aria-label="Toggle cart preview"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              hidePreview();
            }}
            aria-label="Hide cart preview"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <X size={18} />
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Content */}
      {isExpanded && (
        <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: { xs: 'calc(70vh - 60px)', sm: 'calc(60vh - 60px)' }, overflow: 'hidden' }}>
          {/* Items Carousel */}
          <Box sx={{ overflowX: 'auto', overflowY: 'auto', p: { xs: 1, sm: 1.5 }, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, flexWrap: 'nowrap', minWidth: 'max-content' }}>
              {items.map((item) => {
                const itemId = item.cart_item_id || item.id;
                const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                const itemTotal = safePrice * safeQuantity;

                return (
                  <Paper
                    key={itemId}
                    elevation={2}
                    sx={{
                      minWidth: { xs: 200, sm: 240 },
                      p: { xs: 1, sm: 1.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ fontSize: '2rem', flexShrink: 0 }}>
                        {item.image || '💎'}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                          ₹{safePrice.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Quantity Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(itemId, Math.max(0, safeQuantity - 1))}
                          disabled={loading || safeQuantity <= 1}
                          sx={{ minWidth: 32, minHeight: 32 }}
                        >
                          <Minus size={14} />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                          {safeQuantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(itemId, safeQuantity + 1)}
                          disabled={loading}
                          sx={{ minWidth: 32, minHeight: 32 }}
                        >
                          <Plus size={14} />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ₹{itemTotal.toLocaleString()}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(itemId)}
                          disabled={loading}
                          aria-label="Remove item"
                          sx={{ color: '#d32f2f', minWidth: 32, minHeight: 32 }}
                        >
                          <X size={14} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ borderTop: '1px solid #e8e0d0', p: { xs: 1.5, sm: 2 }, backgroundColor: '#faf8f3' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2">Subtotal: ₹{totals.subtotal?.toLocaleString() || '0'}</Typography>
              {totals.tax > 0 && (
                <Typography variant="body2">Tax: ₹{totals.tax?.toLocaleString() || '0'}</Typography>
              )}
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Total: ₹{totals.total?.toLocaleString() || '0'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ShoppingCart size={16} />}
                onClick={onCartClick}
                fullWidth
                sx={{ minHeight: 44 }}
              >
                View Cart
              </Button>
              <Button
                component={Link}
                to="/checkout"
                variant="contained"
                endIcon={<ArrowRight size={16} />}
                onClick={() => setIsExpanded(false)}
                fullWidth
                sx={{ minHeight: 44 }}
              >
                Checkout
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};
