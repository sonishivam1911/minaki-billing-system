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

async function agentFetch(path, options = {}) {
  const response = await fetch(`${AGENT_API_BASE}${path}`, options);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || body.message || JSON.stringify(body);
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
};

export default agentsApi;
