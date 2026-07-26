import React, { useEffect, useMemo, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { LoadingSpinner, ErrorMessage } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { fmtMoney, fmtNum, fmtRoas } from '../../utils/marketingFormat';
import {
  campaignOptionLabel,
  defaultPortfolioDateRange,
  normalizeMetaPortfolioRun,
} from './portfolioRun';

const RECENT_RUNS_LIMIT = 15;
const RESOLUTION_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const MetricsStrip = ({ metrics = {} }) => (
  <div className="agents-summary-grid">
    <div className="agents-summary-card">
      <span>Spend</span>
      <strong>{fmtMoney(metrics.spend)}</strong>
    </div>
    <div className="agents-summary-card">
      <span>Clicks</span>
      <strong>{fmtNum(metrics.clicks)}</strong>
    </div>
    <div className="agents-summary-card">
      <span>Add to cart</span>
      <strong>{fmtNum(metrics.add_to_cart)}</strong>
    </div>
    <div className="agents-summary-card">
      <span>Purchases</span>
      <strong>{fmtNum(metrics.purchases)}</strong>
    </div>
    <div className="agents-summary-card">
      <span>Purchase value</span>
      <strong>{fmtMoney(metrics.purchase_value)}</strong>
    </div>
    <div className="agents-summary-card">
      <span>ROAS</span>
      <strong>{fmtRoas(metrics.roas)}</strong>
    </div>
  </div>
);

const PeriodTable = ({ rows = [], title }) => (
  <div className="agents-table-wrap">
    <h4>{title}</h4>
    <table className="agents-table">
      <thead>
        <tr>
          <th>Period</th>
          <th>Spend</th>
          <th>Clicks</th>
          <th>ATC</th>
          <th>Purchases</th>
          <th>Purchase ₹</th>
          <th>ROAS</th>
        </tr>
      </thead>
      <tbody>
        {(rows || []).length === 0 ? (
          <tr>
            <td colSpan={7}>No period buckets</td>
          </tr>
        ) : (
          rows.map((bucket) => {
            const metrics = bucket.metrics || {};
            return (
              <tr key={bucket.period}>
                <td>{bucket.period}</td>
                <td>{fmtMoney(metrics.spend)}</td>
                <td>{fmtNum(metrics.clicks)}</td>
                <td>{fmtNum(metrics.add_to_cart)}</td>
                <td>{fmtNum(metrics.purchases)}</td>
                <td>{fmtMoney(metrics.purchase_value)}</td>
                <td>{fmtRoas(metrics.roas)}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export const MetaMarketingPage = () => {
  const { userInfo } = useAuth();
  const defaults = useMemo(() => defaultPortfolioDateRange(), []);
  const role = String(userInfo?.role || '').toLowerCase();
  const canViewAllRuns = role === 'admin' || role === 'manager';

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
  const [since, setSince] = useState(defaults.since);
  const [until, setUntil] = useState(defaults.until);
  const [resolution, setResolution] = useState('week');
  const [includeCreatives, setIncludeCreatives] = useState(true);
  const [includeShopify, setIncludeShopify] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [recentRuns, setRecentRuns] = useState([]);
  const [recentRunsTotal, setRecentRunsTotal] = useState(0);
  const [recentRunsLoading, setRecentRunsLoading] = useState(false);
  const [historyScope, setHistoryScope] = useState('mine');
  const [schemaReady, setSchemaReady] = useState(true);
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  const filteredCampaigns = useMemo(() => {
    const needle = campaignFilter.trim().toLowerCase();
    if (!needle) return campaigns;
    return campaigns.filter((campaign) => {
      const label = campaignOptionLabel(campaign).toLowerCase();
      return label.includes(needle) || String(campaign.id).includes(needle);
    });
  }, [campaigns, campaignFilter]);

  const loadCampaigns = async (refresh = false) => {
    setLoadingCampaigns(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.listMetaCampaigns({ limit: 500, refresh });
      setCampaigns(response.campaigns || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadRecentRuns = async (scopeOverride) => {
    setRecentRunsLoading(true);
    try {
      const scope = scopeOverride || historyScope || 'mine';
      const response = await agentsApi.listMetaPortfolioRuns({
        limit: RECENT_RUNS_LIMIT,
        scope: canViewAllRuns ? scope : 'mine',
      });
      setRecentRuns(response.items || []);
      setRecentRunsTotal(response.total || 0);
      if (response.scope) setHistoryScope(response.scope);
      if (response.schema_ready === false) setSchemaReady(false);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setRecentRunsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns(false);
    loadRecentRuns(canViewAllRuns ? historyScope : 'mine');
  }, []);

  const toggleCampaign = (campaignId) => {
    setSelectedCampaignIds((current) =>
      current.includes(campaignId)
        ? current.filter((id) => id !== campaignId)
        : [...current, campaignId]
    );
  };

  const selectFiltered = () => {
    setSelectedCampaignIds((current) => {
      const next = new Set(current);
      filteredCampaigns.forEach((campaign) => next.add(String(campaign.id)));
      return Array.from(next);
    });
  };

  const clearSelection = () => setSelectedCampaignIds([]);

  const createPortfolioRun = async () => {
    if (!selectedCampaignIds.length) {
      setErrorMessage('Select at least one Meta campaign');
      return;
    }
    if (!since || !until) {
      setErrorMessage('Choose a date range');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.createMetaPortfolioRun({
        campaign_ids: selectedCampaignIds,
        since,
        until,
        resolution,
        include_creatives: includeCreatives,
        include_shopify: includeShopify,
        send_email: sendEmail,
      });
      const normalized = normalizeMetaPortfolioRun(response);
      setActiveRun(normalized);
      setExpandedCampaignId(normalized.campaigns?.[0]?.campaign_id || null);
      await loadRecentRuns(canViewAllRuns ? historyScope : 'mine');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRun = async (runId) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.getMetaPortfolioRun(runId);
      const normalized = normalizeMetaPortfolioRun(response);
      setActiveRun(normalized);
      setExpandedCampaignId(normalized.campaigns?.[0]?.campaign_id || null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shopify = activeRun?.shopify || null;

  return (
    <div className="screen-container agents-page">
      <AgentsSubnav />
      <div className="agents-header">
        <div>
          <h1>Meta Marketing</h1>
          <p>
            Meta Portfolio Performance — multi-select campaigns, day/week/month buckets, store-wide
            Shopify appendix. Runs are saved to your history.
          </p>
        </div>
      </div>

      {!schemaReady && (
        <p className="agents-hint">
          Portfolio runs table missing or file-fallback active. Apply{' '}
          <code>api/scripts/migrations/minaki_marketing_portfolio_runs.sql</code> when ready.
        </p>
      )}

      {errorMessage && <ErrorMessage message={errorMessage} />}

      <div className="agents-card agents-form-stack">
        <div className="agents-form-row">
          <label>
            Since
            <input type="date" value={since} onChange={(event) => setSince(event.target.value)} />
          </label>
          <label>
            Until
            <input type="date" value={until} onChange={(event) => setUntil(event.target.value)} />
          </label>
          <label>
            Resolution
            <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
              {RESOLUTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="agents-form-row">
          <label className="agents-checkbox">
            <input
              type="checkbox"
              checked={includeCreatives}
              onChange={(event) => setIncludeCreatives(event.target.checked)}
            />
            Include creatives
          </label>
          <label className="agents-checkbox">
            <input
              type="checkbox"
              checked={includeShopify}
              onChange={(event) => setIncludeShopify(event.target.checked)}
            />
            Include Shopify appendix
          </label>
          <label className="agents-checkbox">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            Email digest
          </label>
        </div>

        <div className="agents-form-row">
          <label>
            Filter campaigns
            <input
              type="search"
              value={campaignFilter}
              onChange={(event) => setCampaignFilter(event.target.value)}
              placeholder="Name, TOF/MOF/BOF, status, or ID"
            />
          </label>
          <div className="agents-inline-actions">
            <button type="button" className="agents-btn secondary" onClick={() => loadCampaigns(true)}>
              Refresh from Meta
            </button>
            <button type="button" className="agents-btn secondary" onClick={selectFiltered}>
              Select filtered
            </button>
            <button type="button" className="agents-btn secondary" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </div>

        <div className="agents-table-wrap agents-campaign-picker">
          <div className="agents-inline-actions">
            <strong>
              Campaigns ({selectedCampaignIds.length} selected
              {loadingCampaigns ? ', loading…' : ''})
            </strong>
          </div>
          <table className="agents-table">
            <thead>
              <tr>
                <th></th>
                <th>Campaign</th>
                <th>Funnel</th>
                <th>Status</th>
                <th>Objective</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5}>{loadingCampaigns ? 'Loading…' : 'No campaigns'}</td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const campaignId = String(campaign.id);
                  const funnel = campaign.funnel_mode?.mode || 'MOF';
                  return (
                    <tr key={campaignId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCampaignIds.includes(campaignId)}
                          onChange={() => toggleCampaign(campaignId)}
                        />
                      </td>
                      <td>{campaign.name || campaignId}</td>
                      <td>
                        <span className={`agents-chip funnel-${funnel.toLowerCase()}`}>{funnel}</span>
                      </td>
                      <td>{campaign.effective_status || campaign.status || '—'}</td>
                      <td>{campaign.objective || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="agents-btn primary"
          disabled={isSubmitting || !selectedCampaignIds.length}
          onClick={createPortfolioRun}
        >
          {isSubmitting ? 'Running portfolio…' : 'Run Meta Portfolio Performance'}
        </button>
      </div>

      {isSubmitting && !activeRun && <LoadingSpinner />}

      {activeRun && (
        <div className="agents-card agents-result-stack">
          <div className="agents-inline-actions">
            <h2>
              Run #{activeRun.runId} · {activeRun.since} → {activeRun.until} ·{' '}
              {activeRun.resolutionLabel || activeRun.resolution}
            </h2>
            <span className="agents-chip">{activeRun.status}</span>
          </div>
          {activeRun.error && <ErrorMessage message={activeRun.error} />}
          {(activeRun.notes || []).map((note) => (
            <p key={note} className="agents-hint">
              {note}
            </p>
          ))}

          <h3>1) Portfolio overall</h3>
          <MetricsStrip metrics={activeRun.portfolioOverall} />

          <PeriodTable
            title={`2) Portfolio by ${activeRun.resolutionLabel || 'period'}`}
            rows={activeRun.portfolioByPeriod}
          />

          <h3>3) Campaigns</h3>
          {(activeRun.campaigns || []).map((campaign) => {
            const isOpen = expandedCampaignId === campaign.campaign_id;
            const funnel = campaign.funnel_mode || {};
            return (
              <div key={campaign.campaign_id} className="agents-card agents-nested-card">
                <button
                  type="button"
                  className="agents-accordion-toggle"
                  onClick={() =>
                    setExpandedCampaignId(isOpen ? null : campaign.campaign_id)
                  }
                >
                  <span>
                    {campaign.campaign_name}{' '}
                    <span className="agents-chip">{funnel.mode || 'MOF'}</span>
                  </span>
                  <span>{isOpen ? 'Hide' : 'Show'}</span>
                </button>
                {isOpen && (
                  <div className="agents-form-stack">
                    <p className="agents-hint">
                      {funnel.label || 'Funnel mode'} · Objective {campaign.objective || '—'} ·{' '}
                      {campaign.status || '—'}
                    </p>
                    <MetricsStrip metrics={campaign.overall || {}} />
                    <PeriodTable
                      title={`By ${activeRun.resolutionLabel || 'period'}`}
                      rows={campaign.by_period || []}
                    />

                    {(campaign.audience?.by_gender || []).length > 0 && (
                      <div className="agents-table-wrap">
                        <h4>Audience — gender</h4>
                        <table className="agents-table">
                          <thead>
                            <tr>
                              <th>Gender</th>
                              <th>Spend</th>
                              <th>ATC</th>
                              <th>Purchases</th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaign.audience.by_gender.map((row) => (
                              <tr key={row.segment}>
                                <td>{row.segment}</td>
                                <td>{fmtMoney(row.spend)}</td>
                                <td>{fmtNum(row.add_to_cart)}</td>
                                <td>{fmtNum(row.purchases)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(campaign.ad_sets || []).length > 0 && (
                      <div className="agents-table-wrap">
                        <h4>Ad sets</h4>
                        <table className="agents-table">
                          <thead>
                            <tr>
                              <th>Ad set</th>
                              <th>Audience</th>
                              <th>Spend</th>
                              <th>ATC</th>
                              <th>Purchases</th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaign.ad_sets.map((adSet) => {
                              const audience = adSet.audience || {};
                              const metrics = adSet.metrics || {};
                              return (
                                <tr key={adSet.ad_set_id || adSet.ad_set_name}>
                                  <td>
                                    {adSet.ad_set_name}
                                    <div className="agents-hint">{adSet.status || '—'}</div>
                                  </td>
                                  <td>
                                    {audience.genders || '—'}; ages {audience.age_range || '—'};{' '}
                                    {audience.countries || '—'}
                                  </td>
                                  <td>{fmtMoney(metrics.spend)}</td>
                                  <td>{fmtNum(metrics.add_to_cart)}</td>
                                  <td>{fmtNum(metrics.purchases)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(campaign.creatives || []).length > 0 && (
                      <div className="agents-table-wrap">
                        <h4>Creatives</h4>
                        <table className="agents-table">
                          <thead>
                            <tr>
                              <th>Ad</th>
                              <th>Format</th>
                              <th>Headline</th>
                              <th>CTA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {campaign.creatives.map((creative, creativeIndex) => (
                              <tr key={`${creative.ad_id || 'ad'}-${creativeIndex}`}>
                                <td>{creative.ad_name || '—'}</td>
                                <td>{creative.format || '—'}</td>
                                <td>{creative.headline || '—'}</td>
                                <td>{creative.call_to_action || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {shopify && (
            <div className="agents-card agents-nested-card">
              <h3>4) Shopify appendix (store-wide)</h3>
              <p className="agents-hint">{shopify.note || 'Store-wide context — not per campaign.'}</p>
              <MetricsStrip
                metrics={{
                  spend: null,
                  clicks: null,
                  add_to_cart: shopify.funnel?.unique_abandoned_checkouts,
                  purchases: shopify.funnel?.paid_orders || shopify.paid_orders_count,
                  purchase_value: shopify.funnel?.order_revenue,
                  roas: shopify.funnel?.checkout_to_order_rate_pct != null
                    ? `${shopify.funnel.checkout_to_order_rate_pct}% checkout→order`
                    : null,
                }}
              />
              <div className="agents-table-wrap">
                <h4>Top focus products</h4>
                <table className="agents-table">
                  <thead>
                    <tr>
                      <th>Lane</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Units</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(shopify.top_products_focus || []).length === 0 ? (
                      <tr>
                        <td colSpan={5}>No focus products</td>
                      </tr>
                    ) : (
                      shopify.top_products_focus.map((product) => (
                        <tr key={`${product.sku}-${product.product_name}`}>
                          <td>{product.focus_lane_label || product.focus_lane || '—'}</td>
                          <td>{product.product_name || '—'}</td>
                          <td>{product.sku || '—'}</td>
                          <td>{fmtNum(product.units_sold)}</td>
                          <td>{fmtMoney(product.revenue_inr)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="agents-card">
        <div className="agents-inline-actions">
          <h3>{historyScope === 'all' ? 'All portfolio runs' : 'Your portfolio history'}</h3>
          {canViewAllRuns && (
            <label className="agents-history-scope">
              Scope
              <select
                value={historyScope}
                onChange={(event) => {
                  const nextScope = event.target.value;
                  setHistoryScope(nextScope);
                  loadRecentRuns(nextScope);
                }}
              >
                <option value="mine">My runs</option>
                <option value="all">All users</option>
              </select>
            </label>
          )}
          <button type="button" className="agents-btn secondary" onClick={() => loadRecentRuns()}>
            Refresh
          </button>
        </div>
        <p className="agents-hint">
          {recentRunsTotal} run{recentRunsTotal === 1 ? '' : 's'}
          {canViewAllRuns ? ' · Admin/manager can switch scope.' : ''}
        </p>
        <div className="agents-table-wrap">
          <table className="agents-table">
            <thead>
              <tr>
                <th>Run</th>
                {historyScope === 'all' && <th>User</th>}
                <th>Window</th>
                <th>Resolution</th>
                <th>Campaigns</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentRunsLoading ? (
                <tr>
                  <td colSpan={historyScope === 'all' ? 7 : 6}>Loading…</td>
                </tr>
              ) : recentRuns.length === 0 ? (
                <tr>
                  <td colSpan={historyScope === 'all' ? 7 : 6}>No saved portfolio runs yet</td>
                </tr>
              ) : (
                recentRuns.map((runRow) => (
                  <tr key={runRow.id}>
                    <td>#{runRow.id}</td>
                    {historyScope === 'all' && (
                      <td>{runRow.created_by_email || '—'}</td>
                    )}
                    <td>
                      {runRow.since || runRow.since_date} → {runRow.until || runRow.until_date}
                    </td>
                    <td>{runRow.resolution}</td>
                    <td>{runRow.campaign_count ?? (runRow.campaign_ids || []).length}</td>
                    <td>{runRow.status}</td>
                    <td>
                      <button
                        type="button"
                        className="agents-btn secondary"
                        onClick={() => openRun(runRow.id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
