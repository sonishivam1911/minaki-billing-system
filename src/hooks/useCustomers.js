import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../services/api';

/**
 * Custom Hook: useCustomers
 * Manages customers data and operations
 * 
 * @returns {Object} Customers state and methods
 */
export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await customersApi.getAll();
        setCustomers(data);
        setError(null);
      } catch (err) {
        setError('Failed to load customers');
        console.error('Fetch customers error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Create new customer
  const createCustomer = useCallback(async (customerData) => {
    try {
      setLoading(true);
      const newCustomer = await customersApi.create(customerData);
      setCustomers((prev) => [...prev, newCustomer]);
      setError(null);
      return newCustomer;
    } catch (err) {
      setError('Failed to create customer');
      console.error('Create customer error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update customer
  const updateCustomer = useCallback(async (contactId, customerData) => {
    try {
      setLoading(true);
      const updatedCustomer = await customersApi.update(contactId, customerData);
      setCustomers((prev) =>
        prev.map((customer) => (
          (customer["Contact ID"] === contactId || customer.id === contactId) 
            ? { ...customer, ...updatedCustomer } 
            : customer
        ))
      );
      setError(null);
      return updatedCustomer;
    } catch (err) {
      setError('Failed to update customer');
      console.error('Update customer error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete customer (set status to inactive)
  const deleteCustomer = useCallback(async (contactId) => {
    try {
      setLoading(true);
      await customersApi.delete(contactId);
      setCustomers((prev) => prev.filter((customer) => 
        customer["Contact ID"] !== contactId && customer.id !== contactId
      ));
      if (selectedCustomer?.["Contact ID"] === contactId || selectedCustomer?.id === contactId) {
        setSelectedCustomer(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to delete customer');
      console.error('Delete customer error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer]);

  // Select customer for checkout
  const selectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
  }, []);

  // Clear selected customer
  const clearSelection = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // Refresh customers list
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customersApi.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Failed to reload customers');
      console.error('Refetch customers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    customers,
    selectedCustomer,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    selectCustomer,
    clearSelection,
    refetch,
  };
};