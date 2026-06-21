import React, { useState } from 'react';
import { User } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { useCustomers } from '../hooks';
import { CustomerCard, SearchBar, LoadingSpinner, ErrorMessage, CustomerModal } from '../components';
import { getCustomerDisplay, getCustomerKey } from '../utils/customerFields';

/**
 * CustomersPage Component
 * Displays and manages customer database
 */
export const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const { 
    customers, 
    loading, 
    error, 
    selectCustomer,
    refetch 
  } = useCustomers();

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    const { name = '', phone = '', email = '' } = getCustomerDisplay(customer);
    return (
      (name && name.toString().toLowerCase().includes(query)) ||
      (phone && phone.toString().toLowerCase().includes(query)) ||
      (email && email.toString().toLowerCase().includes(query))
    );
  });

  const getCustomerName = (c) => getCustomerDisplay(c).name || "Unknown Customer";

  const handleSelectCustomer = (customer) => {
    selectCustomer(customer);
    alert(`Selected customer: ${getCustomerName(customer)}`);
  };

  const handleCustomerModalSelect = (customer) => {
    alert(`Customer selected: ${getCustomerName(customer)}`);
    setIsCustomerModalOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
        <LoadingSpinner message="Loading customers..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
        <ErrorMessage message={error} onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Customers
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Manage customer database
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<User size={18} />}
            onClick={() => setIsCustomerModalOpen(true)}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Add New Customer
          </Button>
        </Box>

        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search customers..."
          />
        </Box>
      </Box>

      {filteredCustomers.length === 0 ? (
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
          <User size={64} color="#9ca3af" />
          <Typography variant="h6" sx={{ mt: 2, color: '#2c2416' }}>
            No customers found
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
            {searchQuery
              ? `No customers matching "${searchQuery}"`
              : 'Add your first customer to get started'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {filteredCustomers.map((customer, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={getCustomerKey(customer) ?? `customer-${index}`}>
              <CustomerCard
                customer={customer}
                onSelect={handleSelectCustomer}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerModalSelect}
      />
    </Container>
  );
};
