import React, { useState, useEffect } from 'react';
import { Move, ArrowRight } from 'lucide-react';
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
import { subDays, format } from 'date-fns';

/**
 * StockMovementReportPage Component
 * Displays stock movement report with movement log table and filters
 */
export const StockMovementReportPage = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const { filters, updateFilters, buildQueryParams } = useReportFilters('stock-movement', {
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    page: 1,
    page_size: 50,
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = buildQueryParams();
        params.page = currentPage;
        params.page_size = 50;
        const result = await reportsApi.getStockMovementReport(params);

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
        setError(err.message || 'Failed to load stock movement report');
      } finally {
        setLoading(false);
      }
    };

    if (filters.start_date && filters.end_date) {
      fetchData();
    }
  }, [filters, currentPage, buildQueryParams]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    setCurrentPage(1);
  };

  const summaryCards = summary ? [
    {
      title: 'Total Additions',
      value: summary.total_additions || 0,
      format: 'number',
      color: 'success',
      icon: Move,
    },
    {
      title: 'Total Transfers',
      value: summary.total_transfers || 0,
      format: 'number',
      color: 'info',
      icon: Move,
    },
    {
      title: 'Total Sales',
      value: summary.total_sales || 0,
      format: 'number',
      color: 'primary',
      icon: Move,
    },
    {
      title: 'Net Change',
      value: summary.net_change || 0,
      format: 'number',
      color: summary.net_change >= 0 ? 'success' : 'error',
      icon: Move,
    },
  ] : [];

  const columns = [
    { key: 'date', label: 'Date', sortable: true, format: 'datetime' },
    { key: 'movement_type', label: 'Type', sortable: true },
    {
      key: 'product',
      label: 'Product',
      sortable: false,
      render: (value) => value?.product_name || 'N/A',
    },
    { key: 'quantity', label: 'Quantity', sortable: true, format: 'number' },
    {
      key: 'from_location',
      label: 'From Location',
      sortable: false,
      render: (value) => value ? `${value.location_name} - ${value.storage_object_name}` : 'N/A',
    },
    {
      key: 'to_location',
      label: 'To Location',
      sortable: false,
      render: (value) => value ? `${value.location_name} - ${value.storage_object_name}` : 'N/A',
    },
    {
      key: 'moved_by',
      label: 'Moved By',
      sortable: false,
      render: (value) => value?.name || value?.username || 'N/A',
    },
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
            Stock Movement Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Track inventory movements including additions, transfers, and sales
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="stock-movement"
          reportTitle="Stock Movement Report"
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
        availableFilters={['date_range', 'movement_type', 'category', 'location']}
      />

      {summary && <ReportSummaryCards cards={summaryCards} />}

      <ReportTable
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="No stock movement data found. Try adjusting your date range."
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

