/**
 * MD Scraper API Service
 * Browses what the Miadonna reference-catalog scraper (Fine by MINAKI
 * diamond line) has found — scraped designs/shapes with their mirrored
 * Contabo images/video, and scrape run history/status.
 *
 * Read-only from here. Triggering an actual scrape run is deliberately
 * NOT exposed to the browser — that's the X-Internal-Sync-Key-protected
 * /internal/md-scraper/* endpoints, meant for the n8n cron, not a button
 * anyone signed into the hub could click.
 *
 * API Prefix: /md-scraper
 */
import { apiRequest } from './apiClient';

const BASE_PATH = '/md-scraper';

export const mdScraperApi = {
  /**
   * Paginated list of scraped (design, shape) rows.
   * GET /md-scraper/designs
   *
   * @param {Object} params - { limit, offset, search, productType, shape }
   * @returns {Promise<{ total: number, designs: Array }>}
   */
  listDesigns: async ({ limit = 50, offset = 0, search = '', productType = '', shape = '' } = {}) => {
    const params = { limit, offset };
    if (search) params.search = search;
    if (productType) params.product_type = productType;
    if (shape) params.shape = shape;
    return await apiRequest('GET', `${BASE_PATH}/designs`, null, { params });
  },

  /**
   * Distinct product_type/shape values in the scraped catalog — for the
   * filter dropdowns. Not hardcoded since Miadonna's vocabulary can shift.
   * GET /md-scraper/designs/filter-options
   */
  getFilterOptions: async () => {
    return await apiRequest('GET', `${BASE_PATH}/designs/filter-options`);
  },

  /**
   * Recent scrape run history, newest first.
   * GET /md-scraper/runs
   */
  listRuns: async ({ limit = 20, offset = 0 } = {}) => {
    return await apiRequest('GET', `${BASE_PATH}/runs`, null, { params: { limit, offset } });
  },

  /**
   * Full status of one run.
   * GET /md-scraper/runs/:runId
   */
  getRun: async (runId) => {
    return await apiRequest('GET', `${BASE_PATH}/runs/${runId}`);
  },

  /**
   * Per-design failure detail for one run.
   * GET /md-scraper/runs/:runId/failures
   */
  getRunFailures: async (runId) => {
    return await apiRequest('GET', `${BASE_PATH}/runs/${runId}/failures`);
  },
};

export default mdScraperApi;
