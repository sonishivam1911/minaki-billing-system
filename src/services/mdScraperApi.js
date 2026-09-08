/**
 * MD Scraper API Service
 * Fine by MINAKI's discovered designs — shapes with their mirrored
 * Contabo images/video, gold/diamond intake, pricing, Shopify push
 * status, and run history.
 *
 * Discovery itself is not triggered from here — that's the
 * X-Internal-Sync-Key-protected /internal/md-scraper/* endpoints, meant
 * for the cron, not a button anyone signed into the hub could click.
 * Everything below IS the ops-facing surface: browsing, filling in
 * intake, previewing price, and pushing to Shopify.
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
   * Real ring/necklace/bracelet design choices, sourced live from
   * fine-by-minaki's own Shopify metaobjects (the same picklist Shopify's
   * admin uses). Earrings comes back empty — no matching field on that
   * store yet.
   * GET /md-scraper/design-type-options
   */
  getDesignTypeOptions: async () => {
    return await apiRequest('GET', `${BASE_PATH}/design-type-options`);
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

  /**
   * Per-Shopify-variant metadata for one design — metal karat, stone
   * color/clarity/certification, SKU, price. Reference data for the
   * gold/diamond intake popup, not required to fill it in.
   * GET /md-scraper/designs/:designHandle/variants
   */
  getDesignVariants: async (designHandle) => {
    return await apiRequest('GET', `${BASE_PATH}/designs/${designHandle}/variants`);
  },

  /**
   * Ops' existing gold/diamond breakdown for one (design, shape), if any.
   * GET /md-scraper/designs/:designHandle/:shapeKey/gold-diamond-intake
   */
  getGoldDiamondIntake: async (designHandle, shapeKey) => {
    return await apiRequest('GET', `${BASE_PATH}/designs/${designHandle}/${shapeKey}/gold-diamond-intake`);
  },

  /**
   * Saves (upserts) ops' gold/diamond breakdown for one (design, shape).
   * POST /md-scraper/designs/:designHandle/:shapeKey/gold-diamond-intake
   */
  saveGoldDiamondIntake: async (designHandle, shapeKey, payload) => {
    return await apiRequest(
      'POST',
      `${BASE_PATH}/designs/${designHandle}/${shapeKey}/gold-diamond-intake`,
      payload
    );
  },

  /**
   * Computes the full 6-variant (14K/18K x White/Yellow/Rose) priced
   * matrix live, without saving anything.
   * POST /md-scraper/pricing/preview
   */
  previewPricing: async ({ gold_weight_14k_grams, stones }) => {
    return await apiRequest('POST', `${BASE_PATH}/pricing/preview`, { gold_weight_14k_grams, stones });
  },

  /**
   * Kicks off an async push of one design_shape's saved intake to
   * Shopify (creates a DRAFT product). Returns a push_run_id.
   * POST /md-scraper/designs/:designHandle/:shapeKey/push
   */
  pushDesign: async (designHandle, shapeKey) => {
    return await apiRequest('POST', `${BASE_PATH}/designs/${designHandle}/${shapeKey}/push`);
  },

  /**
   * Status of one push run.
   * GET /md-scraper/push-runs/:pushRunId
   */
  getPushRun: async (pushRunId) => {
    return await apiRequest('GET', `${BASE_PATH}/push-runs/${pushRunId}`);
  },
};

export default mdScraperApi;
