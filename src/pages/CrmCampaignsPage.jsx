import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Snackbar, Alert as MuiAlert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { billingUiBuilder } from '../ui/BillingUiBuilder';
import { BillingScreenHost } from '../ui/BillingScreenHost';
import { CrmCampaignsScreen } from '../screens/CrmCampaignsScreen';
import { CampaignBuilderModal } from '../components/CampaignBuilderModal';
import { crmCampaignsApi } from '../services/crmCampaignsApi';

const SEND_COLUMNS = [
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' },
  { key: 'sent_at', label: 'Sent', format: 'datetime' },
  { key: 'delivered_at', label: 'Delivered', format: 'datetime' },
  { key: 'read_at', label: 'Read', format: 'datetime' },
  { key: 'error', label: 'Error' },
];

export const CrmCampaignsPage = () => {
  const [filters, setFilters] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingCampaignId, setActingCampaignId] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [sendsTarget, setSendsTarget] = useState(null);
  const [sends, setSends] = useState([]);
  const [sendsLoading, setSendsLoading] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crmCampaignsApi.list();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const filteredRows = useMemo(() => {
    if (!filters.status) return campaigns;
    return campaigns.filter((c) => c.status === filters.status);
  }, [campaigns, filters]);

  const handleStart = useCallback(
    async (row) => {
      if (!window.confirm(`Start campaign "${row.name}" now? This freezes the recipient list and begins sending.`)) return;
      setActingCampaignId(row.id);
      try {
        const result = await crmCampaignsApi.start(row.id);
        setSnackbar({ severity: 'success', message: `${row.name}: ${result.recipients_queued} recipients queued` });
        fetchCampaigns();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to start campaign' });
      } finally {
        setActingCampaignId(null);
      }
    },
    [fetchCampaigns],
  );

  const handleCancel = useCallback(
    async (row) => {
      if (!window.confirm(`Cancel campaign "${row.name}"?`)) return;
      setActingCampaignId(row.id);
      try {
        await crmCampaignsApi.cancel(row.id);
        setSnackbar({ severity: 'success', message: `Cancelled ${row.name}` });
        fetchCampaigns();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to cancel campaign' });
      } finally {
        setActingCampaignId(null);
      }
    },
    [fetchCampaigns],
  );

  const handleViewSends = useCallback(async (row) => {
    setSendsTarget(row);
    setSendsLoading(true);
    try {
      const data = await crmCampaignsApi.getSends(row.id, { limit: 200 });
      setSends(Array.isArray(data) ? data : []);
    } catch (err) {
      setSends([]);
    } finally {
      setSendsLoading(false);
    }
  }, []);

  const handleRefreshStatus = useCallback(async () => {
    if (!sendsTarget) return;
    setRefreshingStatus(true);
    try {
      const result = await crmCampaignsApi.refreshStatus(sendsTarget.id);
      const data = await crmCampaignsApi.getSends(sendsTarget.id, { limit: 200 });
      setSends(Array.isArray(data) ? data : []);
      setSnackbar({ severity: 'success', message: `Checked ${result.checked}, updated ${result.updated}` });
      fetchCampaigns();
    } catch (err) {
      setSnackbar({ severity: 'error', message: err.message || 'Failed to refresh status' });
    } finally {
      setRefreshingStatus(false);
    }
  }, [sendsTarget, fetchCampaigns]);

  const screen = useMemo(
    () => new CrmCampaignsScreen({ onStart: handleStart, onCancel: handleCancel, onViewSends: handleViewSends, actingCampaignId }),
    [handleStart, handleCancel, handleViewSends, actingCampaignId],
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
        onRetry={fetchCampaigns}
        pagination={null}
        extra={
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button size="small" variant="contained" onClick={() => setBuilderOpen(true)}>
              New Campaign
            </Button>
          </Box>
        }
      />

      <CampaignBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onCreated={() => {
          setBuilderOpen(false);
          setSnackbar({ severity: 'success', message: 'Campaign created' });
          fetchCampaigns();
        }}
      />

      <Dialog open={Boolean(sendsTarget)} onClose={() => setSendsTarget(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Sends: {sendsTarget?.name}
          <Button size="small" variant="outlined" disabled={refreshingStatus} onClick={handleRefreshStatus}>
            {refreshingStatus ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          {billingUiBuilder.table({
            columns: SEND_COLUMNS,
            data: sends,
            loading: sendsLoading,
            emptyMessage: 'No sends recorded yet.',
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendsTarget(null)}>Close</Button>
        </DialogActions>
      </Dialog>

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

export default CrmCampaignsPage;
