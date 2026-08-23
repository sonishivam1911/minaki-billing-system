import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { FieldLabel } from '../../components/agents/FieldInfoTip';
import { LoadingSpinner, ErrorMessage } from '../../components';
import {
  collectHttpImageUrls,
  normalizeCreativePodRunForDisplay,
  parseCommaSeparatedEmails,
} from './creativePodRun';

const RECENT_RUNS_LIMIT = 15;
const VARIANT_COUNT_OPTIONS = [1, 2, 3];
const TEXT_RENDER_MODE_OPTIONS = [
  { value: 'no_text', label: 'No text (default)' },
  { value: 'with_text', label: 'With text (burned-in title/subtitle/cta)' },
];

const FIELD_HELP = {
  brief:
    'Describe the campaign in plain language: occasion, product, audience, and where traffic should go. This drives strategy, copy, and casting.',
  goal:
    'Marketing outcome for this banner (e.g. collection traffic, awareness). Leave on Auto to infer from the brief, or pick a funnel goal explicitly.',
  goalDetail:
    'Optional nuance the strategist should not miss — promo dates, avoid-words, audience notes, or channel constraints.',
  platform:
    'Output size preset (website, Meta, WhatsApp, etc.). Sets default width/height and aspect unless you override below.',
  variantCount:
    'How many distinct image looks to generate. Each variant gets a different pose/camera/wardrobe delta and casting look from the lane pool.',
  textRenderMode:
    'No text renders zero in-image text — Title/Subtitle/CTA stay as copy-pack metadata only (default). With text burns that same title/subtitle/cta into the image as real, legible type, OCR-verified to match.',
  brandLane:
    'Which MINAKI vertical this banner speaks for. Leave on Auto to classify from the brief. MAIN is the master brand alone — no vertical-specific voice, palette, or imagery, for unity/all-three-lines content.',
  imageModel:
    'Which image model renders the banner. Leave on Auto for the best default. Faster models trade off fidelity.',
  imageModelMulti:
    'Which image model(s) render the banner. Leave none checked for Auto (best default). Check one to pick it explicitly. Check several to generate+evaluate all of them on the same locked copy/scene in this one run — the first checked becomes the primary result, the rest are stored as comparisons. Each additional model costs one extra generation + evaluator call.',
  textModel:
    'Which text model runs the Strategist, Copywriter, and Director agents (one shared pick for all three). Leave on Auto for the default. Type to search — this list covers every general chat model OpenRouter offers.',
  titlePosition:
    'Where to reserve clean empty space for text (added afterward, not burned into the image). Leave on Auto to let the Director pick per aspect.',
  customWidth:
    'Optional pixel width. Leave blank to use the platform preset. Pair with height when you need a custom crop.',
  customHeight:
    'Optional pixel height. Leave blank to use the platform preset. Pair with width when you need a custom crop.',
  productImage:
    'Required SKU photo. Ref 1 is product ground truth — metal, stones, and silhouette must match this image in every banner.',
  productDescription:
    "Optional plain-text description of the product's structure (from the Shopify listing works well) — e.g. \"rigid open-cuff bangle, single CZ stone, split-wire silhouette, NOT a ring, NOT a chain-link bracelet.\" A second, unambiguous signal alongside the photo, so the image model is less likely to hallucinate construction it can't clearly see.",
  lifestyleImages:
    'Optional mood photos (model, setting, lighting). Used for vibe only — they do not replace the product SKU.',
  notifyEmails:
    'Comma-separated addresses that get a completion email with banner links when the run finishes (or fails).',
  regenerateHint:
    'Tell the agent what to fix on regenerate — e.g. darker background, shorter headline, sharper product, different pose.',
};

const ROUTE_LABELS = { A: 'Route A', B: 'Route B' };

const RouteBlock = ({ routeKey, route }) => {
  if (!route) return null;
  return (
    <div className="agents-copy-block">
      <p><strong>{ROUTE_LABELS[routeKey] || routeKey}:</strong> {route.angle}</p>
      {route.emotion && <p className="agents-collection-meta">Emotion: {route.emotion}</p>}
      {route.gain_quote && <p className="agents-collection-meta">Gain: {route.gain_quote}</p>}
      {Array.isArray(route.hooks) && route.hooks.length > 0 && (
        <ul className="agents-hook-list">
          {route.hooks.map((hook) => (
            <li key={hook}>{hook}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CopyVariantBlock = ({ variantKey, variant, isRecommended }) => {
  if (!variant) return null;
  return (
    <div className="agents-copy-block">
      <p>
        <strong>Variant {variantKey}{isRecommended ? ' (recommended)' : ''}:</strong>{' '}
        {variant.hook_line}
      </p>
      {variant.caption && <p className="agents-collection-meta">{variant.caption}</p>}
    </div>
  );
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

/** Side-by-side results from comparing the run's locked prompt across
 * additional image models (compare-models endpoint) — same input, so
 * differences reflect the model, not the prompt. */
const ModelComparisonPanel = ({ comparison, loading }) => {
  if (!loading && !comparison) return null;
  const entries = Object.entries(comparison || {});
  return (
    <div className="agents-copy-block">
      <h3>Model comparison</h3>
      {loading && <p className="agents-muted-inline">Generating comparison variants…</p>}
      {entries.map(([modelId, result]) => (
        <div key={modelId} className="agents-copy-block">
          <p>
            <strong>{modelId}</strong>
            {result.error
              ? ` — failed: ${result.error}`
              : ` — score ${result.quality_score} (${result.pass ? 'pass' : 'needs review'})`}
          </p>
          {!result.error && collectHttpImageUrls(result.banner_urls).length > 0 && (
            <div className="agents-banner-grid">
              {collectHttpImageUrls(result.banner_urls).map((imageUrl) => (
                <a
                  key={imageUrl}
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="agents-banner-cell"
                >
                  <img src={imageUrl} alt={`${modelId} comparison`} loading="lazy" />
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/** Surfaces the Strategist, Copywriter, Director, and Evaluator outputs that
 * already flow through the API response but weren't previously rendered. */
const AgentOutputsPanel = ({ contentBrief, copyPack, visualSpec, decisionLogs }) => {
  const routes = contentBrief && !contentBrief.stop
    ? Object.entries(contentBrief).filter(([key]) => key === 'route_a' || key === 'route_b')
    : [];
  const copyVariants = copyPack?.variants || {};
  const recommendedVariant = copyPack?.recommended_variant;
  const director = decisionLogs?.director;
  const typography = visualSpec?.typography;
  const evaluator = decisionLogs?.evaluator;
  const costs = decisionLogs?.costs || {};
  const costEntries = Object.entries(costs);
  const totalCost = costEntries.reduce((sum, [, entry]) => sum + (entry.cost_usd || 0), 0);

  const hasAny = routes.length || Object.keys(copyVariants).length || visualSpec || evaluator;
  if (!hasAny) return null;

  return (
    <details className="agents-copy-block agents-agent-outputs">
      <summary>Full agent outputs (Strategist · Copywriter · Director · Evaluator)</summary>

      {costEntries.length > 0 && (
        <div className="agents-copy-block">
          <h3>Cost per agent</h3>
          <p>
            <strong>Total: ${totalCost.toFixed(4)}</strong>{' '}
            <span className="agents-collection-meta">
              (text-agent/evaluator costs are token counts × OpenRouter's published rates;
              image generation cost is OpenRouter's own reported spend per call)
            </span>
          </p>
          <ul className="agents-hook-list">
            {costEntries.map(([agentLabel, entry]) => (
              <li key={agentLabel}>
                <strong>{agentLabel}:</strong> ${(entry.cost_usd || 0).toFixed(4)}
                {entry.model ? ` — ${entry.model}` : ''}
                {entry.input_tokens !== undefined
                  ? ` (${entry.input_tokens} in / ${entry.output_tokens} out tokens)`
                  : entry.calls !== undefined
                    ? ` (${entry.calls} call${entry.calls === 1 ? '' : 's'})`
                    : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {routes.length > 0 && (
        <div className="agents-copy-block">
          <h3>Strategist — routes</h3>
          {routes.map(([key, route]) => (
            <RouteBlock key={key} routeKey={key.replace('route_', '').toUpperCase()} route={route} />
          ))}
        </div>
      )}

      {(Object.keys(copyVariants).length > 0 || copyPack?.claims) && (
        <div className="agents-copy-block">
          <h3>Copywriter — copy pack</h3>
          {Object.entries(copyVariants).map(([key, variant]) => (
            <CopyVariantBlock
              key={key}
              variantKey={key}
              variant={variant}
              isRecommended={key === recommendedVariant}
            />
          ))}
          {copyPack?.alt_text && (
            <p className="agents-collection-meta">Alt text: {copyPack.alt_text}</p>
          )}
          {Array.isArray(copyPack?.claims) && copyPack.claims.length > 0 && (
            <ul className="agents-hook-list">
              {copyPack.claims.map((claim) => (
                <li key={claim.text}>{claim.text}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(visualSpec || director) && (
        <div className="agents-copy-block">
          <h3>Director — scene</h3>
          {visualSpec?.concept && <p><strong>Concept:</strong> {visualSpec.concept}</p>}
          {visualSpec?.mood && <p className="agents-collection-meta">Mood: {visualSpec.mood}</p>}
          {visualSpec?.pose && <p className="agents-collection-meta">Pose: {visualSpec.pose}</p>}
          {visualSpec?.casting && (
            <p className="agents-collection-meta">Casting: {visualSpec.casting}</p>
          )}
          {visualSpec?.color_notes && (
            <p className="agents-collection-meta">Colors: {visualSpec.color_notes}</p>
          )}
          {typography && (
            <p className="agents-collection-meta">
              Text placement: {typography.title_position || 'auto'}
              {typography.contrast_notes ? ` — ${typography.contrast_notes}` : ''}
            </p>
          )}
          {director?.scene && <p className="agents-collection-meta">Scene: {director.scene}</p>}
          {director?.product_fidelity && (
            <p className="agents-collection-meta">Product fidelity: {director.product_fidelity}</p>
          )}
          {director?.legibility && (
            <p className="agents-collection-meta">Legibility: {director.legibility}</p>
          )}
        </div>
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
              <p className="agents-collection-meta">Variant {variant.variant_index}</p>
              {Object.entries(variant.slots || {}).map(([slotName, verdict]) => (
                <EvaluatorSlotBreakdown key={slotName} slotName={slotName} verdict={verdict} />
              ))}
            </div>
          ))}
        </div>
      )}
    </details>
  );
};

export const CreativePodPage = () => {
  const [goals, setGoals] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [imageModels, setImageModels] = useState([]);
  const [defaultImageModel, setDefaultImageModel] = useState('');
  const [textModels, setTextModels] = useState([]);
  const [textModelFilter, setTextModelFilter] = useState('');
  const [textPlacements, setTextPlacements] = useState([]);
  const [brandLanes, setBrandLanes] = useState([]);
  const [schemaReady, setSchemaReady] = useState(true);
  const [briefText, setBriefText] = useState('');
  const [goalType, setGoalType] = useState('');
  const [goalDetail, setGoalDetail] = useState('');
  const [platform, setPlatform] = useState('website');
  const [variantCount, setVariantCount] = useState(2);
  const [textRenderMode, setTextRenderMode] = useState('no_text');
  const [brandLane, setBrandLane] = useState('');
  // Multi-select: first checked model is the primary generation (feeds
  // banner_urls/models_used/evaluator as before), any additional checked
  // models are generated+evaluated as comparisons on the SAME locked
  // visual_spec, in the same "Generate banners" click — no separate
  // compare step required. Empty selection = Auto (backend default).
  const [selectedImageModels, setSelectedImageModels] = useState([]);
  const [textModel, setTextModel] = useState('');
  const [titlePosition, setTitlePosition] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [modelComparison, setModelComparison] = useState(null);
  const [comparingModels, setComparingModels] = useState(false);
  const [prefilledFromRunId, setPrefilledFromRunId] = useState(null);
  const [prefilledReferenceImages, setPrefilledReferenceImages] = useState(null);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productDescription, setProductDescription] = useState('');
  const [regenerateProductDescription, setRegenerateProductDescription] = useState('');
  const [lifestyleImageFiles, setLifestyleImageFiles] = useState([]);
  const [regenerateHint, setRegenerateHint] = useState('');
  const [regenerateImageModel, setRegenerateImageModel] = useState('');
  const [regenerateTitlePosition, setRegenerateTitlePosition] = useState('');
  const [regenerateBrandLane, setRegenerateBrandLane] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);

  const loadCatalog = async () => {
    try {
      const [
        goalsResponse,
        platformsResponse,
        modelsResponse,
        textModelsResponse,
        placementsResponse,
        brandLanesResponse,
      ] = await Promise.all([
        agentsApi.listCreativePodGoals(),
        agentsApi.listCreativePodPlatforms(),
        agentsApi.listCreativePodModels(),
        agentsApi.listCreativePodTextModels(),
        agentsApi.listCreativePodTextPlacements(),
        agentsApi.listCreativePodBrandLanes(),
      ]);
      setGoals(goalsResponse.goals || []);
      setPlatforms(platformsResponse.platforms || []);
      setImageModels(modelsResponse.models || []);
      setDefaultImageModel(modelsResponse.default || '');
      setTextModels(textModelsResponse.models || []);
      setTextPlacements(placementsResponse.positions || []);
      setBrandLanes(brandLanesResponse.brand_lanes || []);
      setSchemaReady(goalsResponse.schema_ready !== false);
      if (!goalType && (goalsResponse.goals || []).length) {
        setGoalType(goalsResponse.goals[0].goal_type);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const loadRecentRuns = async () => {
    setRecentRunsLoading(true);
    try {
      const response = await agentsApi.listCreativePodRuns({ limit: RECENT_RUNS_LIMIT });
      setRecentRuns(response.items || []);
      setRecentRunsTotal(response.total || 0);
      if (response.schema_ready === false) {
        setSchemaReady(false);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRecentRunsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    loadRecentRuns();
  }, []);

  const createCreativePodRun = async () => {
    if (!briefText.trim()) {
      setErrorMessage('Enter a banner brief');
      return;
    }
    if (!productImageFile) {
      setErrorMessage(
        prefilledFromRunId
          ? `Upload a product reference image — file inputs can't be prefilled, so re-upload the image from run #${prefilledFromRunId} (or a new one) to continue`
          : 'Upload a product reference image'
      );
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    // First checked model is the primary run; the rest are compared against
    // its locked visual_spec right after, in this same submit.
    const [primaryImageModel, ...comparisonImageModels] = selectedImageModels;
    try {
      const response = await agentsApi.createCreativePodRun({
        briefText: briefText.trim(),
        productImageFile,
        lifestyleImageFiles,
        goalType: goalType || undefined,
        goalDetail: goalDetail.trim() || undefined,
        platform: platform || undefined,
        width: customWidth ? Number(customWidth) : undefined,
        height: customHeight ? Number(customHeight) : undefined,
        variantCount,
        textRenderMode,
        brandLane: brandLane || undefined,
        imageModel: primaryImageModel || undefined,
        titlePosition: titlePosition || undefined,
        textModel: textModel || undefined,
        productDescription: productDescription.trim() || undefined,
        notifyEmails: parseCommaSeparatedEmails(notifyEmails),
      });
      const normalized = normalizeCreativePodRunForDisplay(response);
      setActiveRun(normalized);
      setModelComparison(null);
      setPrefilledFromRunId(null);
      setPrefilledReferenceImages(null);
      setRegenerateImageModel(normalized?.intake?.image_model || '');
      setRegenerateTitlePosition(normalized?.intake?.title_position || '');
      setRegenerateBrandLane(normalized?.intake?.brand_lane || '');
      setRegenerateProductDescription(normalized?.intake?.product_description || '');
      await loadRecentRuns();
      if (comparisonImageModels.length > 0 && normalized?.runId) {
        await runModelComparison(normalized.runId, comparisonImageModels);
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const runModelComparison = async (runId, models) => {
    setComparingModels(true);
    try {
      const response = await agentsApi.compareCreativePodModels(runId, models);
      setModelComparison(response.models || {});
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setComparingModels(false);
    }
  };

  const toggleImageModelSelection = (value) => {
    setSelectedImageModels((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
    );
  };

  const viewRunDetails = async (runId) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const runRow = await agentsApi.getCreativePodRun(runId);
      const normalized = normalizeCreativePodRunForDisplay(runRow);
      setActiveRun(normalized);
      setModelComparison(normalized?.decisionLogs?.model_comparison?.models || null);
      setRegenerateImageModel(normalized?.intake?.image_model || '');
      setRegenerateTitlePosition(normalized?.intake?.title_position || '');
      setRegenerateBrandLane(normalized?.intake?.brand_lane || '');
      setRegenerateProductDescription(normalized?.intake?.product_description || '');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const prefillFormFromRun = (run) => {
    if (!run) return;
    setBriefText(run.briefText || '');
    setGoalType(run.goalType || '');
    setGoalDetail(run.goalDetail || '');
    setPlatform(run.platform || 'website');
    setVariantCount(run.variantCount || 1);
    setTextRenderMode(run.textRenderMode || 'no_text');
    setBrandLane(run.brandLane || run.intake?.brand_lane || '');
    setSelectedImageModels(run.intake?.image_model ? [run.intake.image_model] : []);
    setTextModel(run.intake?.text_model || '');
    setTitlePosition(run.intake?.title_position || '');
    setCustomWidth(run.intake?.width ? String(run.intake.width) : '');
    setCustomHeight(run.intake?.height ? String(run.intake.height) : '');
    setProductDescription(run.intake?.product_description || '');
    setNotifyEmails((run.notifyEmails || []).join(', '));
    setProductImageFile(null);
    setLifestyleImageFiles([]);
    setPrefilledFromRunId(run.runId || null);
    setPrefilledReferenceImages({
      productImageUrl: run.intake?.product_image_url || '',
      lifestyleImageUrls: run.intake?.lifestyle_reference_urls || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prefillFormFromRunId = async (runId) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const runRow = await agentsApi.getCreativePodRun(runId);
      prefillFormFromRun(normalizeCreativePodRunForDisplay(runRow));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateBanners = async () => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.regenerateCreativePodRun(activeRun.runId, {
        hint: regenerateHint,
        notify_emails: parseCommaSeparatedEmails(notifyEmails),
        image_model: regenerateImageModel || undefined,
        title_position: regenerateTitlePosition || undefined,
        brand_lane: regenerateBrandLane || undefined,
        product_description:
          regenerateProductDescription.trim() !== (activeRun?.intake?.product_description || '')
            ? regenerateProductDescription.trim()
            : undefined,
      });
      setActiveRun(normalizeCreativePodRunForDisplay(response));
      setRegenerateHint('');
      await loadRecentRuns();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bannerImageUrls = collectHttpImageUrls(activeRun?.bannerUrls);
  const variantCards = activeRun?.variants || [];
  const selectedPlatform = platforms.find((row) => row.platform === platform);

  return (
    <div className="screen-container agents-page creative-pod-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Banner Generation</h1>
          <p className="screen-subtitle">
            Creative Pod — pick goal + platform, upload a product image, generate banners, then
            regenerate with feedback
          </p>
        </div>
      </div>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.banners} />
      {errorMessage && (
        <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />
      )}

      {!schemaReady && (
        <div className="agents-card agents-alert">
          <p>
            Creative pod runs table is missing or file-fallback is active. Apply the{' '}
            <code>creative_pod_runs</code> migration on Postgres when ready; local file storage still
            works for testing.
          </p>
        </div>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">New banner run</h2>
        {prefilledFromRunId && (
          <div className="agents-alert agents-prefill-banner">
            <p>
              Prefilled from Run #{prefilledFromRunId} — all fields below are editable.
              File inputs can&apos;t be prefilled by the browser, so you must upload the
              product image (and lifestyle images, if any) again to submit.
            </p>
            {prefilledReferenceImages?.productImageUrl && (
              <div className="agents-banner-grid">
                <a
                  href={prefilledReferenceImages.productImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="agents-banner-cell"
                >
                  <img src={prefilledReferenceImages.productImageUrl} alt="Previous product reference" loading="lazy" />
                </a>
                {(prefilledReferenceImages.lifestyleImageUrls || []).map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="agents-banner-cell">
                    <img src={url} alt="Previous lifestyle reference" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="agents-form-stack">
          <label>
            <FieldLabel label="Brief" info={FIELD_HELP.brief} />
            <textarea
              value={briefText}
              onChange={(event) => setBriefText(event.target.value)}
              rows={4}
              placeholder="e.g. Diwali gifting hero for crystal earrings collection — traffic to collection page"
            />
          </label>

          <label>
            <FieldLabel label="Goal" info={FIELD_HELP.goal} />
            <select value={goalType} onChange={(event) => setGoalType(event.target.value)}>
              <option value="">Auto-map from brief</option>
              {goals.map((goal) => (
                <option key={goal.goal_type} value={goal.goal_type}>
                  {goal.label || goal.goal_type}
                  {goal.funnel ? ` · ${goal.funnel}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            <FieldLabel label="Goal detail (optional)" info={FIELD_HELP.goalDetail} />
            <input
              value={goalDetail}
              onChange={(event) => setGoalDetail(event.target.value)}
              placeholder="Extra nuance for the strategist"
            />
          </label>

          <label>
            <FieldLabel label="Platform" info={FIELD_HELP.platform} />
            <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
              {platforms.map((row) => (
                <option key={row.platform} value={row.platform}>
                  {row.label}
                  {row.category ? ` (${row.category})` : ''}
                </option>
              ))}
              {!platforms.length && <option value="website">Our website</option>}
            </select>
            {selectedPlatform?.description && (
              <span className="agents-collection-meta">{selectedPlatform.description}</span>
            )}
          </label>

          <label>
            <FieldLabel label="Vertical" info={FIELD_HELP.brandLane} />
            <select value={brandLane} onChange={(event) => setBrandLane(event.target.value)}>
              <option value="">Auto-classify from brief</option>
              {brandLanes.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>

          <div className="agents-form-row">
            <label>
              <FieldLabel label="Image variants" info={FIELD_HELP.variantCount} />
              <select
                value={variantCount}
                onChange={(event) => setVariantCount(Number(event.target.value))}
              >
                {VARIANT_COUNT_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel label="Text render mode" info={FIELD_HELP.textRenderMode} />
              <select
                value={textRenderMode}
                onChange={(event) => setTextRenderMode(event.target.value)}
              >
                {TEXT_RENDER_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="agents-form-row">
            <label>
              <FieldLabel label="Text-safe space" info={FIELD_HELP.titlePosition} />
              <select value={titlePosition} onChange={(event) => setTitlePosition(event.target.value)}>
                <option value="">Auto (Director picks)</option>
                {textPlacements.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <FieldLabel label="Image model(s)" info={FIELD_HELP.imageModelMulti} />
            <div className="agents-check-group agents-compare-models-group">
              {imageModels.map((option) => (
                <label key={option.value}>
                  <input
                    type="checkbox"
                    checked={selectedImageModels.includes(option.value)}
                    onChange={() => toggleImageModelSelection(option.value)}
                  />
                  {option.label}
                </label>
              ))}
              {!imageModels.length && (
                <span className="agents-collection-meta">No models loaded yet.</span>
              )}
            </div>
            {selectedImageModels.length === 0 && (
              <span className="agents-collection-meta">
                None checked = Auto ({imageModels.find((m) => m.value === defaultImageModel)?.label || defaultImageModel || 'default'}).
              </span>
            )}
            {selectedImageModels.length === 1 && (
              <span className="agents-collection-meta">Single model — this run's primary result.</span>
            )}
            {selectedImageModels.length > 1 && (
              <span className="agents-collection-meta">
                First checked ({imageModels.find((m) => m.value === selectedImageModels[0])?.label || selectedImageModels[0]}) is the primary result. The other {selectedImageModels.length - 1} will be generated and evaluated as comparisons, stored on this same run, right after.
              </span>
            )}
          </div>

          <label>
            <FieldLabel label="Text model (Strategist/Copywriter/Director)" info={FIELD_HELP.textModel} />
            <input
              value={textModelFilter}
              onChange={(event) => setTextModelFilter(event.target.value)}
              placeholder={`Search ${textModels.length || ''} models…`}
              className="agents-model-filter"
            />
            <select value={textModel} onChange={(event) => setTextModel(event.target.value)}>
              <option value="">Auto (default)</option>
              {textModels
                .filter((option) => {
                  const needle = textModelFilter.trim().toLowerCase();
                  if (!needle) return true;
                  return (
                    option.value.toLowerCase().includes(needle) ||
                    (option.label || '').toLowerCase().includes(needle)
                  );
                })
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <div className="agents-form-row">
            <label>
              <FieldLabel label="Custom width (px)" info={FIELD_HELP.customWidth} />
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={customWidth}
                onChange={(event) => setCustomWidth(event.target.value)}
                placeholder="optional — platform default"
              />
            </label>
            <label>
              <FieldLabel label="Custom height (px)" info={FIELD_HELP.customHeight} />
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={customHeight}
                onChange={(event) => setCustomHeight(event.target.value)}
                placeholder="optional — platform default"
              />
            </label>
          </div>

          <label>
            <FieldLabel label="Product image (required)" info={FIELD_HELP.productImage} />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setProductImageFile(event.target.files?.[0] || null)}
            />
            {productImageFile && (
              <span className="agents-collection-meta">{productImageFile.name}</span>
            )}
          </label>

          <label>
            <FieldLabel
              label="Product description (optional)"
              info={FIELD_HELP.productDescription}
            />
            <textarea
              value={productDescription}
              onChange={(event) => setProductDescription(event.target.value)}
              placeholder="e.g. rigid open-cuff bangle, single CZ stone, split-wire silhouette — NOT a ring, NOT a chain-link bracelet"
              rows={2}
            />
          </label>

          <label>
            <FieldLabel
              label="Lifestyle reference images (optional)"
              info={FIELD_HELP.lifestyleImages}
            />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setLifestyleImageFiles(Array.from(event.target.files || []))}
            />
            {lifestyleImageFiles.length > 0 && (
              <span className="agents-collection-meta">
                {lifestyleImageFiles.length} file{lifestyleImageFiles.length === 1 ? '' : 's'}{' '}
                selected
              </span>
            )}
          </label>

          <label>
            <FieldLabel label="Notify emails" info={FIELD_HELP.notifyEmails} />
            <input
              value={notifyEmails}
              onChange={(event) => setNotifyEmails(event.target.value)}
              placeholder="you@minaki.com, team@minaki.com"
              inputMode="email"
              autoComplete="email"
            />
          </label>

          <div className="agents-actions-row">
            <button
              type="button"
              className="agents-btn primary"
              onClick={createCreativePodRun}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Generating banners…' : 'Generate banners'}
            </button>
          </div>
        </div>
        {isSubmitting && (
          <p className="agents-muted-inline">
            Creative Pod runs strategist → copy → director → image gen. Keep this tab open.
            {selectedImageModels.length > 1
              ? ` Then compares against ${selectedImageModels.length - 1} additional model${selectedImageModels.length - 1 === 1 ? '' : 's'}.`
              : ''}
          </p>
        )}
      </section>

      {activeRun && (
        <section className="agents-card">
          <div className="agents-actions-row compact agents-run-header-actions">
            <h2 className="agents-section-title">
              Run #{activeRun.runId} — {activeRun.status}
            </h2>
            <button
              type="button"
              className="agents-btn secondary"
              onClick={() => prefillFormFromRun(activeRun)}
            >
              Prefill form to rerun with changes
            </button>
          </div>
          {activeRun.errorMessage && (
            <p className="agents-status-err">{activeRun.errorMessage}</p>
          )}
          <p className="agents-muted">
            {[activeRun.goalType, activeRun.platformLabel || activeRun.platform, activeRun.brandLane]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {(activeRun.inImageTitle || activeRun.inImageSubtitle || activeRun.inImageCta) && (
            <div className="agents-copy-block">
              <h3>In-image copy</h3>
              {activeRun.inImageTitle && <p><strong>Title:</strong> {activeRun.inImageTitle}</p>}
              {activeRun.inImageSubtitle && (
                <p><strong>Subtitle:</strong> {activeRun.inImageSubtitle}</p>
              )}
              {activeRun.inImageCta && <p><strong>CTA:</strong> {activeRun.inImageCta}</p>}
            </div>
          )}

          <AgentOutputsPanel
            contentBrief={activeRun.contentBrief}
            copyPack={activeRun.copyPack}
            visualSpec={activeRun.visualSpec}
            decisionLogs={activeRun.decisionLogs}
          />

          <ModelComparisonPanel comparison={modelComparison} loading={comparingModels} />

          {variantCards.length > 0 ? (
            variantCards.map((variantCard) => (
              <div key={`variant-${variantCard.variantIndex}`} className="agents-copy-block">
                <h3>
                  Variant {variantCard.variantIndex}
                  {variantCard.diversityLabel ? ` — ${variantCard.diversityLabel}` : ''}
                </h3>
                {variantCard.castingKey && (
                  <p className="agents-collection-meta">Casting: {variantCard.castingKey}</p>
                )}
                {variantCard.ocr && (
                  <p className="agents-validation">
                    Text QA:{' '}
                    {variantCard.ocr.pass
                      ? 'pass'
                      : `needs review (${(variantCard.ocr.reasons || []).join('; ') || 'failed'})`}
                    {variantCard.ocr.attempt ? ` · attempt ${variantCard.ocr.attempt}` : ''}
                    {variantCard.ocr.image_model ? ` · ${variantCard.ocr.image_model}` : ''}
                  </p>
                )}
                {variantCard.imageUrls.length > 0 ? (
                  <div className="agents-banner-grid">
                    {variantCard.imageUrls.map((imageUrl) => (
                      <a
                        key={imageUrl}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="agents-banner-cell"
                      >
                        <img
                          src={imageUrl}
                          alt={`Creative pod variant ${variantCard.variantIndex}`}
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="agents-muted">No images for this variant.</p>
                )}
              </div>
            ))
          ) : (
            bannerImageUrls.length > 0 && (
              <div className="agents-banner-grid">
                {bannerImageUrls.map((imageUrl) => (
                  <a
                    key={imageUrl}
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="agents-banner-cell"
                  >
                    <img src={imageUrl} alt="Creative pod banner" loading="lazy" />
                  </a>
                ))}
              </div>
            )
          )}

          {activeRun.emailNotification && (
            <p className="agents-validation">
              Email:{' '}
              {activeRun.emailNotification.success
                ? activeRun.emailNotification.message || 'sent'
                : activeRun.emailNotification.error ||
                  activeRun.emailNotification.message ||
                  'skipped/failed'}
            </p>
          )}

          <div className="agents-form-stack agents-regen-stack">
            <label>
              <FieldLabel label="Regenerate hint" info={FIELD_HELP.regenerateHint} />
              <input
                value={regenerateHint}
                onChange={(event) => setRegenerateHint(event.target.value)}
                placeholder="e.g. darker background, sharper product, shorter headline"
              />
            </label>
            <label>
              <FieldLabel
                label="Product description (optional)"
                info={FIELD_HELP.productDescription}
              />
              <textarea
                value={regenerateProductDescription}
                onChange={(event) => setRegenerateProductDescription(event.target.value)}
                placeholder="e.g. rigid open-cuff bangle, single CZ stone, split-wire silhouette — NOT a ring, NOT a chain-link bracelet"
                rows={2}
              />
            </label>
            <div className="agents-form-row">
              <label>
                <FieldLabel label="Image model" info={FIELD_HELP.imageModel} />
                <select
                  value={regenerateImageModel}
                  onChange={(event) => setRegenerateImageModel(event.target.value)}
                >
                  <option value="">Auto (Seedream 4.5)</option>
                  {imageModels.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <FieldLabel label="Text-safe space" info={FIELD_HELP.titlePosition} />
                <select
                  value={regenerateTitlePosition}
                  onChange={(event) => setRegenerateTitlePosition(event.target.value)}
                >
                  <option value="">Auto (Director picks)</option>
                  {textPlacements.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <FieldLabel
                  label="Vertical"
                  info="Casting/color-lock override only — regenerate never re-runs the Director, so this can't rewrite prompt text."
                />
                <select
                  value={regenerateBrandLane}
                  onChange={(event) => setRegenerateBrandLane(event.target.value)}
                >
                  <option value="">Keep run's lane</option>
                  {brandLanes.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="agents-actions-row compact">
              <button
                type="button"
                className="agents-btn primary"
                onClick={regenerateBanners}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Regenerating…' : 'Regenerate banners'}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">Recent runs</h2>
        <div className="agents-actions-row compact">
          <button
            type="button"
            className="agents-btn secondary"
            onClick={loadRecentRuns}
            disabled={recentRunsLoading}
          >
            Refresh
          </button>
        </div>
        {recentRunsLoading ? (
          <LoadingSpinner message="Loading runs…" />
        ) : (
          <div className="agents-table-wrap">
            <p className="agents-preview-skus">{recentRunsTotal} total runs</p>
            <table className="agents-table creative-pod-runs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Goal</th>
                  <th>Status</th>
                  <th>Brief</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((runRow) => (
                  <tr key={runRow.id}>
                    <td data-label="ID">{runRow.id}</td>
                    <td data-label="Goal">{runRow.goal_type || '—'}</td>
                    <td data-label="Status">{runRow.status}</td>
                    <td data-label="Brief">{(runRow.brief_text || '').slice(0, 60) || '—'}</td>
                    <td data-label="">
                      <button
                        type="button"
                        className="agents-link-btn"
                        onClick={() => viewRunDetails(runRow.id)}
                      >
                        View
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className="agents-link-btn"
                        onClick={() => prefillFormFromRunId(runRow.id)}
                      >
                        Rerun
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
