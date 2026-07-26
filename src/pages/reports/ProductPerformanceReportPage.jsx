import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { useProductReport } from '../../hooks/useProductReport';
import { useReportFilters } from '../../hooks/useReportFilters';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportSummaryCards } from '../../components/reports/ReportSummaryCards';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportSkeleton } from '../../components/reports/ReportSkeleton';
import { ExportButton } from '../../components/reports/ExportButton';
import { ErrorMessage, Pagination } from '../../components';
import { formatRupees } from '../../utils';

/**
 * ProductPerformanceReportPage Component
 * Displays product performance report with product metrics, sorting, and top performers
 */
export const ProductPerformanceReportPage = () => {
  const { data, summary, loading, error, pagination, fetchProductPerformanceReport, clearError } = useProductReport();
  const { filters, updateFilters, buildQueryParams } = useReportFilters('product-performance', {
    page: 1,
    page_size: 50,
    sort_by: 'revenue',
    sort_order: 'desc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('revenue');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const params = buildQueryParams();
    params.page = currentPage;
    params.page_size = 50;
    params.sort_by = sortBy;
    params.sort_order = sortOrder;
    fetchProductPerformanceReport(params);
  }, [filters, currentPage, sortBy, sortOrder, buildQueryParams, fetchProductPerformanceReport]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSort = (column, order) => {
    setSortBy(column);
    setSortOrder(order);
  };

  const summaryCards = summary ? [
    {
      title: 'Total Products',
      value: summary.total_products || 0,
      format: 'number',
      color: 'primary',
      icon: Package,
    },
    {
      title: 'Total Revenue',
      value: summary.total_revenue || 0,
      format: 'currency',
      color: 'success',
      icon: DollarSign,
    },
    {
      title: 'Total Units Sold',
      value: summary.total_units_sold || 0,
      format: 'number',
      color: 'info',
      icon: TrendingUp,
    },
    {
      title: 'Average Price',
      value: summary.average_price || 0,
      format: 'currency',
      color: 'default',
      icon: DollarSign,
    },
  ] : [];

  const columns = [
    { key: 'product_name', label: 'Product Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'units_sold', label: 'Units Sold', sortable: true, format: 'number' },
    { key: 'revenue', label: 'Revenue', sortable: true, format: 'currency' },
    { key: 'average_selling_price', label: 'Avg Price', sortable: true, format: 'currency' },
    { key: 'turnover_rate', label: 'Turnover Rate', sortable: true, format: 'percentage' },
    { key: 'current_stock', label: 'Current Stock', sortable: true, format: 'number' },
  ];

  if (loading && !data.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <ReportSkeleton />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} className="report-content">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5 }}>
            Product Performance Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Analyze individual product sales and performance metrics
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="product-performance"
          reportTitle="Product Performance Report"
          summary={summary}
        />
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <ErrorMessage message={error} />
          <Button onClick={clearError} sx={{ mt: 1 }}>Dismiss</Button>
        </Box>
      )}

      <ReportFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        availableFilters={['date_range', 'category', 'sku', 'location', 'price_range']}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      <ReportTable
        columns={columns}
        data={data}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        emptyMessage="No product performance data found. Try adjusting your filters."
      />

      {pagination && pagination.total_pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.total_pages}
            onPageChange={setCurrentPage}
          />
        </Box>
      )}
    </Container>
  );
};

