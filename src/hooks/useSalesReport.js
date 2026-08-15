import { useState, useCallback } from 'react';
import { reportsApi } from '../services/api';

/**
 * useSalesReport Hook
 * Manages sales report data fetching and state
 */
export const useSalesReport = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchDailySalesReport = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsApi.getDailySalesReport(params);

      // Response structure: { date: "...", summary: {...}, transactions: [...], pagination: {...} }
      if (result.transactions && Array.isArray(result.transactions)) {
        setData(result.transactions);
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
      const errorMessage = err.message || 'Failed to load daily sales report';
      setError(errorMessage);
      console.error('Failed to load daily sales report:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSalesPerformanceReport = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsApi.getSalesPerformanceReport(params);

      // Response structure: { period: {...}, summary: {...}, data: [...], comparison: {...} }
      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
      } else if (Array.isArray(result)) {
        setData(result);
      } else {
        setData([]);
      }

      // Merge summary and comparison into summary state
      const summaryData = { ...(result.summary || {}) };
      if (result.comparison) {
        summaryData.comparison = result.comparison;
      }
      if (result.period) {
        summaryData.period = result.period;
      }
      
      if (Object.keys(summaryData).length > 0) {
        setSummary(summaryData);
      } else {
        setSummary(null);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load sales performance report';
      setError(errorMessage);
      setData([]);
      setSummary(null);
      console.error('Failed to load sales performance report:', err);
      return null;
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
    fetchDailySalesReport,
    fetchSalesPerformanceReport,
    clearError,
  };
};

