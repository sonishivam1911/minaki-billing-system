import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { AgentsPagedTable } from '../../components/agents/AgentsPagedTable';
import { FieldInfoTip } from '../../components/agents/FieldInfoTip';
import { LoadingSpinner } from '../../components';
import {
  collectHttpImageUrls,
  normalizeCreativePodRunForDisplay,
  parseCommaSeparatedEmails,
} from './creativePodRun';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

const RECENT_RUNS_LIMIT = 15;
const VARIANT_COUNT_OPTIONS = [1, 2, 3];
const TEXT_RENDER_MODE_OPTIONS = [
  { value: 'no_text', label: 'No text (default)' },
  { value: 'with_text', label: 'With text (burned-in title/subtitle/cta)' },
];

// Radix Select can't take an empty-string item value, so every "Auto" /
// "unset" choice is stored under this sentinel and mapped back to '' in the
// change handler — same pattern as AgentSettingsPage.
const AUTO_VALUE = '__auto__';

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

// Shared "sub-panel" surface used throughout the agent-output breakdowns
// below (routes, copy variants, evaluator slots, director scene, etc).
const BLOCK_CLASS = 'space-y-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3';
const META_CLASS = 'text-sm text-[var(--color-muted-foreground)]';
const HOOK_LIST_CLASS = 'list-disc space-y-1 pl-5 text-sm';

/** Maps a MINAKI brand-lane value to its gemstone Badge variant. */
const laneBadgeVariant = (laneValue) => {
  const value = String(laneValue || '').toLowerCase();
  if (value.includes('bridal')) return 'ruby';
  if (value.includes('demi')) return 'citrine';
  if (value.includes('fine')) return 'emerald';
  return 'outline';
};

/** Label + optional info-tip, styled with the new Label primitive. */
const FieldLabelRow = ({ htmlFor, label, info }) => (
  <div className="flex items-center gap-1.5">
    <Label htmlFor={htmlFor}>{label}</Label>
    {info ? <FieldInfoTip label={label}>{info}</FieldInfoTip> : null}
  </div>
);

/** Grid of clickable banner thumbnails — reused for reference images, model
 * comparisons, variant results, and the flat banner fallback. */
const BannerImageGrid = ({ images, altPrefix }) => {
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((imageUrl) => (
        <Card key={imageUrl} showcase className="overflow-hidden p-0">
          <a href={imageUrl} target="_blank" rel="noreferrer" className="block">
            <img src={imageUrl} alt={altPrefix} loading="lazy" className="aspect-square w-full object-cover" />
          </a>
        </Card>
      ))}
    </div>
  );
};

const RouteBlock = ({ routeKey, route }) => {
  if (!route) return null;
  return (
    <div className={BLOCK_CLASS}>
      <p className="text-sm">
        <strong className="font-semibold">{ROUTE_LABELS[routeKey] || routeKey}:</strong> {route.angle}
      </p>
      {route.emotion && <p className={META_CLASS}>Emotion: {route.emotion}</p>}
      {route.gain_quote && <p className={META_CLASS}>Gain: {route.gain_quote}</p>}
      {Array.isArray(route.hooks) && route.hooks.length > 0 && (
        <ul className={HOOK_LIST_CLASS}>
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
    <div className={BLOCK_CLASS}>
      <p className="text-sm">
        <strong className="font-semibold">
          Variant {variantKey}
          {isRecommended ? ' (recommended)' : ''}:
        </strong>{' '}
        {variant.hook_line}
      </p>
      {variant.caption && <p className={META_CLASS}>{variant.caption}</p>}
    </div>
  );
};

const EvaluatorSlotBreakdown = ({ slotName, verdict }) => {
  if (!verdict) return null;
  const breakdown = verdict.score_breakdown || [];
  return (
    <div className={BLOCK_CLASS}>
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <strong className="font-semibold">{slotName}:</strong>
        <Badge variant={verdict.pass ? 'success' : 'warning'}>{verdict.pass ? 'Pass' : 'Needs review'}</Badge>
        <span>score {verdict.score}</span>
        {verdict.hard_gate_failed ? <span>(hard gate failed)</span> : null}
      </p>
      {breakdown.length > 0 ? (
        <ul className={HOOK_LIST_CLASS}>
          {breakdown.map((entry) => (
            <li key={entry.axis}>
              <strong className="font-semibold">{entry.axis}:</strong>{' '}
              {entry.score !== undefined ? `${entry.score}/100 — ` : `${entry.status} — `}
              {entry.detail}
            </li>
          ))}
        </ul>
      ) : (
        (verdict.reasons || []).length > 0 && <p className={META_CLASS}>{verdict.reasons.join('; ')}</p>
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
    <div className={BLOCK_CLASS}>
      <h3 className="text-sm font-semibold">Model comparison</h3>
      {loading && <p className={META_CLASS}>Generating comparison variants…</p>}
      {entries.map(([modelId, result]) => (
        <div key={modelId} className="space-y-2">
          <p className="text-sm">
            <strong className="font-semibold">{modelId}</strong>
            {result.error
              ? ` — failed: ${result.error}`
              : ` — score ${result.quality_score} (${result.pass ? 'pass' : 'needs review'})`}
          </p>
          {!result.error && (
            <BannerImageGrid
              images={collectHttpImageUrls(result.banner_urls)}
              altPrefix={`${modelId} comparison`}
            />
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
    <details className="space-y-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Full agent outputs (Strategist · Copywriter · Director · Evaluator)
      </summary>

      <div className="mt-4 space-y-4">
        {costEntries.length > 0 && (
          <div className={BLOCK_CLASS}>
            <h3 className="text-sm font-semibold">Cost per agent</h3>
            <p className="text-sm">
              <strong className="font-semibold">Total: ${totalCost.toFixed(4)}</strong>{' '}
              <span className={META_CLASS}>
                (text-agent/evaluator costs are token counts × OpenRouter's published rates; image
                generation cost is OpenRouter's own reported spend per call)
              </span>
            </p>
            <ul className={HOOK_LIST_CLASS}>
              {costEntries.map(([agentLabel, entry]) => (
                <li key={agentLabel}>
                  <strong className="font-semibold">{agentLabel}:</strong> ${(entry.cost_usd || 0).toFixed(4)}
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
          <div className={BLOCK_CLASS}>
            <h3 className="text-sm font-semibold">Strategist — routes</h3>
            <div className="space-y-2">
              {routes.map(([key, route]) => (
                <RouteBlock key={key} routeKey={key.replace('route_', '').toUpperCase()} route={route} />
              ))}
            </div>
          </div>
        )}

        {(Object.keys(copyVariants).length > 0 || copyPack?.claims) && (
          <div className={BLOCK_CLASS}>
            <h3 className="text-sm font-semibold">Copywriter — copy pack</h3>
            <div className="space-y-2">
              {Object.entries(copyVariants).map(([key, variant]) => (
                <CopyVariantBlock
                  key={key}
                  variantKey={key}
                  variant={variant}
                  isRecommended={key === recommendedVariant}
                />
              ))}
            </div>
            {copyPack?.alt_text && <p className={META_CLASS}>Alt text: {copyPack.alt_text}</p>}
            {Array.isArray(copyPack?.claims) && copyPack.claims.length > 0 && (
              <ul className={HOOK_LIST_CLASS}>
                {copyPack.claims.map((claim) => (
                  <li key={claim.text}>{claim.text}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(visualSpec || director) && (
          <div className={BLOCK_CLASS}>
            <h3 className="text-sm font-semibold">Director — scene</h3>
            {visualSpec?.concept && (
              <p className="text-sm">
                <strong className="font-semibold">Concept:</strong> {visualSpec.concept}
              </p>
            )}
            {visualSpec?.mood && <p className={META_CLASS}>Mood: {visualSpec.mood}</p>}
            {visualSpec?.pose && <p className={META_CLASS}>Pose: {visualSpec.pose}</p>}
            {visualSpec?.casting && <p className={META_CLASS}>Casting: {visualSpec.casting}</p>}
            {visualSpec?.color_notes && <p className={META_CLASS}>Colors: {visualSpec.color_notes}</p>}
            {typography && (
              <p className={META_CLASS}>
                Text placement: {typography.title_position || 'auto'}
                {typography.contrast_notes ? ` — ${typography.contrast_notes}` : ''}
              </p>
            )}
            {director?.scene && <p className={META_CLASS}>Scene: {director.scene}</p>}
            {director?.product_fidelity && (
              <p className={META_CLASS}>Product fidelity: {director.product_fidelity}</p>
            )}
            {director?.legibility && <p className={META_CLASS}>Legibility: {director.legibility}</p>}
          </div>
        )}

        {evaluator && (
          <div className={BLOCK_CLASS}>
            <h3 className="text-sm font-semibold">Evaluator — quality gate</h3>
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <strong className="font-semibold">Composite score: {evaluator.composite_score}</strong>
              <Badge variant={evaluator.pass ? 'success' : 'warning'}>
                {evaluator.pass ? 'Pass' : 'Needs review'}
              </Badge>
            </p>
            <div className="space-y-2">
              {(evaluator.variants || []).map((variant) => (
                <div key={variant.variant_index} className="space-y-2">
                  <p className={META_CLASS}>Variant {variant.variant_index}</p>
                  {Object.entries(variant.slots || {}).map(([slotName, verdict]) => (
                    <EvaluatorSlotBreakdown key={slotName} slotName={slotName} verdict={verdict} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const prefilledImages = prefilledReferenceImages
    ? [prefilledReferenceImages.productImageUrl, ...(prefilledReferenceImages.lifestyleImageUrls || [])].filter(
        Boolean
      )
    : [];

  const RUN_COLUMNS = [
    { key: 'id', label: 'ID' },
    { key: 'goal_type', label: 'Goal', render: (row) => row.goal_type || '—' },
    { key: 'status', label: 'Status' },
    { key: 'brief_text', label: 'Brief', render: (row) => (row.brief_text || '').slice(0, 60) || '—' },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => viewRunDetails(row.id)}>
            View
          </Button>
          <span className="text-[var(--color-muted-foreground)]">·</span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => prefillFormFromRunId(row.id)}>
            Rerun
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="minaki-ui mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Banner Generation</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Creative Pod — pick goal + platform, upload a product image, generate banners, then
          regenerate with feedback
        </p>
      </header>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.banners} />
      {errorMessage && (
        <Alert variant="destructive" title="Something went wrong" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      {!schemaReady && (
        <Alert variant="warning" className="mb-6">
          Creative pod runs table is missing or file-fallback is active. Apply the{' '}
          <code>creative_pod_runs</code> migration on Postgres when ready; local file storage still
          works for testing.
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New banner run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefilledFromRunId && (
              <Alert variant="info">
                <p>
                  Prefilled from Run #{prefilledFromRunId} — all fields below are editable. File
                  inputs can&apos;t be prefilled by the browser, so you must upload the product image
                  (and lifestyle images, if any) again to submit.
                </p>
                {prefilledImages.length > 0 && (
                  <div className="mt-3">
                    <BannerImageGrid images={prefilledImages} altPrefix="Previous reference" />
                  </div>
                )}
              </Alert>
            )}

            <div className="space-y-1.5">
              <FieldLabelRow htmlFor="cp-brief" label="Brief" info={FIELD_HELP.brief} />
              <Textarea
                id="cp-brief"
                value={briefText}
                onChange={(event) => setBriefText(event.target.value)}
                rows={4}
                placeholder="e.g. Diwali gifting hero for crystal earrings collection — traffic to collection page"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabelRow label="Goal" info={FIELD_HELP.goal} />
                <Select
                  value={goalType || AUTO_VALUE}
                  onValueChange={(value) => setGoalType(value === AUTO_VALUE ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_VALUE}>Auto-map from brief</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.goal_type} value={goal.goal_type}>
                        {goal.label || goal.goal_type}
                        {goal.funnel ? ` · ${goal.funnel}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabelRow htmlFor="cp-platform" label="Platform" info={FIELD_HELP.platform} />
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="cp-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.length ? (
                      platforms.map((row) => (
                        <SelectItem key={row.platform} value={row.platform}>
                          {row.label}
                          {row.category ? ` (${row.category})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="website">Our website</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedPlatform?.description && <p className={META_CLASS}>{selectedPlatform.description}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabelRow htmlFor="cp-goal-detail" label="Goal detail (optional)" info={FIELD_HELP.goalDetail} />
                <Input
                  id="cp-goal-detail"
                  value={goalDetail}
                  onChange={(event) => setGoalDetail(event.target.value)}
                  placeholder="Extra nuance for the strategist"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabelRow label="Vertical" info={FIELD_HELP.brandLane} />
                <Select
                  value={brandLane || AUTO_VALUE}
                  onValueChange={(value) => setBrandLane(value === AUTO_VALUE ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AUTO_VALUE}>Auto-classify from brief</SelectItem>
                    {brandLanes.map((row) => (
                      <SelectItem key={row.value} value={row.value}>
                        {row.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabelRow label="Image variants" info={FIELD_HELP.variantCount} />
                <Select value={String(variantCount)} onValueChange={(value) => setVariantCount(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANT_COUNT_OPTIONS.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabelRow label="Text render mode" info={FIELD_HELP.textRenderMode} />
                <Select value={textRenderMode} onValueChange={setTextRenderMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_RENDER_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow label="Text-safe space" info={FIELD_HELP.titlePosition} />
              <Select
                value={titlePosition || AUTO_VALUE}
                onValueChange={(value) => setTitlePosition(value === AUTO_VALUE ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO_VALUE}>Auto (Director picks)</SelectItem>
                  {textPlacements.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow label="Image model(s)" info={FIELD_HELP.imageModelMulti} />
              <div className="grid gap-2 sm:grid-cols-2">
                {imageModels.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedImageModels.includes(option.value)}
                      onCheckedChange={() => toggleImageModelSelection(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
                {!imageModels.length && <p className={META_CLASS}>No models loaded yet.</p>}
              </div>
              {selectedImageModels.length === 0 && (
                <p className={META_CLASS}>
                  None checked = Auto (
                  {imageModels.find((m) => m.value === defaultImageModel)?.label || defaultImageModel || 'default'}
                  ).
                </p>
              )}
              {selectedImageModels.length === 1 && (
                <p className={META_CLASS}>Single model — this run's primary result.</p>
              )}
              {selectedImageModels.length > 1 && (
                <p className={META_CLASS}>
                  First checked (
                  {imageModels.find((m) => m.value === selectedImageModels[0])?.label || selectedImageModels[0]}) is
                  the primary result. The other {selectedImageModels.length - 1} will be generated and evaluated as
                  comparisons, stored on this same run, right after.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow
                htmlFor="cp-text-model-filter"
                label="Text model (Strategist/Copywriter/Director)"
                info={FIELD_HELP.textModel}
              />
              <Input
                id="cp-text-model-filter"
                value={textModelFilter}
                onChange={(event) => setTextModelFilter(event.target.value)}
                placeholder={`Search ${textModels.length || ''} models…`}
              />
              <Select
                value={textModel || AUTO_VALUE}
                onValueChange={(value) => setTextModel(value === AUTO_VALUE ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO_VALUE}>Auto (default)</SelectItem>
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
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabelRow htmlFor="cp-custom-width" label="Custom width (px)" info={FIELD_HELP.customWidth} />
                <Input
                  id="cp-custom-width"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)}
                  placeholder="optional — platform default"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabelRow htmlFor="cp-custom-height" label="Custom height (px)" info={FIELD_HELP.customHeight} />
                <Input
                  id="cp-custom-height"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)}
                  placeholder="optional — platform default"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow htmlFor="cp-product-image" label="Product image (required)" info={FIELD_HELP.productImage} />
              <input
                id="cp-product-image"
                type="file"
                accept="image/*"
                onChange={(event) => setProductImageFile(event.target.files?.[0] || null)}
                className="block w-full text-sm text-[var(--color-foreground)] file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-[var(--color-secondary)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-secondary-foreground)] hover:file:opacity-90"
              />
              {productImageFile && <p className={META_CLASS}>{productImageFile.name}</p>}
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow
                htmlFor="cp-product-description"
                label="Product description (optional)"
                info={FIELD_HELP.productDescription}
              />
              <Textarea
                id="cp-product-description"
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
                placeholder="e.g. rigid open-cuff bangle, single CZ stone, split-wire silhouette — NOT a ring, NOT a chain-link bracelet"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow
                htmlFor="cp-lifestyle-images"
                label="Lifestyle reference images (optional)"
                info={FIELD_HELP.lifestyleImages}
              />
              <input
                id="cp-lifestyle-images"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setLifestyleImageFiles(Array.from(event.target.files || []))}
                className="block w-full text-sm text-[var(--color-foreground)] file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-[var(--color-secondary)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-secondary-foreground)] hover:file:opacity-90"
              />
              {lifestyleImageFiles.length > 0 && (
                <p className={META_CLASS}>
                  {lifestyleImageFiles.length} file{lifestyleImageFiles.length === 1 ? '' : 's'} selected
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <FieldLabelRow htmlFor="cp-notify-emails" label="Notify emails" info={FIELD_HELP.notifyEmails} />
              <Input
                id="cp-notify-emails"
                value={notifyEmails}
                onChange={(event) => setNotifyEmails(event.target.value)}
                placeholder="you@minaki.com, team@minaki.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-3">
            <Button onClick={createCreativePodRun} disabled={isSubmitting}>
              {isSubmitting ? 'Generating banners…' : 'Generate banners'}
            </Button>
            {isSubmitting && (
              <p className={META_CLASS}>
                Creative Pod runs strategist → copy → director → image gen. Keep this tab open.
                {selectedImageModels.length > 1
                  ? ` Then compares against ${selectedImageModels.length - 1} additional model${
                      selectedImageModels.length - 1 === 1 ? '' : 's'
                    }.`
                  : ''}
              </p>
            )}
          </CardFooter>
        </Card>

        {activeRun && (
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>
                Run #{activeRun.runId} — {activeRun.status}
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => prefillFormFromRun(activeRun)}>
                Prefill form to rerun with changes
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeRun.errorMessage && <Alert variant="destructive">{activeRun.errorMessage}</Alert>}
              <div className="flex flex-wrap items-center gap-2">
                <p className={META_CLASS}>
                  {[activeRun.goalType, activeRun.platformLabel || activeRun.platform].filter(Boolean).join(' · ')}
                </p>
                {activeRun.brandLane && (
                  <Badge variant={laneBadgeVariant(activeRun.brandLane)}>{activeRun.brandLane}</Badge>
                )}
              </div>

              {(activeRun.inImageTitle || activeRun.inImageSubtitle || activeRun.inImageCta) && (
                <div className={BLOCK_CLASS}>
                  <h3 className="text-sm font-semibold">In-image copy</h3>
                  {activeRun.inImageTitle && (
                    <p className="text-sm">
                      <strong className="font-semibold">Title:</strong> {activeRun.inImageTitle}
                    </p>
                  )}
                  {activeRun.inImageSubtitle && (
                    <p className="text-sm">
                      <strong className="font-semibold">Subtitle:</strong> {activeRun.inImageSubtitle}
                    </p>
                  )}
                  {activeRun.inImageCta && (
                    <p className="text-sm">
                      <strong className="font-semibold">CTA:</strong> {activeRun.inImageCta}
                    </p>
                  )}
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
                <div className="space-y-4">
                  {variantCards.map((variantCard) => (
                    <div key={`variant-${variantCard.variantIndex}`} className={BLOCK_CLASS}>
                      <h3 className="text-sm font-semibold">
                        Variant {variantCard.variantIndex}
                        {variantCard.diversityLabel ? ` — ${variantCard.diversityLabel}` : ''}
                      </h3>
                      {variantCard.castingKey && <p className={META_CLASS}>Casting: {variantCard.castingKey}</p>}
                      {variantCard.ocr && (
                        <p className="flex flex-wrap items-center gap-2 text-sm">
                          <span>Text QA:</span>
                          <Badge variant={variantCard.ocr.pass ? 'success' : 'warning'}>
                            {variantCard.ocr.pass ? 'Pass' : 'Needs review'}
                          </Badge>
                          {!variantCard.ocr.pass && (variantCard.ocr.reasons || []).length > 0 && (
                            <span className={META_CLASS}>{variantCard.ocr.reasons.join('; ')}</span>
                          )}
                          {variantCard.ocr.attempt ? <span className={META_CLASS}>attempt {variantCard.ocr.attempt}</span> : null}
                          {variantCard.ocr.image_model ? (
                            <span className={META_CLASS}>{variantCard.ocr.image_model}</span>
                          ) : null}
                        </p>
                      )}
                      {variantCard.imageUrls.length > 0 ? (
                        <BannerImageGrid
                          images={variantCard.imageUrls}
                          altPrefix={`Creative pod variant ${variantCard.variantIndex}`}
                        />
                      ) : (
                        <p className={META_CLASS}>No images for this variant.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <BannerImageGrid images={bannerImageUrls} altPrefix="Creative pod banner" />
              )}

              {activeRun.emailNotification && (
                <p className="text-sm">
                  Email:{' '}
                  {activeRun.emailNotification.success
                    ? activeRun.emailNotification.message || 'sent'
                    : activeRun.emailNotification.error || activeRun.emailNotification.message || 'skipped/failed'}
                </p>
              )}

              <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
                <div className="space-y-1.5">
                  <FieldLabelRow htmlFor="cp-regen-hint" label="Regenerate hint" info={FIELD_HELP.regenerateHint} />
                  <Input
                    id="cp-regen-hint"
                    value={regenerateHint}
                    onChange={(event) => setRegenerateHint(event.target.value)}
                    placeholder="e.g. darker background, sharper product, shorter headline"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabelRow
                    htmlFor="cp-regen-product-description"
                    label="Product description (optional)"
                    info={FIELD_HELP.productDescription}
                  />
                  <Textarea
                    id="cp-regen-product-description"
                    value={regenerateProductDescription}
                    onChange={(event) => setRegenerateProductDescription(event.target.value)}
                    placeholder="e.g. rigid open-cuff bangle, single CZ stone, split-wire silhouette — NOT a ring, NOT a chain-link bracelet"
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <FieldLabelRow label="Image model" info={FIELD_HELP.imageModel} />
                    <Select
                      value={regenerateImageModel || AUTO_VALUE}
                      onValueChange={(value) => setRegenerateImageModel(value === AUTO_VALUE ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUTO_VALUE}>Auto (Seedream 4.5)</SelectItem>
                        {imageModels.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabelRow label="Text-safe space" info={FIELD_HELP.titlePosition} />
                    <Select
                      value={regenerateTitlePosition || AUTO_VALUE}
                      onValueChange={(value) => setRegenerateTitlePosition(value === AUTO_VALUE ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUTO_VALUE}>Auto (Director picks)</SelectItem>
                        {textPlacements.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabelRow
                      label="Vertical"
                      info="Casting/color-lock override only — regenerate never re-runs the Director, so this can't rewrite prompt text."
                    />
                    <Select
                      value={regenerateBrandLane || AUTO_VALUE}
                      onValueChange={(value) => setRegenerateBrandLane(value === AUTO_VALUE ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AUTO_VALUE}>Keep run's lane</SelectItem>
                        {brandLanes.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={regenerateBanners} disabled={isSubmitting}>
                  {isSubmitting ? 'Regenerating…' : 'Regenerate banners'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>Recent runs</CardTitle>
            <Button variant="outline" size="sm" onClick={loadRecentRuns} disabled={recentRunsLoading}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {recentRunsLoading ? (
              <LoadingSpinner message="Loading runs…" />
            ) : (
              <div className="space-y-3">
                <p className={META_CLASS}>{recentRunsTotal} total runs</p>
                <AgentsPagedTable
                  columns={RUN_COLUMNS}
                  rows={recentRuns}
                  selectedRowId={activeRun?.runId}
                  getRowId={(row) => row.id}
                  emptyLabel="No runs yet."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
