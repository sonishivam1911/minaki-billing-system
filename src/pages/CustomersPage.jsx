import React, { useState } from 'react';
import { User } from 'lucide-react';
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
    return <LoadingSpinner message="Loading customers..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Customers</h1>
          <p className="screen-subtitle">Manage customer database</p>
        </div>

        <div className="header-actions">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search customers..."
          />
          <button 
            className="btn-primary"
            onClick={() => setIsCustomerModalOpen(true)}
          >
            <User size={18} />
            Add New Customer
          </button>
        </div>
      </div>

      <div className="customers-list">
        {filteredCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onSelect={handleSelectCustomer}
          />
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="empty-state">
          <User size={64} />
          <h2>No customers found</h2>
          <p>
            {searchQuery
              ? `No customers matching "${searchQuery}"`
              : 'Add your first customer to get started'}
          </p>
        </div>
      )}

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleCustomerModalSelect}
      />
    </div>
  );
};