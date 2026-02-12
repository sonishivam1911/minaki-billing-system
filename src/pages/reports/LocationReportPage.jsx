import React, { useState, useEffect } from 'react';
import { MapPin, DollarSign, Package, Users } from 'lucide-react';
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
import { ErrorMessage } from '../../components';
import { formatRupees } from '../../utils';

/**
 * LocationReportPage Component
 * Displays location report with multi-location comparison and performance metrics
 */
export const LocationReportPage = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { filters, updateFilters, buildQueryParams } = useReportFilters('locations', {
    compare: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = buildQueryParams();
        const result = await reportsApi.getLocationReport(params);

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
      } catch (err) {
        setError(err.message || 'Failed to load location report');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, buildQueryParams]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const summaryCards = summary ? [
    {
      title: 'Total Locations',
      value: summary.total_locations || 0,
      format: 'number',
      color: 'primary',
      icon: MapPin,
    },
    {
      title: 'Total Sales',
      value: summary.total_sales || 0,
      format: 'currency',
      color: 'success',
      icon: DollarSign,
    },
    {
      title: 'Average Sales per Location',
      value: summary.average_sales_per_location || 0,
      format: 'currency',
      color: 'info',
      icon: DollarSign,
    },
  ] : [];

  const columns = [
    { key: 'location_name', label: 'Location', sortable: true },
    {
      key: 'sales',
      label: 'Total Sales',
      sortable: true,
      format: 'currency',
      render: (value, row) => row.sales?.total_sales || 0,
    },
    {
      key: 'sales',
      label: 'Transactions',
      sortable: true,
      format: 'number',
      render: (value, row) => row.sales?.transaction_count || 0,
    },
    {
      key: 'sales',
      label: 'Avg Transaction Value',
      sortable: true,
      format: 'currency',
      render: (value, row) => row.sales?.average_transaction_value || 0,
    },
    {
      key: 'inventory',
      label: 'Total Products',
      sortable: true,
      format: 'number',
      render: (value, row) => row.inventory?.total_products || 0,
    },
    {
      key: 'inventory',
      label: 'Inventory Value',
      sortable: true,
      format: 'currency',
      render: (value, row) => row.inventory?.total_value || 0,
    },
    {
      key: 'customers',
      label: 'Total Customers',
      sortable: true,
      format: 'number',
      render: (value, row) => row.customers?.total_customers || 0,
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
            Location Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Compare performance across different locations and stores
          </Typography>
        </Box>
        <ExportButton
          data={data}
          columns={columns}
          reportType="locations"
          reportTitle="Location Report"
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
        loading={loading}
        emptyMessage="No location data found. Try adjusting your filters."
      />
    </Container>
  );
};

