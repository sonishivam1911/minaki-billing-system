const HTTP_URL_PATTERN = /^https?:\/\//i;

export function ensureStringArray(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

/** Collect every http(s) URL nested inside an API payload (banner JSON shapes vary). */
export function collectHttpImageUrls(value, collectedUrls = []) {
  if (!value) {
    return collectedUrls;
  }
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

/** Normalize generate/detail API shapes into one UI-friendly object. */
export function normalizeCollectionRunForDisplay(apiRun) {
  if (!apiRun) {
    return null;
  }
  return {
    runId: apiRun.run_id ?? apiRun.id,
    success: apiRun.success !== false && apiRun.status !== 'failed',
    cached: apiRun.cached,
    errorMessage: apiRun.error || apiRun.error_message,
    wireframe: apiRun.wireframe || apiRun.wireframe_json,
    copyPackage: apiRun.copy_package || apiRun.copy_json,
    visualBrief: apiRun.visual_brief || apiRun.visual_json,
    bannerUrls: apiRun.banner_urls || apiRun.banner_urls_json,
    bannerQualityStatus: apiRun.banner_qc_status,
    shopifyMetafieldWrite: apiRun.shopify_metafield_write_result,
    modelsUsed: apiRun.models_used,
    status: apiRun.status,
    collectionHandle: apiRun.collection_handle,
    collectionGid: apiRun.collection_gid,
    createdAt: apiRun.created_at,
    finishedAt: apiRun.finished_at,
  };
}
