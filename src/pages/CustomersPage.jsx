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
    
    // Handle different possible field names from the API
    const name = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "";
    const phone = customer.phone || customer.Phone || customer.MobilePhone || "";
    const email = customer.email || customer.EmailID || "";
    
    return (
      (name && name.toString().toLowerCase().includes(query)) ||
      (phone && phone.toString().toLowerCase().includes(query)) ||
      (email && email.toString().toLowerCase().includes(query))
    );
  });

  const handleSelectCustomer = (customer) => {
    selectCustomer(customer);
    const customerName = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "Unknown Customer";
    alert(`Selected customer: ${customerName}`);
  };

  const handleCustomerModalSelect = (customer) => {
    const customerName = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "Unknown Customer";
    alert(`Customer selected: ${customerName}`);
    setIsCustomerModalOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <LoadingSpinner message="Loading customers..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <ErrorMessage message={error} onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5 }}>
              Customers
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Manage customer database
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<User size={18} />}
            onClick={() => setIsCustomerModalOpen(true)}
          >
            Add New Customer
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
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
        <Grid container spacing={3}>
          {filteredCustomers.map((customer) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
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
