export const normalizeMetaPortfolioRun = (payload = {}) => {
  const report = payload.report || payload.report_json || {};
  return {
    runId: payload.run_id || payload.id || null,
    status: payload.status || report.status || 'unknown',
    error: payload.error || payload.error_message || null,
    since: payload.since || report.since || null,
    until: payload.until || report.until || null,
    resolution: payload.resolution || report.resolution || null,
    resolutionLabel: report.resolution_label || payload.resolution || null,
    campaignIds: payload.campaign_ids || report.campaign_ids || [],
    createdAt: payload.created_at || null,
    finishedAt: payload.finished_at || null,
    createdByEmail: payload.created_by_email || null,
    portfolioOverall: report.portfolio_overall || {},
    portfolioByPeriod: report.portfolio_by_period || [],
    campaigns: report.campaigns || [],
    shopify: report.shopify || null,
    notes: report.notes || [],
    errors: report.errors || [],
    raw: payload,
  };
};

export const defaultPortfolioDateRange = () => {
  const until = new Date();
  const since = new Date(until.getFullYear(), until.getMonth(), 1);
  const toIso = (dateValue) => dateValue.toISOString().slice(0, 10);
  return { since: toIso(since), until: toIso(until) };
};

export const campaignOptionLabel = (campaign) => {
  const funnel = campaign?.funnel_mode?.mode || 'MOF';
  const status = campaign?.effective_status || campaign?.status || 'UNKNOWN';
  return `${campaign?.name || campaign?.id} · ${funnel} · ${status}`;
};
