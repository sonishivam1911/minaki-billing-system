/**
 * CRM data pipeline + segmentation - merged Shopify + Zoho customer view
 * (crm_customers) and saved segments on top of it.
 */
import { apiRequest } from './apiClient';

const BASE_PATH = '/crm';

export const crmApi = {
  syncShopifyCustomers: async () => apiRequest('POST', `${BASE_PATH}/sync/shopify-customers`),

  syncMerge: async () => apiRequest('POST', `${BASE_PATH}/sync/merge`),

  listCustomers: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.segmentId != null) qs.set('segment_id', params.segmentId);
    qs.set('limit', params.limit != null ? params.limit : 50);
    qs.set('offset', params.offset != null ? params.offset : 0);
    return apiRequest('GET', `${BASE_PATH}/customers?${qs.toString()}`);
  },

  listSegments: async () => apiRequest('GET', `${BASE_PATH}/segments`),

  createSegment: async (segment) => apiRequest('POST', `${BASE_PATH}/segments`, segment),

  getSegment: async (segmentId) => apiRequest('GET', `${BASE_PATH}/segments/${segmentId}`),

  updateSegment: async (segmentId, updates) => apiRequest('PATCH', `${BASE_PATH}/segments/${segmentId}`, updates),

  deleteSegment: async (segmentId) => apiRequest('DELETE', `${BASE_PATH}/segments/${segmentId}`),

  computeSegment: async (segmentId) => apiRequest('POST', `${BASE_PATH}/segments/${segmentId}/compute`),

  getSegmentMembers: async (segmentId, params = {}) => {
    const qs = new URLSearchParams();
    qs.set('limit', params.limit != null ? params.limit : 100);
    qs.set('offset', params.offset != null ? params.offset : 0);
    return apiRequest('GET', `${BASE_PATH}/segments/${segmentId}/members?${qs.toString()}`);
  },

  previewSegment: async (filterDefinition, limit = 50) =>
    apiRequest('POST', `${BASE_PATH}/segments/preview`, { filter_definition: filterDefinition, limit }),
};

export default crmApi;
