import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsPagedTable } from '../../components/agents/AgentsPagedTable';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';

const CUSTOMER_STORAGE_KEY = 'minaki.productReviewer.customerId';
const DEFAULT_REVIEW_COUNT = 12;

const PRODUCT_COLUMNS = [
  { key: 'sku', label: 'SKU', render: (row) => row.sku || '—' },
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category', render: (row) => row.category || '—' },
  { key: 'sub_category', label: 'Subcategory', render: (row) => row.sub_category || '—' },
  { key: 'qty', label: 'Qty', align: 'right' },
  { key: 'review_count', label: 'Reviews', align: 'right' },
];

const REVIEW_COLUMNS = [
  { key: 'customer_name', label: 'Name', render: (row) => row.customer_name || '—' },
  { key: 'reviewer_location', label: 'Location', render: (row) => row.reviewer_location || '—' },
  { key: 'rating', label: 'Rating', align: 'right', render: (row) => row.rating ?? '—' },
  { key: 'review_title', label: 'Title', render: (row) => row.review_title || '—' },
  { key: 'comments', label: 'Comments', render: (row) => row.comments || '—' },
  { key: 'source', label: 'Source', render: (row) => (row.is_agent_review ? 'agent' : 'other') },
];

const numericProductId = (row) => {
  const raw = String(row?.product_id || row?.id || '');
  return raw.replace(/^gid:\/\/shopify\/Product\//, '');
};

const buildProductContext = (row, writeContext) => {
  const fromApi = writeContext?.product || {};
  return {
    title: fromApi.title || row?.title || '',
    description: fromApi.description || '',
    product_type: fromApi.product_type || row?.product_type || row?.category || '',
    handle: fromApi.handle || row?.handle || '',
    vendor: fromApi.vendor || 'MINAKI',
    tags: Array.isArray(fromApi.tags) ? fromApi.tags : [],
  };
};

export const ProductReviewerPage = () => {
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [facebookOnly, setFacebookOnly] = useState(true);
  const [missingReviews, setMissingReviews] = useState([]);
  const [withReviews, setWithReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [customerId, setCustomerId] = useState(
    () => localStorage.getItem(CUSTOMER_STORAGE_KEY) || ''
  );
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [writeContext, setWriteContext] = useState(null);
  const [reviewCount, setReviewCount] = useState(DEFAULT_REVIEW_COUNT);
  const [publishToShopify, setPublishToShopify] = useState(true);
  const [lastResult, setLastResult] = useState(null);

  const selectedProductId = selectedProduct ? numericProductId(selectedProduct) : '';

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setError(null);
    try {
      const res = await agentsApi.listProductReviewerQueue({
        online_store_only: true,
        facebook_only: facebookOnly,
        in_stock_only: true,
        min_inventory: 1,
        exclude_utility: true,
        search: search || undefined,
        category: category || undefined,
        sub_category: subCategory || undefined,
      });
      setMissingReviews(res.missing_reviews || []);
      setWithReviews(res.with_reviews || []);
      setSummary(res.summary || null);
      if (!customerId && res.default_customer_id) {
        setCustomerId(res.default_customer_id);
        localStorage.setItem(CUSTOMER_STORAGE_KEY, res.default_customer_id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [facebookOnly, search, category, subCategory, customerId]);

  useEffect(() => {
    loadQueue();
  }, []);

  const selectProduct = async (row) => {
    setSelectedProduct(row);
    setLastResult(null);
    setError(null);
    setLoadingContext(true);
    try {
      const productId = numericProductId(row);
      const context = await agentsApi.getProductReviewerWriteContext(productId);
      setWriteContext(context);
      if (context.publish_customer_id) {
        setCustomerId(context.publish_customer_id);
        localStorage.setItem(CUSTOMER_STORAGE_KEY, context.publish_customer_id);
      }
    } catch (err) {
      setWriteContext(null);
      setError(err.message);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleCustomerChange = (value) => {
    setCustomerId(value);
    if (value) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    }
  };

  const handleWriteReviews = async () => {
    if (!selectedProduct) {
      setError('Select a product from a table first.');
      return;
    }
    const product = buildProductContext(selectedProduct, writeContext);
    if (!product.title) {
      setError('Selected product has no title, so generate cannot run.');
      return;
    }
    setWriting(true);
    setError(null);
    setLastResult(null);
    try {
      const productId = numericProductId(selectedProduct);
      const res = await agentsApi.generateProductReviews({
        product,
        review_count: Number(reviewCount) || DEFAULT_REVIEW_COUNT,
        publish_to_shopify: publishToShopify,
        product_id: productId,
        customer_id: customerId || undefined,
      });
      setLastResult(res);
      if (res.success) {
        await selectProduct(selectedProduct);
        await loadQueue();
      } else {
        setError(res.error || res.message || 'Generate failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWriting(false);
    }
  };

  const existingReviews = useMemo(
    () => writeContext?.reviews || [],
    [writeContext]
  );
  const canGenerate = Boolean(selectedProduct) && !writing && !loadingContext;

  return (
    <Box className="screen-container agents-page" sx={{ pb: 4 }}>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.reviewer} />
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        Product Reviewer
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        In-stock products live on the website{facebookOnly ? ' and Facebook' : ''}.
        Select a row, then generate reviews.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">Filters</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              fullWidth
              label="Search title, SKU, handle"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && loadQueue()}
            />
            <TextField
              size="small"
              fullWidth
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <TextField
              size="small"
              fullWidth
              label="Subcategory"
              value={subCategory}
              onChange={(event) => setSubCategory(event.target.value)}
            />
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ sm: 'center' }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={facebookOnly}
                  onChange={(event) => setFacebookOnly(event.target.checked)}
                />
              }
              label="Facebook / Meta only"
            />
            <Button
              variant="outlined"
              onClick={loadQueue}
              disabled={loadingQueue}
              fullWidth
              sx={{ maxWidth: { sm: 200 } }}
            >
              {loadingQueue ? 'Loading…' : 'Refresh queue'}
            </Button>
          </Stack>
          {summary && (
            <Typography variant="body2" color="text.secondary">
              Missing: {summary.missing_count ?? missingReviews.length} · With reviews:{' '}
              {summary.with_reviews_count ?? withReviews.length}
            </Typography>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={2} sx={{ mb: 2 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Missing reviews ({missingReviews.length})
          </Typography>
          <AgentsPagedTable
            columns={PRODUCT_COLUMNS}
            rows={missingReviews}
            selectedRowId={selectedProductId}
            getRowId={numericProductId}
            onRowClick={selectProduct}
            emptyLabel={loadingQueue ? 'Loading catalog…' : 'No matching products without reviews.'}
          />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            With reviews ({withReviews.length})
          </Typography>
          <AgentsPagedTable
            columns={PRODUCT_COLUMNS}
            rows={withReviews}
            selectedRowId={selectedProductId}
            getRowId={numericProductId}
            onRowClick={selectProduct}
            emptyLabel={loadingQueue ? 'Loading catalog…' : 'No matching products with reviews yet.'}
          />
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Write reviews
        </Typography>
        {!selectedProduct ? (
          <Typography variant="body2" color="text.secondary">
            Select a product from either table.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <Typography>
              <strong>{selectedProduct.title}</strong>
              {selectedProduct.product_url ? (
                <>
                  {' · '}
                  <Link href={selectedProduct.product_url} target="_blank" rel="noreferrer">
                    Open on site
                  </Link>
                </>
              ) : null}
            </Typography>
            {loadingContext && (
              <Typography variant="body2" color="text.secondary">
                Loading existing reviews…
              </Typography>
            )}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                type="number"
                label="Review count"
                value={reviewCount}
                onChange={(event) => setReviewCount(event.target.value)}
                inputProps={{ min: 1, max: 24 }}
                sx={{ width: { xs: '100%', md: 140 } }}
              />
              <TextField
                size="small"
                fullWidth
                label="Customer GID (optional if reviews/env already have one)"
                value={customerId}
                onChange={(event) => handleCustomerChange(event.target.value)}
              />
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={publishToShopify}
                  onChange={(event) => setPublishToShopify(event.target.checked)}
                />
              }
              label="Publish to Shopify (ACTIVE)"
            />
            <Button
              variant="contained"
              onClick={handleWriteReviews}
              disabled={!canGenerate}
              fullWidth
              sx={{ maxWidth: { md: 280 } }}
            >
              {writing ? 'Writing…' : publishToShopify ? 'Generate + publish' : 'Generate only'}
            </Button>

            <Typography variant="subtitle2">
              Existing reviews ({existingReviews.length})
            </Typography>
            <AgentsPagedTable
              columns={REVIEW_COLUMNS}
              rows={existingReviews}
              getRowId={(row) => row.metaobject_id || row.handle}
              emptyLabel="No reviews on this product yet."
            />

            {lastResult && (
              <Alert severity={lastResult.success ? 'success' : 'warning'}>
                {lastResult.message}
                {Array.isArray(lastResult.reviews) && lastResult.reviews.length > 0
                  ? ` · batch ${lastResult.reviews.length}${
                      lastResult.shopify_write ? ' · published' : ''
                    }`
                  : ''}
              </Alert>
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};
