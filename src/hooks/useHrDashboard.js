import { useState, useEffect, useCallback } from 'react';
import { hrApi } from '../services/hrApi';

/**
 * useHrDashboard - HR dashboard metrics and workforce list
 */
export function useHrDashboard(options = {}) {
  const { autoFetch = true, statusFilter = 'all', search = '', page = 1, pageSize = 10 } = options;
  const [metrics, setMetrics] = useState(null);
  const [workforce, setWorkforce] = useState({ items: [], total: 0, page: 1, page_size: 10 });
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await hrApi.getDashboardMetrics();
      setMetrics(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
      setMetrics({
        onboarding_active: 0,
        onboarding_trend_vs_ly: 0,
        clock_in_discrepancy: 0,
        active_shifts: 0,
        time_off_requests_pending: 0,
      });
      return null;
    }
  }, []);

  const fetchWorkforce = useCallback(
    async (overrides = {}) => {
      try {
        setLoading(true);
        setError(null);
        const status = overrides.status ?? statusFilter;
        const pg = overrides.page ?? page;
        const sz = overrides.page_size ?? pageSize;
        const srch = overrides.search ?? search;
        const data = await hrApi.getWorkforce({ status, search: srch, page: pg, page_size: sz });
        setWorkforce({
          items: data.items || [],
          total: data.total ?? 0,
          page: data.page ?? pg,
          page_size: data.page_size ?? sz,
        });
        return data;
      } catch (err) {
        setError(err.message || 'Failed to load workforce');
        setWorkforce({ items: [], total: 0, page: 1, page_size: pageSize });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search, page, pageSize]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchMetrics();
    }
  }, [autoFetch, fetchMetrics]);

  useEffect(() => {
    if (autoFetch) {
      fetchWorkforce();
    }
  }, [autoFetch, statusFilter, page, pageSize]);

  const refetch = useCallback(() => {
    fetchMetrics();
    fetchWorkforce();
  }, [fetchMetrics, fetchWorkforce]);

  return {
    metrics,
    workforce,
    loading,
    error,
    fetchMetrics,
    fetchWorkforce,
    refetch,
  };
}
