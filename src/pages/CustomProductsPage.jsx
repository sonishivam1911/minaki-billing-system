import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
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
import { useCustomProducts } from '../hooks';
import { CustomProductCard, CustomProductModal, LoadingSpinner, ErrorMessage, SearchBar } from '../components';
import { format, startOfDay, endOfDay } from 'date-fns';

/**
 * CustomProductsPage Component
 * Main page for managing custom products (Lab Grown Diamond)
 */
export const CustomProductsPage = () => {
  const location = useLocation();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (location.state?.openCreate) {
      setIsProductModalOpen(true);
      setSelectedProduct(null);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state?.openCreate, location.pathname]);
  const [filters, setFilters] = useState({
    status: '',
    customer_id: '',
    start_date: '',
    end_date: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch
  } = useCustomProducts({ autoFetch: true });

  const handleCreateProduct = async (productData) => {
    await createProduct(productData);
    await refetch(filters);
  };

  const handleUpdateProduct = async (productId, updateData) => {
    await updateProduct(productId, updateData);
    await refetch(filters);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm('Are you sure you want to delete this custom product?')) {
      await deleteProduct(product.id);
      await refetch(filters);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.customer_id) {
      filtered = filtered.filter(p => p.customer_id === parseInt(filters.customer_id));
    }
    if (filters.start_date) {
      filtered = filtered.filter(p => {
        const productDate = new Date(p.created_at);
        return productDate >= startOfDay(new Date(filters.start_date));
      });
    }
    if (filters.end_date) {
      filtered = filtered.filter(p => {
        const productDate = new Date(p.created_at);
        return productDate <= endOfDay(new Date(filters.end_date));
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const customerName = p.customer?.name || p.customer?.['Contact Name'] || p.customer?.['Display Name'] || '';
        return p.product_number?.toLowerCase().includes(query) ||
          customerName.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [products, filters, searchQuery]);

  const productsByStatus = useMemo(() => ({
    draft: filteredProducts.filter(p => p.status === 'draft').length,
    quoted: filteredProducts.filter(p => p.status === 'quoted').length,
    approved: filteredProducts.filter(p => p.status === 'approved').length,
    in_production: filteredProducts.filter(p => p.status === 'in_production').length,
    completed: filteredProducts.filter(p => p.status === 'completed').length,
  }), [filteredProducts]);

  if (loading && products.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <LoadingSpinner message="Loading custom products..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5 }}>
              Custom Products
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Manage Lab Grown Diamond custom products (Made to Order)
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => {
              setSelectedProduct(null);
              setIsProductModalOpen(true);
            }}
            sx={{
              bgcolor: '#8b6f47',
              '&:hover': { bgcolor: '#6d5637' }
            }}
          >
            New Custom Product
          </Button>
        </Box>

        {error && (
          <Box sx={{ mb: 2 }}>
            <ErrorMessage message={error} onRetry={() => refetch(filters)} />
          </Box>
        )}

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products..."
            />
          </Box>

          <FormControl sx={{ minWidth: 150 }}>
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
            sx={{ minWidth: 150 }}
          />

          <TextField
            label="End Date"
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Draft</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>{productsByStatus.draft}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Quoted</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>{productsByStatus.quoted}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>In Production</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>{productsByStatus.in_production}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Completed</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>{productsByStatus.completed}</Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, minWidth: 120 }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Total</Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c2416' }}>{filteredProducts.length}</Typography>
          </Box>
        </Box>
      </Box>

      {filteredProducts.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, textAlign: 'center' }}>
          <Package size={64} color="#9ca3af" />
          <Typography variant="h6" sx={{ mt: 2, color: '#2c2416' }}>
            No custom products found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            {searchQuery || filters.status ? 'No products match your filters' : 'Create your first custom product to get started'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <CustomProductCard
                product={product}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDeleteProduct}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CustomProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={selectedProduct ?
          (data) => handleUpdateProduct(selectedProduct.id, data) :
          handleCreateProduct
        }
        initialData={selectedProduct}
      />
    </Container>
  );
};
