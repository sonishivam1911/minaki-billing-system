import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation, Footer, DrawerCart, Breadcrumbs, CartPreviewStrip } from './components';
import { CatalogPage, CartPage, CheckoutPage, CustomersPage } from './pages';
import { useCart } from './context/CartContext';
import './styles/App.css';

/**
 * ProtectedRoute Component
 * Protects routes based on cart state and workflow
 */
const ProtectedRoute = ({ element, requiresCart = false, children }) => {
  const { totals } = useCart();
  const hasItemsInCart = totals.itemCount > 0;

  if (requiresCart && !hasItemsInCart) {
    return <Navigate to="/catalog" replace />;
  }

  return element || children;
};

/**
 * Main App Component
 * Sets up routing with workflow restrictions and global state
 */
function App() {
  const { totals } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <Router>
      <div className="app">
        <Navigation 
          cartItemCount={totals.itemCount} 
          onCartClick={openDrawer}
        />
        
        <Breadcrumbs />
        
        <main className="main-content">
          <Routes>
            {/* Default to catalog */}
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            
            {/* Always accessible */}
            <Route path="/catalog" element={<CatalogPage />} />
            
            {/* Protected routes - require items in cart */}
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute requiresCart={true}>
                  <CartPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute requiresCart={true}>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute requiresCart={true}>
                  <CustomersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback for invalid routes */}
            <Route path="*" element={<Navigate to="/catalog" replace />} />
          </Routes>
        </main>

        {/* Cart Preview Strip */}
        <CartPreviewStrip onCartClick={openDrawer} />

        <Footer />
        
        {/* Drawer Cart */}
        <DrawerCart 
          isOpen={isDrawerOpen} 
          onClose={closeDrawer} 
        />
      </div>
    </Router>
  );
}

export default App;