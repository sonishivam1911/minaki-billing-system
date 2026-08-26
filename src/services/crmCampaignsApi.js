/**
 * Campaign builder + sender - create a campaign against a segment + template,
 * start/schedule/cancel it, view send stats.
 */
import { apiRequest } from './apiClient';

const BASE_PATH = '/crm-campaigns';

export const crmCampaignsApi = {
  list: async () => apiRequest('GET', `${BASE_PATH}/`),

  create: async (campaign) => apiRequest('POST', `${BASE_PATH}/`, campaign),

  get: async (campaignId) => apiRequest('GET', `${BASE_PATH}/${campaignId}`),

  update: async (campaignId, updates) => apiRequest('PATCH', `${BASE_PATH}/${campaignId}`, updates),

  remove: async (campaignId) => apiRequest('DELETE', `${BASE_PATH}/${campaignId}`),

  start: async (campaignId) => apiRequest('POST', `${BASE_PATH}/${campaignId}/start`),

  schedule: async (campaignId, scheduledAt) => apiRequest('POST', `${BASE_PATH}/${campaignId}/schedule`, { scheduled_at: scheduledAt }),

  cancel: async (campaignId) => apiRequest('POST', `${BASE_PATH}/${campaignId}/cancel`),

  getSends: async (campaignId, params = {}) => {
    const qs = new URLSearchParams();
    qs.set('limit', params.limit != null ? params.limit : 100);
    qs.set('offset', params.offset != null ? params.offset : 0);
    return apiRequest('GET', `${BASE_PATH}/${campaignId}/sends?${qs.toString()}`);
  },

  getStats: async (campaignId) => apiRequest('GET', `${BASE_PATH}/${campaignId}/stats`),
};

export default crmCampaignsApi;
