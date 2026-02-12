import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../services/api';

/**
 * useInventoryReport Hook
 * Manages inventory report data fetching and state
 */
export const useInventoryReport = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchInventoryReport = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsApi.getInventoryReport(params);

      // Handle response format according to API spec
      // Response structure: { summary: {...}, data: [...], pagination: {...} }
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
      } else if (Array.isArray(result)) {
        setData(result);
      } else {
        setData([]);
      }

      if (result.summary) {
        setSummary(result.summary);
      } else {
        setSummary(null);
      }

      if (result.pagination) {
        setPagination(result.pagination);
      } else {
        setPagination(null);
      }

      return result;
    } catch (err) {
      // Error is already parsed by apiRequest with detail message
      const errorMessage = err.message || 'Failed to load inventory report';
      setError(errorMessage);
      console.error('Failed to load inventory report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    summary,
    loading,
    error,
    pagination,
    fetchInventoryReport,
    clearError,
  };
};

