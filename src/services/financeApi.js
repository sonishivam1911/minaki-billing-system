// Same base-URL resolution as agentsApi.js — Vite proxy in dev, VITE_API_URL
// origin (stripped of /billing_system/api) in prod.
function getFinanceApiBase() {
  const explicit = import.meta.env.VITE_AGENT_API_URL;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const billingUrl = import.meta.env.VITE_API_URL || '';
  if (billingUrl.includes('/billing_system/api')) {
    return billingUrl.replace(/\/billing_system\/api\/?$/, '');
  }

  return '';
}

const FINANCE_API_BASE = getFinanceApiBase();

async function getFinanceAuthToken() {
  try {
    const { supabase } = await import('../config/supabase');
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

async function financeFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = await getFinanceAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(`${FINANCE_API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      const raw = body.detail || body.message || body;
      detail = typeof raw === 'string' ? raw : JSON.stringify(raw);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return response.json();
}

export const financeApi = {
  getSpendSummary: ({ component, operation, fromDate, toDate } = {}) => {
    const params = new URLSearchParams();
    if (component) params.set('component', component);
    if (operation) params.set('operation', operation);
    if (fromDate) params.set('from_date', fromDate);
    if (toDate) params.set('to_date', toDate);
    const qs = params.toString();
    return financeFetch(`/api/finance/spend/summary${qs ? `?${qs}` : ''}`);
  },
};
