import { createTheme } from '@mui/material/styles';

/**
 * Custom Material UI Theme for RealJewelry POS
 * Maintains brown/gold jewelry store aesthetic
 * Optimized for iPhone 14/15/16 viewports
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#8b6f47', // Brown/gold
      light: '#a6896b',
      dark: '#6b5537',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5d4e37', // Darker brown
      light: '#7a6b55',
      dark: '#3f3425',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#faf8f3',
    },
    text: {
      primary: '#2c2416',
      secondary: '#5d4e37',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: "'Lato', sans-serif",
    h1: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 700,
      color: '#2c2416',
    },
    h2: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 600,
      color: '#2c2416',
    },
    h3: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 600,
      color: '#2c2416',
    },
    h4: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 500,
      color: '#2c2416',
    },
    h5: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 500,
      color: '#2c2416',
    },
    h6: {
      fontFamily: "'Cormorant Garamond', serif",
      fontWeight: 500,
      color: '#2c2416',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 390, // iPhone 14
      md: 600, // Tablet
      lg: 900, // Desktop
      xl: 1536, // Large Desktop
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px', // Minimum touch target for mobile
          padding: '10px 24px',
          borderRadius: '6px',
          fontSize: '0.95rem',
          fontWeight: 500,
        },
        sizeSmall: {
          minHeight: '36px',
          padding: '6px 16px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          minHeight: '48px',
          padding: '12px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: '44px', // Minimum touch target
          minHeight: '44px',
          padding: '8px',
        },
        sizeSmall: {
          minWidth: '36px',
          minHeight: '36px',
          padding: '4px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '44px', // Minimum touch target
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f1e8',
          color: '#5d4e37',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(139, 111, 71, 0.1)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '8px',
          '@media (max-width: 430px)': {
            margin: '8px',
            maxWidth: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '2px solid #8b6f47',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(139, 111, 71, 0.1)',
          borderBottom: '2px solid #8b6f47',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          minHeight: '32px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px', // Minimum touch target
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 6,
  },
});

export default theme;

