import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner, ErrorMessage } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { collectHttpImageUrls, normalizeCreativePodRunForDisplay } from './creativePodRun';
import { ensureStringArray, normalizeCollectionRunForDisplay } from './collectionPageRun';

// Every agent pod that persists runs — one place to log + price all of them,
// not just Collection Builder's own two pipelines. Product Writer, Keywords,
// and Naming Teams have no run-history endpoint at all (stateless / CRUD
// tables, not generation runs), so there's nothing to list for them.
const LOG_PIPELINES = [
  {
    key: 'copy',
    label: 'Copy / SEO runs',
    list: (params) => agentsApi.listCollectionRuns(params),
    get: (id) => agentsApi.getCollectionRun(id),
    normalize: normalizeCollectionRunForDisplay,
    rowLabel: (row) =>
      `${row.collection_handle || row.collection_gid || 'collection'}${
        row.error_message ? ` — error: ${row.error_message}` : ''
      }`,
    costsOf: (raw) => raw?.models_used?._costs,
  },
  {
    key: 'banner',
    label: 'Banner runs',
    list: (params) => agentsApi.listCreativePodRuns(params),
    get: (id) => agentsApi.getCreativePodRun(id),
    normalize: normalizeCreativePodRunForDisplay,
    rowLabel: (row) =>
      `${row.goal_type || 'banner'}${row.error_message ? ` — error: ${row.error_message}` : ''}`,
    costsOf: (raw) => raw?.decision_logs?.costs,
  },
  {
    key: 'campaign',
    label: 'Campaign Creative runs',
    list: (params) => agentsApi.listCampaignRuns(params),
    get: (id) => agentsApi.getCampaignRun(id),
    normalize: (raw) => raw,
    rowLabel: (row) =>
      `${row.brand_kit_id || 'campaign'}${row.error_message ? ` — error: ${row.error_message}` : ''}`,
    costsOf: () => null,
  },
  {
    key: 'meta',
    label: 'Meta Marketing runs',
    list: (params) => agentsApi.listMetaPortfolioRuns(params),
    get: (id) => agentsApi.getMetaPortfolioRun(id),
    normalize: (raw) => raw,
    rowLabel: (row) =>
      `${row.since || ''}${row.until ? ` to ${row.until}` : ''}${
        row.error_message ? ` — error: ${row.error_message}` : ''
      }`,
    costsOf: () => null,
  },
];

const RULE_COLUMN_LABELS = {
  TAG: 'Tag',
  TITLE: 'Title',
  TYPE: 'Product type',
  VENDOR: 'Vendor',
  PRICE: 'Price',
  VARIANT_INVENTORY: 'Inventory',
  PRODUCT_METAFIELD_DEFINITION: 'Metafield',
  PRODUCT_TAXONOMY_NODE_ID: 'Category',
  IS_PRICE_REDUCED: 'On sale',
  VARIANT_TITLE: 'Variant title',
  WEIGHT: 'Weight',
};

const RULE_RELATION_LABELS = {
  EQUALS: 'is',
  NOT_EQUALS: 'is not',
  GREATER_THAN: 'is greater than',
  LESS_THAN: 'is less than',
  STARTS_WITH: 'starts with',
  ENDS_WITH: 'ends with',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'does not contain',
};

/** Same logic Shopify itself uses to auto-populate a smart collection — the
 * rule_set already IS the collection's positioning, so prefill from it
 * instead of asking the operator to redescribe it from scratch. Manual
 * (non-rule-based) collections have no rule_set; leave blank for those. */
const formatCollectionRuleSet = (ruleSet) => {
  if (!ruleSet || !Array.isArray(ruleSet.rules) || !ruleSet.rules.length) return '';
  const joiner = ruleSet.appliedDisjunctively ? ' OR ' : ' AND ';
  const parts = ruleSet.rules.map((rule) => {
    const column = RULE_COLUMN_LABELS[rule.column] || rule.column;
    const relation = RULE_RELATION_LABELS[rule.relation] || rule.relation;
    return `${column} ${relation} "${rule.condition}"`;
  });
  return `Automated collection rule — products are auto-added when ${parts.join(joiner)}.`;
};

const EvaluatorSlotBreakdown = ({ slotName, verdict }) => {
  if (!verdict) return null;
  const breakdown = verdict.score_breakdown || [];
  return (
    <div className="agents-copy-block">
      <p>
        <strong>{slotName}:</strong> {verdict.pass ? 'pass' : 'needs review'} — score {verdict.score}
        {verdict.hard_gate_failed ? ' (hard gate failed)' : ''}
      </p>
      {breakdown.length > 0 ? (
        <ul className="agents-hook-list">
          {breakdown.map((entry) => (
            <li key={entry.axis}>
              <strong>{entry.axis}:</strong>{' '}
              {entry.score !== undefined ? `${entry.score}/100 — ` : `${entry.status} — `}
              {entry.detail}
            </li>
          ))}
        </ul>
      ) : (
        (verdict.reasons || []).length > 0 && (
          <p className="agents-collection-meta">{verdict.reasons.join('; ')}</p>
        )
      )}
    </div>
  );
};

export const CollectionBuilderPage = () => {
  const { isManager } = useAuth();
  const canViewPricing = isManager();

  const [activeTab, setActiveTab] = useState('builder');

  const [shopifyCollections, setShopifyCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [pickerValue, setPickerValue] = useState('');
  const [collectionHandle, setCollectionHandle] = useState('');
  const [collectionGid, setCollectionGid] = useState('');
  const [collectionTitle, setCollectionTitle] = useState('');

  const PRODUCTS_PAGE_SIZE = 24;

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsLoadingMore, setProductsLoadingMore] = useState(false);
  const [productsPageInfo, setProductsPageInfo] = useState({ has_next_page: false, end_cursor: null });
  const [selectedProductId, setSelectedProductId] = useState('');

  const [collectionLogicText, setCollectionLogicText] = useState('');

  const [seoResult, setSeoResult] = useState(null);
  const [seoSubmitting, setSeoSubmitting] = useState(false);

  const [bannerRun, setBannerRun] = useState(null);
  const [bannerSubmitting, setBannerSubmitting] = useState(false);
  const [regenerateHint, setRegenerateHint] = useState('');

  const [applyResult, setApplyResult] = useState(null);
  const [applySubmitting, setApplySubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  // Logs: full run history across both pipelines (collection copy/SEO runs
  // via collection_page_pod, banner runs via Creative Pod) so operators can
  // see the entire output of any past run, not just the current session.
  const [logsKind, setLogsKind] = useState('copy'); // one of LOG_PIPELINES[].key
  const [logsItems, setLogsItems] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [expandedRunKey, setExpandedRunKey] = useState('');
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [expandedLoading, setExpandedLoading] = useState(false);

  // Pricing: admin/manager only, both client-gated (this tab) and
  // server-gated (the API strips cost data from the response body entirely
  // for any other role — see utils/agent_user.py:strip_pricing_if_unauthorized
  // in the backend). A non-manager never receives cost numbers over the
  // wire, regardless of what the UI shows.
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);
  const [pricingRows, setPricingRows] = useState([]);

  const loadShopifyCollections = async () => {
    setCollectionsLoading(true);
    try {
      const response = await agentsApi.listShopifyCollections({ first: 250 });
      setShopifyCollections(response.collections || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    loadShopifyCollections();
  }, []);

  const resetDownstreamState = () => {
    setProducts([]);
    setProductsPageInfo({ has_next_page: false, end_cursor: null });
    setSelectedProductId('');
    setCollectionLogicText('');
    setSeoResult(null);
    setBannerRun(null);
    setRegenerateHint('');
    setApplyResult(null);
  };

  const selectCollection = async (value) => {
    setPickerValue(value);
    resetDownstreamState();
    if (!value) {
      setCollectionHandle('');
      setCollectionGid('');
      setCollectionTitle('');
      return;
    }
    const picked = shopifyCollections.find((row) => row.handle === value);
    const handle = picked?.handle || value;
    setCollectionHandle(handle);
    setCollectionGid(picked?.id || '');
    setCollectionTitle(picked?.title || handle);
    setCollectionLogicText(formatCollectionRuleSet(picked?.rule_set));

    setProductsLoading(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.listCollectionBuilderProducts({
        collectionHandle: handle,
        collectionGid: picked?.id,
        limit: PRODUCTS_PAGE_SIZE,
      });
      setProducts(response.products || []);
      setProductsPageInfo(response.page_info || { has_next_page: false, end_cursor: null });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!productsPageInfo.has_next_page || productsLoadingMore) return;
    setProductsLoadingMore(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.listCollectionBuilderProducts({
        collectionHandle: collectionHandle || undefined,
        collectionGid: collectionGid || undefined,
        limit: PRODUCTS_PAGE_SIZE,
        after: productsPageInfo.end_cursor,
      });
      setProducts((prev) => [...prev, ...(response.products || [])]);
      setProductsPageInfo(response.page_info || { has_next_page: false, end_cursor: null });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setProductsLoadingMore(false);
    }
  };

  const selectedProduct = products.find((p) => p.product_id === selectedProductId) || null;

  const generateSeo = async () => {
    setSeoSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.generateCollectionPage({
        collection_handle: collectionHandle || undefined,
        collection_gid: collectionGid || undefined,
        active_filters: {},
        skip_image_generation: true,
        skip_image_judge: true,
        // Collection Builder is a deliberate, manual, one-collection-at-a-time
        // action — every click should produce fresh copy, not the backend's
        // fingerprint-cached result from a previous run.
        force_regenerate: true,
      });
      setSeoResult(normalizeCollectionRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSeoSubmitting(false);
    }
  };

  const generateBanner = async () => {
    if (!selectedProduct) {
      setErrorMessage('Pick a hero product first');
      return;
    }
    if (!collectionLogicText.trim()) {
      setErrorMessage('Describe the collection positioning / logic first');
      return;
    }
    setBannerSubmitting(true);
    setErrorMessage(null);
    try {
      // Two independent runs, not one merged call: a copy-only run and a
      // banner-only run are each short enough to reliably finish inside a
      // single deploy window. The merged one-request cycle blocked the
      // worker for copy+banner combined (~15-20 min), which is exactly the
      // window a mid-flight deploy restart kills without ever writing a
      // final status — see the stale-run reaper fix (PR #195).
      const response = await agentsApi.createCollectionBuilderBanner({
        collection_gid: collectionGid,
        collection_title: collectionTitle,
        collection_handle: collectionHandle || undefined,
        product_title: selectedProduct.title,
        product_image_url: selectedProduct.image_url,
        product_description: selectedProduct.description || undefined,
        collection_logic_text: collectionLogicText.trim(),
        variant_count: 1,
      });
      setBannerRun(normalizeCreativePodRunForDisplay(response));
      setApplyResult(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBannerSubmitting(false);
    }
  };

  const regenerateBanner = async () => {
    if (!bannerRun?.runId) return;
    setBannerSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.regenerateCreativePodRun(bannerRun.runId, {
        hint: regenerateHint,
      });
      setBannerRun(normalizeCreativePodRunForDisplay(response));
      setRegenerateHint('');
      setApplyResult(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBannerSubmitting(false);
    }
  };

  const applyToCollection = async () => {
    if (!bannerRun?.runId || !collectionGid) return;
    setApplySubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.applyCollectionBuilderBanner({
        creative_pod_run_id: bannerRun.runId,
        collection_gid: collectionGid,
        variant_index: 1,
      });
      setApplyResult(response);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setApplySubmitting(false);
    }
  };

  const bannerImageUrls = collectHttpImageUrls(bannerRun?.bannerUrls);
  const evaluator = bannerRun?.decisionLogs?.evaluator;
  const seoWireframe = seoResult?.wireframe;
  const seoCopyPackage = seoResult?.copyPackage;
  const seoWireframeKeywords = ensureStringArray(seoWireframe?.keywords);
  const seoCopyParagraphs = ensureStringArray(seoCopyPackage?.paragraphs);

  const loadLogs = async (kind) => {
    setLogsKind(kind);
    setLogsLoading(true);
    setLogsError(null);
    setExpandedRunKey('');
    setExpandedDetail(null);
    try {
      const pipeline = LOG_PIPELINES.find((p) => p.key === kind);
      const response = await pipeline.list({ limit: 30 });
      setLogsItems(response.items || []);
    } catch (error) {
      setLogsError(error.message);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs(logsKind);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleExpandRun = async (runId, kind) => {
    const key = `${kind}:${runId}`;
    if (expandedRunKey === key) {
      setExpandedRunKey('');
      setExpandedDetail(null);
      return;
    }
    setExpandedRunKey(key);
    setExpandedDetail(null);
    setExpandedLoading(true);
    try {
      const pipeline = LOG_PIPELINES.find((p) => p.key === kind);
      const response = await pipeline.get(runId);
      setExpandedDetail(pipeline.normalize(response));
    } catch (error) {
      setLogsError(error.message);
    } finally {
      setExpandedLoading(false);
    }
  };

  const loadPricing = async () => {
    setPricingLoading(true);
    setPricingError(null);
    try {
      const rows = [];
      for (const pipeline of LOG_PIPELINES) {
        const listResp = await pipeline.list({ limit: 20 }).catch(() => ({ items: [] }));
        const details = await Promise.all(
          (listResp.items || []).map((row) =>
            pipeline.get(row.run_id ?? row.id).catch(() => null)
          )
        );
        details.filter(Boolean).forEach((run) => {
          const costs = pipeline.costsOf(run) || {};
          Object.entries(costs).forEach(([agentLabel, entry]) => {
            rows.push({
              runId: run.run_id ?? run.id,
              kind: pipeline.key,
              pipelineLabel: pipeline.label,
              agent: agentLabel,
              model: entry.model,
              inputTokens: entry.input_tokens,
              outputTokens: entry.output_tokens,
              costUsd: entry.cost_usd,
              calls: entry.calls,
            });
          });
        });
      }
      setPricingRows(rows);
    } catch (error) {
      setPricingError(error.message);
    } finally {
      setPricingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pricing' && canViewPricing) {
      loadPricing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const pricingTotalUsd = pricingRows.reduce((sum, row) => sum + (Number(row.costUsd) || 0), 0);

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Collection Builder</h1>
          <p className="screen-subtitle">
            Pick a collection and a hero product, generate SEO copy and a Creative Pod banner, then
            apply the banner to the collection's Shopify metafields.
          </p>
        </div>
      </div>
      <AgentsSubnav />

      <div className="agents-actions-row compact" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`agents-btn ${activeTab === 'builder' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('builder')}
        >
          Builder
        </button>
        <button
          type="button"
          className={`agents-btn ${activeTab === 'logs' ? 'primary' : 'secondary'}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
        {canViewPricing && (
          <button
            type="button"
            className={`agents-btn ${activeTab === 'pricing' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('pricing')}
          >
            Pricing
          </button>
        )}
      </div>

      {errorMessage && <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />}

      {activeTab === 'builder' && (
      <>
      <section className="agents-card">
        <h2 className="agents-section-title">1. Collection</h2>
        <div className="agents-form-stack">
          <label>
            Shopify collection
            {collectionsLoading ? (
              <LoadingSpinner message="Loading collections from Shopify…" />
            ) : (
              <select value={pickerValue} onChange={(event) => selectCollection(event.target.value)}>
                <option value="">Select a collection…</option>
                {shopifyCollections.map((row) => (
                  <option key={row.id || row.handle} value={row.handle}>
                    {row.title} — {row.handle}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>
      </section>

      {collectionHandle && (
        <section className="agents-card">
          <h2 className="agents-section-title">2. Hero product</h2>
          <p className="agents-collection-meta">Newest products first, 24 at a time.</p>
          {productsLoading ? (
            <LoadingSpinner message="Loading products…" />
          ) : products.length ? (
            <>
              <div
                className="agents-banner-grid"
                style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
              >
                {products.map((product) => {
                  const isSelected = selectedProductId === product.product_id;
                  return (
                    <button
                      type="button"
                      key={product.product_id}
                      className={`agents-banner-cell agents-product-pick${isSelected ? ' active' : ''}`}
                      onClick={() => setSelectedProductId(product.product_id)}
                      style={
                        isSelected
                          ? {
                              borderColor: '#8a6d3b',
                              borderWidth: '2px',
                              boxShadow: '0 0 0 2px rgba(138, 109, 59, 0.35)',
                            }
                          : undefined
                      }
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} loading="lazy" />
                      ) : (
                        <span className="agents-muted">No image</span>
                      )}
                      <span className="agents-collection-meta">
                        {isSelected ? '✓ ' : ''}
                        {product.title}
                      </span>
                    </button>
                  );
                })}
              </div>
              {productsPageInfo.has_next_page && (
                <div className="agents-actions-row" style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="agents-btn secondary"
                    onClick={loadMoreProducts}
                    disabled={productsLoadingMore}
                  >
                    {productsLoadingMore ? 'Loading more…' : 'Load more products'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="agents-muted">No products found in this collection.</p>
          )}
        </section>
      )}

      {selectedProduct && (
        <section className="agents-card">
          <h2 className="agents-section-title">3. Collection positioning / logic</h2>
          <div className="agents-form-stack">
            <label>
              What is this collection about, and why does the hero product represent it?
              {collectionLogicText && (
                <span className="agents-collection-meta">
                  Prefilled from this collection's automated Shopify rule — edit freely.
                </span>
              )}
              <textarea
                value={collectionLogicText}
                onChange={(event) => setCollectionLogicText(event.target.value)}
                placeholder="e.g. Everyday stackable gold jewelry for young professionals — emphasize versatility and gifting appeal."
                rows={3}
              />
            </label>
          </div>
        </section>
      )}

      {collectionHandle && (
        <section className="agents-card">
          <h2 className="agents-section-title">4. Collection copy / SEO</h2>
          <p className="agents-collection-meta">
            Generates SEO title/description and collection body copy only — no images. Writes
            straight to the collection (same as the old Collection Pages generator).
          </p>
          <div className="agents-actions-row">
            <button
              type="button"
              className="agents-btn secondary"
              onClick={generateSeo}
              disabled={seoSubmitting}
            >
              {seoSubmitting ? 'Generating copy…' : 'Generate copy/SEO'}
            </button>
          </div>
          {seoResult && (
            <>
              {seoResult.errorMessage && (
                <p className="agents-status-err">{seoResult.errorMessage}</p>
              )}
              {seoWireframe && (
                <div className="agents-copy-block">
                  <h3>SEO wireframe</h3>
                  {seoWireframe.seo_title && <p><strong>Title:</strong> {seoWireframe.seo_title}</p>}
                  {seoWireframe.seo_description && (
                    <p><strong>Meta:</strong> {seoWireframe.seo_description}</p>
                  )}
                  {seoWireframeKeywords.length ? (
                    <p><strong>Keywords:</strong> {seoWireframeKeywords.join(', ')}</p>
                  ) : null}
                </div>
              )}
              {seoCopyPackage && (
                <div className="agents-copy-block">
                  <h3>Collection copy</h3>
                  {seoCopyPackage.short_description && (
                    <p className="agents-lead">{seoCopyPackage.short_description}</p>
                  )}
                  {seoCopyParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {selectedProduct && collectionLogicText.trim() && (
        <section className="agents-card">
          <h2 className="agents-section-title">5. Banner</h2>
          <p className="agents-collection-meta">
            goal: Collection page traffic (MOFU) · platform: website · image model:
            google/gemini-3-pro-image · text model: anthropic/claude-opus-5
          </p>
          <div className="agents-actions-row">
            <button
              type="button"
              className="agents-btn primary"
              onClick={generateBanner}
              disabled={bannerSubmitting}
            >
              {bannerSubmitting ? 'Generating banner…' : 'Generate banner'}
            </button>
          </div>
          {bannerSubmitting && (
            <p className="agents-muted-inline">
              Runs strategist → copy → director → image gen → evaluator. Keep this tab open.
            </p>
          )}

          {bannerRun && (
            <>
              {bannerRun.errorMessage && (
                <p className="agents-status-err">{bannerRun.errorMessage}</p>
              )}
              {bannerImageUrls.length > 0 ? (
                <div className="agents-banner-grid">
                  {bannerImageUrls.map((imageUrl) => (
                    <a
                      key={imageUrl}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="agents-banner-cell"
                    >
                      <img src={imageUrl} alt="Collection banner" loading="lazy" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="agents-muted">No images yet.</p>
              )}

              {evaluator && (
                <div className="agents-copy-block">
                  <h3>Evaluator — quality gate</h3>
                  <p>
                    <strong>Composite score: {evaluator.composite_score}</strong> —{' '}
                    {evaluator.pass ? 'pass' : 'needs review'}
                  </p>
                  {(evaluator.variants || []).map((variant) => (
                    <div key={variant.variant_index}>
                      {Object.entries(variant.slots || {}).map(([slotName, verdict]) => (
                        <EvaluatorSlotBreakdown key={slotName} slotName={slotName} verdict={verdict} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="agents-form-stack agents-regen-stack">
                <label>
                  Regenerate hint
                  <input
                    value={regenerateHint}
                    onChange={(event) => setRegenerateHint(event.target.value)}
                    placeholder="e.g. darker background, sharper product, shorter headline"
                  />
                </label>
                <div className="agents-actions-row compact">
                  <button
                    type="button"
                    className="agents-btn secondary"
                    onClick={regenerateBanner}
                    disabled={bannerSubmitting}
                  >
                    {bannerSubmitting ? 'Regenerating…' : 'Regenerate banner'}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {bannerRun && bannerImageUrls.length > 0 && (
        <section className="agents-card">
          <h2 className="agents-section-title">6. Apply to collection</h2>
          <p className="agents-collection-meta">
            Writes the desktop/mobile banner URLs to this collection's Shopify metafields
            (namespace <code>minaki.collection_page</code>, same keys the old Collection Pages
            generator used).
          </p>
          <div className="agents-actions-row">
            <button
              type="button"
              className="agents-btn primary"
              onClick={applyToCollection}
              disabled={applySubmitting}
            >
              {applySubmitting ? 'Applying…' : 'Apply banner to collection'}
            </button>
          </div>
          {applyResult && (
            <p className={applyResult.success ? 'agents-validation' : 'agents-status-err'}>
              {applyResult.success
                ? `Applied: ${applyResult.written_metafields.join(', ')}`
                : `Failed: ${JSON.stringify(applyResult.userErrors)}`}
            </p>
          )}
        </section>
      )}
      </>
      )}

      {activeTab === 'logs' && (
        <section className="agents-card">
          <h2 className="agents-section-title">Run logs</h2>
          <p className="agents-collection-meta">
            Full history of every run across every agent pod that stores one, with complete
            output per run — not just the latest one from this session. (Product Writer, Keywords,
            and Naming Teams don't persist runs, so they have nothing to show here.)
          </p>
          <div className="agents-actions-row compact">
            {LOG_PIPELINES.map((pipeline) => (
              <button
                key={pipeline.key}
                type="button"
                className={`agents-btn ${logsKind === pipeline.key ? 'primary' : 'secondary'}`}
                onClick={() => loadLogs(pipeline.key)}
                disabled={logsLoading}
              >
                {pipeline.label}
              </button>
            ))}
          </div>

          {logsError && <p className="agents-status-err">{logsError}</p>}
          {logsLoading ? (
            <LoadingSpinner message="Loading runs…" />
          ) : logsItems.length === 0 ? (
            <p className="agents-muted">No runs found.</p>
          ) : (
            <div className="agents-form-stack">
              {logsItems.map((row) => {
                const runId = row.run_id ?? row.id;
                const key = `${logsKind}:${runId}`;
                const isExpanded = expandedRunKey === key;
                return (
                  <div key={key} className="agents-copy-block">
                    <button
                      type="button"
                      className="agents-btn secondary"
                      onClick={() => toggleExpandRun(runId, logsKind)}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      {isExpanded ? '▾' : '▸'} #{runId} — {row.status || 'unknown'} —{' '}
                      {LOG_PIPELINES.find((p) => p.key === logsKind).rowLabel(row)}
                      {row.created_at ? ` — ${row.created_at}` : ''}
                    </button>

                    {isExpanded && (
                      <div style={{ marginTop: '0.75rem' }}>
                        {expandedLoading ? (
                          <LoadingSpinner message="Loading full run output…" />
                        ) : expandedDetail ? (
                          <>
                            {logsKind === 'copy' && (
                              <>
                                {expandedDetail.wireframe && (
                                  <p>
                                    <strong>SEO title:</strong>{' '}
                                    {expandedDetail.wireframe.seo_title || '—'}
                                    <br />
                                    <strong>SEO description:</strong>{' '}
                                    {expandedDetail.wireframe.seo_description || '—'}
                                  </p>
                                )}
                                {expandedDetail.copyPackage?.short_description && (
                                  <p className="agents-lead">
                                    {expandedDetail.copyPackage.short_description}
                                  </p>
                                )}
                                {ensureStringArray(expandedDetail.copyPackage?.paragraphs).map(
                                  (paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                  )
                                )}
                              </>
                            )}
                            {logsKind === 'banner' && (
                              <>
                                {collectHttpImageUrls(expandedDetail.bannerUrls).length > 0 && (
                                  <div className="agents-banner-grid">
                                    {collectHttpImageUrls(expandedDetail.bannerUrls).map((url) => (
                                      <a
                                        key={url}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="agents-banner-cell"
                                      >
                                        <img src={url} alt="Logged banner" loading="lazy" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {expandedDetail.decisionLogs?.evaluator && (
                                  <div style={{ marginTop: '0.5rem' }}>
                                    <strong>
                                      Evaluator score:{' '}
                                      {expandedDetail.decisionLogs.evaluator.composite_score}
                                    </strong>{' '}
                                    — {expandedDetail.decisionLogs.evaluator.pass ? 'pass' : 'needs review'}
                                  </div>
                                )}
                              </>
                            )}
                            <details style={{ marginTop: '0.75rem' }}>
                              <summary className="agents-muted-inline">Entire raw output (JSON)</summary>
                              <pre
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  maxHeight: '480px',
                                  overflow: 'auto',
                                  fontSize: '0.75rem',
                                  fontFamily:
                                    'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                                  background: 'rgba(0,0,0,0.03)',
                                  border: '1px solid rgba(0,0,0,0.08)',
                                  borderRadius: '6px',
                                  padding: '0.75rem',
                                  marginTop: '0.5rem',
                                }}
                              >
                                {JSON.stringify(expandedDetail, null, 2)}
                              </pre>
                            </details>
                          </>
                        ) : (
                          <p className="agents-muted">No detail loaded.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'pricing' && canViewPricing && (
        <section className="agents-card">
          <h2 className="agents-section-title">Pricing</h2>
          <p className="agents-collection-meta">
            Estimated spend per agent call across recent runs (admin/manager only — the API omits
            this data entirely for other roles, this isn't just a hidden tab).
          </p>
          <div className="agents-actions-row">
            <button
              type="button"
              className="agents-btn secondary"
              onClick={loadPricing}
              disabled={pricingLoading}
            >
              {pricingLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {pricingError && <p className="agents-status-err">{pricingError}</p>}
          {pricingLoading ? (
            <LoadingSpinner message="Loading pricing across recent runs…" />
          ) : pricingRows.length === 0 ? (
            <p className="agents-muted">No cost data recorded on recent runs yet.</p>
          ) : (
            <>
              <p>
                <strong>Total (last {pricingRows.length} agent calls shown): ${pricingTotalUsd.toFixed(4)}</strong>
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="agents-table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Pipeline</th>
                      <th>Agent</th>
                      <th>Model</th>
                      <th>Input tokens</th>
                      <th>Output tokens</th>
                      <th>Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRows.map((row, index) => (
                      <tr key={`${row.kind}-${row.runId}-${row.agent}-${index}`}>
                        <td>#{row.runId}</td>
                        <td>{row.pipelineLabel}</td>
                        <td>{row.agent}</td>
                        <td>{row.model || '—'}</td>
                        <td>{row.inputTokens ?? '—'}</td>
                        <td>{row.outputTokens ?? '—'}</td>
                        <td>${Number(row.costUsd || 0).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};
