import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Percent, X } from 'lucide-react';
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
  TextField,
  Alert,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import api from '../services/api';

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
    loading,
    cartId,
    refreshCart
  } = useCart();
  
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

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
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
      } catch (err) {
        console.error('Failed to clear cart:', err);
      }
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || !cartId) return;
    
    setApplyingDiscount(true);
    setDiscountError('');
    
    try {
      // First, try to get all discounts to find the one matching the code
      const discounts = await api.discounts.getAll();
      const discount = discounts.find(d => 
        d.code?.toLowerCase() === discountCode.trim().toLowerCase() || 
        d.id?.toString() === discountCode.trim()
      );
      
      if (!discount) {
        setDiscountError('Discount code not found');
        setApplyingDiscount(false);
        return;
      }
      
      // Apply the discount to the cart
      await api.discounts.applyToCart(cartId, discount.id);
      setAppliedDiscount(discount);
      setDiscountCode('');
      
      // Refresh cart to get updated totals
      await refreshCart();
    } catch (err) {
      console.error('Failed to apply discount:', err);
      setDiscountError(err.message || 'Failed to apply discount');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!cartId) return;
    
    try {
      await api.discounts.removeFromCart(cartId);
      setAppliedDiscount(null);
      setDiscountError('');
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove discount:', err);
      setDiscountError(err.message || 'Failed to remove discount');
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
                          {(item.minaki_code || item.sku) && (
                            <Typography variant="caption" sx={{ color: '#8b6f47', display: 'block' }}>
                              MINAKI: {item.minaki_code || item.sku}
                            </Typography>
                          )}
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
            {/* Discount Section */}
            <Box sx={{ mb: 2 }}>
              {appliedDiscount ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1.5,
                  backgroundColor: '#f0f9ff',
                  borderRadius: 1,
                  border: '1px solid #bae6fd',
                  mb: 1
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#0369a1' }}>
                      Discount Applied: {appliedDiscount.code || appliedDiscount.name}
                    </Typography>
                    {appliedDiscount.percent && (
                      <Typography variant="caption" sx={{ color: '#0284c7', display: 'block' }}>
                        {appliedDiscount.percent}% off
                      </Typography>
                    )}
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={handleRemoveDiscount}
                    disabled={loading || applyingDiscount}
                    sx={{ color: '#0369a1' }}
                  >
                    <X size={16} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyDiscount();
                      }
                    }}
                    disabled={loading || applyingDiscount}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleApplyDiscount}
                    disabled={loading || applyingDiscount || !discountCode.trim()}
                    startIcon={<Percent size={16} />}
                    sx={{ 
                      minWidth: 'auto',
                      borderColor: '#8b6f47',
                      color: '#8b6f47',
                      '&:hover': {
                        borderColor: '#6b5435',
                        backgroundColor: '#faf8f3'
                      }
                    }}
                  >
                    Apply
                  </Button>
                </Box>
              )}
              {discountError && (
                <Alert severity="error" sx={{ mt: 1, mb: 1 }} onClose={() => setDiscountError('')}>
                  {discountError}
                </Alert>
              )}
            </Box>

            {/* Cart Summary */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">₹{totals.subtotal?.toLocaleString() || '0'}</Typography>
              </Box>
              {appliedDiscount && totals.discount && totals.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#0369a1' }}>
                    Discount:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0369a1' }}>
                    -₹{totals.discount.toLocaleString()}
                  </Typography>
                </Box>
              )}
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
