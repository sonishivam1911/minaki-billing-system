import React, { useEffect, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';
import {
  approvalStatusClass,
  collectHttpImageUrls,
  normalizeCampaignRunForDisplay,
} from './campaignCreativeRun';

const RECENT_RUNS_LIMIT = 15;
const POSTS_PER_WEEK_OPTIONS = [3, 5, 7, 14];

export const CampaignCreativePage = () => {
  const [brandKits, setBrandKits] = useState([]);
  const [brandKitId, setBrandKitId] = useState('modern');
  const [campaignGoal, setCampaignGoal] = useState('awareness');
  const [postsPerWeek, setPostsPerWeek] = useState(5);
  const [horizonDays, setHorizonDays] = useState(14);
  const [notifyEmails, setNotifyEmails] = useState('');
  const [schemaReady, setSchemaReady] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);
  const [regenerateHint, setRegenerateHint] = useState('');

  const loadBrandKits = async () => {
    try {
      const response = await agentsApi.listCampaignBrandKits();
      setBrandKits(response.kits || []);
      setSchemaReady(response.schema_ready !== false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const loadRecentRuns = async () => {
    setRecentRunsLoading(true);
    try {
      const response = await agentsApi.listCampaignRuns({ limit: RECENT_RUNS_LIMIT });
      setRecentRuns(response.items || []);
      setRecentRunsTotal(response.total || 0);
      setSchemaReady(response.schema_ready !== false);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRecentRunsLoading(false);
    }
  };

  useEffect(() => {
    loadBrandKits();
    loadRecentRuns();
  }, []);

  const createCampaignRun = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.createCampaignRun({
        brand_kit_id: brandKitId,
        campaign_goal: campaignGoal.trim() || 'awareness',
        posts_per_week: postsPerWeek,
        horizon_days: horizonDays,
        notify_emails: notifyEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
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
      const runRow = await agentsApi.getCampaignRun(runId);
      setActiveRun(normalizeCampaignRunForDisplay(runRow));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveTheme = async (themeKey, approvalStatus) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.approveCampaignTheme(activeRun.runId, themeKey, {
        approval_status: approvalStatus,
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateTheme = async (themeKey) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.regenerateCampaignTheme(activeRun.runId, themeKey, {
        hint: regenerateHint,
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
      setRegenerateHint('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const produceTheme = async (themeKey) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.produceCampaignTheme(activeRun.runId, themeKey);
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const produceAllApproved = async () => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.produceAllApprovedCampaignThemes(activeRun.runId);
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveAsset = async (themeKey, assetId, approvalStatus) => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.approveCampaignAsset(activeRun.runId, themeKey, {
        asset_id: assetId,
        approval_status: approvalStatus,
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeCampaign = async () => {
    if (!activeRun?.runId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.finalizeCampaignRun(activeRun.runId, {
        notify_emails: notifyEmails
          .split(',')
          .map((email) => email.trim())
          .filter(Boolean),
      });
      setActiveRun(normalizeCampaignRunForDisplay(response));
      await loadRecentRuns();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themes = activeRun?.themes || [];

  return (
    <div className="screen-container agents-page">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Campaign Creative</h1>
          <p className="screen-subtitle">
            Plan Instagram UGC campaigns, approve themes, produce assets, and download ZIP packs
          </p>
        </div>
      </div>
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.campaign} />
      {errorMessage && (
        <ErrorMessage message={errorMessage} onRetry={() => setErrorMessage(null)} />
      )}

      {!schemaReady && (
        <div className="agents-card agents-alert">
          <p>
            Campaign creative runs table is missing. Apply{' '}
            <code>homelab-contabo/scripts/migrations/minaki_agents_campaign_creative_pod.sql</code>{' '}
            on Postgres.
          </p>
        </div>
      )}

      <section className="agents-card">
        <h2 className="agents-section-title">New campaign run</h2>
        <div className="agents-form-stack">
          <label>
            Brand kit
            <select value={brandKitId} onChange={(event) => setBrandKitId(event.target.value)}>
              {brandKits.map((kit) => (
                <option key={kit.id} value={kit.id}>
                  {kit.label} — {kit.description}
                </option>
              ))}
              {!brandKits.length && (
                <>
                  <option value="modern">Modern</option>
                  <option value="traditional">Traditional</option>
                </>
              )}
            </select>
          </label>

          <label>
            Campaign goal
            <input
              value={campaignGoal}
              onChange={(event) => setCampaignGoal(event.target.value)}
              placeholder="e.g. awareness, gifting season, everyday wear"
            />
          </label>

          <label>
            Posts per week
            <select
              value={postsPerWeek}
              onChange={(event) => setPostsPerWeek(Number(event.target.value))}
            >
              {POSTS_PER_WEEK_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label>
            Horizon (days)
            <input
              type="number"
              min={7}
              max={28}
              value={horizonDays}
              onChange={(event) => setHorizonDays(Number(event.target.value))}
            />
          </label>

          <label>
            Notify emails (comma-separated)
            <input
              value={notifyEmails}
              onChange={(event) => setNotifyEmails(event.target.value)}
              placeholder="you@minaki.com, team@minaki.com"
            />
          </label>

          <div className="agents-actions-row">
            <button
              type="button"
              className="agents-btn primary"
              onClick={createCampaignRun}
              disabled={isSubmitting || !schemaReady}
            >
              {isSubmitting ? 'Generating plan…' : 'Create campaign plan'}
            </button>
          </div>
        </div>
        {isSubmitting && (
          <p className="agents-muted-inline">LLM is building your 2-week theme calendar. Keep this tab open.</p>
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
          {activeRun.strategySummary && (
            <p className="agents-lead">{activeRun.strategySummary}</p>
          )}

          <div className="agents-actions-row compact">
            <button
              type="button"
              className="agents-btn secondary"
              onClick={produceAllApproved}
              disabled={isSubmitting}
            >
              Produce all approved themes
            </button>
            <button
              type="button"
              className="agents-btn primary"
              onClick={finalizeCampaign}
              disabled={isSubmitting}
            >
              Finalize &amp; email ZIP
            </button>
            {activeRun.zipUrl && (
              <a className="agents-btn secondary" href={activeRun.zipUrl} target="_blank" rel="noreferrer">
                Download ZIP
              </a>
            )}
          </div>

          <label>
            Regenerate hint (optional, applies to next theme regen)
            <input
              value={regenerateHint}
              onChange={(event) => setRegenerateHint(event.target.value)}
              placeholder="e.g. more gifting angle, less product-forward"
            />
          </label>

          {themes.map((theme) => {
            const frameUrls = collectHttpImageUrls(theme.ugc_package?.frames || []);
            return (
              <div key={theme.theme_key} className="agents-copy-block">
                <h3>
                  {theme.name || theme.theme_key}{' '}
                  <span className={approvalStatusClass(theme.approval_status)}>
                    ({theme.approval_status || 'pending'})
                  </span>
                </h3>
                <p className="agents-muted">
                  {theme.scheduled_date} · {theme.angle}
                </p>
                {theme.hook && <p><strong>Hook:</strong> {theme.hook}</p>}
                {theme.caption_draft && (
                  <p className="agents-lead">{theme.caption_draft}</p>
                )}
                {(theme.qc_issues || []).length > 0 && (
                  <p className="agents-validation">QC: {theme.qc_issues.join('; ')}</p>
                )}

                <div className="agents-actions-row compact">
                  <button
                    type="button"
                    className="agents-btn secondary"
                    onClick={() => approveTheme(theme.theme_key, 'approved')}
                    disabled={isSubmitting}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="agents-btn secondary"
                    onClick={() => approveTheme(theme.theme_key, 'rejected')}
                    disabled={isSubmitting}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="agents-btn secondary"
                    onClick={() => regenerateTheme(theme.theme_key)}
                    disabled={isSubmitting}
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    className="agents-btn primary"
                    onClick={() => produceTheme(theme.theme_key)}
                    disabled={isSubmitting || theme.approval_status !== 'approved'}
                  >
                    Produce UGC
                  </button>
                </div>

                {frameUrls.length > 0 && (
                  <div className="agents-banner-grid">
                    {frameUrls.map((imageUrl) => (
                      <a
                        key={imageUrl}
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="agents-banner-cell"
                      >
                        <img src={imageUrl} alt="UGC frame" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}

                {theme.ugc_package && (
                  <div className="agents-copy-block nested">
                    <h4>Asset review</h4>
                    {theme.ugc_package.caption && (
                      <div className="agents-actions-row compact">
                        <span className={approvalStatusClass(theme.ugc_package.caption.approval_status)}>
                          Caption ({theme.ugc_package.caption.approval_status || 'pending'})
                        </span>
                        <button
                          type="button"
                          className="agents-btn secondary"
                          onClick={() => approveAsset(theme.theme_key, 'caption', 'approved')}
                          disabled={isSubmitting}
                        >
                          Approve caption
                        </button>
                        <button
                          type="button"
                          className="agents-btn secondary"
                          onClick={() => approveAsset(theme.theme_key, 'caption', 'rejected')}
                          disabled={isSubmitting}
                        >
                          Reject caption
                        </button>
                      </div>
                    )}
                    {(theme.ugc_package.frames || []).map((frame) => (
                      <div key={frame.asset_id} className="agents-actions-row compact">
                        <span className={approvalStatusClass(frame.approval_status)}>
                          {frame.asset_id} ({frame.approval_status || 'pending'})
                        </span>
                        <button
                          type="button"
                          className="agents-btn secondary"
                          onClick={() => approveAsset(theme.theme_key, frame.asset_id, 'approved')}
                          disabled={isSubmitting}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="agents-btn secondary"
                          onClick={() => approveAsset(theme.theme_key, frame.asset_id, 'rejected')}
                          disabled={isSubmitting}
                        >
                          Reject
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
            <table className="agents-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Kit</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((runRow) => (
                  <tr key={runRow.id}>
                    <td>{runRow.id}</td>
                    <td>{runRow.brand_kit_id || '—'}</td>
                    <td>{runRow.status}</td>
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
