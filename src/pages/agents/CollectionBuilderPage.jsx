import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner, ErrorMessage } from '../../components';
import { collectHttpImageUrls, normalizeCreativePodRunForDisplay } from './creativePodRun';
import { ensureStringArray, normalizeCollectionRunForDisplay } from './collectionPageRun';

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
  const [shopifyCollections, setShopifyCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [pickerValue, setPickerValue] = useState('');
  const [collectionHandle, setCollectionHandle] = useState('');
  const [collectionGid, setCollectionGid] = useState('');
  const [collectionTitle, setCollectionTitle] = useState('');

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
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

    setProductsLoading(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.listCollectionBuilderProducts({
        collectionHandle: handle,
        collectionGid: picked?.id,
      });
      setProducts(response.products || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setProductsLoading(false);
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
      {errorMessage && <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />}

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
          {productsLoading ? (
            <LoadingSpinner message="Loading products…" />
          ) : products.length ? (
            <div className="agents-banner-grid">
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
    </div>
  );
};
