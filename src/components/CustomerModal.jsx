import React, { useState } from 'react';
import { X, Search, User, Phone, Mail, Plus, Check } from 'lucide-react';
import { useCustomers } from '../hooks';
import { LoadingSpinner, ErrorMessage } from './index';

/**
 * CustomerModal Component
 * Modal for selecting existing customers or creating new ones
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Function} props.onSelectCustomer - Function called when customer is selected
 */
export const CustomerModal = ({ isOpen, onClose, onSelectCustomer }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const { 
    customers, 
    loading, 
    error, 
    selectCustomer,
    createCustomer,
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
    setSelectedCustomer(customer);
    selectCustomer(customer);
    onSelectCustomer(customer);
    onClose();
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    if (!newCustomer.name.trim()) {
      alert('Customer name is required');
      return;
    }

    try {
      const createdCustomer = await createCustomer(newCustomer);
      
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: ''
      });
      setShowCreateForm(false);
      
      // Select the newly created customer
      handleSelectCustomer(createdCustomer);
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setNewCustomer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content customer-modal">
        <div className="modal-header">
          <h2>Select or Create Customer</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {!showCreateForm ? (
            <>
              {/* Search Section */}
              <div className="modal-search">
                <div className="search-container">
                  <Search size={20} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search customers by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={18} />
                  Create New
                </button>
              </div>

              {/* Loading & Error States */}
              {loading && <LoadingSpinner message="Loading customers..." />}
              {error && <ErrorMessage message={error} onRetry={refetch} />}

              {/* Customer List */}
              {!loading && !error && (
                <div className="customer-list">
                  {filteredCustomers.length === 0 ? (
                    <div className="empty-state-modal">
                      <User size={48} />
                      <h3>No customers found</h3>
                      <p>
                        {searchQuery
                          ? `No customers matching "${searchQuery}"`
                          : 'Start by creating your first customer'}
                      </p>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const customerName = customer.name || customer["Contact Name"] || customer["Display Name"] || customer["Company Name"] || "Unknown Customer";
                      const customerPhone = customer.phone || customer.Phone || customer.MobilePhone || "";
                      const customerEmail = customer.email || customer.EmailID || "";
                      
                      return (
                        <div
                          key={customer.id}
                          className="customer-modal-item"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <div className="customer-avatar">
                            <User size={24} />
                          </div>
                          <div className="customer-info">
                            <div className="customer-name">{customerName}</div>
                            <div className="customer-contact">
                              {customerPhone && (
                                <span>
                                  <Phone size={14} />
                                  {customerPhone}
                                </span>
                              )}
                              {customerEmail && (
                                <span>
                                  <Mail size={14} />
                                  {customerEmail}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="customer-select">
                            <Check size={20} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          ) : (
            /* Create Customer Form */
            <div className="create-customer-form">
              <div className="form-header">
                <h3>Create New Customer</h3>
                <button 
                  className="btn-link"
                  onClick={() => setShowCreateForm(false)}
                >
                  ← Back to list
                </button>
              </div>

              <form onSubmit={handleCreateCustomer}>
                <div className="form-group">
                  <label className="input-label">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="Enter phone number"
                    value={newCustomer.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter email address"
                    value={newCustomer.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">
                    Address
                  </label>
                  <textarea
                    className="input-field textarea-field"
                    placeholder="Enter customer address"
                    value={newCustomer.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={!newCustomer.name.trim()}
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};