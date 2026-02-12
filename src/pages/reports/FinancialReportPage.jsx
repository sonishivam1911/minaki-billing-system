import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
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
import { ReportCharts } from '../../components/reports/ReportCharts';
import { ReportTable } from '../../components/reports/ReportTable';
import { ReportSkeleton } from '../../components/reports/ReportSkeleton';
import { ExportButton } from '../../components/reports/ExportButton';
import { ErrorMessage } from '../../components';
import { formatRupees } from '../../utils';
import { subDays, format } from 'date-fns';

/**
 * FinancialReportPage Component
 * Displays financial report with P&L format, revenue/cost breakdown, and profit margins
 */
export const FinancialReportPage = () => {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { filters, updateFilters, buildQueryParams } = useReportFilters('financial', {
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    include_refunds: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = buildQueryParams();
        const result = await reportsApi.getFinancialReport(params);

        // Response structure: { period: {...}, financial_summary: {...}, breakdown: {...} }
        if (result.financial_summary) {
          setSummary(result.financial_summary);
        } else {
          setSummary(null);
        }

        if (result.breakdown) {
          setData(result.breakdown);
        } else {
          setData(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load financial report');
      } finally {
        setLoading(false);
      }
    };

    if (filters.start_date && filters.end_date) {
      fetchData();
    }
  }, [filters, buildQueryParams]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const revenue = summary?.revenue || {};
  const costs = summary?.costs || {};
  const profitability = summary?.profitability || {};

  const summaryCards = summary ? [
    {
      title: 'Total Revenue',
      value: revenue.total_revenue || 0,
      format: 'currency',
      color: 'success',
      icon: DollarSign,
    },
    {
      title: 'Total Costs',
      value: costs.total_costs || 0,
      format: 'currency',
      color: 'error',
      icon: TrendingDown,
    },
    {
      title: 'Gross Profit',
      value: profitability.gross_profit || 0,
      format: 'currency',
      color: 'success',
      icon: TrendingUp,
    },
    {
      title: 'Gross Profit Margin',
      value: profitability.gross_profit_margin || 0,
      format: 'percentage',
      color: 'info',
      icon: Percent,
    },
  ] : [];

  const breakdownData = (data && data.by_category) ? data.by_category : [];

  const columns = [
    { key: 'category', label: 'Category', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true, format: 'currency' },
    { key: 'cogs', label: 'COGS', sortable: true, format: 'currency' },
    { key: 'gross_profit', label: 'Gross Profit', sortable: true, format: 'currency' },
    { key: 'gross_profit_margin', label: 'Profit Margin', sortable: true, format: 'percentage' },
  ];

  if (loading && !summary) {
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
            Financial Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            View revenue, expenses, profitability, and financial metrics
          </Typography>
        </Box>
        <ExportButton
          data={breakdownData}
          columns={columns}
          reportType="financial"
          reportTitle="Financial Report"
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
        availableFilters={['date_range', 'location', 'category', 'include_refunds']}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      {breakdownData.length > 0 && (
        <ReportCharts
          type="bar"
          data={breakdownData}
          config={{
            xKey: 'category',
            bars: [
              { key: 'revenue', name: 'Revenue', color: '#2e7d32' },
              { key: 'cogs', name: 'COGS', color: '#d32f2f' },
              { key: 'gross_profit', name: 'Gross Profit', color: '#8b6f47' },
            ],
          }}
          title="Revenue vs Costs by Category"
        />
      )}

      {breakdownData.length > 0 && (
        <ReportTable
          columns={columns}
          data={breakdownData}
          loading={loading}
          emptyMessage="No financial data found. Try adjusting your date range."
        />
      )}
    </Container>
  );
};

