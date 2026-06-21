const HTTP_URL_PATTERN = /^https?:\/\//i;

export function ensureStringArray(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function collectHttpImageUrls(value, collectedUrls = []) {
  if (!value) return collectedUrls;
  if (typeof value === 'string' && HTTP_URL_PATTERN.test(value)) {
    collectedUrls.push(value);
    return collectedUrls;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectHttpImageUrls(entry, collectedUrls));
    return collectedUrls;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectHttpImageUrls(entry, collectedUrls));
  }
  return collectedUrls;
}

export function normalizeCampaignRunForDisplay(apiRun) {
  if (!apiRun) return null;
  const plan = apiRun.plan_json || apiRun.plan || {};
  return {
    runId: apiRun.run_id ?? apiRun.id,
    status: apiRun.status,
    brandKitId: apiRun.brand_kit_id,
    campaignConfig: apiRun.campaign_config_json || {},
    plan,
    strategySummary: plan.strategy_summary || '',
    themes: plan.themes || [],
    zipUrl: apiRun.zip_url,
    errorMessage: apiRun.error || apiRun.error_message,
    schemaReady: apiRun.schema_ready !== false,
  };
}

export function approvalStatusClass(status) {
  switch (status) {
    case 'approved':
      return 'agents-status-ok';
    case 'rejected':
      return 'agents-status-err';
    case 'needs_review':
      return 'agents-validation';
    default:
      return 'agents-muted';
  }
}
