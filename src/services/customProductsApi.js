/**
 * Custom Products API Service
 * Manages custom products (Lab Grown Diamond) with reference images
 *
 * API Prefix: /custom-products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/custom-products';

export const customProductsApi = {
  /**
   * Create a new custom product
   * POST /custom-products
   */
  create: async (productData) => {
    return await apiRequest('POST', BASE_PATH, productData);
  },

  /**
   * Get all custom products with optional filters
   * GET /custom-products
   */
  getAll: async (filters = {}) => {
    return await apiRequest('GET', BASE_PATH, null, {
      params: filters
    });
  },

  /**
   * Get custom product by ID
   * GET /custom-products/{id}
   */
  getById: async (productId) => {
    return await apiRequest('GET', `${BASE_PATH}/${productId}`);
  },

  /**
   * Update custom product
   * PATCH /custom-products/{id}
   */
  update: async (productId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${productId}`, updateData);
  },

  /**
   * Delete custom product
   * DELETE /custom-products/{id}
   */
  delete: async (productId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${productId}`);
  },
};

export default customProductsApi;
