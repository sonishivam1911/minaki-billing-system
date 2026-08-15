import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ReportsPage.css';
import {
  Package,
  FileText,
  TrendingUp,
  BarChart3,
  Users,
  Move,
  DollarSign,
  MapPin,
  ShoppingCart,
  Megaphone,
} from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';

/**
 * ReportsPage Component
 * Landing page showing all available reports in a grid layout
 */
export const ReportsPage = () => {
  const navigate = useNavigate();

  const reports = [
    {
      id: 'zakya-invoice-register',
      title: 'Zakya Invoice Register',
      description: 'One row per Zakya invoice: date, customer, email, phone, branch, status, total, balance',
      icon: FileText,
      path: '/reports/zakya/zakya-invoice-register',
      color: '#2e7d32',
    },
    {
      id: 'zakya-invoice-monthly',
      title: 'Zakya Invoice Revenue by Month',
      description: 'Invoice count and rupees grouped by month, filterable by branch and status',
      icon: TrendingUp,
      path: '/reports/zakya/zakya-invoice-monthly',
      color: '#0288d1',
    },
    {
      id: 'zakya-invoice-product-sales',
      title: 'Zakya Product Sales',
      description: 'SKU sales from invoice lines: quantity, rupees, invoice count',
      icon: ShoppingCart,
      path: '/reports/zakya/zakya-invoice-product-sales',
      color: '#ed6c02',
    },
    {
      id: 'zakya-sales-order-register',
      title: 'Zakya Sales Order Register',
      description: 'Order book (not retail invoices): customer, email/phone, channel, invoiced/paid status, total',
      icon: Package,
      path: '/reports/zakya/zakya-sales-order-register',
      color: '#9c27b0',
    },
    {
      id: 'zakya-sales-order-product-sales',
      title: 'Zakya Products on Sales Orders',
      description: 'SKU quantities on sales orders (order book, not invoiced sales)',
      icon: Package,
      path: '/reports/zakya/zakya-sales-order-product-sales',
      color: '#6a1b9a',
    },
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Track current stock levels, product locations, and inventory movements',
      icon: Package,
      path: '/reports/inventory',
      color: '#8b6f47',
    },
    {
      id: 'daily-sales',
      title: 'Daily Sales Report',
      description: 'View daily sales transactions, revenue, and performance metrics',
      icon: FileText,
      path: '/reports/daily-sales',
      color: '#2e7d32',
    },
    {
      id: 'sales-performance',
      title: 'Sales Performance Report',
      description: 'Analyze sales trends over time with period comparisons',
      icon: TrendingUp,
      path: '/reports/sales-performance',
      color: '#0288d1',
    },
    {
      id: 'product-performance',
      title: 'Product Performance Report',
      description: 'Analyze individual product sales and performance metrics',
      icon: BarChart3,
      path: '/reports/product-performance',
      color: '#9c27b0',
    },
    {
      id: 'customers',
      title: 'Customer Report',
      description: 'Track customer behavior, purchase history, and segmentation',
      icon: Users,
      path: '/reports/customers',
      color: '#f44336',
    },
    {
      id: 'stock-movement',
      title: 'Stock Movement Report',
      description: 'Track inventory movements including additions, transfers, and sales',
      icon: Move,
      path: '/reports/stock-movement',
      color: '#ff9800',
    },
    {
      id: 'financial',
      title: 'Financial Report',
      description: 'View revenue, expenses, profitability, and financial metrics',
      icon: DollarSign,
      path: '/reports/financial',
      color: '#00bcd4',
    },
    {
      id: 'locations',
      title: 'Location Report',
      description: 'Compare performance across different locations and stores',
      icon: MapPin,
      path: '/reports/locations',
      color: '#795548',
    },
    {
      id: 'shopify-commerce',
      title: 'Shopify Commerce Report',
      description: 'Storefront funnel, landing pages, product views, cart activity by city, and orders',
      icon: ShoppingCart,
      path: '/reports/shopify-commerce',
      color: '#5e8b47',
    },
    {
      id: 'meta-marketing',
      title: 'Meta Marketing Report',
      description:
        'Select Meta campaigns, view spend/clicks/ROAS trends by day/week/month, ACTIVE ad sets, and ads',
      icon: Megaphone,
      path: '/reports/meta-marketing',
      color: '#1877f2',
    },
  ];

  const handleReportClick = (path) => {
    navigate(path);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <BarChart3 size={28} color="#8b6f47" />
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Reports
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#6b7280', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Access comprehensive reports and analytics for your business
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: `1px solid ${report.color}30`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)',
                    borderColor: report.color,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: `${report.color}10`,
                      width: 'fit-content',
                    }}
                  >
                    <Icon size={32} color={report.color} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416', mb: 1 }}>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    {report.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleReportClick(report.path)}
                    sx={{
                      backgroundColor: report.color,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: report.color,
                        opacity: 0.9,
                      },
                    }}
                  >
                    View Report
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

