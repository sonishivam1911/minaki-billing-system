import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner, ErrorMessage } from '../../components';
import {
  collectHttpImageUrls,
  ensureStringArray,
  normalizeCollectionRunForDisplay,
} from './collectionPageRun';

const RECENT_RUNS_LIMIT = 15;
const CUSTOM_HANDLE_VALUE = '__custom__';

export const CollectionPage = () => {
  const [shopifyCollections, setShopifyCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [pickerValue, setPickerValue] = useState('');
  const [collectionHandle, setCollectionHandle] = useState('');
  const [collectionGid, setCollectionGid] = useState('');
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [skipBannerImages, setSkipBannerImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const [ragPreview, setRagPreview] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [runsSchemaReady, setRunsSchemaReady] = useState(true);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);

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

  const loadRecentRuns = async (handleFilter) => {
    setRecentRunsLoading(true);
    try {
      const response = await agentsApi.listCollectionRuns({
        collection_handle: handleFilter || undefined,
        limit: RECENT_RUNS_LIMIT,
      });
      setRecentRuns(response.items || []);
      setRecentRunsTotal(response.total || 0);
      setRunsSchemaReady(response.schema_ready !== false);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRecentRunsLoading(false);
    }
  };

  useEffect(() => {
    loadShopifyCollections();
    loadRecentRuns();
  }, []);

  const applyCollectionSelection = (value) => {
    setPickerValue(value);
    if (!value) {
      setCollectionHandle('');
      setCollectionGid('');
      loadRecentRuns();
      return;
    }
    if (value === CUSTOM_HANDLE_VALUE) {
      setCollectionHandle('');
      setCollectionGid('');
      loadRecentRuns();
      return;
    }
    const picked = shopifyCollections.find((row) => row.handle === value);
    const handle = picked?.handle || value;
    setCollectionHandle(handle);
    setCollectionGid(picked?.id || '');
    loadRecentRuns(handle);
  };

  const onCustomHandleChange = (event) => {
    const handle = event.target.value;
    setCollectionHandle(handle);
    setCollectionGid('');
  };

  const onCustomHandleBlur = () => {
    const trimmedHandle = collectionHandle.trim();
    if (trimmedHandle) {
      loadRecentRuns(trimmedHandle);
    }
  };

  const requireCollectionTarget = () => {
    const trimmedHandle = collectionHandle.trim();
    if (!trimmedHandle && !collectionGid) {
      setErrorMessage('Choose a Shopify collection or enter a handle');
      return null;
    }
    return {
      collection_handle: trimmedHandle || undefined,
      collection_gid: collectionGid || undefined,
    };
  };

  const runRagPreview = async () => {
    const target = requireCollectionTarget();
    if (!target) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.collectionRagPreview({
        ...target,
        active_filters: {},
      });
      setRagPreview(response);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const runCollectionGeneration = async () => {
    const target = requireCollectionTarget();
    if (!target) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setGenerationResult(null);
    try {
      const response = await agentsApi.generateCollectionPage({
        ...target,
        active_filters: {},
        force_regenerate: forceRegenerate,
        skip_image_generation: skipBannerImages,
        skip_image_judge: skipBannerImages,
      });
      if (response.success === false) {
        setErrorMessage(response.error || response.error_message || 'Generation failed');
        setGenerationResult(normalizeCollectionRunForDisplay(response));
      } else {
        setGenerationResult(normalizeCollectionRunForDisplay(response));
        await loadRecentRuns(target.collection_handle);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewRunDetails = async (runId) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const runRow = await agentsApi.getCollectionRun(runId);
      setGenerationResult(
        normalizeCollectionRunForDisplay({ ...runRow, success: runRow.status === 'completed' }),
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bannerImageUrls = collectHttpImageUrls(generationResult?.bannerUrls);
  const copyPackage = generationResult?.copyPackage;
  const wireframe = generationResult?.wireframe;
  const wireframeKeywords = ensureStringArray(wireframe?.keywords);
  const copyParagraphs = ensureStringArray(copyPackage?.paragraphs);
  const selectedCollection = shopifyCollections.find((row) => row.handle === collectionHandle);
  const usingCustomHandle = pickerValue === CUSTOM_HANDLE_VALUE;

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Collection Pages</h1>
          <p className="screen-subtitle">
            Generate collection copy, SEO wireframe, and banner images via the Collection Page Pod
          </p>
        </div>
      </div>
      <AgentsSubnav />
      {errorMessage && <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />}

      {!runsSchemaReady && (
        <div className="agents-card agents-alert">
          <p>
            Collection page runs table is missing. Run{' '}
            <code>homelab-contabo/scripts/migrations/minaki_agents_collection_page_pod.sql</code> on
            Postgres.
          </p>
        </div>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">Generate collection page</h2>

        <div className="agents-form-stack">
          <label>
            Shopify collection
            {collectionsLoading ? (
              <LoadingSpinner message="Loading collections from Shopify…" />
            ) : (
              <select
                value={pickerValue}
                onChange={(event) => applyCollectionSelection(event.target.value)}
              >
                <option value="">Select a collection…</option>
                {shopifyCollections.map((row) => (
                  <option key={row.id || row.handle} value={row.handle}>
                    {row.title} — {row.handle}
                  </option>
                ))}
                <option value={CUSTOM_HANDLE_VALUE}>Enter handle manually…</option>
              </select>
            )}
            {selectedCollection && !usingCustomHandle && (
              <span className="agents-collection-meta">
                Handle: <code>{selectedCollection.handle}</code>
                {selectedCollection.id ? ` · GID stored for API` : ''}
              </span>
            )}
          </label>

          {(usingCustomHandle || (!pickerValue && collectionHandle)) && (
            <label>
              Collection handle
              <input
                value={collectionHandle}
                onChange={onCustomHandleChange}
                onBlur={onCustomHandleBlur}
                placeholder="e.g. crystal-earrings"
              />
              <span className="agents-collection-meta">
                Use the URL slug from your Shopify collection page.
              </span>
            </label>
          )}

          <div className="agents-check-group">
            <label>
              <input
                type="checkbox"
                checked={forceRegenerate}
                onChange={(event) => setForceRegenerate(event.target.checked)}
              />
              Force regenerate (ignore cache)
            </label>
            <label>
              <input
                type="checkbox"
                checked={skipBannerImages}
                onChange={(event) => setSkipBannerImages(event.target.checked)}
              />
              Skip banner image generation
            </label>
          </div>

          <div className="agents-actions-row">
            <button type="button" className="agents-btn secondary" onClick={runRagPreview} disabled={isSubmitting}>
              Preview RAG context
            </button>
            <button type="button" className="agents-btn primary" onClick={runCollectionGeneration} disabled={isSubmitting}>
              {isSubmitting ? 'Running pod… (may take several minutes)' : 'Generate page'}
            </button>
          </div>
        </div>

        {isSubmitting && (
          <p className="agents-muted-inline">
            The pod runs copy, optional images, and QC in one request. Keep this tab open.
          </p>
        )}
      </section>

      {ragPreview && (
        <section className="agents-card">
          <h2 className="agents-section-title">RAG preview</h2>
          <p className="agents-preview-skus">Query: {ragPreview.retrieval_query_text}</p>
          <p className="agents-muted">
            {ragPreview.keywords?.length || 0} keywords, {ragPreview.faqs?.length || 0} FAQs retrieved
          </p>
        </section>
      )}

      {generationResult && (
        <section className="agents-card">
          <h2 className="agents-section-title">
            Result {generationResult.runId ? `#${generationResult.runId}` : ''}
            {generationResult.cached ? ' (cached)' : ''}
          </h2>
          {generationResult.errorMessage && (
            <p className="agents-status-err">{generationResult.errorMessage}</p>
          )}
          {generationResult.bannerQualityStatus && (
            <p className="agents-validation">Banner QC: {generationResult.bannerQualityStatus}</p>
          )}

          {wireframe && (
            <div className="agents-copy-block">
              <h3>SEO wireframe</h3>
              {wireframe.seo_title && <p><strong>Title:</strong> {wireframe.seo_title}</p>}
              {wireframe.seo_description && (
                <p><strong>Meta:</strong> {wireframe.seo_description}</p>
              )}
              {wireframeKeywords.length ? (
                <p><strong>Keywords:</strong> {wireframeKeywords.join(', ')}</p>
              ) : null}
            </div>
          )}

          {copyPackage && (
            <div className="agents-copy-block">
              <h3>Collection copy</h3>
              {copyPackage.short_description && (
                <p className="agents-lead">{copyPackage.short_description}</p>
              )}
              {copyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {bannerImageUrls.length > 0 && (
            <div className="agents-copy-block">
              <h3>Banner images</h3>
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
            </div>
          )}

          {generationResult.shopifyMetafieldWrite && (
            <p className="agents-muted">
              Shopify metafield write: {JSON.stringify(generationResult.shopifyMetafieldWrite)}
            </p>
          )}
        </section>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">Recent runs</h2>
        <p className="agents-collection-meta">
          {collectionHandle.trim()
            ? `Filtered to handle: ${collectionHandle.trim()}`
            : 'Showing all collection runs — pick a collection above to filter'}
        </p>
        <div className="agents-actions-row compact">
          <button
            type="button"
            className="agents-btn secondary"
            onClick={() => loadRecentRuns(collectionHandle.trim() || undefined)}
            disabled={recentRunsLoading}
          >
            Refresh history
          </button>
        </div>
        {recentRunsLoading ? (
          <LoadingSpinner message="Loading runs…" />
        ) : (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">{recentRunsTotal} total runs</p>
            <table className="agents-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Handle</th>
                  <th>Status</th>
                  <th>QC</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((runRow) => (
                  <tr key={runRow.id}>
                    <td>{runRow.id}</td>
                    <td>{runRow.collection_handle || '—'}</td>
                    <td>{runRow.status}</td>
                    <td>{runRow.banner_qc_status || '—'}</td>
                    <td>{runRow.created_at ? String(runRow.created_at).slice(0, 19) : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="agents-link-btn"
                        onClick={() => viewRunDetails(runRow.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
