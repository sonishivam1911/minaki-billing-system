/**
 * Custom Orders API Service
 * Manages custom orders with reference images
 * 
 * API Prefix: /custom-orders
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/custom-orders';

export const customOrdersApi = {
  /**
   * Create a new custom order
   * POST /custom-orders
   * 
   * @param {Object} orderData - Order details
   *   {
   *     enquiry_id: number (optional),
   *     customer_id: number (required),
   *     order_number: string (optional, auto-generated),
   *     reference_images: array (optional, array of URLs),
   *     description: string (required),
   *     specifications: object (optional, JSON),
   *     estimated_price: number (optional),
   *     status: string (optional, default: "draft")
   *   }
   * @returns {Promise<Object>} Created order with ID
   */
  create: async (orderData) => {
    return await apiRequest('POST', BASE_PATH, orderData);
  },

  /**
   * Get all custom orders with optional filters
   * GET /custom-orders
   * 
   * @param {Object} filters - Filter parameters
   *   {
   *     enquiry_id: number (optional),
   *     customer_id: number (optional),
   *     status: string (optional),
   *     start_date: string (optional, ISO date),
   *     end_date: string (optional, ISO date),
   *     page: number (optional),
   *     page_size: number (optional)
   *   }
   * @returns {Promise<Object>} List of orders with pagination
   */
  getAll: async (filters = {}) => {
    return await apiRequest('GET', BASE_PATH, null, {
      params: filters
    });
  },

  /**
   * Get custom order by ID
   * GET /custom-orders/{id}
   * 
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  getById: async (orderId) => {
    return await apiRequest('GET', `${BASE_PATH}/${orderId}`);
  },

  /**
   * Update custom order
   * PATCH /custom-orders/{id}
   * 
   * @param {number} orderId - Order ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated order
   */
  update: async (orderId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${orderId}`, updateData);
  },

  /**
   * Delete custom order
   * DELETE /custom-orders/{id}
   * 
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (orderId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${orderId}`);
  },

  /**
   * Generate quote for custom order
   * POST /custom-orders/{id}/quote
   * 
   * @param {number} orderId - Order ID
   * @param {Object} quoteData - Quote details (optional)
   * @returns {Promise<Object>} Generated quote
   */
  generateQuote: async (orderId, quoteData = {}) => {
    return await apiRequest('POST', `${BASE_PATH}/${orderId}/quote`, quoteData);
  },

  /**
   * Upload reference images for custom order
   * POST /custom-orders/{id}/images
   * 
   * @param {number} orderId - Order ID
   * @param {Array<string>} imageUrls - Array of image URLs
   * @returns {Promise<Object>} Updated order with images
   */
  uploadImages: async (orderId, imageUrls) => {
    return await apiRequest('POST', `${BASE_PATH}/${orderId}/images`, {
      image_urls: imageUrls
    });
  },
};

export default customOrdersApi;


