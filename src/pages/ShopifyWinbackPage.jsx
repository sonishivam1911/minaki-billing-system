import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Snackbar, Alert as MuiAlert, Stack } from '@mui/material';
import { BillingScreenHost } from '../ui/BillingScreenHost';
import { ShopifyWinbackScreen } from '../screens/ShopifyWinbackScreen';
import { ShopifyWinbackTemplateSettings } from '../components/ShopifyWinbackTemplateSettings';
import { shopifyWinbackApi } from '../services/shopifyWinbackApi';

const PAGE_SIZE = 25;

export const ShopifyWinbackPage = () => {
  const [filters, setFilters] = useState({ status: 'open' });
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState(null); // cursor for the page currently shown
  const [nextPageInfo, setNextPageInfo] = useState(null);
  const [cursorStack, setCursorStack] = useState([]); // history of previous cursors, for "Previous"
  const [triggeringToken, setTriggeringToken] = useState(null);
  const [snackbar, setSnackbar] = useState(null); // { severity, message }

  const fetchCheckouts = useCallback(
    async (cursor) => {
      setLoading(true);
      setError(null);
      try {
        const data = await shopifyWinbackApi.listCheckouts({
          status: filters.status,
          limit: PAGE_SIZE,
          pageInfo: cursor || undefined,
        });
        setCheckouts(data.checkouts || []);
        setNextPageInfo(data.next_page_info || null);
      } catch (err) {
        setError(err.message || 'Failed to load abandoned checkouts');
      } finally {
        setLoading(false);
      }
    },
    [filters.status],
  );

  useEffect(() => {
    setPageInfo(null);
    setCursorStack([]);
    fetchCheckouts(null);
  }, [fetchCheckouts]);

  const handleNextPage = () => {
    if (!nextPageInfo) return;
    setCursorStack((stack) => [...stack, pageInfo]);
    setPageInfo(nextPageInfo);
    fetchCheckouts(nextPageInfo);
  };

  const handlePreviousPage = () => {
    if (cursorStack.length === 0) return;
    const prevStack = [...cursorStack];
    const prevCursor = prevStack.pop();
    setCursorStack(prevStack);
    setPageInfo(prevCursor);
    fetchCheckouts(prevCursor);
  };

  const handleTrigger = useCallback(async (row) => {
    setTriggeringToken(row.checkout_token);
    try {
      await shopifyWinbackApi.triggerCheckout(row.checkout_token, row);
      setSnackbar({ severity: 'success', message: `Winback offer queued for ${row.phone}` });
      fetchCheckouts(pageInfo);
    } catch (err) {
      setSnackbar({ severity: 'error', message: err.message || 'Failed to trigger winback' });
    } finally {
      setTriggeringToken(null);
    }
  }, [fetchCheckouts, pageInfo]);

  const screen = useMemo(
    () => new ShopifyWinbackScreen({ onTrigger: handleTrigger, triggeringToken }),
    [handleTrigger, triggeringToken],
  );

  return (
    <>
      <BillingScreenHost
        screen={screen}
        filters={filters}
        onFiltersChange={setFilters}
        rows={checkouts}
        loading={loading}
        error={error}
        onRetry={() => fetchCheckouts(pageInfo)}
        pagination={null}
        extra={
          <>
            <ShopifyWinbackTemplateSettings />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button size="small" disabled={cursorStack.length === 0 || loading} onClick={handlePreviousPage}>
                  Previous
                </Button>
                <Button size="small" disabled={!nextPageInfo || loading} onClick={handleNextPage}>
                  Next
                </Button>
              </Stack>
            </Box>
          </>
        }
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

export default ShopifyWinbackPage;
