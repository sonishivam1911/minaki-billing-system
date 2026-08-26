/**
 * WhatsApp template lifecycle - local mirror list + create/update/pause/
 * unpause/delete/metrics against Meta directly. Distinct from
 * whatsappCrmApi.getTemplates() (live Meta passthrough, unchanged) - this
 * reads from the fast local whatsapp_templates table instead.
 */
import { apiRequest } from './apiClient';

const BASE_PATH = '/whatsapp-templates';

export const whatsappTemplatesApi = {
  list: async () => apiRequest('GET', `${BASE_PATH}/`),

  sync: async () => apiRequest('POST', `${BASE_PATH}/sync`),

  create: async (template) => apiRequest('POST', `${BASE_PATH}/`, template),

  update: async (templateId, updates) => apiRequest('PATCH', `${BASE_PATH}/${templateId}`, updates),

  pause: async (templateId) => apiRequest('POST', `${BASE_PATH}/${templateId}/pause`),

  unpause: async (templateId) => apiRequest('POST', `${BASE_PATH}/${templateId}/unpause`),

  remove: async (templateId) => apiRequest('DELETE', `${BASE_PATH}/${templateId}`),

  metrics: async (templateId, start, end) =>
    apiRequest('GET', `${BASE_PATH}/${templateId}/metrics`, null, { params: { start, end } }),
};

export default whatsappTemplatesApi;
