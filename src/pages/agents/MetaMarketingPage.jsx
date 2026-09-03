import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { agentsApi } from '../../services/agentsApi';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { LoadingSpinner, ErrorMessage } from '../../components';
import { ReportTable } from '../../components/reports/ReportTable';
import { useAuth } from '../../context/AuthContext';
import { fmtMoney, fmtNum, fmtRoas } from '../../utils/marketingFormat';
import {
  campaignOptionLabel,
  defaultPortfolioDateRange,
  normalizeMetaPortfolioRun,
} from './portfolioRun';

const RECENT_RUNS_LIMIT = 15;
const DEFAULT_STATUS_FILTER = 'ACTIVE';
const ALL_FILTER_VALUE = 'all';
const RESOLUTION_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const campaignStatusValue = (campaign) =>
  String(campaign?.effective_status || campaign?.status || 'UNKNOWN').trim();

const campaignFunnelValue = (campaign) =>
  String(campaign?.funnel_mode?.mode || 'MOF').trim().toUpperCase();

const campaignObjectiveValue = (campaign) =>
  String(campaign?.objective || '—').trim();

const uniqueSortedValues = (values) =>
  Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' })
  );

const matchesFilterValue = (actualValue, selectedValue) => {
  if (!selectedValue || selectedValue === ALL_FILTER_VALUE) return true;
  return String(actualValue).toLowerCase() === String(selectedValue).toLowerCase();
};

const SelectAllCheckbox = ({ checked, indeterminate, onChange, ariaLabel }) => {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="agents-table-checkbox"
      checked={checked}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
      aria-label={ariaLabel}
    />
  );
};

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

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c2416', mb: 1.5, mt: 1 }}>
    {children}
  </Typography>
);

const PERIOD_COLUMNS = [
  { key: 'period', label: 'Period', sortable: false },
  { key: 'spend', label: 'Spend', sortable: false, render: (value) => fmtMoney(value) },
  { key: 'clicks', label: 'Clicks', sortable: false, render: (value) => fmtNum(value) },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: (value) => fmtNum(value) },
  { key: 'purchases', label: 'Purchases', sortable: false, render: (value) => fmtNum(value) },
  { key: 'purchase_value', label: 'Purchase ₹', sortable: false, render: (value) => fmtMoney(value) },
  { key: 'roas', label: 'ROAS', sortable: false, render: (value) => fmtRoas(value) },
];

const flattenPeriodRows = (rows = []) =>
  (rows || []).map((bucket) => {
    const metrics = bucket.metrics || {};
    return {
      id: bucket.period,
      period: bucket.period,
      spend: metrics.spend,
      clicks: metrics.clicks,
      add_to_cart: metrics.add_to_cart,
      purchases: metrics.purchases,
      purchase_value: metrics.purchase_value,
      roas: metrics.roas,
    };
  });

const PeriodTable = ({ rows = [], title }) => (
  <Box sx={{ mb: 2 }}>
    {title && <SectionTitle>{title}</SectionTitle>}
    <ReportTable
      columns={PERIOD_COLUMNS}
      data={flattenPeriodRows(rows)}
      emptyMessage="No period buckets"
    />
  </Box>
);

const GENDER_COLUMNS = [
  { key: 'segment', label: 'Gender', sortable: false },
  { key: 'spend', label: 'Spend', sortable: false, render: (value) => fmtMoney(value) },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: (value) => fmtNum(value) },
  { key: 'purchases', label: 'Purchases', sortable: false, render: (value) => fmtNum(value) },
];

const AD_SET_COLUMNS = [
  {
    key: 'ad_set_name',
    label: 'Ad set',
    sortable: false,
    render: (value, row) => (
      <Box>
        <Typography variant="body2">{value || '—'}</Typography>
        <Typography variant="caption" sx={{ color: '#6b7280' }}>
          {row.status || '—'}
        </Typography>
      </Box>
    ),
  },
  { key: 'audience_label', label: 'Audience', sortable: false },
  { key: 'spend', label: 'Spend', sortable: false, render: (value) => fmtMoney(value) },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: (value) => fmtNum(value) },
  { key: 'purchases', label: 'Purchases', sortable: false, render: (value) => fmtNum(value) },
];

const CREATIVE_COLUMNS = [
  { key: 'ad_name', label: 'Ad', sortable: false },
  { key: 'format', label: 'Format', sortable: false },
  { key: 'headline', label: 'Headline', sortable: false },
  { key: 'call_to_action', label: 'CTA', sortable: false },
];

const SHOPIFY_PRODUCT_COLUMNS = [
  { key: 'focus_lane_label', label: 'Lane', sortable: false },
  { key: 'product_name', label: 'Product', sortable: false },
  { key: 'sku', label: 'SKU', sortable: false },
  { key: 'units_sold', label: 'Units', sortable: false, render: (value) => fmtNum(value) },
  { key: 'revenue_inr', label: 'Revenue', sortable: false, render: (value) => fmtMoney(value) },
];

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
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [funnelFilter, setFunnelFilter] = useState(ALL_FILTER_VALUE);
  const [objectiveFilter, setObjectiveFilter] = useState(ALL_FILTER_VALUE);
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

  const statusFilterOptions = useMemo(() => {
    const values = uniqueSortedValues(campaigns.map(campaignStatusValue));
    if (
      DEFAULT_STATUS_FILTER &&
      !values.some((value) => value.toLowerCase() === DEFAULT_STATUS_FILTER.toLowerCase())
    ) {
      values.unshift(DEFAULT_STATUS_FILTER);
    }
    return values;
  }, [campaigns]);

  const funnelFilterOptions = useMemo(
    () => uniqueSortedValues(campaigns.map(campaignFunnelValue)),
    [campaigns]
  );

  const objectiveFilterOptions = useMemo(
    () => uniqueSortedValues(campaigns.map(campaignObjectiveValue)),
    [campaigns]
  );

  const filteredCampaigns = useMemo(() => {
    const needle = campaignFilter.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (!matchesFilterValue(campaignStatusValue(campaign), statusFilter)) return false;
      if (!matchesFilterValue(campaignFunnelValue(campaign), funnelFilter)) return false;
      if (!matchesFilterValue(campaignObjectiveValue(campaign), objectiveFilter)) return false;
      if (!needle) return true;
      const label = campaignOptionLabel(campaign).toLowerCase();
      return label.includes(needle) || String(campaign.id).includes(needle);
    });
  }, [campaigns, campaignFilter, statusFilter, funnelFilter, objectiveFilter]);

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

  useEffect(() => {
    loadCampaigns(false);
    loadRecentRuns(canViewAllRuns ? historyScope : 'mine');
  }, []);

  const campaignPickerRows = useMemo(
    () =>
      filteredCampaigns.map((campaign) => {
        const campaignId = String(campaign.id);
        return {
          id: campaignId,
          campaign_id: campaignId,
          name: campaign.name || campaignId,
          funnel: campaignFunnelValue(campaign),
          status: campaignStatusValue(campaign),
          objective: campaignObjectiveValue(campaign),
        };
      }),
    [filteredCampaigns]
  );

  const allFilteredSelected =
    campaignPickerRows.length > 0 &&
    campaignPickerRows.every((row) => selectedCampaignIds.includes(row.campaign_id));

  const someFilteredSelected =
    !allFilteredSelected &&
    campaignPickerRows.some((row) => selectedCampaignIds.includes(row.campaign_id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(campaignPickerRows.map((row) => row.campaign_id));
      setSelectedCampaignIds((current) => current.filter((id) => !filteredIds.has(id)));
      return;
    }
    selectFiltered();
  };

  const campaignPickerColumns = useMemo(
    () => [
      {
        key: 'selected',
        label: (
          <SelectAllCheckbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected}
            onChange={toggleSelectAllFiltered}
            ariaLabel="Select all filtered campaigns"
          />
        ),
        sortable: false,
        render: (_value, row) => (
          <input
            type="checkbox"
            className="agents-table-checkbox"
            checked={selectedCampaignIds.includes(row.campaign_id)}
            onChange={() => toggleCampaign(row.campaign_id)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select ${row.name}`}
          />
        ),
      },
      { key: 'name', label: 'Campaign', sortable: false },
      {
        key: 'funnel',
        label: 'Funnel',
        sortable: false,
        render: (value) => (
          <span className={`agents-chip funnel-${String(value).toLowerCase()}`}>{value}</span>
        ),
      },
      { key: 'status', label: 'Status', sortable: false },
      { key: 'objective', label: 'Objective', sortable: false },
    ],
    [selectedCampaignIds, allFilteredSelected, someFilteredSelected]
  );

  const historyColumns = useMemo(() => {
    const columns = [
      { key: 'id', label: 'Run', sortable: false, render: (value) => `#${value}` },
    ];
    if (historyScope === 'all') {
      columns.push({
        key: 'created_by_email',
        label: 'User',
        sortable: false,
        render: (value) => value || '—',
      });
    }
    columns.push(
      {
        key: 'window',
        label: 'Window',
        sortable: false,
        render: (_value, row) =>
          `${row.since || row.since_date || '—'} → ${row.until || row.until_date || '—'}`,
      },
      { key: 'resolution', label: 'Resolution', sortable: false },
      {
        key: 'campaign_count',
        label: 'Campaigns',
        sortable: false,
        render: (value, row) => value ?? (row.campaign_ids || []).length,
      },
      { key: 'status', label: 'Status', sortable: false },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (_value, row) => (
          <button
            type="button"
            className="agents-btn secondary"
            onClick={(event) => {
              event.stopPropagation();
              openRun(row.id);
            }}
          >
            Open
          </button>
        ),
      }
    );
    return columns;
  }, [historyScope]);

  const shopify = activeRun?.shopify || null;

  const shopifyProductRows = (shopify?.top_products_focus || []).map((product) => ({
    id: `${product.sku}-${product.product_name}`,
    focus_lane_label: product.focus_lane_label || product.focus_lane || '—',
    product_name: product.product_name || '—',
    sku: product.sku || '—',
    units_sold: product.units_sold,
    revenue_inr: product.revenue_inr,
  }));

  return (
    <div className="screen-container agents-page">
      <AgentsHowTo {...AGENT_HOW_TO.marketing} />
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

      <div className="agents-card agents-form-stack meta-marketing-form">
        <div className="agents-form-row meta-marketing-dates">
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

        <div className="agents-form-row meta-marketing-toggles">
          <label className="agents-checkbox">
            <input
              type="checkbox"
              checked={includeCreatives}
              onChange={(event) => setIncludeCreatives(event.target.checked)}
            />
            <span>Include creatives</span>
          </label>
          <label className="agents-checkbox">
            <input
              type="checkbox"
              checked={includeShopify}
              onChange={(event) => setIncludeShopify(event.target.checked)}
            />
            <span>Include Shopify appendix</span>
          </label>
          <label className="agents-checkbox">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
            />
            <span>Email digest</span>
          </label>
        </div>

        <div className="agents-form-row meta-marketing-filters">
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value={ALL_FILTER_VALUE}>All statuses</option>
              {statusFilterOptions.map((statusValue) => (
                <option key={statusValue} value={statusValue}>
                  {statusValue}
                </option>
              ))}
            </select>
          </label>
          <label>
            Funnel
            <select value={funnelFilter} onChange={(event) => setFunnelFilter(event.target.value)}>
              <option value={ALL_FILTER_VALUE}>All funnels</option>
              {funnelFilterOptions.map((funnelValue) => (
                <option key={funnelValue} value={funnelValue}>
                  {funnelValue}
                </option>
              ))}
            </select>
          </label>
          <label>
            Objective
            <select
              value={objectiveFilter}
              onChange={(event) => setObjectiveFilter(event.target.value)}
            >
              <option value={ALL_FILTER_VALUE}>All objectives</option>
              {objectiveFilterOptions.map((objectiveValue) => (
                <option key={objectiveValue} value={objectiveValue}>
                  {objectiveValue}
                </option>
              ))}
            </select>
          </label>
          <label>
            Search
            <input
              type="search"
              value={campaignFilter}
              onChange={(event) => setCampaignFilter(event.target.value)}
              placeholder="Name or campaign ID"
            />
          </label>
        </div>

        <div className="agents-inline-actions meta-marketing-filter-actions">
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

        <div className="meta-marketing-campaign-picker">
          <div className="meta-marketing-campaign-picker__header">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2c2416' }}>
              Campaigns ({selectedCampaignIds.length} selected
              {loadingCampaigns ? ', loading…' : ` · ${campaignPickerRows.length} shown`})
            </Typography>
          </div>
          <ReportTable
            columns={campaignPickerColumns}
            data={campaignPickerRows}
            loading={loadingCampaigns}
            emptyMessage="No campaigns match these filters"
            onRowClick={(row) => toggleCampaign(row.campaign_id)}
          />
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
            const genderRows = (campaign.audience?.by_gender || []).map((row) => ({
              id: row.segment,
              ...row,
            }));
            const adSetRows = (campaign.ad_sets || []).map((adSet) => {
              const audience = adSet.audience || {};
              const metrics = adSet.metrics || {};
              return {
                id: adSet.ad_set_id || adSet.ad_set_name,
                ad_set_name: adSet.ad_set_name,
                status: adSet.status,
                audience_label: `${audience.genders || '—'}; ages ${audience.age_range || '—'}; ${audience.countries || '—'}`,
                spend: metrics.spend,
                add_to_cart: metrics.add_to_cart,
                purchases: metrics.purchases,
              };
            });
            const creativeRows = (campaign.creatives || []).map((creative, creativeIndex) => ({
              id: `${creative.ad_id || 'ad'}-${creativeIndex}`,
              ad_name: creative.ad_name || '—',
              format: creative.format || '—',
              headline: creative.headline || '—',
              call_to_action: creative.call_to_action || '—',
            }));

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

                    {genderRows.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <SectionTitle>Audience — gender</SectionTitle>
                        <ReportTable columns={GENDER_COLUMNS} data={genderRows} />
                      </Box>
                    )}

                    {adSetRows.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <SectionTitle>Ad sets</SectionTitle>
                        <ReportTable columns={AD_SET_COLUMNS} data={adSetRows} />
                      </Box>
                    )}

                    {creativeRows.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <SectionTitle>Creatives</SectionTitle>
                        <ReportTable columns={CREATIVE_COLUMNS} data={creativeRows} />
                      </Box>
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
              <Box sx={{ mb: 2 }}>
                <SectionTitle>Top focus products</SectionTitle>
                <ReportTable
                  columns={SHOPIFY_PRODUCT_COLUMNS}
                  data={shopifyProductRows}
                  emptyMessage="No focus products"
                />
              </Box>
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
        <ReportTable
          columns={historyColumns}
          data={recentRuns}
          loading={recentRunsLoading}
          emptyMessage="No saved portfolio runs yet"
        />
      </div>
    </div>
  );
};
