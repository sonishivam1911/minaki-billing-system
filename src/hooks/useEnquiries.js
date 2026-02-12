import { useState, useEffect, useCallback } from 'react';
import enquiriesApi from '../services/enquiriesApi';

/**
 * Custom Hook: useEnquiries
 * Manages customer enquiries data and operations
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to auto-fetch on mount (default: false)
 * @param {Object} options.filters - Initial filters
 * @returns {Object} Enquiries state and methods
 */
export const useEnquiries = ({ autoFetch = false, filters = {} } = {}) => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  // Fetch all enquiries
  const fetchEnquiries = useCallback(async (queryFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const finalFilters = { ...filters, ...queryFilters };
      const response = await enquiriesApi.getAll(finalFilters);
      // Handle both array and object with items property
      const enquiriesList = Array.isArray(response) ? response : (response.items || response.enquiries || []);
      setEnquiries(enquiriesList);
      return enquiriesList;
    } catch (err) {
      setError('Failed to load enquiries');
      console.error('Fetch enquiries error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch enquiries on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchEnquiries();
    }
  }, [autoFetch]); // Only run on mount

  // Create new enquiry
  const createEnquiry = useCallback(async (enquiryData) => {
    try {
      setLoading(true);
      setError(null);
      const newEnquiry = await enquiriesApi.create(enquiryData);
      setEnquiries((prev) => [newEnquiry, ...prev]);
      return newEnquiry;
    } catch (err) {
      setError('Failed to create enquiry');
      console.error('Create enquiry error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update enquiry
  const updateEnquiry = useCallback(async (enquiryId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedEnquiry = await enquiriesApi.update(enquiryId, updateData);
      setEnquiries((prev) =>
        prev.map((enquiry) =>
          enquiry.id === enquiryId ? { ...enquiry, ...updatedEnquiry } : enquiry
        )
      );
      return updatedEnquiry;
    } catch (err) {
      setError('Failed to update enquiry');
      console.error('Update enquiry error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete enquiry
  const deleteEnquiry = useCallback(async (enquiryId) => {
    try {
      setLoading(true);
      setError(null);
      await enquiriesApi.delete(enquiryId);
      setEnquiries((prev) => prev.filter((enquiry) => enquiry.id !== enquiryId));
    } catch (err) {
      setError('Failed to delete enquiry');
      console.error('Delete enquiry error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get enquiry by ID
  const getEnquiryById = useCallback(async (enquiryId) => {
    try {
      setLoading(true);
      setError(null);
      const enquiry = await enquiriesApi.getById(enquiryId);
      return enquiry;
    } catch (err) {
      setError('Failed to fetch enquiry');
      console.error('Get enquiry error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get orders for enquiry
  const getEnquiryOrders = useCallback(async (enquiryId) => {
    try {
      setError(null);
      const orders = await enquiriesApi.getOrders(enquiryId);
      return Array.isArray(orders) ? orders : (orders.items || []);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Get enquiry orders error:', err);
      throw err;
    }
  }, []);

  // Refetch enquiries
  const refetch = useCallback(async (queryFilters = {}) => {
    return await fetchEnquiries(queryFilters);
  }, [fetchEnquiries]);

  return {
    enquiries,
    loading,
    error,
    fetchEnquiries,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
    getEnquiryById,
    getEnquiryOrders,
    refetch,
  };
};


