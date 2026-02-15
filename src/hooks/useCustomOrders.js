import { useState, useEffect, useCallback } from 'react';
import customOrdersApi from '../services/customOrdersApi';

/**
 * Custom Hook: useCustomOrders
 * Manages custom orders data and operations
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to auto-fetch on mount (default: false)
 * @param {Object} options.filters - Initial filters
 * @returns {Object} Custom orders state and methods
 */
export const useCustomOrders = ({ autoFetch = false, filters = {} } = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  // Fetch all custom orders
  const fetchOrders = useCallback(async (queryFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const finalFilters = { ...filters, ...queryFilters };
      const response = await customOrdersApi.getAll(finalFilters);
      // Handle both array and object with items property
      const ordersList = Array.isArray(response) ? response : (response.items || response.orders || []);
      setOrders(ordersList);
      return ordersList;
    } catch (err) {
      setError('Failed to load custom orders');
      console.error('Fetch custom orders error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch orders on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch]); // Only run on mount

  // Create new custom order
  const createOrder = useCallback(async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      const newOrder = await customOrdersApi.create(orderData);
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      setError('Failed to create custom order');
      console.error('Create custom order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update custom order
  const updateOrder = useCallback(async (orderId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedOrder = await customOrdersApi.update(orderId, updateData);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...updatedOrder } : order
        )
      );
      return updatedOrder;
    } catch (err) {
      setError('Failed to update custom order');
      console.error('Update custom order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete custom order
  const deleteOrder = useCallback(async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      await customOrdersApi.delete(orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (err) {
      setError('Failed to delete custom order');
      console.error('Delete custom order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get order by ID
  const getOrderById = useCallback(async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      const order = await customOrdersApi.getById(orderId);
      return order;
    } catch (err) {
      setError('Failed to fetch custom order');
      console.error('Get custom order error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate quote for order
  const generateQuote = useCallback(async (orderId, quoteData = {}) => {
    try {
      setLoading(true);
      setError(null);
      const quote = await customOrdersApi.generateQuote(orderId, quoteData);
      // Update order with quote information
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, quote, status: 'quoted' } : order
        )
      );
      return quote;
    } catch (err) {
      setError('Failed to generate quote');
      console.error('Generate quote error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload images for order
  const uploadImages = useCallback(async (orderId, imageUrls) => {
    try {
      setLoading(true);
      setError(null);
      const updatedOrder = await customOrdersApi.uploadImages(orderId, imageUrls);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, ...updatedOrder } : order
        )
      );
      return updatedOrder;
    } catch (err) {
      setError('Failed to upload images');
      console.error('Upload images error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch orders
  const refetch = useCallback(async (queryFilters = {}) => {
    return await fetchOrders(queryFilters);
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    generateQuote,
    uploadImages,
    refetch,
  };
};


