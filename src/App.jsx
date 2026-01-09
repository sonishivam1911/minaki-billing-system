import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, CircularProgress } from '@mui/material';
import { Navigation, Footer, DrawerCart, Breadcrumbs, CartPreviewStrip } from './components';
import { CatalogPage, CartPage, CheckoutPage, CustomersPage, InvoicesPage, ProductDetailPage, StoreLocatorPage, StoreManagementPage, StorageTypeDetailPage, LoginPage, UserManagementPage, PermissionManagementPage } from './pages';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import './styles/App.css';

/**
 * ProtectedRoute Component
 * Protects routes based on authentication and cart state
 */
const ProtectedRoute = ({ element, requiresCart = false, children, requireAuth = true }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { totals } = useCart();
  const hasItemsInCart = totals.itemCount > 0;
  const location = useLocation();

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check authentication first
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check cart requirement
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
  const { isAuthenticated } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  
  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:60',message:'DndProvider initialized',data:{backend:'HTML5Backend'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, []);
  // #endregion

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Only show navigation when authenticated */}
        {isAuthenticated && (
          <Navigation 
            cartItemCount={totals.itemCount} 
            onCartClick={openDrawer}
            onSidebarToggle={handleSidebarToggle}
          />
        )}
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: { xs: '60px', sm: '70px' },
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          {/* Only show breadcrumbs when authenticated */}
          {isAuthenticated && <Breadcrumbs />}
          
          <Box sx={{ flexGrow: 1, width: '100%', overflowX: 'hidden' }}>
            <Routes>
                {/* Login page - public, redirect if already authenticated */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Default to catalog */}
                <Route path="/" element={<Navigate to="/catalog" replace />} />
                
                {/* Protected routes - require authentication */}
                <Route 
                  path="/catalog" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <CatalogPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/invoices" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <InvoicesPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/store-locator" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <StoreLocatorPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/store-locator/storage-type/:storageTypeId" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <StorageTypeDetailPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/store-management" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <StoreManagementPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Product detail pages - require auth */}
                <Route 
                  path="/product/:type/:id" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <ProductDetailPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes - require auth AND items in cart */}
                <Route 
                  path="/cart" 
                  element={
                    <ProtectedRoute requireAuth={true} requiresCart={true}>
                      <CartPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute requireAuth={true} requiresCart={true}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes - require auth */}
                <Route 
                  path="/customers" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <CustomersPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin routes - require auth */}
                <Route 
                  path="/user-management" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/permissions" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <PermissionManagementPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback for invalid routes */}
                <Route path="*" element={<Navigate to="/catalog" replace />} />
              </Routes>
          </Box>

          {/* Only show cart preview and footer when authenticated */}
          {isAuthenticated && (
            <>
              <CartPreviewStrip onCartClick={openDrawer} />
              <Footer />
            </>
          )}
        </Box>
        
        {/* Drawer Cart - only show when authenticated */}
        {isAuthenticated && (
          <DrawerCart 
            isOpen={isDrawerOpen} 
            onClose={closeDrawer} 
          />
        )}
      </Box>
    </Router>
    </DndProvider>
  );
}

export default App;