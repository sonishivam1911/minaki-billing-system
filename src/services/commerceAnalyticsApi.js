import { agentFetch } from './agentsApi';

/**
 * Shopify Commerce Analytics API
 * Talks to the real-time POC backend at /commerce/analytics/*.
 *
 * Two kinds of endpoints:
 * - Live Admin endpoints (orders, carts) accept a rolling `days` window ending today.
 * - ShopifyQL endpoints (session funnel, landing pages, product views) accept true
 *   `since`/`until` date ranges.
 */

const COMMERCE_ANALYTICS_BASE = '/commerce/analytics';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    query.set(key, value instanceof Date ? value.toISOString().split('T')[0] : String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function commerceFetch(path, params) {
  return agentFetch(`${COMMERCE_ANALYTICS_BASE}${path}${buildQuery(params)}`);
}

export const commerceAnalyticsApi = {
  /** Session funnel via ShopifyQL: sessions → cart adds → reached checkout → completed. */
  getSessionFunnel: ({ since, until } = {}) =>
    commerceFetch('/sessions/funnel', { since, until }),

  /** Abandoned checkout → paid order funnel from live Shopify Admin data. */
  getCommerceFunnel: ({ days } = {}) => commerceFetch('/funnel', { days }),

  /** Paid/cancelled order counts, revenue, AOV over a rolling window. */
  getOrdersSummary: ({ days } = {}) => commerceFetch('/orders/summary', { days }),

  /** Top products by paid order units and revenue. */
  getTopOrderedProducts: ({ days, limit } = {}) =>
    commerceFetch('/products/top-orders', { days, limit }),

  /** Top products by live cart additions. */
  getTopCartProducts: ({ days, limit } = {}) =>
    commerceFetch('/products/top', { days, limit }),

  /** Top landing pages by sessions with conversion rate (ShopifyQL). */
  getTopLandingPages: ({ since, until, limit } = {}) =>
    commerceFetch('/landing-pages', { since, until, limit }),

  /** Top viewed products (GA4 first, ShopifyQL fallback). */
  getTopViewedProducts: ({ since, until, limit } = {}) =>
    commerceFetch('/products/viewed', { since, until, limit }),

  /** Add-to-cart activity broken down by city. */
  getAddToCartByCity: ({ days, limit } = {}) =>
    commerceFetch('/add-to-cart/by-city', { days, limit }),

  /** Session-level summary (events, abandoned carts, order stats). */
  getSessionSummary: ({ days } = {}) => commerceFetch('/sessions/summary', { days }),
};

export default commerceAnalyticsApi;
