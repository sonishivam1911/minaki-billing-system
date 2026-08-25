/**
 * Shopify abandoned-checkout WhatsApp winback - list + manual trigger.
 * Uses apiRequest to include Supabase access token (required by backend).
 */
import { apiRequest } from './apiClient';

const BASE_PATH = '/shopify-winback';

export const shopifyWinbackApi = {
  listCheckouts: async (params = {}) => {
    const qs = new URLSearchParams();
    qs.set('status', params.status || 'open');
    qs.set('limit', params.limit != null ? params.limit : 25);
    if (params.pageInfo) qs.set('page_info', params.pageInfo);
    return apiRequest('GET', `${BASE_PATH}/checkouts?${qs.toString()}`);
  },

  triggerCheckout: async (checkoutToken, checkout) => {
    return apiRequest('POST', `${BASE_PATH}/checkouts/${encodeURIComponent(checkoutToken)}/trigger`, {
      checkout_id: checkout.checkout_id,
      email: checkout.email,
      phone: checkout.phone,
      customer: checkout.customer,
      billing_address: checkout.billing_address,
      shipping_address: checkout.shipping_address,
      line_items: checkout.line_items,
      abandoned_checkout_url: checkout.abandoned_checkout_url,
      total_price: checkout.total_price,
      currency: checkout.currency,
    });
  },

  getTemplateConfig: async () => {
    return apiRequest('GET', `${BASE_PATH}/config`);
  },

  updateTemplateConfig: async (updates) => {
    return apiRequest('PATCH', `${BASE_PATH}/config`, updates);
  },
};

export default shopifyWinbackApi;
