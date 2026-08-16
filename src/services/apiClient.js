/**
 * API Client Wrapper
 * Centralized HTTP request handler for all API calls
 * Handles auth, error handling, and response formatting
 */

import { supabase } from '../config/supabase';

// API Base URL - update this to your backend URL
let VITE_API_URL = import.meta.env.VITE_API_URL;

// Force relative URL for development to ensure proxy works
if (!VITE_API_URL || VITE_API_URL.startsWith('http://localhost:')) {
  VITE_API_URL = null; // Use the default relative path
}

const API_BASE_URL = VITE_API_URL || '/billing_system/api';

console.log('🌐 API_BASE_URL (apiClient):', API_BASE_URL);

// Resolved backend origin (null in dev, where nginx/Vite path-proxies relative
// URLs; an absolute URL like https://api.minaki.me in prod, where nginx has no
// API proxy rules at all — see images/billing-frontend/nginx.conf). Other API
// prefixes (driveApi.js's /drive/api) must build their base off this, not off
// a hardcoded relative path, or they 404 through the SPA catch-all in prod.
export const API_ORIGIN = VITE_API_URL;

/**
 * Get Supabase access token for authenticated requests
 * @returns {Promise<string|null>}
 */
const getAuthToken = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      return null;
    }
    return data.session.access_token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Make an API request with common configuration
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE, PUT)
 * @param {string} path - API endpoint path
 * @param {object} data - Request body (for POST, PATCH, PUT)
 * @param {object} options - Additional options { params, headers, skipAuth }
 * @param {boolean} options.skipAuth - Skip adding auth token (for public endpoints)
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - If response is not ok
 */
export const apiRequest = async (method, path, data = null, options = {}) => {
  const { params = {}, headers = {}, skipAuth = false, timeoutMs, baseUrl } = options;

  // Build full URL (baseUrl lets callers target a different API prefix, e.g. Drive's /drive/api)
  let url = `${baseUrl || API_BASE_URL}${path}`;

  // Add query parameters if provided
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Add auth token if not skipping auth
  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Build fetch options
  const fetchOptions = {
    method,
    headers: defaultHeaders,
  };

  if (timeoutMs) {
    fetchOptions.signal = AbortSignal.timeout(timeoutMs);
  }

  // Add body for methods that support it
  if (data && ['POST', 'PATCH', 'PUT'].includes(method)) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    console.log(`🌐 API Request:`, {
      method,
      url,
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    });

    const response = await fetch(url, fetchOptions);

    console.log(`🌐 API Response Status:`, {
      method,
      path,
      status: response.status,
      statusText: response.statusText,
    });

    // Handle error responses
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      let errorDetails = null;

      // Try to parse error response
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch (parseError) {
        // If response isn't JSON, use status text
        console.warn('Could not parse error response as JSON');
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorDetails,
      };

      throw error;
    }

    // Parse and return response
    const responseData = await response.json();

    console.log(`🌐 API Success:`, {
      method,
      path,
      hasData: !!responseData,
      dataType: typeof responseData,
    });

    return responseData;
  } catch (error) {
    console.error(`🚨 API Error:`, {
      method,
      path,
      error: error.message,
      status: error.status,
    });

    throw error;
  }
};

export default apiRequest;
