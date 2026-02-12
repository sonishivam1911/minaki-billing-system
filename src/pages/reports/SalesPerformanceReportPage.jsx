import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
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
import { ErrorMessage } from '../../components';
import { formatRupees } from '../../utils';
import { subDays, format } from 'date-fns';

/**
 * SalesPerformanceReportPage Component
 * Displays sales performance report with date range, group by, trend charts, and comparison
 */
export const SalesPerformanceReportPage = () => {
  const { data, summary, loading, error, fetchSalesPerformanceReport, clearError } = useSalesReport();
  const { filters, updateFilters, buildQueryParams } = useReportFilters('sales-performance', {
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    group_by: 'day',
    compare_with_previous: false,
    page: 1,
    page_size: 100,
  });

  useEffect(() => {
    const params = buildQueryParams();
    if (params.start_date && params.end_date && params.group_by) {
      fetchSalesPerformanceReport(params);
    }
  }, [filters, buildQueryParams, fetchSalesPerformanceReport]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
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
      icon: TrendingUp,
    },
    {
      title: 'Average Transaction Value',
      value: summary.average_transaction_value || 0,
      format: 'currency',
      color: 'info',
      icon: TrendingUp,
    },
    {
      title: 'Growth Percentage',
      value: summary.growth_percentage || 0,
      format: 'percentage',
      color: summary.growth_percentage >= 0 ? 'success' : 'error',
      icon: Percent,
    },
  ] : [];

  const chartData = data.map((item) => ({
    period: item.period,
    sales: item.sales || 0,
    transactions: item.transactions || 0,
    previous_period_sales: item.previous_period_sales || 0,
  }));

  const columns = [
    { key: 'period', label: 'Period', sortable: true },
    { key: 'sales', label: 'Sales', sortable: true, format: 'currency' },
    { key: 'transactions', label: 'Transactions', sortable: true, format: 'number' },
    { key: 'average_transaction_value', label: 'Avg Transaction', sortable: true, format: 'currency' },
    { key: 'growth_percentage', label: 'Growth %', sortable: true, format: 'percentage' },
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
            Sales Performance Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Analyze sales trends over time with period comparisons
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="sales-performance"
          reportTitle="Sales Performance Report"
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
        availableFilters={['date_range', 'group_by', 'category', 'location', 'compare_with_previous']}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      {chartData.length > 0 && (
        <ReportCharts
          type="line"
          data={chartData}
          config={{
            xKey: 'period',
            lines: [
              { key: 'sales', name: 'Current Period', color: '#8b6f47' },
              { key: 'previous_period_sales', name: 'Previous Period', color: '#9ca3af' },
            ],
          }}
          title="Sales Trend"
        />
      )}

      <ReportTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No sales performance data found. Try adjusting your date range."
      />
    </Container>
  );
};

