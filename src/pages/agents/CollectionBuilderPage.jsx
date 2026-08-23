import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsModeSelect } from '../../components/agents/AgentsModeSelect';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { collectHttpImageUrls, normalizeCreativePodRunForDisplay } from './creativePodRun';
import { ensureStringArray, normalizeCollectionRunForDisplay } from './collectionPageRun';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { cn } from '../../lib/utils';

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

// Radix Select items can't have an empty-string value — these sentinels
// stand in for "auto-classify" / "lane's default scene" and get mapped back
// to '' (the real, meaningful state value) in the change handlers below.
const AUTO_LANE_VALUE = '__auto__';
const DEFAULT_SCENE_VALUE = '__default__';

// Gemstone badge family (see design direction doc) mapped from whatever
// label text Creative Pod's brand-lane API returns — Bridal/Fine/Demi Fine
// aren't fixed enum values on the frontend, so this matches on label text
// rather than a hardcoded value list.
const laneBadgeVariant = (label = '') => {
  const normalized = String(label).toLowerCase();
  if (normalized.includes('bridal')) return 'ruby';
  if (normalized.includes('demi')) return 'citrine';
  if (normalized.includes('fine')) return 'emerald';
  return 'sapphire';
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
    <div className="space-y-1.5 border-t border-[var(--color-border)] pt-3 first:border-t-0 first:pt-0">
      <p className="text-sm">
        <strong className="font-semibold">{slotName}:</strong>{' '}
        {verdict.pass ? 'pass' : 'needs review'} — score {verdict.score}
        {verdict.hard_gate_failed ? ' (hard gate failed)' : ''}
      </p>
      {breakdown.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {breakdown.map((entry) => (
            <li key={entry.axis}>
              <strong className="font-semibold">{entry.axis}:</strong>{' '}
              {entry.score !== undefined ? `${entry.score}/100 — ` : `${entry.status} — `}
              {entry.detail}
            </li>
          ))}
        </ul>
      ) : (
        (verdict.reasons || []).length > 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)]">{verdict.reasons.join('; ')}</p>
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
  const [collectionSearch, setCollectionSearch] = useState('');
  const [pickerValue, setPickerValue] = useState('');
  const [collectionHandle, setCollectionHandle] = useState('');
  const [collectionGid, setCollectionGid] = useState('');
  const [collectionTitle, setCollectionTitle] = useState('');

  const PRODUCTS_PAGE_SIZE = 24;
  const COLLECTION_PAGE_SIZE = 30;
  const COLLECTION_SEARCH_DEBOUNCE_MS = 300;

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

  // Vertical/scene override — omitting both preserves the old auto-classify
  // behavior (which almost always lands on Demi Fine); pre-filled from the
  // saved Agent Settings default (see AgentSettingsPage.jsx), overridable
  // per run via these pickers.
  const [brandLanes, setBrandLanes] = useState([]);
  const [brandLane, setBrandLane] = useState('');
  const [visualSubVariants, setVisualSubVariants] = useState([]);
  const [visualSubVariant, setVisualSubVariant] = useState('');

  // Combined "Generate & Publish" action — chains copy -> banner -> apply.
  // autoPhase drives the button label / progress line; '' means idle.
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoPhase, setAutoPhase] = useState('');

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

  const loadShopifyCollections = async (search = '') => {
    setCollectionsLoading(true);
    try {
      const response = await agentsApi.listShopifyCollections({
        first: COLLECTION_PAGE_SIZE,
        q: search || undefined,
      });
      setShopifyCollections(response.collections || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    const delay = collectionSearch ? COLLECTION_SEARCH_DEBOUNCE_MS : 0;
    const timer = setTimeout(() => {
      loadShopifyCollections(collectionSearch.trim());
    }, delay);
    return () => clearTimeout(timer);
  }, [collectionSearch]);

  useEffect(() => {
    const loadBrandDefaults = async () => {
      try {
        const [brandLanesResponse, settingsResponse] = await Promise.all([
          agentsApi.listCreativePodBrandLanes(),
          agentsApi.getAgentSettings('collection_builder'),
        ]);
        setBrandLanes(brandLanesResponse.brand_lanes || []);
        const defaultLane = settingsResponse.config?.brand_lane || '';
        setBrandLane(defaultLane);
        setVisualSubVariant(settingsResponse.config?.visual_sub_variant || '');
        if (defaultLane) {
          const variantsResponse = await agentsApi.listCreativePodVisualVariants(defaultLane);
          setVisualSubVariants(variantsResponse.visual_sub_variants || []);
        }
      } catch {
        // Non-fatal — pickers just fall back to "auto-classify", same as
        // before this feature existed.
      }
    };
    loadBrandDefaults();
  }, []);

  const handleBrandLaneChange = async (nextLane) => {
    setBrandLane(nextLane);
    setVisualSubVariant('');
    if (!nextLane) {
      setVisualSubVariants([]);
      return;
    }
    try {
      const response = await agentsApi.listCreativePodVisualVariants(nextLane);
      setVisualSubVariants(response.visual_sub_variants || []);
    } catch {
      setVisualSubVariants([]);
    }
  };

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

  const selectCollection = async (picked) => {
    const handle = picked?.handle || '';
    setPickerValue(handle);
    resetDownstreamState();
    if (!handle) {
      setCollectionHandle('');
      setCollectionGid('');
      setCollectionTitle('');
      setCollectionLogicText('');
      return;
    }
    setCollectionHandle(handle);
    setCollectionGid(picked?.id || '');
    setCollectionTitle(picked?.title || handle);
    setCollectionLogicText(formatCollectionRuleSet(picked?.rule_set));

    setProductsLoading(true);
    setErrorMessage(null);
    try {
      const [productsResponse, detailResponse] = await Promise.all([
        agentsApi.listCollectionBuilderProducts({
          collectionHandle: handle,
          collectionGid: picked?.id,
          limit: PRODUCTS_PAGE_SIZE,
        }),
        picked?.rule_set
          ? Promise.resolve({ collection: picked })
          : agentsApi.getShopifyCollectionByHandle(handle).catch(() => ({ collection: picked })),
      ]);
      setProducts(productsResponse.products || []);
      setProductsPageInfo(
        productsResponse.page_info || { has_next_page: false, end_cursor: null }
      );
      const detailed = detailResponse?.collection || picked;
      if (detailed?.id) setCollectionGid(detailed.id);
      if (detailed?.title) setCollectionTitle(detailed.title);
      setCollectionLogicText(formatCollectionRuleSet(detailed?.rule_set));
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

  // Every generate/regenerate endpoint now only does fast prep + enqueue
  // (real background worker picks up the actual pipeline — see
  // core/job_queue.py on the backend) and returns almost immediately with
  // status: "running" and no result fields yet. This polls the matching
  // GET .../runs/{id} endpoint until the row leaves "running", so callers
  // get the real, finished result instead of the fast placeholder response.
  // ~15s interval, ~12 min ceiling (real generations run well under that).
  const pollRunUntilDone = async (getFn, runId, normalizeFn) => {
    const intervalMs = 15000;
    const maxAttempts = 48;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const row = await getFn(runId);
      const normalized = normalizeFn(row);
      if (normalized.status !== 'running') {
        return normalized;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(
      `Run #${runId} is still going after 12 minutes — check the Logs tab, it'll finish in the background.`
    );
  };

  const generateSeo = async () => {
    setSeoSubmitting(true);
    setErrorMessage(null);
    try {
      const started = await agentsApi.generateCollectionPage({
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
      const runId = started.run_id;
      const finalResult = runId
        ? await pollRunUntilDone(agentsApi.getCollectionRun, runId, normalizeCollectionRunForDisplay)
        : normalizeCollectionRunForDisplay(started);
      setSeoResult(finalResult);
      if (finalResult.status === 'failed') {
        throw new Error(finalResult.errorMessage || 'Copy/SEO generation failed');
      }
      return finalResult;
    } catch (error) {
      setErrorMessage(error.message);
      throw error;
    } finally {
      setSeoSubmitting(false);
    }
  };

  const generateBanner = async () => {
    if (!selectedProduct) {
      setErrorMessage('Pick a hero product first');
      throw new Error('Pick a hero product first');
    }
    if (!collectionLogicText.trim()) {
      setErrorMessage('Describe the collection positioning / logic first');
      throw new Error('Describe the collection positioning / logic first');
    }
    setBannerSubmitting(true);
    setErrorMessage(null);
    try {
      // Fast prep + enqueue now (see pollRunUntilDone above) — the RQ
      // background worker runs the actual strategist/copywriter/director/
      // image-gen/evaluator pipeline, so this is no longer racing a deploy
      // restart the way the old synchronous 15-20 min call did.
      const started = await agentsApi.createCollectionBuilderBanner({
        collection_gid: collectionGid,
        collection_title: collectionTitle,
        collection_handle: collectionHandle || undefined,
        product_title: selectedProduct.title,
        product_image_url: selectedProduct.image_url,
        product_description: selectedProduct.description || undefined,
        collection_logic_text: collectionLogicText.trim(),
        variant_count: 1,
        brand_lane: brandLane || undefined,
        visual_sub_variant: visualSubVariant || undefined,
      });
      const runId = started.run_id;
      const finalResult = runId
        ? await pollRunUntilDone(agentsApi.getCreativePodRun, runId, normalizeCreativePodRunForDisplay)
        : normalizeCreativePodRunForDisplay(started);
      setBannerRun(finalResult);
      setApplyResult(null);
      if (finalResult.status === 'failed') {
        throw new Error(finalResult.errorMessage || 'Banner generation failed');
      }
      return finalResult;
    } catch (error) {
      setErrorMessage(error.message);
      throw error;
    } finally {
      setBannerSubmitting(false);
    }
  };

  const regenerateBanner = async () => {
    if (!bannerRun?.runId) return;
    setBannerSubmitting(true);
    setErrorMessage(null);
    try {
      // regenerate_banners() is fast-prep + enqueue too now, same run_id —
      // poll that same id until the new image is actually done.
      await agentsApi.regenerateCreativePodRun(bannerRun.runId, {
        hint: regenerateHint,
      });
      const finalResult = await pollRunUntilDone(
        agentsApi.getCreativePodRun,
        bannerRun.runId,
        normalizeCreativePodRunForDisplay
      );
      setBannerRun(finalResult);
      setRegenerateHint('');
      setApplyResult(null);
      if (finalResult.status === 'failed') {
        setErrorMessage(finalResult.errorMessage || 'Banner regeneration failed');
      }
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
      // Metafield write only — single GraphQL mutation, genuinely fast,
      // never went through the RQ split, no polling needed.
      const response = await agentsApi.applyCollectionBuilderBanner({
        creative_pod_run_id: bannerRun.runId,
        collection_gid: collectionGid,
        variant_index: 1,
      });
      setApplyResult(response);
      if (!response.success) {
        throw new Error(`Publish to Shopify failed: ${JSON.stringify(response.userErrors)}`);
      }
      return response;
    } catch (error) {
      setErrorMessage(error.message);
      throw error;
    } finally {
      setApplySubmitting(false);
    }
  };

  // One click: copy/SEO (already writes straight to the collection as part
  // of its own generation) -> banner -> publish the banner to the same
  // collection's Shopify metafields. Stops and surfaces a clear error at
  // whichever step fails rather than silently skipping ahead — a failed
  // banner does not attempt to publish, a failed publish still leaves the
  // real banner run visible/regenerable above.
  //
  // Calls generateBanner()'s *returned* run directly (not the bannerRun
  // state var) for the apply step — state set inside generateSeo/
  // generateBanner isn't guaranteed to have re-rendered yet by the time
  // this function's next line runs, so reading state here would risk a
  // stale closure.
  const generateAndPublish = async () => {
    if (!selectedProduct) {
      setErrorMessage('Pick a hero product first');
      return;
    }
    if (!collectionLogicText.trim()) {
      setErrorMessage('Describe the collection positioning / logic first');
      return;
    }
    setAutoRunning(true);
    setErrorMessage(null);
    try {
      setAutoPhase('copy');
      await generateSeo();

      setAutoPhase('banner');
      const banner = await generateBanner();

      setAutoPhase('publish');
      setApplySubmitting(true);
      let applyResponse;
      try {
        applyResponse = await agentsApi.applyCollectionBuilderBanner({
          creative_pod_run_id: banner.runId,
          collection_gid: collectionGid,
          variant_index: 1,
        });
      } finally {
        setApplySubmitting(false);
      }
      setApplyResult(applyResponse);
      if (!applyResponse.success) {
        throw new Error(`Publish to Shopify failed: ${JSON.stringify(applyResponse.userErrors)}`);
      }

      setAutoPhase('done');
    } catch (error) {
      setErrorMessage(error.message);
      setAutoPhase('error');
    } finally {
      setAutoRunning(false);
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
    <div className="minaki-ui mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Collection Builder</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Pick a collection and a hero product, generate SEO copy and a Creative Pod banner, then
          apply the banner to the collection's Shopify metafields.
        </p>
      </header>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.collections} />

      <AgentsModeSelect
        label="Section"
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: 'builder', label: 'Builder' },
          { value: 'logs', label: 'Logs' },
          ...(canViewPricing ? [{ value: 'pricing', label: 'Pricing' }] : []),
        ]}
      />

      {errorMessage && (
        <Alert variant="destructive" title="Something went wrong" className="mb-4">
          {errorMessage}{' '}
          <Button variant="link" size="sm" className="h-auto p-0 text-[var(--color-destructive)]" onClick={() => setErrorMessage(null)}>
            Dismiss
          </Button>
        </Alert>
      )}

      {activeTab === 'builder' && (
      <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="collection-search">Shopify collection</Label>
            <Input
              id="collection-search"
              value={collectionSearch}
              onChange={(event) => setCollectionSearch(event.target.value)}
              placeholder="Type a collection name…"
              autoComplete="off"
            />
          </div>
          {collectionTitle && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Selected: <span className="font-medium text-[var(--color-foreground)]">{collectionTitle}</span>{' '}
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => selectCollection(null)}>
                Clear
              </Button>
            </p>
          )}
          {collectionsLoading ? (
            <LoadingSpinner message="Loading collections…" />
          ) : shopifyCollections.length > 0 ? (
            <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--color-border)]">
              {shopifyCollections.map((row) => {
                const isActive = pickerValue === row.handle;
                return (
                  <button
                    type="button"
                    key={row.handle}
                    onClick={() => selectCollection(row)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-[var(--color-muted)]',
                      isActive && 'bg-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/60'
                    )}
                  >
                    <span>{row.title || row.handle}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{row.handle}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            collectionSearch && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No collections match "{collectionSearch}".
              </p>
            )
          )}
        </CardContent>
      </Card>

      {collectionHandle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Hero product</CardTitle>
            <CardDescription>Newest products first, 24 at a time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {productsLoading ? (
              <LoadingSpinner message="Loading products…" />
            ) : products.length ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {products.map((product) => {
                    const isSelected = selectedProductId === product.product_id;
                    return (
                      <Card
                        key={product.product_id}
                        showcase
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedProductId(product.product_id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedProductId(product.product_id);
                          }
                        }}
                        className={cn(
                          'cursor-pointer overflow-hidden p-0',
                          isSelected && 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/50'
                        )}
                      >
                        <div className="aspect-square w-full overflow-hidden bg-[var(--color-muted)]">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
                              No image
                            </div>
                          )}
                        </div>
                        <p className="line-clamp-2 px-2 py-1.5 text-xs text-[var(--color-muted-foreground)]">
                          {isSelected && <span className="text-[var(--color-primary)]">✓ </span>}
                          {product.title}
                        </p>
                      </Card>
                    );
                  })}
                </div>
                {productsPageInfo.has_next_page && (
                  <div className="flex justify-center">
                    <Button variant="secondary" onClick={loadMoreProducts} disabled={productsLoadingMore}>
                      {productsLoadingMore ? 'Loading more…' : 'Load more products'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No products found in this collection.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Collection positioning / logic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="collection-logic">
                What is this collection about, and why does the hero product represent it?
              </Label>
              {collectionLogicText && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Prefilled from this collection's automated Shopify rule — edit freely.
                </p>
              )}
              <Textarea
                id="collection-logic"
                value={collectionLogicText}
                onChange={(event) => setCollectionLogicText(event.target.value)}
                placeholder="e.g. Everyday stackable gold jewelry for young professionals — emphasize versatility and gifting appeal."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Vertical</Label>
                <Select
                  value={brandLane || AUTO_LANE_VALUE}
                  onValueChange={(value) =>
                    handleBrandLaneChange(value === AUTO_LANE_VALUE ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_LANE_VALUE}>Auto-classify from brief (usually Demi Fine)</SelectItem>
                    {brandLanes.map((row) => (
                      <SelectItem key={row.value} value={row.value}>
                        {row.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {brandLane && (
                  <Badge variant={laneBadgeVariant(brandLanes.find((row) => row.value === brandLane)?.label)}>
                    {brandLanes.find((row) => row.value === brandLane)?.label || brandLane}
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Scene / mood</Label>
                <Select
                  value={visualSubVariant || DEFAULT_SCENE_VALUE}
                  onValueChange={(value) =>
                    setVisualSubVariant(value === DEFAULT_SCENE_VALUE ? '' : value)
                  }
                  disabled={!brandLane}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_SCENE_VALUE}>
                      {brandLane ? "Lane's default scene" : 'Pick a vertical first'}
                    </SelectItem>
                    {visualSubVariants.map((row) => (
                      <SelectItem key={row.value} value={row.value}>
                        {row.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap items-start gap-2">
            <Button
              onClick={generateAndPublish}
              disabled={autoRunning || !collectionLogicText.trim()}
            >
              {autoRunning
                ? {
                    copy: 'Generating copy…',
                    banner: 'Generating banner…',
                    publish: 'Publishing to Shopify…',
                  }[autoPhase] || 'Working…'
                : 'Generate copy + banner & publish'}
            </Button>
            {autoRunning && (
              <p className="w-full text-sm text-[var(--color-muted-foreground)]">
                Runs copy/SEO, then the full banner pipeline (strategist → copy → director → image
                gen → evaluator), then writes the banner to this collection's Shopify metafields —
                in that order, stops and shows the error if any step fails. Keep this tab open, or
                check the Logs tab later; the run keeps going in the background either way.
              </p>
            )}
            {autoPhase === 'done' && !autoRunning && (
              <p className="w-full text-sm font-medium text-[var(--color-success)]">
                Copy, banner, and Shopify publish all completed.
              </p>
            )}
          </CardFooter>
        </Card>
      )}

      {collectionHandle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Collection copy / SEO</CardTitle>
            <CardDescription>
              Individual steps below — use these to review or fix one piece (e.g. regenerate just
              the banner with a hint) without re-running everything above. Generates SEO
              title/description and collection body copy only — no images. Writes straight to the
              collection (same as the old Collection Pages generator).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" onClick={generateSeo} disabled={seoSubmitting}>
              {seoSubmitting ? 'Generating copy…' : 'Generate copy/SEO'}
            </Button>
            {seoResult && (
              <div className="space-y-4">
                {seoResult.errorMessage && (
                  <Alert variant="destructive">{seoResult.errorMessage}</Alert>
                )}
                {seoWireframe && (
                  <div className="space-y-1.5 rounded-md border border-[var(--color-border)] p-4 text-sm">
                    <h3 className="font-display text-base font-semibold">SEO wireframe</h3>
                    {seoWireframe.seo_title && (
                      <p><strong className="font-semibold">Title:</strong> {seoWireframe.seo_title}</p>
                    )}
                    {seoWireframe.seo_description && (
                      <p><strong className="font-semibold">Meta:</strong> {seoWireframe.seo_description}</p>
                    )}
                    {seoWireframeKeywords.length ? (
                      <p><strong className="font-semibold">Keywords:</strong> {seoWireframeKeywords.join(', ')}</p>
                    ) : null}
                  </div>
                )}
                {seoCopyPackage && (
                  <div className="space-y-2 rounded-md border border-[var(--color-border)] p-4 text-sm">
                    <h3 className="font-display text-base font-semibold">Collection copy</h3>
                    {seoCopyPackage.short_description && (
                      <p className="font-medium">{seoCopyPackage.short_description}</p>
                    )}
                    {seoCopyParagraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProduct && collectionLogicText.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Banner</CardTitle>
            <CardDescription>
              goal: Collection page traffic (MOFU) · platform: website · image model:
              google/gemini-3-pro-image · text model: anthropic/claude-opus-5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateBanner} disabled={bannerSubmitting}>
              {bannerSubmitting ? 'Generating banner…' : 'Generate banner'}
            </Button>
            {bannerSubmitting && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Runs strategist → copy → director → image gen → evaluator. Keep this tab open.
              </p>
            )}

            {bannerRun && (
              <div className="space-y-4">
                {bannerRun.errorMessage && (
                  <Alert variant="destructive">{bannerRun.errorMessage}</Alert>
                )}
                {bannerImageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {bannerImageUrls.map((imageUrl) => (
                      <a
                        key={imageUrl}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-lg border border-[var(--color-border)] transition-shadow hover:shadow-md"
                      >
                        <img src={imageUrl} alt="Collection banner" loading="lazy" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-muted-foreground)]">No images yet.</p>
                )}

                {evaluator && (
                  <div className="space-y-2 rounded-md border border-[var(--color-border)] p-4">
                    <h3 className="font-display text-base font-semibold">Evaluator — quality gate</h3>
                    <p className="text-sm">
                      <strong className="font-semibold">Composite score: {evaluator.composite_score}</strong> —{' '}
                      {evaluator.pass ? 'pass' : 'needs review'}
                    </p>
                    {(evaluator.variants || []).map((variant) => (
                      <div key={variant.variant_index} className="space-y-2">
                        {Object.entries(variant.slots || {}).map(([slotName, verdict]) => (
                          <EvaluatorSlotBreakdown key={slotName} slotName={slotName} verdict={verdict} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-1.5">
                    <Label htmlFor="regenerate-hint">Regenerate hint</Label>
                    <Input
                      id="regenerate-hint"
                      value={regenerateHint}
                      onChange={(event) => setRegenerateHint(event.target.value)}
                      placeholder="e.g. darker background, sharper product, shorter headline"
                    />
                  </div>
                  <Button variant="secondary" onClick={regenerateBanner} disabled={bannerSubmitting}>
                    {bannerSubmitting ? 'Regenerating…' : 'Regenerate banner'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {bannerRun && bannerImageUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">6. Apply to collection</CardTitle>
            <CardDescription>
              Writes the desktop/mobile banner URLs to this collection's Shopify metafields
              (namespace <code>minaki.collection_page</code>, same keys the old Collection Pages
              generator used).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={applyToCollection} disabled={applySubmitting}>
              {applySubmitting ? 'Applying…' : 'Apply banner to collection'}
            </Button>
            {applyResult && (
              <Alert variant={applyResult.success ? 'success' : 'destructive'}>
                {applyResult.success
                  ? `Applied: ${applyResult.written_metafields.join(', ')}`
                  : `Failed: ${JSON.stringify(applyResult.userErrors)}`}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
      </div>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run logs</CardTitle>
            <CardDescription>
              Full history of every run across every agent pod that stores one, with complete
              output per run — not just the latest one from this session. (Product Writer, Keywords,
              and Naming Teams don't persist runs, so they have nothing to show here.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {LOG_PIPELINES.map((pipeline) => (
                <Button
                  key={pipeline.key}
                  variant={logsKind === pipeline.key ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => loadLogs(pipeline.key)}
                  disabled={logsLoading}
                >
                  {pipeline.label}
                </Button>
              ))}
            </div>

            {logsError && <Alert variant="destructive">{logsError}</Alert>}
            {logsLoading ? (
              <LoadingSpinner message="Loading runs…" />
            ) : logsItems.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No runs found.</p>
            ) : (
              <div className="space-y-3">
                {logsItems.map((row) => {
                  const runId = row.run_id ?? row.id;
                  const key = `${logsKind}:${runId}`;
                  const isExpanded = expandedRunKey === key;
                  return (
                    <div key={key} className="rounded-md border border-[var(--color-border)] p-3">
                      <Button
                        variant="outline"
                        onClick={() => toggleExpandRun(runId, logsKind)}
                        className="w-full justify-start text-left font-normal"
                      >
                        {isExpanded ? '▾' : '▸'} #{runId} — {row.status || 'unknown'} —{' '}
                        {LOG_PIPELINES.find((p) => p.key === logsKind).rowLabel(row)}
                        {row.created_at ? ` — ${row.created_at}` : ''}
                      </Button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 text-sm">
                          {expandedLoading ? (
                            <LoadingSpinner message="Loading full run output…" />
                          ) : expandedDetail ? (
                            <>
                              {logsKind === 'copy' && (
                                <>
                                  {expandedDetail.wireframe && (
                                    <p>
                                      <strong className="font-semibold">SEO title:</strong>{' '}
                                      {expandedDetail.wireframe.seo_title || '—'}
                                      <br />
                                      <strong className="font-semibold">SEO description:</strong>{' '}
                                      {expandedDetail.wireframe.seo_description || '—'}
                                    </p>
                                  )}
                                  {expandedDetail.copyPackage?.short_description && (
                                    <p className="font-medium">
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
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                      {collectHttpImageUrls(expandedDetail.bannerUrls).map((url) => (
                                        <a
                                          key={url}
                                          href={url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="overflow-hidden rounded-lg border border-[var(--color-border)] transition-shadow hover:shadow-md"
                                        >
                                          <img src={url} alt="Logged banner" loading="lazy" className="h-full w-full object-cover" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  {expandedDetail.decisionLogs?.evaluator && (
                                    <div>
                                      <strong className="font-semibold">
                                        Evaluator score:{' '}
                                        {expandedDetail.decisionLogs.evaluator.composite_score}
                                      </strong>{' '}
                                      — {expandedDetail.decisionLogs.evaluator.pass ? 'pass' : 'needs review'}
                                    </div>
                                  )}
                                </>
                              )}
                              <details>
                                <summary className="cursor-pointer text-sm text-[var(--color-muted-foreground)]">
                                  Entire raw output (JSON)
                                </summary>
                                <pre className="mt-2 max-h-[480px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 font-mono text-xs">
                                  {JSON.stringify(expandedDetail, null, 2)}
                                </pre>
                              </details>
                            </>
                          ) : (
                            <p className="text-sm text-[var(--color-muted-foreground)]">No detail loaded.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'pricing' && canViewPricing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
            <CardDescription>
              Estimated spend per agent call across recent runs (admin/manager only — the API omits
              this data entirely for other roles, this isn't just a hidden tab).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="secondary" onClick={loadPricing} disabled={pricingLoading}>
              {pricingLoading ? 'Loading…' : 'Refresh'}
            </Button>
            {pricingError && <Alert variant="destructive">{pricingError}</Alert>}
            {pricingLoading ? (
              <LoadingSpinner message="Loading pricing across recent runs…" />
            ) : pricingRows.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No cost data recorded on recent runs yet.
              </p>
            ) : (
              <>
                <p className="text-sm">
                  <strong className="font-semibold">
                    Total (last {pricingRows.length} agent calls shown): ${pricingTotalUsd.toFixed(4)}
                  </strong>
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run</TableHead>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Input tokens</TableHead>
                      <TableHead className="text-right">Output tokens</TableHead>
                      <TableHead className="text-right">Cost (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingRows.map((row, index) => (
                      <TableRow key={`${row.kind}-${row.runId}-${row.agent}-${index}`}>
                        <TableCell>#{row.runId}</TableCell>
                        <TableCell>{row.pipelineLabel}</TableCell>
                        <TableCell>{row.agent}</TableCell>
                        <TableCell>{row.model || '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.inputTokens ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.outputTokens ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">${Number(row.costUsd || 0).toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
