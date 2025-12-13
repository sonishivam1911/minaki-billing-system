import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navigation, Footer, DrawerCart, Breadcrumbs, CartPreviewStrip } from './components';
import { CatalogPage, CartPage, CheckoutPage, CustomersPage, InvoicesPage, ProductDetailPage, StoreLocatorPage, StoreManagementPage } from './pages';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  
  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <Router>
      <div className="app">
        <Navigation 
          cartItemCount={totals.itemCount} 
          onCartClick={openDrawer}
          onSidebarToggle={handleSidebarToggle}
        />
        
        <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <div className="main-content">
            <Breadcrumbs />
            
            <div className="page-content">
              <Routes>
                {/* Default to catalog */}
                <Route path="/" element={<Navigate to="/catalog" replace />} />
                
                {/* Always accessible */}
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/store-locator" element={<StoreLocatorPage />} />
                <Route path="/store-management" element={<StoreManagementPage />} />
                
                {/* Product detail pages - accessible without cart */}
                <Route path="/product/:type/:id" element={<ProductDetailPage />} />
                
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
                
                {/* Always accessible */}
                <Route 
                  path="/customers" 
                  element={<CustomersPage />} 
                />

                
                
                {/* Fallback for invalid routes */}
                <Route path="*" element={<Navigate to="/catalog" replace />} />
              </Routes>
            </div>
          </div>
        </div>

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