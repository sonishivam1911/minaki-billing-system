const HTTP_URL_PATTERN = /^https?:\/\//i;

export function ensureStringArray(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function isDisplayableImageUrl(value) {
  return (
    typeof value === 'string'
    && (HTTP_URL_PATTERN.test(value) || value.startsWith('data:image/'))
  );
}

export function collectHttpImageUrls(value, collectedUrls = []) {
  if (!value) return collectedUrls;
  if (isDisplayableImageUrl(value)) {
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

export function sortUgcFrames(frames) {
  return [...(frames || [])].sort((left, right) => {
    const sceneLeft = Number(left.scene) || 0;
    const sceneRight = Number(right.scene) || 0;
    if (sceneLeft !== sceneRight) return sceneLeft - sceneRight;
    return String(left.asset_id || '').localeCompare(String(right.asset_id || ''));
  });
}

export function formatHashtags(hashtags) {
  return ensureStringArray(hashtags)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(' ');
}

export const CAMPAIGN_KIT_LABELS = {
  fine: 'Fine by MINAKI',
  kundan: 'Kundan / Traditional',
  eleganza: 'Eleganza',
  crystal: 'Crystal',
  modern: 'Fine by MINAKI',
  traditional: 'Kundan / Traditional',
};

export function campaignBrandKitLabel(kitId, apiLabel) {
  if (apiLabel) return apiLabel;
  if (!kitId) return '—';
  return CAMPAIGN_KIT_LABELS[kitId] || kitId;
}

export function normalizeCampaignRunForDisplay(apiRun) {
  if (!apiRun) return null;
  const plan = apiRun.plan_json || apiRun.plan || {};
  const brandKitId = apiRun.brand_kit_id;
  return {
    runId: apiRun.run_id ?? apiRun.id,
    status: apiRun.status,
    brandKitId,
    brandKitLabel: campaignBrandKitLabel(brandKitId, apiRun.brand_kit_label),
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
