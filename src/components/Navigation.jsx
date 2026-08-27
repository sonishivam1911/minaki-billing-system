import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, FileText, User, Clock, Gem, Home, BarChart3, Menu, X, MapPin, Building2, LogOut, Shield, Lock, UserPlus, ShoppingBag, Users, LayoutDashboard, Calendar, MessageCircle, Sparkles, PenLine, Tags, HardDrive, TrendingUp, Link2, MapPinned, Bot, Search, Globe, Settings, RotateCcw, MessageSquare, Send } from 'lucide-react';
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
  Collapse,
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
  const isHrActive = location.pathname.startsWith('/hr');
  const isAgentsActive = location.pathname.startsWith('/agents');
  const isSeoActive = location.pathname.startsWith('/seo');
  const isWhatsappActive = ['/whatsapp-crm', '/shopify-winback', '/whatsapp-templates', '/crm-segments', '/crm-campaigns'].some(
    (path) => location.pathname.startsWith(path),
  );
  const [hrNavOpen, setHrNavOpen] = useState(isHrActive);
  // Keep Agents expanded by default so lower-nav items stay discoverable once the sidebar scrolls.
  const [agentsNavOpen, setAgentsNavOpen] = useState(true);
  const [seoNavOpen, setSeoNavOpen] = useState(isSeoActive);
  const [whatsappNavOpen, setWhatsappNavOpen] = useState(isWhatsappActive);
  const hasItemsInCart = cartItemCount > 0;

  React.useEffect(() => {
    if (isHrActive) setHrNavOpen(true);
  }, [isHrActive]);

  React.useEffect(() => {
    if (isAgentsActive) setAgentsNavOpen(true);
  }, [isAgentsActive]);

  React.useEffect(() => {
    if (isWhatsappActive) setWhatsappNavOpen(true);
  }, [isWhatsappActive]);

  React.useEffect(() => {
    if (isSeoActive) setSeoNavOpen(true);
  }, [isSeoActive]);

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
    { path: '/catalog', label: 'Home', icon: Home },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/invoices', label: 'Invoices', icon: FileText },
    { path: '/store-locator', label: 'Store Locator', icon: MapPin },
    { path: '/store-management', label: 'Store Management', icon: Building2 },
    { path: '/drive', label: 'Drive', icon: HardDrive },
    { path: '/customers', label: 'Customers', icon: User },
    { path: '/walk-ins', label: 'Walk-ins', icon: UserPlus },
    { path: '/custom-products', label: 'Custom Products', icon: ShoppingBag },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  const hrNavItems = [
    { path: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/hr/weekly-schedule', label: 'Weekly Schedule', icon: Calendar },
  ];

  const whatsappNavItems = [
    { path: '/whatsapp-crm', label: 'WhatsApp CRM', icon: MessageCircle },
    { path: '/shopify-winback', label: 'Abandoned Checkout Winback', icon: RotateCcw },
    { path: '/whatsapp-templates', label: 'WhatsApp Templates', icon: MessageSquare },
    { path: '/crm-segments', label: 'CRM Segments', icon: Users },
    { path: '/crm-campaigns', label: 'Campaigns', icon: Send },
  ];

  const agentsNavItems = [
    { path: '/agents/writer', label: 'Product Writer', icon: PenLine },
    { path: '/agents/product-reviewer', label: 'Product Reviewer', icon: Sparkles },
    { path: '/agents/keywords', label: 'Keywords', icon: Tags },
    { path: '/agents/naming-teams', label: 'Naming Teams', icon: Sparkles },
    { path: '/agents/collections', label: 'Collections', icon: LayoutDashboard },
    { path: '/agents/campaign-creative', label: 'Campaign Creative', icon: Sparkles },
    { path: '/agents/creative-pod', label: 'Banner Generation', icon: Sparkles },
    { path: '/agents/marketing', label: 'Meta Marketing', icon: Sparkles },
    { path: '/agents/settings', label: 'Agent Settings', icon: Settings },
  ];

  const seoNavItems = [
    { path: '/seo/site-crawl', label: 'Site Crawl', icon: Globe },
    { path: '/seo/keyword-planner', label: 'Keyword Planner', icon: Tags },
    { path: '/seo/rank-tracker', label: 'Rank Tracker', icon: TrendingUp },
    { path: '/seo/backlinks', label: 'Backlinks', icon: Link2 },
    { path: '/seo/local-seo', label: 'Local SEO', icon: MapPinned },
    { path: '/seo/ai-visibility', label: 'AI Visibility', icon: Bot },
    { path: '/seo/serp-results', label: 'SERP Results', icon: Search },
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          borderBottom: '1px solid #e9edef',
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
          width: { xs: 280, sm: 260 },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: { xs: 280, sm: 260 },
            boxSizing: 'border-box',
            mt: { xs: '60px', sm: '70px' },
            // Cap height under the AppBar so the inner list can scroll to Agents / HR.
            height: { xs: 'calc(100% - 60px)', sm: 'calc(100% - 70px)' },
            maxHeight: { xs: 'calc(100dvh - 60px)', sm: 'calc(100dvh - 70px)' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '2px solid #8b6f47',
            backgroundColor: '#faf8f5',
            boxShadow: '4px 0 20px rgba(139, 111, 71, 0.08)',
          },
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            pt: 2,
            pb: 3,
          }}
        >
          <Typography variant="overline" sx={{ px: 2, py: 0.5, color: '#6b7280', fontSize: '0.7rem', letterSpacing: 1.2 }}>
            Main Menu
          </Typography>
          <List sx={{ pt: 0 }}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isWhatsApp = item.path === '/whatsapp-crm';
              return (
                <ListItem key={item.path} disablePadding sx={{ px: 1, mb: 0.25 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={active}
                    onClick={closeSidebar}
                    sx={{
                      borderRadius: '8px',
                      mx: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: isWhatsApp ? 'rgba(37, 211, 102, 0.12)' : '#f5f1e8',
                        color: isWhatsApp ? '#128C7E' : '#8b6f47',
                        borderRight: 'none',
                        '&:hover': {
                          backgroundColor: isWhatsApp ? 'rgba(37, 211, 102, 0.18)' : '#f5f1e8',
                        },
                        '& .MuiListItemIcon-root': {
                          color: isWhatsApp ? '#25D366' : '#8b6f47',
                        },
                      },
                      '&:hover': {
                        backgroundColor: isWhatsApp ? 'rgba(37, 211, 102, 0.08)' : '#f8f6f0',
                        borderRight: 'none',
                      },
                      py: { xs: 1.25, sm: 1.25 },
                      px: { xs: 1.5, sm: 1.5 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 }, color: active ? (isWhatsApp ? '#25D366' : '#8b6f47') : 'inherit' }}>
                      <Icon size={isMobile ? 22 : 20} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: { xs: '0.95rem', sm: '0.9rem' },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
            <Divider sx={{ my: 2, mx: 2 }} />
            <Typography variant="overline" sx={{ px: 2, py: 0.5, color: '#6b7280', fontSize: '0.7rem', letterSpacing: 1.2 }}>
              HR
            </Typography>
            {/* HR section with expandable sub-nav */}
            <ListItem disablePadding sx={{ px: 1, mb: 0.25 }}>
              <ListItemButton
                onClick={() => setHrNavOpen(!hrNavOpen)}
                sx={{
                  borderRadius: '8px',
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: '#f8f6f0',
                  },
                  py: { xs: 1.25, sm: 1.25 },
                  px: { xs: 1.5, sm: 1.5 },
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 }, color: isHrActive ? '#8b6f47' : 'inherit' }}>
                  <Users size={isMobile ? 22 : 20} />
                </ListItemIcon>
                <ListItemText 
                  primary="HR"
                  primaryTypographyProps={{
                    fontWeight: isHrActive ? 600 : 500,
                    fontSize: { xs: '0.95rem', sm: '0.9rem' },
                  }}
                />
                <Typography variant="body2" sx={{ transform: hrNavOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6b7280' }}>▼</Typography>
              </ListItemButton>
            </ListItem>
            <Collapse in={hrNavOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 1 }}>
                {hrNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <ListItem key={item.path} disablePadding sx={{ pl: 2, mb: 0.25 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={active}
                        onClick={closeSidebar}
                        sx={{
                          borderRadius: '8px',
                          '&.Mui-selected': {
                            backgroundColor: '#f5f1e8',
                            color: '#8b6f47',
                            '&:hover': { backgroundColor: '#f5f1e8' },
                          },
                          '&:hover': {
                            backgroundColor: '#f8f6f0',
                          },
                          py: 1,
                          px: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: active ? '#8b6f47' : 'inherit' }}>
                          <Icon size={18} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
            <Divider sx={{ my: 2, mx: 2 }} />
            <Typography variant="overline" sx={{ px: 2, py: 0.5, color: '#6b7280', fontSize: '0.7rem', letterSpacing: 1.2 }}>
              Agents
            </Typography>
            <ListItem disablePadding sx={{ px: 1, mb: 0.25 }}>
              <ListItemButton
                onClick={() => setAgentsNavOpen(!agentsNavOpen)}
                sx={{
                  borderRadius: '8px',
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: '#f8f6f0',
                  },
                  py: { xs: 1.25, sm: 1.25 },
                  px: { xs: 1.5, sm: 1.5 },
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 }, color: isAgentsActive ? '#8b6f47' : 'inherit' }}>
                  <Sparkles size={isMobile ? 22 : 20} />
                </ListItemIcon>
                <ListItemText
                  primary="Agents"
                  primaryTypographyProps={{
                    fontWeight: isAgentsActive ? 600 : 500,
                    fontSize: { xs: '0.95rem', sm: '0.9rem' },
                  }}
                />
                <Typography variant="body2" sx={{ transform: agentsNavOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6b7280' }}>▼</Typography>
              </ListItemButton>
            </ListItem>
            <Collapse in={agentsNavOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 1 }}>
                {agentsNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <ListItem key={item.path} disablePadding sx={{ pl: 2, mb: 0.25 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={active}
                        onClick={closeSidebar}
                        sx={{
                          borderRadius: '8px',
                          '&.Mui-selected': {
                            backgroundColor: '#f5f1e8',
                            color: '#8b6f47',
                            '&:hover': { backgroundColor: '#f5f1e8' },
                          },
                          '&:hover': {
                            backgroundColor: '#f8f6f0',
                          },
                          py: 1,
                          px: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: active ? '#8b6f47' : 'inherit' }}>
                          <Icon size={18} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
            <Divider sx={{ my: 2, mx: 2 }} />
            <Typography variant="overline" sx={{ px: 2, py: 0.5, color: '#6b7280', fontSize: '0.7rem', letterSpacing: 1.2 }}>
              WhatsApp
            </Typography>
            <ListItem disablePadding sx={{ px: 1, mb: 0.25 }}>
              <ListItemButton
                onClick={() => setWhatsappNavOpen(!whatsappNavOpen)}
                sx={{
                  borderRadius: '8px',
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: '#f8f6f0',
                  },
                  py: { xs: 1.25, sm: 1.25 },
                  px: { xs: 1.5, sm: 1.5 },
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 }, color: isWhatsappActive ? '#8b6f47' : 'inherit' }}>
                  <MessageCircle size={isMobile ? 22 : 20} />
                </ListItemIcon>
                <ListItemText
                  primary="WhatsApp"
                  primaryTypographyProps={{
                    fontWeight: isWhatsappActive ? 600 : 500,
                    fontSize: { xs: '0.95rem', sm: '0.9rem' },
                  }}
                />
                <Typography variant="body2" sx={{ transform: whatsappNavOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6b7280' }}>▼</Typography>
              </ListItemButton>
            </ListItem>
            <Collapse in={whatsappNavOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 1 }}>
                {whatsappNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <ListItem key={item.path} disablePadding sx={{ pl: 2, mb: 0.25 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={active}
                        onClick={closeSidebar}
                        sx={{
                          borderRadius: '8px',
                          '&.Mui-selected': {
                            backgroundColor: '#f5f1e8',
                            color: '#8b6f47',
                            '&:hover': { backgroundColor: '#f5f1e8' },
                          },
                          '&:hover': {
                            backgroundColor: '#f8f6f0',
                          },
                          py: 1,
                          px: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: active ? '#8b6f47' : 'inherit' }}>
                          <Icon size={18} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
            <Divider sx={{ my: 2, mx: 2 }} />
            <Typography variant="overline" sx={{ px: 2, py: 0.5, color: '#6b7280', fontSize: '0.7rem', letterSpacing: 1.2 }}>
              SEO
            </Typography>
            <ListItem disablePadding sx={{ px: 1, mb: 0.25 }}>
              <ListItemButton
                onClick={() => setSeoNavOpen(!seoNavOpen)}
                sx={{
                  borderRadius: '8px',
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: '#f8f6f0',
                  },
                  py: { xs: 1.25, sm: 1.25 },
                  px: { xs: 1.5, sm: 1.5 },
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 }, color: isSeoActive ? '#8b6f47' : 'inherit' }}>
                  <TrendingUp size={isMobile ? 22 : 20} />
                </ListItemIcon>
                <ListItemText
                  primary="SEO"
                  primaryTypographyProps={{
                    fontWeight: isSeoActive ? 600 : 500,
                    fontSize: { xs: '0.95rem', sm: '0.9rem' },
                  }}
                />
                <Typography variant="body2" sx={{ transform: seoNavOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6b7280' }}>▼</Typography>
              </ListItemButton>
            </ListItem>
            <Collapse in={seoNavOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 1 }}>
                {seoNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <ListItem key={item.path} disablePadding sx={{ pl: 2, mb: 0.25 }}>
                      <ListItemButton
                        component={Link}
                        to={item.path}
                        selected={active}
                        onClick={closeSidebar}
                        sx={{
                          borderRadius: '8px',
                          '&.Mui-selected': {
                            backgroundColor: '#f5f1e8',
                            color: '#8b6f47',
                            '&:hover': { backgroundColor: '#f5f1e8' },
                          },
                          '&:hover': {
                            backgroundColor: '#f8f6f0',
                          },
                          py: 1,
                          px: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, color: active ? '#8b6f47' : 'inherit' }}>
                          <Icon size={18} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.9rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </List>
        </Box>
      </Drawer>
    </>
  );
};
