import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { BillingScreenHost } from '../../ui/BillingScreenHost';
import { DEFAULT_TABLE_PAGE_SIZE } from '../../ui/billingUiConstants';
import { useBuiltReport } from '../../hooks/useBuiltReport';
import { useReportFilters } from '../../hooks/useReportFilters';
import { createZakyaReportScreen } from '../../screens/reports/zakyaReportCatalog';

export const BuiltReportPage = () => {
  const { reportId } = useParams();
  const screen = useMemo(() => createZakyaReportScreen(reportId), [reportId]);
  const { filters, updateFilters, buildQueryParams } = useReportFilters(
    reportId || 'zakya-report',
    screen ? screen.defaultFilters() : {},
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const { rows, summary, pagination, loading, error, fetchReport } = useBuiltReport(reportId);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportId, filters]);

  useEffect(() => {
    if (!screen) return;
    const params = buildQueryParams();
    params.page = currentPage;
    params.page_size = DEFAULT_TABLE_PAGE_SIZE;
    if (sortBy) {
      params.sort_by = sortBy;
      params.sort_order = sortOrder;
    }
    fetchReport(params);
  }, [screen, filters, currentPage, sortBy, sortOrder, buildQueryParams, fetchReport]);

  if (!screen) {
    return <Navigate to="/reports" replace />;
  }

  const handleSort = (columnKey, nextSortOrder) => {
    setSortBy(columnKey);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  };

  return (
    <BillingScreenHost
      screen={screen}
      filters={filters}
      onFiltersChange={(nextFilters) => {
        updateFilters(nextFilters);
        setCurrentPage(1);
      }}
      rows={rows}
      summary={summary}
      loading={loading}
      error={error}
      onRetry={() => {
        const params = buildQueryParams();
        params.page = currentPage;
        params.page_size = DEFAULT_TABLE_PAGE_SIZE;
        fetchReport(params);
      }}
      pagination={
        pagination
          ? {
              currentPage: pagination.page,
              totalPages: pagination.total_pages,
            }
          : null
      }
      onPageChange={setCurrentPage}
      onSort={handleSort}
      sortBy={sortBy}
      sortOrder={sortOrder}
      extra={null}
    />
  );
};
