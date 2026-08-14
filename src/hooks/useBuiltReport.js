import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '../services/api';

export const useBuiltReport = (reportId) => {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async (params) => {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.runBuiltReport(reportId, params);
      setRows(result.rows || []);
      setSummary(result.summary || null);
      setPagination(result.pagination || null);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load report');
      setRows([]);
      setSummary(null);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    setRows([]);
    setSummary(null);
    setPagination(null);
    setError(null);
  }, [reportId]);

  return {
    rows,
    summary,
    pagination,
    loading,
    error,
    fetchReport,
    clearError: () => setError(null),
  };
};
