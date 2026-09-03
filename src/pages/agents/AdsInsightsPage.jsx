import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Autocomplete,
  TextField,
  MenuItem,
  Chip,
  Collapse,
  Grid,
  Divider,
} from '@mui/material';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { billingUiBuilder } from '../../ui/BillingUiBuilder';
import { LoadingSpinner, ErrorMessage } from '../../components';
import { ReportTable } from '../../components/reports/ReportTable';
import { agentsApi } from '../../services/agentsApi';
import { fmtMoney, fmtNum } from '../../utils/marketingFormat';

const METRIC_OPTIONS = [
  { value: 'spend', label: 'Spend' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const AudienceSummary = ({ audience }) => {
  if (!audience) return null;
  const chipRow = (label, values) =>
    values && values.length > 0 ? (
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {values.map((v) => (
            <Chip key={v} label={v} size="small" />
          ))}
        </Box>
      </Box>
    ) : null;

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Age:</strong> {audience.age_range} &nbsp; <strong>Gender:</strong> {audience.genders}
        {audience.targeting_automated && (
          <Chip label="Advantage+ audience" size="small" color="info" sx={{ ml: 1 }} />
        )}
      </Typography>
      {chipRow('Countries', audience.countries)}
      {chipRow('Cities', audience.cities)}
      {chipRow('Interests', audience.interests)}
      {chipRow('Behaviors', audience.behaviors)}
      {chipRow('Custom audiences', audience.custom_audiences)}
      {audience.has_lookalike_audience && (
        <Chip label="Includes lookalike audience" size="small" color="warning" sx={{ mt: 0.5 }} />
      )}
      {chipRow('Placements — platforms', audience.placements?.publisher_platforms)}
      {chipRow('Placements — Facebook positions', audience.placements?.facebook_positions)}
      {chipRow('Placements — Instagram positions', audience.placements?.instagram_positions)}
    </Box>
  );
};

const CreativeSummary = ({ creative }) => {
  if (!creative) return null;
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Format:</strong> {creative.format}
        {creative.link && (
          <>
            {' '}
            &nbsp;
            <a href={creative.link} target="_blank" rel="noopener noreferrer" style={{ color: '#8b6f47' }}>
              destination <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
            </a>
          </>
        )}
      </Typography>
      {creative.headlines?.length > 0 && (
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Headlines:</strong> {creative.headlines.join(' · ')}
        </Typography>
      )}
      {creative.bodies?.length > 0 && (
        <Typography variant="body2" sx={{ mb: 0.5 }}>
          <strong>Body:</strong> {creative.bodies.join(' · ')}
        </Typography>
      )}
      {creative.ctas?.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          {creative.ctas.map((c) => (
            <Chip key={c} label={c} size="small" color="primary" variant="outlined" />
          ))}
        </Box>
      )}
      {creative.images?.length > 0 && (
        <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 1 }}>
          {creative.images.length} image asset{creative.images.length > 1 ? 's' : ''} referenced (image hash
          only — no CDN preview wired up yet)
        </Typography>
      )}
    </Box>
  );
};

const AdDetailPanel = ({ adId, since, until }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    agentsApi
      .getAdConfigVsPerformance(adId, { since, until })
      .then((res) => {
        if (!cancelled) setDetail(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load ad detail');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adId, since, until]);

  if (loading) return <LoadingSpinner message="Loading ad detail..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!detail) return null;

  const perfRows = detail.performance?.rows || [];
  const perfTotals = perfRows.reduce(
    (acc, r) => {
      acc.spend += r.spend || 0;
      acc.impressions += r.impressions || 0;
      acc.clicks += r.clicks || 0;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0 }
  );

  return (
    <Box sx={{ p: 2, backgroundColor: '#faf9f6' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Campaign / Ad Set
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Campaign:</strong> {detail.campaign?.name} ({detail.campaign?.objective})
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Ad set:</strong> {detail.ad_set?.name} — {detail.ad_set?.optimization_goal}/
            {detail.ad_set?.billing_event}, budget {fmtMoney(detail.ad_set?.daily_budget || detail.ad_set?.lifetime_budget)}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Audience
          </Typography>
          <AudienceSummary audience={detail.audience} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Creative
          </Typography>
          <CreativeSummary creative={detail.creative} />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Performance ({since} to {until})
          </Typography>
          {perfRows.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              No spend logged for this ad in this date range.
            </Typography>
          ) : (
            <Typography variant="body2">
              Spend {fmtMoney(perfTotals.spend)} · Impressions {fmtNum(perfTotals.impressions)} · Clicks{' '}
              {fmtNum(perfTotals.clicks)}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export const AdsInsightsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [since, setSince] = useState(daysAgoIso(30));
  const [until, setUntil] = useState(todayIso());
  const [metric, setMetric] = useState('spend');
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [error, setError] = useState(null);
  const [expandedAdId, setExpandedAdId] = useState(null);

  useEffect(() => {
    agentsApi
      .listMetaCampaigns({ limit: 500 })
      .then((res) => setCampaigns(res.campaigns || []))
      .catch((err) => setError(err.message || 'Failed to load campaigns'))
      .finally(() => setCampaignsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCampaign) {
      setAds([]);
      return;
    }
    let cancelled = false;
    setLoadingAds(true);
    setError(null);
    agentsApi
      .listAdsRanked(selectedCampaign.id, { since, until, metric })
      .then((res) => {
        if (!cancelled) setAds(res.ads || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load ads');
      })
      .finally(() => {
        if (!cancelled) setLoadingAds(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCampaign, since, until, metric]);

  const columns = useMemo(
    () => [
      { key: 'ad_name', label: 'Ad', render: (row) => row.ad_name || row.ad_id },
      { key: 'status', label: 'Status' },
      { key: 'creative_format', label: 'Creative' },
      { key: 'creative_headline', label: 'Headline' },
      {
        key: 'metric_value',
        label: METRIC_OPTIONS.find((m) => m.value === metric)?.label || metric,
        align: 'right',
        render: (row) => (metric === 'spend' ? fmtMoney(row.metric_value) : fmtNum(row.metric_value)),
      },
      {
        key: 'expand',
        label: '',
        align: 'right',
        render: (row) =>
          expandedAdId === row.ad_id ? <ChevronUp size={16} /> : <ChevronDown size={16} />,
      },
    ],
    [metric, expandedAdId]
  );

  return billingUiBuilder.page({
    title: 'Ads Insights',
    description: 'What we set up (audience + creative) next to what happened (performance) — per ad.',
    children: (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <Autocomplete
                  options={campaigns}
                  loading={campaignsLoading}
                  getOptionLabel={(c) => c.name || c.id}
                  value={selectedCampaign}
                  onChange={(_e, value) => setSelectedCampaign(value)}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(params) => (
                    <TextField {...params} label="Campaign" size="small" placeholder="Search campaigns..." />
                  )}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Since"
                  type="date"
                  size="small"
                  fullWidth
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Until"
                  type="date"
                  size="small"
                  fullWidth
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  label="Rank by"
                  size="small"
                  fullWidth
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                >
                  {METRIC_OPTIONS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && <ErrorMessage message={error} />}

        {!selectedCampaign && !error && (
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Pick a campaign above to see its ads ranked by performance.
          </Typography>
        )}

        {selectedCampaign && (
          <Card>
            <CardContent>
              <ReportTable
                columns={columns}
                data={ads}
                loading={loadingAds}
                emptyMessage="No ads with spend in this date range."
                onRowClick={(row) => setExpandedAdId(expandedAdId === row.ad_id ? null : row.ad_id)}
              />
              {expandedAdId && (
                <Collapse in>
                  <AdDetailPanel adId={expandedAdId} since={since} until={until} />
                </Collapse>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    ),
  });
};
