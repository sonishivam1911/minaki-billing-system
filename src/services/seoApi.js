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

  // Site crawl — sitemap discovery + scrape (HTML/JSON in S3+DB) + opt-in
  // per-page Google Ads keyword extraction across a whole Shopify site.
  listSiteCrawls: (params = {}) => agentFetch(withQuery('/api/agent/site-crawl', params)),

  startSiteCrawl: (data) => agentFetch('/api/agent/site-crawl/start', jsonBody(data)),

  getSiteCrawl: (crawlId) => agentFetch(`/api/agent/site-crawl/${crawlId}`),

  cancelSiteCrawl: (crawlId) => agentFetch(`/api/agent/site-crawl/${crawlId}/cancel`, jsonBody({})),

  resumeSiteCrawl: (crawlId) => agentFetch(`/api/agent/site-crawl/${crawlId}/resume`, jsonBody({})),

  listSiteCrawlPages: (crawlId, params = {}) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/pages`, params)),

  getSiteCrawlPageDetail: (crawlId, url) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/pages/detail`, { url })),

  extractSiteCrawlKeywords: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/extract-keywords`, jsonBody(data)),

  getSiteCrawlKeywordExtractionStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/keyword-extraction-status`),

  getSiteCrawlKeywordReport: (crawlId, params = {}) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/keyword-report`, params)),

  checkSiteCrawlSchema: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/check-schema`, jsonBody(data)),

  getSiteCrawlSchemaCheckStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/schema-check-status`),

  getSiteCrawlSchemaReport: (crawlId, params = {}) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/schema-report`, params)),

  // Page-type counts (View 1) + unified structural-data extraction
  // (headings/links/meta/OG) — auto-triggered alongside keyword
  // extraction/schema check once a crawl completes.
  getSiteCrawlPageTypeSummary: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/page-type-summary`),

  extractSiteCrawlContent: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/extract-content`, jsonBody(data)),

  getSiteCrawlContentExtractionStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/content-extraction-status`),

  getSiteCrawlPageContent: (crawlId, url) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/pages/content`, { url })),

  getSiteCrawlPageLinks: (crawlId, url, params = {}) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/pages/links`, { url, ...params })),

  getSiteCrawlPageEmbeddingStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/page-embedding-status`),

  // Keyword clustering + composite scoring (frequency/relevance/volume/
  // competition) -> each page's top-N final keywords.
  scoreSiteCrawlKeywords: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/score-keywords`, jsonBody(data)),

  getSiteCrawlKeywordScoringStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/keyword-scoring-status`),

  getSiteCrawlPageKeywordScores: (crawlId, url) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/pages/keyword-scores`, { url })),

  // SERP rank validation for final keywords — is THIS page actually
  // ranking page-1, not just the domain.
  checkSiteCrawlRankings: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/check-rankings`, jsonBody(data)),

  getSiteCrawlSerpLookupStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/serp-lookup-status`),

  getSiteCrawlPageRankings: (crawlId, url) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/pages/rankings`, { url })),

  // Technical SEO — canonical/meta-robots/robots.txt/redirect chains.
  checkSiteCrawlTechnical: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/check-technical`, jsonBody(data)),

  getSiteCrawlTechnicalCheckStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/technical-check-status`),

  getSiteCrawlTechnicalReport: (crawlId, params = {}) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/technical-report`, params)),

  // CWV/Lighthouse — manual only, never auto-triggered (PSI quota).
  checkSiteCrawlCwv: (crawlId, data = {}) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/check-cwv`, jsonBody(data)),

  getSiteCrawlCwvStatus: (crawlId) =>
    agentFetch(`/api/agent/site-crawl/${crawlId}/cwv-status`),

  getSiteCrawlCwvReport: (crawlId, params = {}) =>
    agentFetch(withQuery(`/api/agent/site-crawl/${crawlId}/cwv-report`, params)),

  // Keyword-scoped SERP store — cache-first, persisted (unlike the
  // always-live getSerpResults above).
  getSerpSnapshot: (params = {}) => agentFetch(withQuery('/api/agent/serp/snapshot', params)),

  getSerpHistory: (params = {}) => agentFetch(withQuery('/api/agent/serp/history', params)),

  // AEO/GEO enrichment — PAA + Related Searches ride free on the SERP
  // snapshot above; Autocomplete + Trends are the two genuinely new
  // free-but-fragile sources.
  getKeywordAutocomplete: (params = {}) =>
    agentFetch(withQuery('/api/agent/keyword-enrichment/autocomplete', params)),

  getKeywordTrends: (params = {}) =>
    agentFetch(withQuery('/api/agent/keyword-enrichment/trends', params)),

  // DataForSEO cost guardrail — current-month spend/cap/remaining.
  getDataForSeoSpendStatus: () => agentFetch('/api/agent/dataforseo-spend/status'),

  // Backlinks — gated, cache-first, cost-guardrailed (unlike the
  // always-live getBacklinksSummary/listBacklinks/listReferringDomains
  // above, kept for backward compat).
  checkBacklinks: (data) => agentFetch('/api/agent/backlinks/check', jsonBody(data)),

  getBacklinksSnapshots: (params = {}) =>
    agentFetch(withQuery('/api/agent/backlinks/snapshots', params)),
};
