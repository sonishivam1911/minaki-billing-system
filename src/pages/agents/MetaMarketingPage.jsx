import React, { useEffect, useMemo, useRef, useState } from 'react';
import { agentsApi } from '../../services/agentsApi';
import { AgentsSubnav } from '../../components/agents/AgentsSubnav';
import { AgentsHowTo } from '../../components/agents/AgentsHowTo';
import { AGENT_HOW_TO } from '../../components/agents/agentHowToCopy';
import { AgentsPagedTable } from '../../components/agents/AgentsPagedTable';
import { LoadingSpinner } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { fmtMoney, fmtNum, fmtRoas } from '../../utils/marketingFormat';
import {
  campaignOptionLabel,
  defaultPortfolioDateRange,
  normalizeMetaPortfolioRun,
} from './portfolioRun';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';

const RECENT_RUNS_LIMIT = 15;
const DEFAULT_STATUS_FILTER = 'ACTIVE';
const ALL_FILTER_VALUE = 'all';
const RESOLUTION_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const STATUS_BADGE_VARIANT = {
  active: 'success',
  paused: 'warning',
  archived: 'default',
  deleted: 'destructive',
  completed: 'success',
  failed: 'destructive',
  running: 'sapphire',
};

const statusBadgeVariant = (status) =>
  STATUS_BADGE_VARIANT[String(status || '').toLowerCase()] || 'outline';

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
      className="h-4 w-4 rounded border border-[var(--color-input)] accent-[var(--color-primary)]"
      checked={checked}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
      aria-label={ariaLabel}
    />
  );
};

const MetricsStrip = ({ metrics = {} }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    {[
      ['Spend', fmtMoney(metrics.spend)],
      ['Clicks', fmtNum(metrics.clicks)],
      ['Add to cart', fmtNum(metrics.add_to_cart)],
      ['Purchases', fmtNum(metrics.purchases)],
      ['Purchase value', fmtMoney(metrics.purchase_value)],
      ['ROAS', fmtRoas(metrics.roas)],
    ].map(([label, value]) => (
      <div key={label} className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
        <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      </div>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h4 className="mb-2 mt-1 text-sm font-semibold">{children}</h4>
);

const PERIOD_COLUMNS = [
  { key: 'period', label: 'Period' },
  { key: 'spend', label: 'Spend', render: (row) => fmtMoney(row.spend) },
  { key: 'clicks', label: 'Clicks', render: (row) => fmtNum(row.clicks) },
  { key: 'add_to_cart', label: 'ATC', render: (row) => fmtNum(row.add_to_cart) },
  { key: 'purchases', label: 'Purchases', render: (row) => fmtNum(row.purchases) },
  { key: 'purchase_value', label: 'Purchase ₹', render: (row) => fmtMoney(row.purchase_value) },
  { key: 'roas', label: 'ROAS', render: (row) => fmtRoas(row.roas) },
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
  <div className="mb-4">
    {title && <SectionTitle>{title}</SectionTitle>}
    <AgentsPagedTable
      columns={PERIOD_COLUMNS}
      rows={flattenPeriodRows(rows)}
      emptyLabel="No period buckets"
    />
  </div>
);

const GENDER_COLUMNS = [
  { key: 'segment', label: 'Gender' },
  { key: 'spend', label: 'Spend', render: (row) => fmtMoney(row.spend) },
  { key: 'add_to_cart', label: 'ATC', render: (row) => fmtNum(row.add_to_cart) },
  { key: 'purchases', label: 'Purchases', render: (row) => fmtNum(row.purchases) },
];

const AD_SET_COLUMNS = [
  {
    key: 'ad_set_name',
    label: 'Ad set',
    render: (row) => (
      <div>
        <p className="text-sm">{row.ad_set_name || '—'}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{row.status || '—'}</p>
      </div>
    ),
  },
  { key: 'audience_label', label: 'Audience' },
  { key: 'spend', label: 'Spend', render: (row) => fmtMoney(row.spend) },
  { key: 'add_to_cart', label: 'ATC', render: (row) => fmtNum(row.add_to_cart) },
  { key: 'purchases', label: 'Purchases', render: (row) => fmtNum(row.purchases) },
];

const CREATIVE_COLUMNS = [
  { key: 'ad_name', label: 'Ad' },
  { key: 'format', label: 'Format' },
  { key: 'headline', label: 'Headline' },
  { key: 'call_to_action', label: 'CTA' },
];

const SHOPIFY_PRODUCT_COLUMNS = [
  { key: 'focus_lane_label', label: 'Lane' },
  { key: 'product_name', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'units_sold', label: 'Units', render: (row) => fmtNum(row.units_sold) },
  { key: 'revenue_inr', label: 'Revenue', render: (row) => fmtMoney(row.revenue_inr) },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        render: (row) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-[var(--color-input)] accent-[var(--color-primary)]"
            checked={selectedCampaignIds.includes(row.campaign_id)}
            onChange={() => toggleCampaign(row.campaign_id)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select ${row.name}`}
          />
        ),
      },
      { key: 'name', label: 'Campaign' },
      {
        key: 'funnel',
        label: 'Funnel',
        render: (row) => <Badge variant="sapphire">{row.funnel}</Badge>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>,
      },
      { key: 'objective', label: 'Objective' },
    ],
    [selectedCampaignIds, allFilteredSelected, someFilteredSelected]
  );

  const historyColumns = useMemo(() => {
    const columns = [{ key: 'id', label: 'Run', render: (row) => `#${row.id}` }];
    if (historyScope === 'all') {
      columns.push({
        key: 'created_by_email',
        label: 'User',
        render: (row) => row.created_by_email || '—',
      });
    }
    columns.push(
      {
        key: 'window',
        label: 'Window',
        render: (row) =>
          `${row.since || row.since_date || '—'} → ${row.until || row.until_date || '—'}`,
      },
      { key: 'resolution', label: 'Resolution' },
      {
        key: 'campaign_count',
        label: 'Campaigns',
        render: (row) => row.campaign_count ?? (row.campaign_ids || []).length,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <Badge variant={statusBadgeVariant(row.status)}>{row.status || '—'}</Badge>,
      },
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              openRun(row.id);
            }}
          >
            Open
          </Button>
        ),
      }
    );
    return columns;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="minaki-ui mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6">
      <AgentsSubnav />
      <AgentsHowTo {...AGENT_HOW_TO.marketing} />
      <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">Meta Marketing</h1>
      <p className="mb-5 text-sm text-[var(--color-muted-foreground)]">
        Meta Portfolio Performance — multi-select campaigns, day/week/month buckets, store-wide
        Shopify appendix. Runs are saved to your history.
      </p>

      {!schemaReady && (
        <Alert variant="warning" className="mb-5">
          Portfolio runs table missing or file-fallback active. Apply{' '}
          <code>api/scripts/migrations/minaki_marketing_portfolio_runs.sql</code> when ready.
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-5">
          {errorMessage}
        </Alert>
      )}

      <Card className="mb-5">
        <CardContent className="space-y-4 pt-5">
          <h2 className="text-sm font-semibold">Run parameters</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meta-since">Since</Label>
              <Input
                id="meta-since"
                type="date"
                value={since}
                onChange={(event) => setSince(event.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-until">Until</Label>
              <Input
                id="meta-until"
                type="date"
                value={until}
                onChange={(event) => setUntil(event.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="meta-include-creatives"
                checked={includeCreatives}
                onCheckedChange={(checked) => setIncludeCreatives(Boolean(checked))}
              />
              <Label htmlFor="meta-include-creatives" className="font-normal">
                Include creatives
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="meta-include-shopify"
                checked={includeShopify}
                onCheckedChange={(checked) => setIncludeShopify(Boolean(checked))}
              />
              <Label htmlFor="meta-include-shopify" className="font-normal">
                Include Shopify appendix
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="meta-send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(Boolean(checked))}
              />
              <Label htmlFor="meta-send-email" className="font-normal">
                Email digest
              </Label>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
                  {statusFilterOptions.map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {statusValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Funnel</Label>
              <Select value={funnelFilter} onValueChange={setFunnelFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All funnels</SelectItem>
                  {funnelFilterOptions.map((funnelValue) => (
                    <SelectItem key={funnelValue} value={funnelValue}>
                      {funnelValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Objective</Label>
              <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All objectives</SelectItem>
                  {objectiveFilterOptions.map((objectiveValue) => (
                    <SelectItem key={objectiveValue} value={objectiveValue}>
                      {objectiveValue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta-search">Search</Label>
              <Input
                id="meta-search"
                type="search"
                value={campaignFilter}
                onChange={(event) => setCampaignFilter(event.target.value)}
                placeholder="Name or campaign ID"
                className="w-[220px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => loadCampaigns(true)}>
              Refresh from Meta
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selectFiltered}>
              Select filtered
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">
              Campaigns ({selectedCampaignIds.length} selected
              {loadingCampaigns ? ', loading…' : ` · ${campaignPickerRows.length} shown`})
            </p>
            <AgentsPagedTable
              columns={campaignPickerColumns}
              rows={campaignPickerRows}
              onRowClick={(row) => toggleCampaign(row.campaign_id)}
              emptyLabel={loadingCampaigns ? 'Loading campaigns…' : 'No campaigns match these filters'}
            />
          </div>

          <Button
            type="button"
            disabled={isSubmitting || !selectedCampaignIds.length}
            onClick={createPortfolioRun}
          >
            {isSubmitting ? 'Running portfolio…' : 'Run Meta Portfolio Performance'}
          </Button>
        </CardContent>
      </Card>

      {isSubmitting && !activeRun && <LoadingSpinner />}

      {activeRun && (
        <Card className="mb-5">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>
              Run #{activeRun.runId} · {activeRun.since} → {activeRun.until} ·{' '}
              {activeRun.resolutionLabel || activeRun.resolution}
            </CardTitle>
            <Badge variant={statusBadgeVariant(activeRun.status)}>{activeRun.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {activeRun.error && <Alert variant="destructive">{activeRun.error}</Alert>}
            {(activeRun.notes || []).map((note) => (
              <p key={note} className="text-sm text-[var(--color-muted-foreground)]">
                {note}
              </p>
            ))}

            <div>
              <h3 className="mb-2 text-base font-semibold">1) Portfolio overall</h3>
              <MetricsStrip metrics={activeRun.portfolioOverall} />
            </div>

            <PeriodTable
              title={`2) Portfolio by ${activeRun.resolutionLabel || 'period'}`}
              rows={activeRun.portfolioByPeriod}
            />

            <div>
              <h3 className="mb-3 text-base font-semibold">3) Campaigns</h3>
              <div className="space-y-3">
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
                    <Card key={campaign.campaign_id}>
                      <CardContent className="space-y-4 pt-5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setExpandedCampaignId(isOpen ? null : campaign.campaign_id)}
                          className="flex w-full items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            {campaign.campaign_name}
                            <Badge variant="sapphire">{funnel.mode || 'MOF'}</Badge>
                          </span>
                          <span>{isOpen ? 'Hide' : 'Show'}</span>
                        </Button>
                        {isOpen && (
                          <div className="space-y-4">
                            <p className="text-sm text-[var(--color-muted-foreground)]">
                              {funnel.label || 'Funnel mode'} · Objective {campaign.objective || '—'} ·{' '}
                              {campaign.status || '—'}
                            </p>
                            <MetricsStrip metrics={campaign.overall || {}} />
                            <PeriodTable
                              title={`By ${activeRun.resolutionLabel || 'period'}`}
                              rows={campaign.by_period || []}
                            />

                            {genderRows.length > 0 && (
                              <div>
                                <SectionTitle>Audience — gender</SectionTitle>
                                <AgentsPagedTable columns={GENDER_COLUMNS} rows={genderRows} />
                              </div>
                            )}

                            {adSetRows.length > 0 && (
                              <div>
                                <SectionTitle>Ad sets</SectionTitle>
                                <AgentsPagedTable columns={AD_SET_COLUMNS} rows={adSetRows} />
                              </div>
                            )}

                            {creativeRows.length > 0 && (
                              <div>
                                <SectionTitle>Creatives</SectionTitle>
                                <AgentsPagedTable columns={CREATIVE_COLUMNS} rows={creativeRows} />
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {shopify && (
              <Card>
                <CardContent className="space-y-4 pt-5">
                  <h3 className="text-base font-semibold">4) Shopify appendix (store-wide)</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {shopify.note || 'Store-wide context — not per campaign.'}
                  </p>
                  <MetricsStrip
                    metrics={{
                      spend: null,
                      clicks: null,
                      add_to_cart: shopify.funnel?.unique_abandoned_checkouts,
                      purchases: shopify.funnel?.paid_orders || shopify.paid_orders_count,
                      purchase_value: shopify.funnel?.order_revenue,
                      roas:
                        shopify.funnel?.checkout_to_order_rate_pct != null
                          ? `${shopify.funnel.checkout_to_order_rate_pct}% checkout→order`
                          : null,
                    }}
                  />
                  <div>
                    <SectionTitle>Top focus products</SectionTitle>
                    <AgentsPagedTable
                      columns={SHOPIFY_PRODUCT_COLUMNS}
                      rows={shopifyProductRows}
                      emptyLabel="No focus products"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{historyScope === 'all' ? 'All portfolio runs' : 'Your portfolio history'}</CardTitle>
          <CardDescription>
            {recentRunsTotal} run{recentRunsTotal === 1 ? '' : 's'}
            {canViewAllRuns ? ' · Admin/manager can switch scope.' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {canViewAllRuns && (
              <div className="flex items-center gap-2">
                <Label className="font-normal">Scope</Label>
                <Select
                  value={historyScope}
                  onValueChange={(nextScope) => {
                    setHistoryScope(nextScope);
                    loadRecentRuns(nextScope);
                  }}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">My runs</SelectItem>
                    <SelectItem value="all">All users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => loadRecentRuns()}>
              Refresh
            </Button>
          </div>
          <AgentsPagedTable
            columns={historyColumns}
            rows={recentRuns}
            emptyLabel={recentRunsLoading ? 'Loading…' : 'No saved portfolio runs yet'}
          />
        </CardContent>
      </Card>
    </div>
  );
};
