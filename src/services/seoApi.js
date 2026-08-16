import { agentFetch } from './agentsApi';

const jsonBody = (data) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const withQuery = (path, params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, v);
  });
  const query = q.toString();
  return query ? `${path}?${query}` : path;
};

export const seoApi = {
  // Rank tracker — DataForSEO-only, historical SERP position tracking.
  createRankTracker: (data) => agentFetch('/api/agent/rank-tracker/configs', jsonBody(data)),

  listRankTrackers: (params = {}) =>
    agentFetch(withQuery('/api/agent/rank-tracker/configs', params)),

  getRankTracker: (configId) => agentFetch(`/api/agent/rank-tracker/configs/${configId}`),

  checkRankTracker: (configId) =>
    agentFetch(`/api/agent/rank-tracker/configs/${configId}/check`, { method: 'POST' }),

  getRankTrackerResults: (configId, params = {}) =>
    agentFetch(withQuery(`/api/agent/rank-tracker/configs/${configId}/results`, params)),

  // Backlinks — DataForSEO-only, no Google alternative.
  getBacklinksSummary: (target) =>
    agentFetch(withQuery('/api/agent/backlinks/summary', { target })),

  listBacklinks: (target, params = {}) =>
    agentFetch(withQuery('/api/agent/backlinks/list', { target, ...params })),

  listReferringDomains: (target, params = {}) =>
    agentFetch(withQuery('/api/agent/backlinks/referring-domains', { target, ...params })),

  // Local SEO / Google Business listings — Google Places-preferred.
  searchLocalPlaces: (params = {}) =>
    agentFetch(withQuery('/api/agent/local-seo/places/search', params)),

  getPlaceDetails: (placeId) => agentFetch(`/api/agent/local-seo/places/${placeId}`),

  // AI visibility / GEO tracking — direct OpenRouter.
  checkAiVisibility: (data) => agentFetch('/api/agent/ai-visibility/check', jsonBody(data)),

  checkAiVisibilityAsync: (data) =>
    agentFetch('/api/agent/ai-visibility/check-async', jsonBody(data)),

  getAiVisibilityHistory: (params = {}) =>
    agentFetch(withQuery('/api/agent/ai-visibility/history', params)),

  // Full SERP block parsing — organic, paid, featured snippet, local pack,
  // knowledge graph, related searches, top stories, PAA.
  getSerpResults: (params = {}) => agentFetch(withQuery('/api/agent/serp/results', params)),
};
