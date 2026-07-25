import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
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
  { value: 'burned_in', label: 'Burned-in text (default)' },
  { value: 'overlay', label: 'Overlay (legacy)' },
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
    'Burned-in paints Title/Subtitle/CTA into the image (preferred). Overlay keeps text separate for legacy HTML overlays.',
  customWidth:
    'Optional pixel width. Leave blank to use the platform preset. Pair with height when you need a custom crop.',
  customHeight:
    'Optional pixel height. Leave blank to use the platform preset. Pair with width when you need a custom crop.',
  productImage:
    'Required SKU photo. Ref 1 is product ground truth — metal, stones, and silhouette must match this image in every banner.',
  lifestyleImages:
    'Optional mood photos (model, setting, lighting). Used for vibe only — they do not replace the product SKU.',
  notifyEmails:
    'Comma-separated addresses that get a completion email with banner links when the run finishes (or fails).',
  regenerateHint:
    'Tell the agent what to fix on regenerate — e.g. darker background, shorter headline, sharper product, different pose.',
};

export const CreativePodPage = () => {
  const [goals, setGoals] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [schemaReady, setSchemaReady] = useState(true);
  const [briefText, setBriefText] = useState('');
  const [goalType, setGoalType] = useState('');
  const [goalDetail, setGoalDetail] = useState('');
  const [platform, setPlatform] = useState('website');
  const [variantCount, setVariantCount] = useState(2);
  const [textRenderMode, setTextRenderMode] = useState('burned_in');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [productImageFile, setProductImageFile] = useState(null);
  const [lifestyleImageFiles, setLifestyleImageFiles] = useState([]);
  const [regenerateHint, setRegenerateHint] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);

  const loadCatalog = async () => {
    try {
      const [goalsResponse, platformsResponse] = await Promise.all([
        agentsApi.listCreativePodGoals(),
        agentsApi.listCreativePodPlatforms(),
      ]);
      setGoals(goalsResponse.goals || []);
      setPlatforms(platformsResponse.platforms || []);
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
      setErrorMessage('Upload a product reference image');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
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
        notifyEmails: parseCommaSeparatedEmails(notifyEmails),
      });
      setActiveRun(normalizeCreativePodRunForDisplay(response));
      await loadRecentRuns();
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
      const runRow = await agentsApi.getCreativePodRun(runId);
      setActiveRun(normalizeCreativePodRunForDisplay(runRow));
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
          </p>
        )}
      </section>

      {activeRun && (
        <section className="agents-card">
          <h2 className="agents-section-title">
            Run #{activeRun.runId} — {activeRun.status}
          </h2>
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
