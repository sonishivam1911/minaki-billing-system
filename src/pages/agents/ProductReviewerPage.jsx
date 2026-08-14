import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner, ErrorMessage } from '../../components';

const CUSTOMER_STORAGE_KEY = 'minaki.productReviewer.customerId';
const DEFAULT_REVIEW_COUNT = 12;

const ProductTable = ({
  title,
  rows,
  selectedProductId,
  onSelect,
  emptyLabel,
}) => (
  <section className="agents-card">
    <h2 className="agents-section-title">
      {title} <span className="agents-preview-skus">({rows.length})</span>
    </h2>
    {rows.length === 0 ? (
      <p className="agents-preview-skus">{emptyLabel}</p>
    ) : (
      <div className="agents-table-wrap">
        <table className="agents-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Title</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Qty</th>
              <th>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const productKey = row.id || row.product_id;
              const isActive = selectedProductId === productKey;
              return (
                <tr
                  key={productKey}
                  className={isActive ? 'agents-row-active' : undefined}
                  onClick={() => onSelect(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td><code>{row.sku || '—'}</code></td>
                  <td>{row.title}</td>
                  <td>{row.category || '—'}</td>
                  <td>{row.sub_category || '—'}</td>
                  <td>{row.qty}</td>
                  <td>{row.review_count || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

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

  const selectedProductId = selectedProduct?.id || selectedProduct?.product_id || null;

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
    setLoadingContext(true);
    setError(null);
    try {
      const productId = row.id || row.product_id;
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
    if (!selectedProduct || !writeContext?.product) {
      setError('Select a product first');
      return;
    }
    setWriting(true);
    setError(null);
    setLastResult(null);
    try {
      const productId = writeContext.product_id || selectedProduct.id || selectedProduct.product_id;
      const res = await agentsApi.generateProductReviews({
        product: writeContext.product,
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

  return (
    <div className="screen-container agents-page">
      <AgentsSubnav />
      <h1>Product Reviewer</h1>
      <p className="agents-preview-skus">
        In-stock products live on the website
        {facebookOnly ? ' and Facebook' : ''}. Click a row, then write reviews.
      </p>

      <section className="agents-card">
        <h2 className="agents-section-title">Filters</h2>
        <div className="agents-search-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <input
            type="search"
            placeholder="Search title, SKU, handle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadQueue()}
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            type="text"
            placeholder="Subcategory"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          />
          <label className="agents-check">
            <input
              type="checkbox"
              checked={facebookOnly}
              onChange={(e) => setFacebookOnly(e.target.checked)}
            />
            Facebook / Meta only
          </label>
          <button type="button" className="agents-btn secondary" onClick={loadQueue} disabled={loadingQueue}>
            Refresh queue
          </button>
        </div>
        {summary && (
          <p className="agents-preview-skus">
            Missing: {summary.missing_count ?? missingReviews.length} · With reviews:{' '}
            {summary.with_reviews_count ?? withReviews.length}
          </p>
        )}
      </section>

      {error && <ErrorMessage message={error} />}
      {loadingQueue ? (
        <LoadingSpinner message="Loading live catalog (website + stock)…" />
      ) : (
        <div className="agents-form-stack">
          <ProductTable
            title="Missing reviews"
            rows={missingReviews}
            selectedProductId={selectedProductId}
            onSelect={selectProduct}
            emptyLabel="No matching products without reviews."
          />
          <ProductTable
            title="With reviews"
            rows={withReviews}
            selectedProductId={selectedProductId}
            onSelect={selectProduct}
            emptyLabel="No matching products with reviews yet."
          />
        </div>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">Click to write</h2>
        {!selectedProduct ? (
          <p className="agents-preview-skus">Select a product from either table.</p>
        ) : loadingContext ? (
          <LoadingSpinner message="Loading product + reviews…" />
        ) : (
          <>
            <p>
              <strong>{selectedProduct.title}</strong>
              {selectedProduct.product_url ? (
                <>
                  {' · '}
                  <a href={selectedProduct.product_url} target="_blank" rel="noreferrer">
                    Open on site
                  </a>
                </>
              ) : null}
            </p>
            <div className="agents-search-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <label>
                Review count{' '}
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={reviewCount}
                  onChange={(e) => setReviewCount(e.target.value)}
                  style={{ width: '4.5rem' }}
                />
              </label>
              <label className="agents-check">
                <input
                  type="checkbox"
                  checked={publishToShopify}
                  onChange={(e) => setPublishToShopify(e.target.checked)}
                />
                Publish to Shopify (ACTIVE)
              </label>
              <input
                type="text"
                placeholder="Customer GID (optional if already on reviews / env)"
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                style={{ minWidth: '22rem', flex: 1 }}
              />
              <button
                type="button"
                className="agents-btn primary"
                onClick={handleWriteReviews}
                disabled={writing}
              >
                {writing ? 'Writing…' : publishToShopify ? 'Generate + publish' : 'Generate only'}
              </button>
            </div>

            <h3 className="agents-section-title">Existing reviews ({existingReviews.length})</h3>
            {existingReviews.length === 0 ? (
              <p className="agents-preview-skus">No reviews on this product yet.</p>
            ) : (
              <div className="agents-table-wrap">
                <table className="agents-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Rating</th>
                      <th>Title</th>
                      <th>Comments</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingReviews.map((review) => (
                      <tr key={review.metaobject_id || review.handle}>
                        <td>{review.customer_name || '—'}</td>
                        <td>{review.reviewer_location || '—'}</td>
                        <td>{review.rating ?? '—'}</td>
                        <td>{review.review_title || '—'}</td>
                        <td>{review.comments || '—'}</td>
                        <td>{review.is_agent_review ? 'agent' : 'other'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {lastResult && (
              <div className="agents-validation" style={{ marginTop: '1rem' }}>
                <p>
                  <strong>{lastResult.success ? 'Done' : 'Failed'}</strong>
                  {' — '}
                  {lastResult.message}
                </p>
                {Array.isArray(lastResult.reviews) && lastResult.reviews.length > 0 && (
                  <p className="agents-preview-skus">
                    Batch size: {lastResult.reviews.length}
                    {lastResult.shopify_write ? ' · published to Shopify' : ''}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
