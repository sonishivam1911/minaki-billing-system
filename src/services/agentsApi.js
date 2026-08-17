function getAgentApiBase() {
  const explicit = import.meta.env.VITE_AGENT_API_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const billingUrl = import.meta.env.VITE_API_URL || '';
  if (billingUrl.includes('/billing_system/api')) {
    return billingUrl.replace(/\/billing_system\/api\/?$/, '');
  }

  // Dev: use Vite proxy (/api → backend)
  return '';
}

const AGENT_API_BASE = getAgentApiBase();

async function getAgentAuthToken() {
  try {
    const { supabase } = await import('../config/supabase');
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function agentFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!options.skipAuth) {
    const token = await getAgentAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  const response = await fetch(`${AGENT_API_BASE}${path}`, {
    ...options,
    headers,
  });
    if (!response.ok) {
      let detail = response.statusText;
      try {
        const body = await response.json();
        const raw = body.detail || body.message || body;
        detail = typeof raw === 'string' ? raw : JSON.stringify(raw);
      } catch {
        /* ignore */
      }
      throw new Error(detail);
    }
  return response.json();
}

export const agentsApi = {
  getCsvTemplates: () => agentFetch('/api/agent/writer/csv-templates'),

  validateCsv: async (file, templateId = 'sku_only') => {
    const form = new FormData();
    form.append('products_file', file);
    form.append('template_id', templateId);
    return agentFetch('/api/agent/writer/validate-csv', { method: 'POST', body: form });
  },

  runWriterSync: async ({
    file,
    sourceType = 'sku_csv',
    skuList = '',
    rowLimit = null,
    forceUpdate = false,
    dryRun = true,
    updateMask = {},
  }) => {
    const form = new FormData();
    form.append('source_type', sourceType);
    form.append('force_update', String(forceUpdate));
    form.append('dry_run', String(dryRun));
    form.append('update_mask', JSON.stringify(updateMask));
    if (file) form.append('products_file', file);
    if (skuList) form.append('sku_list', skuList);
    if (rowLimit != null) form.append('row_limit', String(rowLimit));

    const qs = rowLimit ? `?max_products=${rowLimit}` : '?max_products=500';
    return agentFetch(`/api/agent/writer-agent-sync${qs}`, { method: 'POST', body: form });
  },

  searchShopifyProducts: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    return agentFetch(`/api/agent/shopify/products/search?${q}`);
  },

  listProductReviewerQueue: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    return agentFetch(`/api/agent/product-reviewer/research/products/queue?${q}`);
  },

  listProductReviews: (productId) => {
    const q = new URLSearchParams({ product_id: String(productId || '') });
    return agentFetch(`/api/agent/product-reviewer/research/product-reviews?${q}`);
  },

  getProductReviewerWriteContext: (productId) => {
    const q = new URLSearchParams({ product_id: String(productId || '') });
    return agentFetch(`/api/agent/product-reviewer/research/product-write-context?${q}`);
  },
  generateProductReviews: (body) =>
    agentFetch('/api/agent/product-reviewer/research/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  publishProductReviews: (body) =>
    agentFetch('/api/agent/product-reviewer/research/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  startEnrichment: async (body) =>
    agentFetch('/api/agent/product-enrichment-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getEnrichmentStatus: (runId) =>
    agentFetch(`/api/agent/product-enrichment-sync/${runId}`),

  getEnrichmentItems: (runId, limit = 50, offset = 0) =>
    agentFetch(`/api/agent/product-enrichment-sync/${runId}/items?limit=${limit}&offset=${offset}`),

  listNamingTeams: () => agentFetch('/api/agent/naming-teams'),

  createNamingTeam: (data) =>
    agentFetch('/api/agent/naming-teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateNamingTeam: (id, data) =>
    agentFetch(`/api/agent/naming-teams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteNamingTeam: (id) =>
    agentFetch(`/api/agent/naming-teams/${id}`, { method: 'DELETE' }),

  generateNamesForTeam: (id, data) =>
    agentFetch(`/api/agent/naming-teams/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  expandKeywordSeeds: (data) =>
    agentFetch('/api/agent/keyword-warehouse/expand-seeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  expandKeywordSeedsGoogleAds: (data) =>
    agentFetch('/api/agent/keyword-warehouse/expand-seeds-google-ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  listKeywords: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    return agentFetch(`/api/agent/keyword-warehouse/keywords?${q}`);
  },

  similarKeywords: (id, k = 25) =>
    agentFetch(`/api/agent/keyword-warehouse/keywords/${id}/similar?k=${k}`),

  listNames: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    return agentFetch(`/api/agent/name-warehouse/names?${q}`);
  },

  collectionRagPreview: (body) =>
    agentFetch('/api/agent/collection-page/rag-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  generateCollectionPage: (body) =>
    agentFetch('/api/agent/collection-page/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  listCollectionRuns: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    return agentFetch(`/api/agent/collection-page/runs?${q}`);
  },

  getCollectionRun: (runId) => agentFetch(`/api/agent/collection-page/runs/${runId}`),

  listShopifyCollections: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    const query = q.toString();
    return agentFetch(`/api/agent/collection-page/shopify-collections${query ? `?${query}` : ''}`);
  },

  getShopifyCollectionByHandle: (handle) => {
    const q = new URLSearchParams({ handle: String(handle || '') });
    return agentFetch(`/api/agent/collection-page/shopify-collections/by-handle?${q}`);
  },

  listCollectionBuilderProducts: ({ collectionHandle, collectionGid, limit, after } = {}) => {
    const q = new URLSearchParams();
    if (collectionHandle) q.set('collection_handle', collectionHandle);
    if (collectionGid) q.set('collection_gid', collectionGid);
    if (limit) q.set('limit', limit);
    if (after) q.set('after', after);
    return agentFetch(`/api/agent/collection-builder/products?${q}`);
  },

  createCollectionBuilderBanner: (body) =>
    agentFetch('/api/agent/collection-builder/banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  applyCollectionBuilderBanner: (body) =>
    agentFetch('/api/agent/collection-builder/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  listCampaignBrandKits: () => agentFetch('/api/agent/campaign-creative/brand-kits'),

  createCampaignRun: (body) =>
    agentFetch('/api/agent/campaign-creative/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  listCampaignRuns: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    return agentFetch(`/api/agent/campaign-creative/runs?${q}`);
  },

  getCampaignRun: (runId) => agentFetch(`/api/agent/campaign-creative/runs/${runId}`),

  approveCampaignTheme: (runId, themeKey, body) =>
    agentFetch(`/api/agent/campaign-creative/runs/${runId}/themes/${themeKey}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  regenerateCampaignTheme: (runId, themeKey, body) =>
    agentFetch(`/api/agent/campaign-creative/runs/${runId}/themes/${themeKey}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  produceCampaignTheme: (runId, themeKey) =>
    agentFetch(`/api/agent/campaign-creative/runs/${runId}/themes/${themeKey}/produce`, {
      method: 'POST',
    }),

  approveCampaignAsset: (runId, themeKey, body) =>
    agentFetch(`/api/agent/campaign-creative/runs/${runId}/themes/${themeKey}/assets/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  produceAllApprovedCampaignThemes: (runId) =>
    agentFetch(`/api/agent/campaign-creative/runs/${runId}/produce`, {
      method: 'POST',
    }),

  finalizeCampaignRun: (runId, body = {}) =>
    agentFetch(`/api/agent/campaign-creative/runs/${runId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  listCreativePodGoals: () => agentFetch('/api/agent/creative-pod/goals'),

  listCreativePodPlatforms: () => agentFetch('/api/agent/creative-pod/platforms'),

  listCreativePodModels: () => agentFetch('/api/agent/creative-pod/models'),

  listCreativePodTextModels: () => agentFetch('/api/agent/creative-pod/text-models'),

  listCreativePodTextPlacements: () => agentFetch('/api/agent/creative-pod/text-placements'),

  listCreativePodBrandLanes: () => agentFetch('/api/agent/creative-pod/brand-lanes'),

  listCreativePodRuns: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') q.set(k, v);
    });
    return agentFetch(`/api/agent/creative-pod/runs?${q}`);
  },

  getCreativePodRun: (runId) => agentFetch(`/api/agent/creative-pod/runs/${runId}`),

  createCreativePodRun: async ({
    briefText,
    productImageFile,
    lifestyleImageFiles = [],
    goalType,
    goalDetail,
    platform,
    width,
    height,
    variantCount = 1,
    // 'no_text' (default) renders zero in-image text; 'with_text' burns the
    // locked title/subtitle/cta in as real type. See GET .../brand-lanes.
    textRenderMode = 'no_text',
    brandLane,
    imageModel,
    titlePosition,
    textModel,
    productDescription,
    notifyEmails = [],
  }) => {
    const form = new FormData();
    form.append('brief_text', briefText);
    form.append('product_image', productImageFile);
    form.append('variant_count', String(variantCount));
    form.append('text_render_mode', textRenderMode || 'no_text');
    if (brandLane) form.append('brand_lane', brandLane);
    if (goalType) form.append('goal_type', goalType);
    if (goalDetail) form.append('goal_detail', goalDetail);
    if (platform) form.append('platform', platform);
    if (width) form.append('width', String(width));
    if (height) form.append('height', String(height));
    if (imageModel) form.append('image_model', imageModel);
    if (titlePosition) form.append('title_position', titlePosition);
    if (textModel) form.append('text_model', textModel);
    if (productDescription) form.append('product_description', productDescription);
    if (notifyEmails?.length) {
      form.append('notify_emails', notifyEmails.join(','));
    }
    (lifestyleImageFiles || []).forEach((file) => {
      form.append('lifestyle_images', file);
    });
    return agentFetch('/api/agent/creative-pod/runs', { method: 'POST', body: form });
  },

  // body may include: hint, notify_emails, image_model, title_position,
  // product_description (override; omit to keep the run's stored one),
  // brand_lane (casting/color-lock override only — never re-runs the
  // Director, so it can't rewrite prompt text or switch text_render_mode)
  regenerateCreativePodRun: (runId, body = {}) =>
    agentFetch(`/api/agent/creative-pod/runs/${runId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  compareCreativePodModels: (runId, models = []) =>
    agentFetch(`/api/agent/creative-pod/runs/${runId}/compare-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models }),
    }),

  listMetaCampaigns: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    return agentFetch(`/api/agent/marketing/meta/campaigns?${q}`);
  },

  createMetaPortfolioRun: (body) =>
    agentFetch('/api/agent/marketing/meta/portfolio-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  listMetaPortfolioRuns: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    return agentFetch(`/api/agent/marketing/meta/portfolio-runs?${q}`);
  },

  getMetaPortfolioRun: (runId) =>
    agentFetch(`/api/agent/marketing/meta/portfolio-runs/${runId}`),
};

export default agentsApi;
