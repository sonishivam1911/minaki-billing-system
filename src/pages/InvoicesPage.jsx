import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, IndianRupee } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { customersApi } from '../services/api';
import { useInvoices } from '../hooks';
import { LoadingSpinner, ErrorMessage, Pagination, InvoiceActions } from '../components';
import { formatRupees } from '../utils';

/**
 * InvoicesPage Component
 * Display and manage invoices with search and filtering
 */
export const InvoicesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { 
    invoices, 
    loading, 
    error, 
    loadInvoices, 
    getInvoiceStats,
    clearError 
  } = useInvoices();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customers, setCustomers] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Load customer data when invoices change
  useEffect(() => {
    if (invoices.length > 0) {
      const customerIds = [...new Set(invoices.map(inv => inv.customer_id).filter(Boolean))];
      loadCustomerData(customerIds);
    }
  }, [invoices]);

  const loadCustomerData = async (customerIds) => {
    const customerData = {};
    
    for (const customerId of customerIds) {
      try {
        const customer = await customersApi.getById(customerId);
        customerData[customerId] = customer;
      } catch (error) {
        console.warn(`Failed to load customer ${customerId}:`, error);
        customerData[customerId] = { name: 'Unknown Customer', id: customerId };
      }
    }
    
    setCustomers(customerData);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    // Could open a detailed modal here
    console.log('View invoice details:', invoice);
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customer = customers[invoice.customer_id];
    const customerName = customer?.name || customer?.full_name || '';
    
    return (
      invoice.invoice_number?.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower) ||
      invoice.status?.toLowerCase().includes(searchLower) ||
      invoice.total_amount?.toString().includes(searchTerm)
    );
  });

  // Paginate filtered results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
  const totalFilteredPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  // Get invoice statistics
  const stats = getInvoiceStats();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingSpinner message="Loading invoices..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorMessage message={error} />
      </Box>
    );
  }

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'paid') return 'success';
    if (statusLower === 'pending') return 'warning';
    if (statusLower === 'cancelled') return 'error';
    return 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FileText size={24} color="#8b6f47" />
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416' }}>
            Invoices
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Manage and send invoices to customers
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search invoices by number, customer, or amount..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} color="#6b7280" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
            },
          }}
        />
      </Box>

      {/* Invoice Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6f47' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Total Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b6f47' }}>
                {formatRupees(stats.totalAmount)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                {stats.paid}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Paid Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Pending Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center',
          }}
        >
          <FileText size={64} color="#9ca3af" />
          <Typography variant="h6" sx={{ mt: 2, color: '#2c2416' }}>
            No invoices found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Invoices will appear here after completing sales'
            }
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedInvoices.map((invoice) => {
                  const customer = customers[invoice.customer_id] || {};
                  const customerName = customer.name || customer.full_name || 'Walk-in Customer';
                  
                  return (
                    <TableRow key={invoice.id || invoice.invoice_id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#8b6f47' }}>
                          {invoice.invoice_number || `#${invoice.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <User size={16} color="#6b7280" />
                          <Typography variant="body2">
                            {customerName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Calendar size={16} color="#6b7280" />
                          <Typography variant="body2">
                            {invoice.created_at 
                              ? new Date(invoice.created_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IndianRupee size={16} color="#6b7280" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatRupees(invoice.total_amount)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status || 'Unknown'}
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <InvoiceActions
                          invoice={invoice}
                          customer={customer}
                          compact={true}
                          showViewButton={true}
                          onView={handleViewInvoice}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalFilteredPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalFilteredPages}
                onPageChange={setCurrentPage}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};
