/**
 * WhatsApp CRM API - conversations, messages, profile, send.
 * Uses apiRequest to include Supabase access token (required by backend).
 */
import { apiRequest } from './apiClient';

const BASE_PATH = '/whatsapp-crm';

export const whatsappCrmApi = {
  getConversations: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.filter) qs.set('filter', params.filter);
    if (params.status) qs.set('status', params.status);
    if (params.assignedUserId != null) qs.set('assigned_user_id', params.assignedUserId);
    if (params.limit != null) qs.set('limit', params.limit);
    if (params.offset != null) qs.set('offset', params.offset);
    const query = qs.toString();
    return apiRequest('GET', `${BASE_PATH}/conversations${query ? `?${query}` : ''}`);
  },

  updateConversation: async (conversationId, payload) => {
    return apiRequest('PATCH', `${BASE_PATH}/conversations/${conversationId}`, payload);
  },

  getAgents: async () => {
    try {
      const data = await apiRequest('GET', `${BASE_PATH}/agents`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getMessages: async (conversationId, params = {}) => {
    const qs = new URLSearchParams();
    if (params.before != null) qs.set('before', params.before);
    if (params.limit != null) qs.set('limit', params.limit);
    const query = qs.toString();
    return apiRequest('GET', `${BASE_PATH}/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  },

  markConversationRead: async (conversationId) => {
    return apiRequest('POST', `${BASE_PATH}/conversations/${conversationId}/read`);
  },

  getConversationProfile: async (conversationId) => {
    return apiRequest('GET', `${BASE_PATH}/conversations/${conversationId}/profile`);
  },

  getTemplates: async () => {
    try {
      const data = await apiRequest('GET', `${BASE_PATH}/templates`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getContactProfile: async (contactId) => {
    return apiRequest('GET', `${BASE_PATH}/contacts/${contactId}/profile`);
  },

  sendMessage: async (payload) => {
    return apiRequest('POST', `${BASE_PATH}/send`, payload);
  },

  sendMedia: async ({ toPhone, caption, file }) => {
    const form = new FormData();
    form.append('to_phone', toPhone);
    if (caption) form.append('caption', caption);
    form.append('file', file);
    return apiRequest('POST', `${BASE_PATH}/send-media`, form);
  },

  sendProduct: async (payload) => {
    return apiRequest('POST', `${BASE_PATH}/send-product`, payload);
  },

  sendProductList: async (payload) => {
    return apiRequest('POST', `${BASE_PATH}/send-product-list`, payload);
  },

  broadcast: async (payload) => {
    return apiRequest('POST', `${BASE_PATH}/broadcast`, payload);
  },
};

export default whatsappCrmApi;
