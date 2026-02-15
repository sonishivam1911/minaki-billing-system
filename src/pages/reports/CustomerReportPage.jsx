import React, { useState, useEffect } from 'react';
import { Users, UserPlus, DollarSign, TrendingUp } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { reportsApi } from '../../services/api';
import { useReportFilters } from '../../hooks/useReportFilters';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportSummaryCards } from '../../components/reports/ReportSummaryCards';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportSkeleton } from '../../components/reports/ReportSkeleton';
import { ExportButton } from '../../components/reports/ExportButton';
import { ErrorMessage, Pagination } from '../../components';
import { formatRupees } from '../../utils';

/**
 * CustomerReportPage Component
 * Displays customer report with customer segmentation, purchase history, and lifetime value
 */
export const CustomerReportPage = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const { filters, updateFilters, buildQueryParams } = useReportFilters('customers', {
    page: 1,
    page_size: 50,
    sort_by: 'total_spend',
    sort_order: 'desc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('total_spend');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = buildQueryParams();
        params.page = currentPage;
        params.page_size = 50;
        params.sort_by = sortBy;
        params.sort_order = sortOrder;
        const result = await reportsApi.getCustomerReport(params);

        if (result.data) {
          setData(result.data);
        } else if (Array.isArray(result)) {
          setData(result);
        } else {
          setData([]);
        }

        if (result.summary) {
          setSummary(result.summary);
        }

        if (result.pagination) {
          setPagination(result.pagination);
        }
      } catch (err) {
        setError(err.message || 'Failed to load customer report');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, currentPage, sortBy, sortOrder, buildQueryParams]);

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
      title: 'Total Customers',
      value: summary.total_customers || 0,
      format: 'number',
      color: 'primary',
      icon: Users,
    },
    {
      title: 'New Customers',
      value: summary.new_customers || 0,
      format: 'number',
      color: 'success',
      icon: UserPlus,
    },
    {
      title: 'Returning Customers',
      value: summary.returning_customers || 0,
      format: 'number',
      color: 'info',
      icon: Users,
    },
    {
      title: 'Customer Retention Rate',
      value: summary.customer_retention_rate || 0,
      format: 'percentage',
      color: 'default',
      icon: TrendingUp,
    },
  ] : [];

  const columns = [
    { key: 'name', label: 'Customer Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: false },
    { key: 'purchase_count', label: 'Purchases', sortable: true, format: 'number' },
    { key: 'total_spend', label: 'Total Spend', sortable: true, format: 'currency' },
    { key: 'average_order_value', label: 'Avg Order Value', sortable: true, format: 'currency' },
    { key: 'segment', label: 'Segment', sortable: true },
    { key: 'last_purchase_date', label: 'Last Purchase', sortable: true, format: 'date' },
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
            Customer Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Track customer behavior, purchase history, and segmentation
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="customers"
          reportTitle="Customer Report"
          summary={summary}
        />
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <ErrorMessage message={error} />
          <Button onClick={() => setError(null)} sx={{ mt: 1 }}>Dismiss</Button>
        </Box>
      )}

      <ReportFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        availableFilters={['date_range', 'location']}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      <ReportTable
        columns={columns}
        data={data}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        loading={loading}
        emptyMessage="No customer data found. Try adjusting your filters."
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

