import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  DollarSign,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  Eye,
  Percent,
  Target,
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { agentsApi } from '../../services/agentsApi';
import {
  DateRangePicker,
  ReportSummaryCards,
  ReportTable,
  ReportCharts,
  ReportSkeleton,
  ExportButton,
} from '../../components/reports';
import { ErrorMessage } from '../../components';
import { fmtMoney, fmtNum, fmtPct, fmtRoas } from '../../utils/marketingFormat';
import {
  campaignOptionLabel,
  normalizeMetaPortfolioRun,
} from '../agents/portfolioRun';
import {
  DEFAULT_CHART_METRIC,
  META_CHART_METRICS,
  enrichMetaMetrics,
  flattenPeriodMetricRows,
  isActiveMetaStatus,
} from '../../utils/metaMarketingMetrics';

const DEFAULT_STATUS_FILTER = 'ACTIVE';
const ALL_FILTER_VALUE = 'all';
const RESOLUTION_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const FUNNEL_CHIP_COLORS = {
  TOF: { backgroundColor: '#eef5f8', color: '#1e4b63' },
  MOF: { backgroundColor: '#f5f1ea', color: '#5d4e37' },
  BOF: { backgroundColor: '#f3ebe3', color: '#6b4423' },
};

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

const FunnelChip = ({ value }) => {
  const funnel = String(value || 'MOF').toUpperCase();
  const colors = FUNNEL_CHIP_COLORS[funnel] || FUNNEL_CHIP_COLORS.MOF;
  return (
    <Chip
      label={funnel}
      size="small"
      sx={{ ...colors, fontWeight: 600, height: 24 }}
    />
  );
};

const StatusChip = ({ value }) => {
  const status = String(value || '—');
  const isActive = isActiveMetaStatus(status);
  return (
    <Chip
      label={status}
      size="small"
      color={isActive ? 'success' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
      sx={{ height: 24 }}
    />
  );
};

const SectionTitle = ({ children }) => (
  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c2416', mb: 1.5, mt: 3 }}>
    {children}
  </Typography>
);

const metricRender = (formatType) => (value) => {
  if (formatType === 'currency') return fmtMoney(value);
  if (formatType === 'percentage') return fmtPct(value);
  if (formatType === 'roas') return fmtRoas(value);
  return fmtNum(value);
};

const PERIOD_COLUMNS = [
  { key: 'period', label: 'Period', sortable: false },
  { key: 'spend', label: 'Spend', sortable: false, render: metricRender('currency') },
  { key: 'impressions', label: 'Impr.', sortable: false, render: metricRender('number') },
  { key: 'clicks', label: 'Clicks', sortable: false, render: metricRender('number') },
  { key: 'ctr', label: 'CTR %', sortable: false, render: metricRender('percentage') },
  { key: 'cpc', label: 'CPC', sortable: false, render: metricRender('currency') },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: metricRender('number') },
  { key: 'purchases', label: 'Purchases', sortable: false, render: metricRender('number') },
  { key: 'purchase_value', label: 'Purchase ₹', sortable: false, render: metricRender('currency') },
  { key: 'roas', label: 'ROAS', sortable: false, render: metricRender('roas') },
  { key: 'cost_per_purchase', label: 'CPA', sortable: false, render: metricRender('currency') },
];

const CAMPAIGN_COLUMNS = [
  { key: 'campaign_name', label: 'Campaign', sortable: false },
  {
    key: 'funnel',
    label: 'Funnel',
    sortable: false,
    render: (value) => <FunnelChip value={value} />,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: false,
    render: (value) => <StatusChip value={value} />,
  },
  { key: 'spend', label: 'Spend', sortable: false, render: metricRender('currency') },
  { key: 'clicks', label: 'Clicks', sortable: false, render: metricRender('number') },
  { key: 'ctr', label: 'CTR %', sortable: false, render: metricRender('percentage') },
  { key: 'cpc', label: 'CPC', sortable: false, render: metricRender('currency') },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: metricRender('number') },
  { key: 'purchases', label: 'Purchases', sortable: false, render: metricRender('number') },
  { key: 'purchase_value', label: 'Purchase ₹', sortable: false, render: metricRender('currency') },
  { key: 'roas', label: 'ROAS', sortable: false, render: metricRender('roas') },
  { key: 'cost_per_purchase', label: 'CPA', sortable: false, render: metricRender('currency') },
];

const AD_SET_COLUMNS = [
  { key: 'campaign_name', label: 'Campaign', sortable: false },
  { key: 'ad_set_name', label: 'Ad set', sortable: false },
  {
    key: 'status',
    label: 'Status',
    sortable: false,
    render: (value) => <StatusChip value={value} />,
  },
  { key: 'audience_label', label: 'Audience', sortable: false, nowrap: false },
  { key: 'spend', label: 'Spend', sortable: false, render: metricRender('currency') },
  { key: 'clicks', label: 'Clicks', sortable: false, render: metricRender('number') },
  { key: 'ctr', label: 'CTR %', sortable: false, render: metricRender('percentage') },
  { key: 'cpc', label: 'CPC', sortable: false, render: metricRender('currency') },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: metricRender('number') },
  { key: 'purchases', label: 'Purchases', sortable: false, render: metricRender('number') },
  { key: 'purchase_value', label: 'Purchase ₹', sortable: false, render: metricRender('currency') },
  { key: 'roas', label: 'ROAS', sortable: false, render: metricRender('roas') },
];

const AD_COLUMNS = [
  { key: 'campaign_name', label: 'Campaign', sortable: false },
  { key: 'ad_name', label: 'Ad', sortable: false },
  { key: 'format', label: 'Format', sortable: false },
  { key: 'headline', label: 'Headline', sortable: false, nowrap: false },
  { key: 'call_to_action', label: 'CTA', sortable: false },
  { key: 'spend', label: 'Spend', sortable: false, render: metricRender('currency') },
  { key: 'clicks', label: 'Clicks', sortable: false, render: metricRender('number') },
  { key: 'ctr', label: 'CTR %', sortable: false, render: metricRender('percentage') },
  { key: 'add_to_cart', label: 'ATC', sortable: false, render: metricRender('number') },
  { key: 'purchases', label: 'Purchases', sortable: false, render: metricRender('number') },
  { key: 'roas', label: 'ROAS', sortable: false, render: metricRender('roas') },
];

const toIsoDate = (dateValue) => (dateValue ? format(dateValue, 'yyyy-MM-dd') : '');

export const MetaMarketingReportPage = () => {
  const [startDate, setStartDate] = useState(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(() => new Date());
  const [resolution, setResolution] = useState('week');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [funnelFilter, setFunnelFilter] = useState(ALL_FILTER_VALUE);
  const [objectiveFilter, setObjectiveFilter] = useState(ALL_FILTER_VALUE);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [chartMetricKey, setChartMetricKey] = useState(DEFAULT_CHART_METRIC);
  const [showAllMetricCharts, setShowAllMetricCharts] = useState(false);

  const statusFilterOptions = useMemo(() => {
    const values = uniqueSortedValues(campaigns.map(campaignStatusValue));
    if (!values.some((value) => value.toLowerCase() === DEFAULT_STATUS_FILTER.toLowerCase())) {
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
    const needle = campaignSearch.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (!matchesFilterValue(campaignStatusValue(campaign), statusFilter)) return false;
      if (!matchesFilterValue(campaignFunnelValue(campaign), funnelFilter)) return false;
      if (!matchesFilterValue(campaignObjectiveValue(campaign), objectiveFilter)) return false;
      if (!needle) return true;
      const label = campaignOptionLabel(campaign).toLowerCase();
      return label.includes(needle) || String(campaign.id).includes(needle);
    });
  }, [campaigns, campaignSearch, statusFilter, funnelFilter, objectiveFilter]);

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

  const loadReport = async () => {
    if (!selectedCampaignIds.length) {
      setErrorMessage('Select at least one Meta campaign first');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Choose a date range');
      return;
    }

    setLoadingReport(true);
    setErrorMessage(null);
    try {
      const response = await agentsApi.createMetaPortfolioRun({
        campaign_ids: selectedCampaignIds,
        since: toIsoDate(startDate),
        until: toIsoDate(endDate),
        resolution,
        include_creatives: true,
        include_shopify: false,
        send_email: false,
      });
      setActiveRun(normalizeMetaPortfolioRun(response));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    loadCampaigns(false);
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
          _selected: selectedCampaignIds.includes(campaignId),
        };
      }),
    [filteredCampaigns, selectedCampaignIds]
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
          <Checkbox
            size="small"
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected}
            onChange={toggleSelectAllFiltered}
            onClick={(event) => event.stopPropagation()}
            inputProps={{ 'aria-label': 'Select all filtered campaigns' }}
            sx={{ color: '#8b6f47', '&.Mui-checked': { color: '#8b6f47' } }}
          />
        ),
        width: 56,
        sortable: false,
        render: (_value, row) => (
          <Checkbox
            size="small"
            checked={selectedCampaignIds.includes(row.campaign_id)}
            onChange={() => toggleCampaign(row.campaign_id)}
            onClick={(event) => event.stopPropagation()}
            inputProps={{ 'aria-label': `Select ${row.name}` }}
            sx={{ color: '#8b6f47', '&.Mui-checked': { color: '#8b6f47' } }}
          />
        ),
      },
      { key: 'name', label: 'Campaign', sortable: false },
      {
        key: 'funnel',
        label: 'Funnel',
        sortable: false,
        render: (value) => <FunnelChip value={value} />,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: false,
        render: (value) => <StatusChip value={value} />,
      },
      { key: 'objective', label: 'Objective', sortable: false },
    ],
    [selectedCampaignIds, allFilteredSelected, someFilteredSelected]
  );

  const portfolioOverall = useMemo(
    () => enrichMetaMetrics(activeRun?.portfolioOverall || {}),
    [activeRun]
  );

  const periodRows = useMemo(
    () => flattenPeriodMetricRows(activeRun?.portfolioByPeriod || []),
    [activeRun]
  );

  const campaignRows = useMemo(
    () =>
      (activeRun?.campaigns || []).map((campaign) => {
        const metrics = enrichMetaMetrics(campaign.overall || {});
        return {
          id: campaign.campaign_id,
          campaign_name: campaign.campaign_name || campaign.campaign_id,
          funnel: campaign.funnel_mode?.mode || 'MOF',
          status: campaign.status || '—',
          ...metrics,
        };
      }),
    [activeRun]
  );

  const activeAdSetRows = useMemo(() => {
    const rows = [];
    (activeRun?.campaigns || []).forEach((campaign) => {
      (campaign.ad_sets || []).forEach((adSet) => {
        if (!isActiveMetaStatus(adSet.status || adSet.effective_status)) return;
        const audience = adSet.audience || {};
        const metrics = enrichMetaMetrics(adSet.metrics || {});
        rows.push({
          id: `${campaign.campaign_id}-${adSet.ad_set_id || adSet.ad_set_name}`,
          campaign_name: campaign.campaign_name || campaign.campaign_id,
          ad_set_name: adSet.ad_set_name || adSet.ad_set_id || '—',
          status: adSet.status || adSet.effective_status || 'ACTIVE',
          audience_label: `${audience.genders || '—'}; ages ${audience.age_range || '—'}; ${audience.countries || '—'}`,
          ...metrics,
        });
      });
    });
    return rows;
  }, [activeRun]);

  const adRows = useMemo(() => {
    const rows = [];
    (activeRun?.campaigns || []).forEach((campaign) => {
      (campaign.creatives || []).forEach((creative, creativeIndex) => {
        const metrics = enrichMetaMetrics(creative.metrics || creative || {});
        rows.push({
          id: `${campaign.campaign_id}-${creative.ad_id || 'ad'}-${creativeIndex}`,
          campaign_name: campaign.campaign_name || campaign.campaign_id,
          ad_name: creative.ad_name || creative.name || '—',
          format: creative.format || '—',
          headline: creative.headline || '—',
          call_to_action: creative.call_to_action || '—',
          ...metrics,
        });
      });
    });
    return rows;
  }, [activeRun]);

  const summaryCards = activeRun
    ? [
        {
          title: 'Spend',
          value: portfolioOverall.spend || 0,
          format: 'currency',
          color: 'primary',
          icon: DollarSign,
        },
        {
          title: 'Clicks',
          value: portfolioOverall.clicks || 0,
          format: 'number',
          color: 'info',
          icon: MousePointerClick,
        },
        {
          title: 'Impressions',
          value: portfolioOverall.impressions || 0,
          format: 'number',
          color: 'default',
          icon: Eye,
        },
        {
          title: 'CTR %',
          value: portfolioOverall.ctr || 0,
          format: 'percentage',
          color: 'warning',
          icon: Percent,
        },
        {
          title: 'Add to cart',
          value: portfolioOverall.add_to_cart || 0,
          format: 'number',
          color: 'info',
          icon: ShoppingCart,
        },
        {
          title: 'Purchases',
          value: portfolioOverall.purchases || 0,
          format: 'number',
          color: 'success',
          icon: Target,
        },
        {
          title: 'Purchase value',
          value: portfolioOverall.purchase_value || 0,
          format: 'currency',
          color: 'success',
          icon: DollarSign,
        },
        {
          title: 'ROAS',
          value: portfolioOverall.roas ?? '—',
          format: 'default',
          color: 'error',
          icon: TrendingUp,
        },
        {
          title: 'CPC',
          value: portfolioOverall.cpc || 0,
          format: 'currency',
          color: 'warning',
          icon: DollarSign,
        },
        {
          title: 'Cost / purchase',
          value: portfolioOverall.cost_per_purchase || 0,
          format: 'currency',
          color: 'primary',
          icon: Target,
        },
        {
          title: 'ATC rate %',
          value: portfolioOverall.atc_rate || 0,
          format: 'percentage',
          color: 'info',
          icon: Percent,
        },
        {
          title: 'Avg order value',
          value: portfolioOverall.average_order_value || 0,
          format: 'currency',
          color: 'success',
          icon: ShoppingCart,
        },
      ]
    : [];

  const selectedChartMetric =
    META_CHART_METRICS.find((metric) => metric.key === chartMetricKey) || META_CHART_METRICS[0];

  const chartHasData = (metricKey) =>
    periodRows.some((row) => row[metricKey] != null && Number(row[metricKey]) !== 0);

  const exportColumns = PERIOD_COLUMNS.map(({ key, label }) => ({ key, label }));
  const exportSummary = activeRun
    ? {
        Spend: fmtMoney(portfolioOverall.spend),
        Clicks: fmtNum(portfolioOverall.clicks),
        Purchases: fmtNum(portfolioOverall.purchases),
        ROAS: fmtRoas(portfolioOverall.roas),
      }
    : null;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }} className="report-content">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2c2416', mb: 0.5 }}>
            Meta Marketing Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Select campaigns, load Meta performance by day/week/month, then review trends, ACTIVE
            ad sets, and ads.
          </Typography>
        </Box>
        <ExportButton
          data={periodRows}
          columns={exportColumns}
          reportType="meta-marketing"
          reportTitle="Meta Marketing Report"
          summary={exportSummary}
        />
      </Box>

      {errorMessage && (
        <Box sx={{ mb: 2 }}>
          <ErrorMessage message={errorMessage} />
        </Box>
      )}

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c2416', mb: 2 }}>
          1) Choose window & campaigns
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onRangeChange={(nextStart, nextEnd) => {
                setStartDate(nextStart);
                setEndDate(nextEnd);
              }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="meta-resolution-label">Resolution</InputLabel>
              <Select
                labelId="meta-resolution-label"
                label="Resolution"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
              >
                {RESOLUTION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="meta-status-filter-label">Status</InputLabel>
              <Select
                labelId="meta-status-filter-label"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value={ALL_FILTER_VALUE}>All statuses</MenuItem>
                {statusFilterOptions.map((statusValue) => (
                  <MenuItem key={statusValue} value={statusValue}>
                    {statusValue}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="meta-funnel-filter-label">Funnel</InputLabel>
              <Select
                labelId="meta-funnel-filter-label"
                label="Funnel"
                value={funnelFilter}
                onChange={(event) => setFunnelFilter(event.target.value)}
              >
                <MenuItem value={ALL_FILTER_VALUE}>All funnels</MenuItem>
                {funnelFilterOptions.map((funnelValue) => (
                  <MenuItem key={funnelValue} value={funnelValue}>
                    {funnelValue}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="meta-objective-filter-label">Objective</InputLabel>
              <Select
                labelId="meta-objective-filter-label"
                label="Objective"
                value={objectiveFilter}
                onChange={(event) => setObjectiveFilter(event.target.value)}
              >
                <MenuItem value={ALL_FILTER_VALUE}>All objectives</MenuItem>
                {objectiveFilterOptions.map((objectiveValue) => (
                  <MenuItem key={objectiveValue} value={objectiveValue}>
                    {objectiveValue}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search campaigns"
              value={campaignSearch}
              onChange={(event) => setCampaignSearch(event.target.value)}
              placeholder="Name or ID"
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button variant="outlined" onClick={() => loadCampaigns(true)} disabled={loadingCampaigns}>
            Refresh campaigns
          </Button>
          <Button variant="outlined" onClick={selectFiltered}>
            Select filtered
          </Button>
          <Button variant="outlined" onClick={clearSelection}>
            Clear selection
          </Button>
          <Button
            variant="contained"
            onClick={loadReport}
            disabled={loadingReport || !selectedCampaignIds.length}
            sx={{ backgroundColor: '#8b6f47', '&:hover': { backgroundColor: '#6f5838' } }}
          >
            {loadingReport ? 'Loading report…' : 'Load report for selected campaigns'}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
          {selectedCampaignIds.length} selected · {campaignPickerRows.length} shown
          {loadingCampaigns ? ' · loading campaigns…' : ''}
        </Typography>

        <ReportTable
          columns={campaignPickerColumns}
          data={campaignPickerRows}
          loading={loadingCampaigns}
          emptyMessage="No campaigns match these filters"
          onRowClick={(row) => toggleCampaign(row.campaign_id)}
          size="small"
          stickyHeader
          maxHeight={360}
        />
      </Paper>

      {loadingReport && !activeRun && <ReportSkeleton />}

      {activeRun && (
        <>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
            Run #{activeRun.runId} · {activeRun.since} → {activeRun.until} ·{' '}
            {activeRun.resolutionLabel || activeRun.resolution} · {activeRun.status}
          </Typography>

          {activeRun.error && <ErrorMessage message={activeRun.error} />}

          <ReportSummaryCards cards={summaryCards} />

          <SectionTitle>Trends by {activeRun.resolutionLabel || resolution}</SectionTitle>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {META_CHART_METRICS.map((metric) => (
              <Chip
                key={metric.key}
                label={metric.label}
                clickable
                color={chartMetricKey === metric.key ? 'primary' : 'default'}
                variant={chartMetricKey === metric.key ? 'filled' : 'outlined'}
                onClick={() => setChartMetricKey(metric.key)}
                sx={{
                  borderColor: metric.color,
                  ...(chartMetricKey === metric.key
                    ? { backgroundColor: metric.color, color: '#fff' }
                    : {}),
                }}
              />
            ))}
            <Chip
              label={showAllMetricCharts ? 'Hide all charts' : 'Show all metric charts'}
              clickable
              onClick={() => setShowAllMetricCharts((current) => !current)}
            />
          </Box>

          <ReportCharts
            type="line"
            data={periodRows}
            config={{
              xKey: 'period',
              lines: [
                {
                  key: selectedChartMetric.key,
                  name: selectedChartMetric.label,
                  color: selectedChartMetric.color,
                },
              ],
            }}
            title={`${selectedChartMetric.label} trend`}
          />

          {showAllMetricCharts && (
            <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
              {META_CHART_METRICS.filter((metric) => chartHasData(metric.key)).map((metric) => (
                <Grid item xs={12} md={6} key={metric.key}>
                  <ReportCharts
                    type="line"
                    data={periodRows}
                    config={{
                      xKey: 'period',
                      lines: [{ key: metric.key, name: metric.label, color: metric.color }],
                    }}
                    title={metric.label}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <SectionTitle>By period</SectionTitle>
          <ReportTable
            columns={PERIOD_COLUMNS}
            data={periodRows}
            emptyMessage="No period buckets for this run"
            size="small"
            stickyHeader
          />

          <SectionTitle>Campaigns</SectionTitle>
          <ReportTable
            columns={CAMPAIGN_COLUMNS}
            data={campaignRows}
            emptyMessage="No campaign metrics"
            size="small"
            stickyHeader
          />

          <SectionTitle>ACTIVE ad sets</SectionTitle>
          <ReportTable
            columns={AD_SET_COLUMNS}
            data={activeAdSetRows}
            emptyMessage="No ACTIVE ad sets in the selected campaigns"
            size="small"
            stickyHeader
          />

          <SectionTitle>Ads</SectionTitle>
          <ReportTable
            columns={AD_COLUMNS}
            data={adRows}
            emptyMessage="No ads/creatives returned for these campaigns"
            size="small"
            stickyHeader
          />
        </>
      )}
    </Container>
  );
};
