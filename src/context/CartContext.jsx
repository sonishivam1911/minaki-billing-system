import React, { createContext, useContext } from 'react';
import { useCart as useCartHook } from '../hooks/useCart';

/**
 * Cart Context
 * Provides global cart state management across the application
 */
const CartContext = createContext();

/**
 * Cart Provider Component
 * Wraps the application to provide cart state globally
 */
export const CartProvider = ({ children }) => {
  const cartState = useCartHook();

  return (
    <CartContext.Provider value={cartState}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * Hook to use cart context
 * Must be used within CartProvider
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};