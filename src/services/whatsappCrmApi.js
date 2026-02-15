/**
 * WhatsApp CRM API - conversations, messages, profile, send.
 * Base URL: /billing_system/api/whatsapp-crm
 */
let VITE_API_URL = import.meta.env.VITE_API_URL;
if (!VITE_API_URL || VITE_API_URL.startsWith('http://localhost:')) {
  VITE_API_URL = null;
}
const API_BASE_URL = VITE_API_URL || '/billing_system/api';
const WHATSAPP_CRM_PREFIX = `${API_BASE_URL}/whatsapp-crm`;

export const whatsappCrmApi = {
  getConversations: async (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.filter) qs.set('filter', params.filter);
    if (params.limit != null) qs.set('limit', params.limit);
    if (params.offset != null) qs.set('offset', params.offset);
    const url = `${WHATSAPP_CRM_PREFIX}/conversations${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch conversations: ${res.status}`);
    return res.json();
  },

  getMessages: async (conversationId, params = {}) => {
    const qs = new URLSearchParams();
    if (params.before != null) qs.set('before', params.before);
    if (params.limit != null) qs.set('limit', params.limit);
    const url = `${WHATSAPP_CRM_PREFIX}/conversations/${conversationId}/messages${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
    return res.json();
  },

  markConversationRead: async (conversationId) => {
    const res = await fetch(`${WHATSAPP_CRM_PREFIX}/conversations/${conversationId}/read`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to mark read: ${res.status}`);
    return res.json();
  },

  getConversationProfile: async (conversationId) => {
    const res = await fetch(`${WHATSAPP_CRM_PREFIX}/conversations/${conversationId}/profile`);
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
    return res.json();
  },

  getTemplates: async () => {
    const res = await fetch(`${WHATSAPP_CRM_PREFIX}/templates`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getContactProfile: async (contactId) => {
    const res = await fetch(`${WHATSAPP_CRM_PREFIX}/contacts/${contactId}/profile`);
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
    return res.json();
  },

  sendMessage: async (payload) => {
    const res = await fetch(`${WHATSAPP_CRM_PREFIX}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Send failed: ${res.status}`);
    }
    return res.json();
  },

  broadcast: async (payload) => {
    const res = await fetch(`${WHATSAPP_CRM_PREFIX}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Broadcast failed: ${res.status}`);
    }
    return res.json();
  },
};

export default whatsappCrmApi;
