import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Snackbar, Alert as MuiAlert, Stack } from '@mui/material';
import { BillingScreenHost } from '../ui/BillingScreenHost';
import { CrmSegmentsScreen } from '../screens/CrmSegmentsScreen';
import { SegmentBuilderModal } from '../components/SegmentBuilderModal';
import { crmApi } from '../services/crmApi';

export const CrmSegmentsPage = () => {
  const [filters, setFilters] = useState({});
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingSegmentId, setActingSegmentId] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [syncingShopify, setSyncingShopify] = useState(false);
  const [syncingMerge, setSyncingMerge] = useState(false);

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crmApi.listSegments();
      setSegments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const filteredRows = useMemo(() => {
    if (!filters.name) return segments;
    const q = filters.name.toLowerCase();
    return segments.filter((s) => String(s.name || '').toLowerCase().includes(q));
  }, [segments, filters]);

  const handleCompute = useCallback(
    async (row) => {
      setActingSegmentId(row.id);
      try {
        const result = await crmApi.computeSegment(row.id);
        setSnackbar({ severity: 'success', message: `${row.name}: ${result.member_count} members` });
        fetchSegments();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to compute segment' });
      } finally {
        setActingSegmentId(null);
      }
    },
    [fetchSegments],
  );

  const handleDelete = useCallback(
    async (row) => {
      if (!window.confirm(`Delete segment "${row.name}"?`)) return;
      try {
        await crmApi.deleteSegment(row.id);
        setSnackbar({ severity: 'success', message: `Deleted ${row.name}` });
        fetchSegments();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to delete segment' });
      }
    },
    [fetchSegments],
  );

  const handleEdit = useCallback((row) => {
    setEditingSegment(row);
    setBuilderOpen(true);
  }, []);

  const handleSyncShopify = async () => {
    setSyncingShopify(true);
    try {
      await crmApi.syncShopifyCustomers();
      setSnackbar({ severity: 'success', message: 'Shopify customer sync queued - this can take a few minutes' });
    } catch (err) {
      setSnackbar({ severity: 'error', message: err.message || 'Failed to queue Shopify sync' });
    } finally {
      setSyncingShopify(false);
    }
  };

  const handleSyncMerge = async () => {
    setSyncingMerge(true);
    try {
      await crmApi.syncMerge();
      setSnackbar({ severity: 'success', message: 'CRM merge queued' });
    } catch (err) {
      setSnackbar({ severity: 'error', message: err.message || 'Failed to queue CRM merge' });
    } finally {
      setSyncingMerge(false);
    }
  };

  const screen = useMemo(
    () => new CrmSegmentsScreen({ onEdit: handleEdit, onCompute: handleCompute, onDelete: handleDelete, actingSegmentId }),
    [handleEdit, handleCompute, handleDelete, actingSegmentId],
  );

  return (
    <>
      <BillingScreenHost
        screen={screen}
        filters={filters}
        onFiltersChange={setFilters}
        rows={filteredRows}
        loading={loading}
        error={error}
        onRetry={fetchSegments}
        pagination={null}
        extra={
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
            <Button size="small" variant="outlined" disabled={syncingShopify} onClick={handleSyncShopify}>
              {syncingShopify ? 'Queuing...' : 'Sync Shopify Customers'}
            </Button>
            <Button size="small" variant="outlined" disabled={syncingMerge} onClick={handleSyncMerge}>
              {syncingMerge ? 'Queuing...' : 'Rebuild CRM Merge'}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                setEditingSegment(null);
                setBuilderOpen(true);
              }}
            >
              New Segment
            </Button>
          </Box>
        }
      />

      <SegmentBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        initialSegment={editingSegment}
        onSaved={() => {
          setBuilderOpen(false);
          setSnackbar({ severity: 'success', message: 'Segment saved' });
          fetchSegments();
        }}
      />

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <MuiAlert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
            {snackbar.message}
          </MuiAlert>
        ) : undefined}
      </Snackbar>
    </>
  );
};

export default CrmSegmentsPage;
