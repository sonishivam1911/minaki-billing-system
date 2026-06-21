import React, { useState, useMemo } from 'react';
import { Package, Plus, Filter } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useCustomOrders } from '../hooks';
import { CustomOrderCard, CustomOrderModal, LoadingSpinner, ErrorMessage, SearchBar } from '../components';
import { format, startOfDay, endOfDay } from 'date-fns';

/**
 * CustomOrdersPage Component
 * Main page for managing custom orders
 */
export const CustomOrdersPage = () => {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    customer_id: '',
    start_date: '',
    end_date: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
    generateQuote,
    refetch
  } = useCustomOrders({ autoFetch: true });

  const handleCreateOrder = async (orderData) => {
    await createOrder(orderData);
    await refetch(filters);
  };

  const handleUpdateOrder = async (orderId, updateData) => {
    await updateOrder(orderId, updateData);
    await refetch(filters);
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm('Are you sure you want to delete this custom order?')) {
      await deleteOrder(order.id);
      await refetch(filters);
    }
  };

  const handleGenerateQuote = async (order) => {
    try {
      await generateQuote(order.id);
      await refetch(filters);
      alert('Quote generated successfully!');
    } catch (err) {
      alert(`Failed to generate quote: ${err.message}`);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.customer_id) {
      filtered = filtered.filter(order => order.customer_id === parseInt(filters.customer_id));
    }
    if (filters.start_date) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfDay(new Date(filters.start_date));
      });
    }
    if (filters.end_date) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate <= endOfDay(new Date(filters.end_date));
      });
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const customerName = order.customer?.name || 
                           order.customer?.['Contact Name'] || 
                           order.customer?.['Display Name'] || 
                           '';
        return order.order_number?.toLowerCase().includes(query) ||
               customerName.toLowerCase().includes(query) ||
               order.description?.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [orders, filters, searchQuery]);

  const ordersByStatus = useMemo(() => {
    return {
      draft: filteredOrders.filter(o => o.status === 'draft').length,
      quoted: filteredOrders.filter(o => o.status === 'quoted').length,
      approved: filteredOrders.filter(o => o.status === 'approved').length,
      in_production: filteredOrders.filter(o => o.status === 'in_production').length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
    };
  }, [filteredOrders]);

  if (loading && orders.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
        <LoadingSpinner message="Loading custom orders..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Custom Orders
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Manage custom orders and quotes
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setSelectedOrder(null);
              setIsOrderModalOpen(true);
            }}
            sx={{
              bgcolor: '#8b6f47',
              '&:hover': { bgcolor: '#6d5637' },
              alignSelf: { xs: 'stretch', sm: 'center' },
            }}
          >
            New Custom Order
          </Button>
        </Box>

        {error && (
          <Box sx={{ mb: 2 }}>
            <ErrorMessage message={error} onRetry={() => refetch(filters)} />
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 200 } }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search orders..."
            />
          </Box>
          
          <FormControl sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="quoted">Quoted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="in_production">In Production</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          />
        </Box>

        {/* Summary Cards */}
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: { xs: 80, sm: 120 }, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Draft
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>
              {ordersByStatus.draft}
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: { xs: 80, sm: 120 }, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Quoted</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '1.5rem', sm: '2rem' } }}>{ordersByStatus.quoted}</Typography>
          </Box>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: { xs: 80, sm: 120 }, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>In Production</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '1.5rem', sm: '2rem' } }}>{ordersByStatus.in_production}</Typography>
          </Box>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: { xs: 80, sm: 120 }, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Completed</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '1.5rem', sm: '2rem' } }}>{ordersByStatus.completed}</Typography>
          </Box>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: { xs: 80, sm: 120 }, flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Total</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416', fontSize: { xs: '1.5rem', sm: '2rem' } }}>{filteredOrders.length}</Typography>
          </Box>
        </Box>
      </Box>

      {filteredOrders.length === 0 ? (
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
          <Package size={64} color="#9ca3af" />
          <Typography variant="h6" sx={{ mt: 2, color: '#2c2416' }}>
            No custom orders found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            {searchQuery || filters.status
              ? 'No orders match your filters'
              : 'Create your first custom order to get started'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
              <CustomOrderCard
                order={order}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDeleteOrder}
                onGenerateQuote={handleGenerateQuote}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CustomOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        onSubmit={selectedOrder ? 
          (data) => handleUpdateOrder(selectedOrder.id, data) :
          handleCreateOrder
        }
        initialData={selectedOrder}
      />
    </Container>
  );
};


