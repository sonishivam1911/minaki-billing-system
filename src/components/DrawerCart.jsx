import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Close } from '@mui/icons-material';
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

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Drawer Header */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e0d0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart size={24} color="#8b6f47" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Shopping Cart
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              ({totals.itemCount} items)
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Drawer Body */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, textAlign: 'center' }}>
              <ShoppingCart size={48} color="#9ca3af" />
              <Typography variant="h6" sx={{ mt: 2, color: '#2c2416' }}>
                Your cart is empty
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                Add items from the catalog to get started
              </Typography>
            </Box>
          ) : (
            <>
              {/* Cart Items */}
              <List>
                {items.map((item) => {
                  const itemId = item.cart_item_id || item.id;
                  const safePrice = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
                  const safeQuantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
                  const itemTotal = safePrice * safeQuantity;

                  return (
                    <ListItem
                      key={itemId}
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        borderBottom: '1px solid #e8e0d0',
                        py: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ fontSize: '2rem', flexShrink: 0 }}>
                          {item.image || '💎'}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                            ₹{safePrice.toLocaleString()}
                          </Typography>
                          
                          {/* Quantity Controls */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(itemId, Math.max(0, safeQuantity - 1))}
                              disabled={loading || safeQuantity <= 1}
                            >
                              <Minus size={16} />
                            </IconButton>
                            <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                              {safeQuantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(itemId, safeQuantity + 1)}
                              disabled={loading}
                            >
                              <Plus size={16} />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            ₹{itemTotal.toLocaleString()}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(itemId)}
                            disabled={loading}
                            aria-label="Remove item"
                            sx={{ color: '#d32f2f' }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>

              {/* Clear Cart Button */}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="text"
                  onClick={handleClearCart}
                  disabled={loading}
                  sx={{ color: '#d32f2f' }}
                >
                  Clear Cart
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <Box sx={{ borderTop: '1px solid #e8e0d0', p: 2 }}>
            {/* Cart Summary */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">₹{totals.subtotal?.toLocaleString() || '0'}</Typography>
              </Box>
              {totals.tax > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2">₹{totals.tax?.toLocaleString() || '0'}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Total:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹{totals.total?.toLocaleString() || '0'}
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                component={Link}
                to="/cart"
                variant="outlined"
                fullWidth
                onClick={handleCheckout}
              >
                View Full Cart
              </Button>
              <Button
                component={Link}
                to="/checkout"
                variant="contained"
                fullWidth
                onClick={handleCheckout}
                endIcon={<ArrowRight size={18} />}
              >
                Checkout
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
