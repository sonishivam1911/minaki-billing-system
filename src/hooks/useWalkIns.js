import { useState, useEffect, useCallback } from 'react';
import walkInsApi from '../services/walkInsApi';

/**
 * Custom Hook: useWalkIns
 * Manages walk-in visits data and operations
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to auto-fetch on mount (default: true)
 * @returns {Object} Walk-ins state and methods
 */
export const useWalkIns = ({ autoFetch = true } = {}) => {
  const [walkIns, setWalkIns] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  // Fetch all walk-ins
  const fetchWalkIns = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walkInsApi.getAll(filters);
      // Handle both array and object with items property
      const walkInsList = Array.isArray(response) ? response : (response.items || response.walk_ins || []);
      setWalkIns(walkInsList);
      return walkInsList;
    } catch (err) {
      setError('Failed to load walk-ins');
      console.error('Fetch walk-ins error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch walk-ins on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchWalkIns();
    }
  }, [autoFetch, fetchWalkIns]);

  // Create new walk-in
  const createWalkIn = useCallback(async (walkInData) => {
    try {
      setLoading(true);
      setError(null);
      const newWalkIn = await walkInsApi.create(walkInData);
      setWalkIns((prev) => [newWalkIn, ...prev]);
      return newWalkIn;
    } catch (err) {
      setError('Failed to create walk-in');
      console.error('Create walk-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update walk-in
  const updateWalkIn = useCallback(async (walkInId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedWalkIn = await walkInsApi.update(walkInId, updateData);
      setWalkIns((prev) =>
        prev.map((walkIn) =>
          walkIn.id === walkInId ? { ...walkIn, ...updatedWalkIn } : walkIn
        )
      );
      return updatedWalkIn;
    } catch (err) {
      setError('Failed to update walk-in');
      console.error('Update walk-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete walk-in
  const deleteWalkIn = useCallback(async (walkInId) => {
    try {
      setLoading(true);
      setError(null);
      await walkInsApi.delete(walkInId);
      setWalkIns((prev) => prev.filter((walkIn) => walkIn.id !== walkInId));
    } catch (err) {
      setError('Failed to delete walk-in');
      console.error('Delete walk-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get walk-in by ID
  const getWalkInById = useCallback(async (walkInId) => {
    try {
      setLoading(true);
      setError(null);
      const walkIn = await walkInsApi.getById(walkInId);
      return walkIn;
    } catch (err) {
      setError('Failed to fetch walk-in');
      console.error('Get walk-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get enquiries for walk-in
  const getWalkInEnquiries = useCallback(async (walkInId) => {
    try {
      setError(null);
      const enquiries = await walkInsApi.getEnquiries(walkInId);
      return Array.isArray(enquiries) ? enquiries : (enquiries.items || []);
    } catch (err) {
      setError('Failed to fetch enquiries');
      console.error('Get walk-in enquiries error:', err);
      throw err;
    }
  }, []);

  // Refetch walk-ins
  const refetch = useCallback(async (filters = {}) => {
    return await fetchWalkIns(filters);
  }, [fetchWalkIns]);

  return {
    walkIns,
    loading,
    error,
    fetchWalkIns,
    createWalkIn,
    updateWalkIn,
    deleteWalkIn,
    getWalkInById,
    getWalkInEnquiries,
    refetch,
  };
};


