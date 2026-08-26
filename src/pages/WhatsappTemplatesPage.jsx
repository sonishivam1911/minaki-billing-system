import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Snackbar, Alert as MuiAlert, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { BillingScreenHost } from '../ui/BillingScreenHost';
import { WhatsappTemplatesScreen } from '../screens/WhatsappTemplatesScreen';
import { TemplateEditorModal } from '../components/TemplateEditorModal';
import { whatsappTemplatesApi } from '../services/whatsappTemplatesApi';

export const WhatsappTemplatesPage = () => {
  const [filters, setFilters] = useState({});
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [actingTemplateId, setActingTemplateId] = useState(null);
  const [snackbar, setSnackbar] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [metricsTarget, setMetricsTarget] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await whatsappTemplatesApi.list();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredRows = useMemo(() => {
    return templates.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.name && !String(t.name || '').toLowerCase().includes(String(filters.name).toLowerCase())) return false;
      return true;
    });
  }, [templates, filters]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await whatsappTemplatesApi.sync();
      setSnackbar({ severity: 'success', message: `Synced ${result.synced}/${result.total} templates from Meta` });
      fetchTemplates();
    } catch (err) {
      setSnackbar({ severity: 'error', message: err.message || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handlePause = useCallback(
    async (row) => {
      setActingTemplateId(row.id);
      try {
        await whatsappTemplatesApi.pause(row.id);
        setSnackbar({ severity: 'success', message: `Paused ${row.name}` });
        fetchTemplates();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to pause template' });
      } finally {
        setActingTemplateId(null);
      }
    },
    [fetchTemplates],
  );

  const handleUnpause = useCallback(
    async (row) => {
      setActingTemplateId(row.id);
      try {
        await whatsappTemplatesApi.unpause(row.id);
        setSnackbar({ severity: 'success', message: `Unpaused ${row.name}` });
        fetchTemplates();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to unpause template' });
      } finally {
        setActingTemplateId(null);
      }
    },
    [fetchTemplates],
  );

  const handleDelete = useCallback(
    async (row) => {
      if (!window.confirm(`Delete template "${row.name}"? This removes it from Meta entirely.`)) return;
      setActingTemplateId(row.id);
      try {
        await whatsappTemplatesApi.remove(row.id);
        setSnackbar({ severity: 'success', message: `Deleted ${row.name}` });
        fetchTemplates();
      } catch (err) {
        setSnackbar({ severity: 'error', message: err.message || 'Failed to delete template' });
      } finally {
        setActingTemplateId(null);
      }
    },
    [fetchTemplates],
  );

  const handleViewMetrics = useCallback(async (row) => {
    setMetricsTarget(row);
    setMetricsLoading(true);
    setMetricsData(null);
    try {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const data = await whatsappTemplatesApi.metrics(row.id, start, end);
      setMetricsData(data);
    } catch (err) {
      setMetricsData({ error: err.message || 'Failed to fetch metrics' });
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const handleCreate = async (payload) => {
    setCreating(true);
    setCreateError('');
    try {
      await whatsappTemplatesApi.create(payload);
      setSnackbar({ severity: 'success', message: `Template "${payload.name}" submitted for review` });
      setEditorOpen(false);
      fetchTemplates();
    } catch (err) {
      setCreateError(err.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const screen = useMemo(
    () =>
      new WhatsappTemplatesScreen({
        onPause: handlePause,
        onUnpause: handleUnpause,
        onDelete: handleDelete,
        onViewMetrics: handleViewMetrics,
        actingTemplateId,
      }),
    [handlePause, handleUnpause, handleDelete, handleViewMetrics, actingTemplateId],
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
        onRetry={fetchTemplates}
        pagination={null}
        extra={
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
            <Button size="small" variant="outlined" disabled={syncing} onClick={handleSync}>
              {syncing ? 'Syncing...' : 'Sync from Meta'}
            </Button>
            <Button size="small" variant="contained" onClick={() => setEditorOpen(true)}>
              New Template
            </Button>
          </Box>
        }
      />

      <TemplateEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleCreate}
        submitting={creating}
        error={createError}
      />

      <Dialog open={Boolean(metricsTarget)} onClose={() => setMetricsTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Metrics: {metricsTarget?.name}</DialogTitle>
        <DialogContent dividers>
          {metricsLoading ? (
            'Loading...'
          ) : metricsData?.error ? (
            <MuiAlert severity="error">{metricsData.error}</MuiAlert>
          ) : (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(metricsData, null, 2)}</pre>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetricsTarget(null)}>Close</Button>
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

export default WhatsappTemplatesPage;
