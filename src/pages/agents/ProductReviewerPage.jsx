import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsPagedTable } from '../../components/agents/AgentsPagedTable';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const existingReviews = useMemo(() => writeContext?.reviews || [], [writeContext]);
  const canGenerate = Boolean(selectedProduct) && !writing && !loadingContext;

  return (
    <div className="minaki-ui mx-auto max-w-5xl px-4 py-6 pb-16 sm:px-6">
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.reviewer} />
      <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">Product Reviewer</h1>
      <p className="mb-5 text-sm text-[var(--color-muted-foreground)]">
        In-stock products live on the website{facebookOnly ? ' and Facebook' : ''}. Select a row, then
        generate reviews.
      </p>

      <Card className="mb-5">
        <CardContent className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold">Filters</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pr-search">Search title, SKU, handle</Label>
              <Input
                id="pr-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadQueue()}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-category">Category</Label>
              <Input id="pr-category" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pr-subcategory">Subcategory</Label>
              <Input
                id="pr-subcategory"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id="pr-facebook-only"
                checked={facebookOnly}
                onCheckedChange={(checked) => setFacebookOnly(Boolean(checked))}
              />
              <Label htmlFor="pr-facebook-only" className="font-normal">
                Facebook / Meta only
              </Label>
            </div>
            <Button
              variant="outline"
              onClick={loadQueue}
              disabled={loadingQueue}
              className="w-full sm:w-auto sm:max-w-[200px]"
            >
              {loadingQueue ? 'Loading…' : 'Refresh queue'}
            </Button>
          </div>
          {summary && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Missing: {summary.missing_count ?? missingReviews.length} · With reviews:{' '}
              {summary.with_reviews_count ?? withReviews.length}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="mb-5 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missing reviews ({missingReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentsPagedTable
              columns={PRODUCT_COLUMNS}
              rows={missingReviews}
              selectedRowId={selectedProductId}
              getRowId={numericProductId}
              onRowClick={selectProduct}
              emptyLabel={loadingQueue ? 'Loading catalog…' : 'No matching products without reviews.'}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">With reviews ({withReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentsPagedTable
              columns={PRODUCT_COLUMNS}
              rows={withReviews}
              selectedRowId={selectedProductId}
              getRowId={numericProductId}
              onRowClick={selectProduct}
              emptyLabel={loadingQueue ? 'Loading catalog…' : 'No matching products with reviews yet.'}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Write reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedProduct ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Select a product from either table.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                <strong className="font-semibold">{selectedProduct.title}</strong>
                {selectedProduct.product_url ? (
                  <>
                    {' · '}
                    <a
                      href={selectedProduct.product_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-primary)] underline underline-offset-2"
                    >
                      Open on site
                    </a>
                  </>
                ) : null}
              </p>
              {loadingContext && (
                <p className="text-sm text-[var(--color-muted-foreground)]">Loading existing reviews…</p>
              )}
              <div className="grid gap-3 md:grid-cols-[140px_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="pr-review-count">Review count</Label>
                  <Input
                    id="pr-review-count"
                    type="number"
                    min={1}
                    max={24}
                    value={reviewCount}
                    onChange={(e) => setReviewCount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pr-customer-id">
                    Customer GID (optional if reviews/env already have one)
                  </Label>
                  <Input
                    id="pr-customer-id"
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pr-publish"
                  checked={publishToShopify}
                  onCheckedChange={(checked) => setPublishToShopify(Boolean(checked))}
                />
                <Label htmlFor="pr-publish" className="font-normal">
                  Publish to Shopify (ACTIVE)
                </Label>
              </div>
              <Button
                onClick={handleWriteReviews}
                disabled={!canGenerate}
                className="w-full md:w-auto md:max-w-[280px]"
              >
                {writing ? 'Writing…' : publishToShopify ? 'Generate + publish' : 'Generate only'}
              </Button>

              <h3 className="text-sm font-semibold">Existing reviews ({existingReviews.length})</h3>
              <AgentsPagedTable
                columns={REVIEW_COLUMNS}
                rows={existingReviews}
                getRowId={(row) => row.metaobject_id || row.handle}
                emptyLabel="No reviews on this product yet."
              />

              {lastResult && (
                <Alert variant={lastResult.success ? 'success' : 'warning'}>
                  {lastResult.message}
                  {Array.isArray(lastResult.reviews) && lastResult.reviews.length > 0
                    ? ` · batch ${lastResult.reviews.length}${
                        lastResult.shopify_write ? ' · published' : ''
                      }`
                    : ''}
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
