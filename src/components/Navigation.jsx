import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, FileText, User, Clock, Gem, Home, BarChart3, Menu, X, MapPin, Building2, LogOut, Shield, Lock } from 'lucide-react';
import {
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Menu as MuiMenu,
  MenuItem,
  Typography,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userInfo, logout, isAuthenticated, isAdmin } = useAuth();
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

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
      setUserMenuAnchor(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    if (onSidebarToggle) {
      onSidebarToggle(false);
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
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
      if (event.key === 'Escape' && userMenuAnchor) {
        handleUserMenuClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [sidebarOpen, userMenuAnchor]);

  // Handle clicks outside sidebar to close it (for desktop persistent drawer)
  React.useEffect(() => {
    if (!sidebarOpen || isMobile) return; // Only needed for desktop persistent drawer

    const handleClickOutside = (event) => {
      // Check if click is outside the drawer
      const drawer = document.querySelector('.MuiDrawer-root');
      const drawerPaper = document.querySelector('.MuiDrawer-paper');
      
      if (drawer && drawerPaper && !drawerPaper.contains(event.target)) {
        // Don't close if clicking on the menu button or user menu
        const menuButton = event.target.closest('[aria-label="toggle navigation menu"]');
        const userMenu = event.target.closest('.MuiMenu-root');
        
        if (!menuButton && !userMenu) {
          closeSidebar();
        }
      }
    };

    // Add a small delay to avoid immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen, isMobile]);

  const navigationItems = [
    { path: '/catalog', label: 'Catalog', icon: Package },
    { path: '/invoices', label: 'Invoices', icon: FileText },
    { path: '/store-locator', label: 'Store Locator', icon: MapPin },
    { path: '/store-management', label: 'Store Management', icon: Building2 },
    { path: '/customers', label: 'Customers', icon: User },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#ffffff',
          color: '#2c2416',
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: '60px', sm: '70px' },
          px: { xs: 1, sm: 2 },
        }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle navigation menu"
            onClick={toggleSidebar}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <Menu size={24} />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* Time Display */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, mr: 1 }}>
              <Clock size={18} color="#6b7280" />
              <Typography variant="body2" sx={{ color: '#6b7280', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                {currentTime}
              </Typography>
            </Box>

            {/* User Menu */}
            {userInfo && (
              <>
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{ 
                    color: '#2c2416',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: { xs: 0.5, sm: 1 },
                  }}
                >
                  <User size={isMobile ? 18 : 20} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      display: { xs: 'none', sm: 'block' }, 
                      ml: 0.5,
                      fontSize: '0.8rem',
                    }}
                  >
                    {userInfo.name || userInfo.email?.split('@')[0] || 'User'}
                  </Typography>
                  {userInfo.role && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: { xs: 'none', md: 'block' }, 
                        ml: 0.5, 
                        color: '#6b7280',
                        fontSize: '0.7rem',
                      }}
                    >
                      {userInfo.role}
                    </Typography>
                  )}
                </IconButton>
                <MuiMenu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {userInfo.email}
                    </Typography>
                    {userInfo.role && (
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        Role: {userInfo.role}
                      </Typography>
                    )}
                  </Box>
                  <Divider />
                  {isAdmin() && (
                    <>
                      <MenuItem
                        onClick={() => {
                          navigate('/user-management');
                          handleUserMenuClose();
                          closeSidebar();
                        }}
                      >
                        <Shield size={18} style={{ marginRight: 8 }} />
                        User Management
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          navigate('/permissions');
                          handleUserMenuClose();
                          closeSidebar();
                        }}
                      >
                        <Lock size={18} style={{ marginRight: 8 }} />
                        Permissions
                      </MenuItem>
                      <Divider />
                    </>
                  )}
                  <MenuItem onClick={handleLogout}>
                    <LogOut size={18} style={{ marginRight: 8 }} />
                    Logout
                  </MenuItem>
                </MuiMenu>
              </>
            )}

            {/* Cart Icon */}
            <IconButton
              color="inherit"
              onClick={handleCartClick}
              disabled={!hasItemsInCart}
              title={hasItemsInCart ? 'View Cart' : 'Add items to cart first'}
              sx={{ 
                opacity: hasItemsInCart ? 1 : 0.5,
                position: 'relative',
              }}
            >
              <Badge badgeContent={cartItemCount} color="primary" max={99}>
                <ShoppingCart size={isMobile ? 20 : 24} />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Left Sidebar Navigation */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={closeSidebar}
        sx={{
          width: { xs: 280, sm: 250 },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: { xs: 280, sm: 250 },
            boxSizing: 'border-box',
            mt: { xs: '60px', sm: '70px' },
            borderRight: '2px solid #8b6f47',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', pt: 1 }}>
          <List>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={active}
                    onClick={closeSidebar}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: '#f5f1e8',
                        color: '#8b6f47',
                        borderRight: '3px solid #8b6f47',
                        '&:hover': {
                          backgroundColor: '#f5f1e8',
                        },
                      },
                      '&:hover': {
                        backgroundColor: '#f8f6f0',
                        borderRight: '3px solid #d4c4a8',
                      },
                      borderRight: '3px solid transparent',
                      py: { xs: 1.5, sm: 1.5 },
                      px: { xs: 2, sm: 1.5 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 }, color: active ? '#8b6f47' : 'inherit' }}>
                      <Icon size={isMobile ? 22 : 20} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: { xs: '1rem', sm: '0.95rem' },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
};
