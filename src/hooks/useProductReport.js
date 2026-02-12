import { useState, useCallback } from 'react';
import { reportsApi } from '../services/api';

/**
 * useProductReport Hook
 * Manages product performance report data fetching and state
 */
export const useProductReport = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchProductPerformanceReport = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsApi.getProductPerformanceReport(params);

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
      const errorMessage = err.message || 'Failed to load product performance report';
      setError(errorMessage);
      console.error('Failed to load product performance report:', err);
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
    fetchProductPerformanceReport,
    clearError,
  };
};

