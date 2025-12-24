import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, FileText, User, Clock, Gem, Home, BarChart3, Menu, X, MapPin, Building2, LogOut, Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Navigation Component
 * Top navigation bar with logo, left sidebar navigation, and cart
 * 
 * @param {Object} props
 * @param {number} props.cartItemCount - Number of items in cart
 * @param {Function} props.onCartClick - Function to open cart drawer
 * @param {Function} props.onSidebarToggle - Function to handle sidebar state changes
 */
export const Navigation = ({ cartItemCount = 0, onCartClick, onSidebarToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo, logout, isAuthenticated, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed by default
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Update clock every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => location.pathname === path;
  const hasItemsInCart = cartItemCount > 0;

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!hasItemsInCart) {
      alert('Add items to cart first');
      return;
    }
    onCartClick();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Notify parent component about sidebar state change
    if (onSidebarToggle) {
      onSidebarToggle(!sidebarOpen);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    // Notify parent component about sidebar state change
    if (onSidebarToggle) {
      onSidebarToggle(false);
    }
  };

  // Notify parent on initial load
  React.useEffect(() => {
    if (onSidebarToggle) {
      onSidebarToggle(sidebarOpen);
    }
  }, []);

  // Add keyboard shortcut for toggling sidebar
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      // Escape to close sidebar
      if (event.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
      // Escape to close user menu
      if (event.key === 'Escape' && showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [sidebarOpen, showUserMenu]);

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  return (
    <>
      {/* Top Header Bar */}
      <header className="top-header">
        <div className="header-left">
          <button 
            className="mobile-menu-btn hamburger-menu"
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="header-center">
          <div className="header-brand">
            <Gem size={32} />
            <div>
              <div className="brand-name">Minaki Billing System</div>
              <div className="brand-tagline">Point of Sale</div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="header-time">
            <Clock size={18} />
            <span className="time-text">{currentTime}</span>
          </div>
          
          {/* User Info */}
          {userInfo && (
            <div className="user-menu-container">
              <button
                className="user-menu-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={`Logged in as ${userInfo.email || userInfo.name || 'User'}`}
              >
                <User size={20} />
                <span className="user-name">
                  {userInfo.name || userInfo.email?.split('@')[0] || 'User'}
                </span>
                {userInfo.role && (
                  <span className="user-role">{userInfo.role}</span>
                )}
              </button>
              
              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-info">
                    <div className="user-menu-email">{userInfo.email}</div>
                    {userInfo.role && (
                      <div className="user-menu-role">Role: {userInfo.role}</div>
                    )}
                  </div>
                  <div className="user-menu-divider"></div>
                  
                  {/* Admin-only menu items */}
                  {isAdmin() && (
                    <>
                      <button
                        className="user-menu-item"
                        onClick={() => {
                          navigate('/user-management');
                          setShowUserMenu(false);
                        }}
                      >
                        <Shield size={18} />
                        <span>User Management</span>
                      </button>
                      <button
                        className="user-menu-item"
                        onClick={() => {
                          navigate('/permissions');
                          setShowUserMenu(false);
                        }}
                      >
                        <Lock size={18} />
                        <span>Permissions</span>
                      </button>
                      <div className="user-menu-divider"></div>
                    </>
                  )}
                  
                  <button
                    className="user-menu-item logout-button"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button 
            className={`cart-icon ${!hasItemsInCart ? 'disabled' : ''}`}
            onClick={handleCartClick}
            disabled={!hasItemsInCart}
            title={hasItemsInCart ? 'View Cart' : 'Add items to cart first'}
          >
            <ShoppingCart size={24} />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* Left Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span>Navigation</span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={closeSidebar}
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/catalog" 
            className={`sidebar-link ${isActive('/catalog') ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 968 && closeSidebar()} // Only close on mobile
          >
            <Package size={20} />
            <span>Catalog</span>
          </Link>
          
          <Link 
            to="/invoices" 
            className={`sidebar-link ${isActive('/invoices') ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 968 && closeSidebar()}
          >
            <FileText size={20} />
            <span>Invoices</span>
          </Link>

          <Link 
            to="/store-locator" 
            className={`sidebar-link ${isActive('/store-locator') ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 968 && closeSidebar()}
          >
            <MapPin size={20} />
            <span>Store Locator</span>
          </Link>

          <Link 
            to="/store-management" 
            className={`sidebar-link ${isActive('/store-management') ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 968 && closeSidebar()}
          >
            <Building2 size={20} />
            <span>Store Management</span>
          </Link>

          <Link 
            to="/customers" 
            className={`sidebar-link ${isActive('/customers') ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 968 && closeSidebar()}
          >
            <User size={20} />
            <span>Customers</span>
          </Link>

          <Link 
            to="/reports" 
            className={`sidebar-link ${isActive('/reports') ? 'active' : ''}`}
            onClick={() => window.innerWidth <= 968 && closeSidebar()}
          >
            <BarChart3 size={20} />
            <span>Reports</span>
          </Link>
        </nav>
      </aside>

      {/* Sidebar Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      ></div>
    </>
  );
};