import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, TrendingUp, Percent } from 'lucide-react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { useSalesReport } from '../../hooks/useSalesReport';
import { useReportFilters } from '../../hooks/useReportFilters';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportSummaryCards } from '../../components/reports/ReportSummaryCards';
import { ReportCharts } from '../../components/reports/ReportCharts';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportSkeleton } from '../../components/reports/ReportSkeleton';
import { ExportButton } from '../../components/reports/ExportButton';
import { ErrorMessage, Pagination } from '../../components';
import { formatRupees } from '../../utils';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField } from '@mui/material';

/**
 * DailySalesReportPage Component
 * Displays daily sales report with date selector, summary cards, charts, and transactions table
 */
export const DailySalesReportPage = () => {
  const { data, summary, loading, error, pagination, fetchDailySalesReport, clearError } = useSalesReport();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { filters, updateFilters, buildQueryParams } = useReportFilters('daily-sales', {
    date: today,
    page: 1,
    page_size: 50,
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = buildQueryParams();
    params.page = currentPage;
    params.page_size = 50;
    fetchDailySalesReport(params);
  }, [filters, currentPage, buildQueryParams, fetchDailySalesReport]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    setCurrentPage(1);
  };

  const summaryCards = summary ? [
    {
      title: 'Total Sales',
      value: summary.total_sales || 0,
      format: 'currency',
      color: 'success',
      icon: DollarSign,
    },
    {
      title: 'Total Transactions',
      value: summary.total_transactions || 0,
      format: 'number',
      color: 'primary',
      icon: FileText,
    },
    {
      title: 'Average Transaction Value',
      value: summary.average_transaction_value || 0,
      format: 'currency',
      color: 'info',
      icon: TrendingUp,
    },
    {
      title: 'Total Discounts',
      value: summary.total_discounts || 0,
      format: 'currency',
      color: 'warning',
      icon: Percent,
    },
    {
      title: 'Total GST',
      value: summary.total_gst || 0,
      format: 'currency',
      color: 'default',
      icon: DollarSign,
    },
  ] : [];

  const categoryChartData = summary?.sales_by_category
    ? Object.entries(summary.sales_by_category).map(([name, value]) => ({ name, value }))
    : [];

  const paymentMethodChartData = summary?.sales_by_payment_method
    ? Object.entries(summary.sales_by_payment_method).map(([name, value]) => ({ name, value }))
    : [];

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', sortable: true },
    {
      key: 'customer',
      label: 'Customer',
      sortable: false,
      render: (value) => value?.name || 'Walk-in Customer',
    },
    { key: 'created_at', label: 'Date', sortable: true, format: 'datetime' },
    { key: 'total_amount', label: 'Amount', sortable: true, format: 'currency' },
    { key: 'payment_method', label: 'Payment Method', sortable: true },
    { key: 'invoice_status', label: 'Status', sortable: true },
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
            Daily Sales Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            View daily sales transactions, revenue, and performance metrics
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="daily-sales"
          reportTitle="Daily Sales Report"
          summary={summary}
        />
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <ErrorMessage message={error} />
          <Button onClick={clearError} sx={{ mt: 1 }}>Dismiss</Button>
        </Box>
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ mb: 3 }}>
          <DatePicker
            label="Select Date"
            value={filters.date ? new Date(filters.date) : new Date()}
            onChange={(newValue) => {
              if (newValue) {
                handleFilterChange({ ...filters, date: format(newValue, 'yyyy-MM-dd') });
              }
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  maxWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                  },
                },
              },
            }}
          />
        </Box>
      </LocalizationProvider>

      <ReportFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
        availableFilters={['category', 'payment_method', 'invoice_status', 'price_range']}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      {categoryChartData.length > 0 && (
        <ReportCharts
          type="bar"
          data={categoryChartData}
          config={{ xKey: 'name', yKey: 'value', bars: [{ key: 'value', name: 'Sales', color: '#8b6f47' }] }}
          title="Sales by Category"
        />
      )}

      {paymentMethodChartData.length > 0 && (
        <ReportCharts
          type="pie"
          data={paymentMethodChartData}
          config={{ nameKey: 'name', valueKey: 'value' }}
          title="Payment Method Distribution"
        />
      )}

      <ReportTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No sales data found for the selected date. Try selecting a different date."
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

