import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, MapPin } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { useInventoryReport } from '../../hooks/useInventoryReport';
import { useReportFilters } from '../../hooks/useReportFilters';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportSummaryCards } from '../../components/reports/ReportSummaryCards';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportSkeleton } from '../../components/reports/ReportSkeleton';
import { ExportButton } from '../../components/reports/ExportButton';
import { ErrorMessage, Pagination } from '../../components';
import { formatRupees } from '../../utils';

/**
 * InventoryReportPage Component
 * Displays inventory report with filters, summary cards, and data table
 */
export const InventoryReportPage = () => {
  const { data, summary, loading, error, pagination, fetchInventoryReport, clearError } = useInventoryReport();
  const { filters, updateFilters, buildQueryParams, resetFilters } = useReportFilters('inventory', {
    page: 1,
    page_size: 50,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const params = buildQueryParams();
    params.page = currentPage;
    params.page_size = 50;
    params.sort_by = sortBy;
    params.sort_order = sortOrder;
    fetchInventoryReport(params);
  }, [filters, currentPage, sortBy, sortOrder, buildQueryParams, fetchInventoryReport]);

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
      title: 'Total Inventory Value',
      value: summary.total_value || 0,
      format: 'currency',
      color: 'success',
      icon: Package,
    },
    {
      title: 'Low Stock Count',
      value: summary.low_stock_count || 0,
      format: 'number',
      color: 'warning',
      icon: AlertCircle,
    },
    {
      title: 'Products Without Location',
      value: summary.products_without_location || 0,
      format: 'number',
      color: 'info',
      icon: MapPin,
    },
  ] : [];

  const columns = [
    { key: 'product_name', label: 'Product Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'quantity', label: 'Quantity', sortable: true, format: 'number' },
    { key: 'price', label: 'Price', sortable: true, format: 'currency' },
    { key: 'total_value', label: 'Total Value', sortable: true, format: 'currency' },
    {
      key: 'location',
      label: 'Location',
      sortable: false,
      render: (value) => {
        if (!value) return 'No Location';
        return `${value.location_name || ''} - ${value.storage_type_name || ''} - ${value.storage_object_name || ''}`;
      },
    },
    { key: 'stock_status', label: 'Stock Status', sortable: true },
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
            Inventory Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Track current stock levels, product locations, and inventory movements
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="inventory"
          reportTitle="Inventory Report"
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
        availableFilters={[
          'date_range',
          'category',
          'sku',
          'product_name',
          'location',
          'price_range',
          'diamond_4c',
          'metal',
          'stock_status',
          'product_type',
        ]}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      <ReportTable
        columns={columns}
        data={data}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        emptyMessage="No inventory data found. Try adjusting your filters."
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

