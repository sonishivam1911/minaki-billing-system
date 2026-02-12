import { useState, useCallback } from 'react';
import { reportsApi } from '../services/api';

/**
 * useReports Hook
 * Main hook for all report types - provides unified interface
 */
export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async (reportType, params = {}) => {
    try {
      setLoading(true);
      setError(null);

      let result;
      switch (reportType) {
        case 'inventory':
          result = await reportsApi.getInventoryReport(params);
          break;
        case 'daily-sales':
          result = await reportsApi.getDailySalesReport(params);
          break;
        case 'sales-performance':
          result = await reportsApi.getSalesPerformanceReport(params);
          break;
        case 'product-performance':
          result = await reportsApi.getProductPerformanceReport(params);
          break;
        case 'customers':
          result = await reportsApi.getCustomerReport(params);
          break;
        case 'stock-movement':
          result = await reportsApi.getStockMovementReport(params);
          break;
        case 'financial':
          result = await reportsApi.getFinancialReport(params);
          break;
        case 'locations':
          result = await reportsApi.getLocationReport(params);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || `Failed to load ${reportType} report`;
      setError(errorMessage);
      console.error(`Failed to load ${reportType} report:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchReport,
    clearError,
  };
};

