/**
 * Customer Enquiries API Service
 * Manages customer enquiries
 * 
 * API Prefix: /enquiries
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/enquiries';

export const enquiriesApi = {
  /**
   * Create a new enquiry
   * POST /enquiries
   * 
   * @param {Object} enquiryData - Enquiry details
   *   {
   *     walk_in_id: number (optional),
   *     customer_id: number (required),
   *     category: string (required),
   *     product_type: string (required),
   *     budget_min: number (optional),
   *     budget_max: number (optional),
   *     timeline: string (optional),
   *     description: string (required),
   *     status: string (optional, default: "new")
   *   }
   * @returns {Promise<Object>} Created enquiry with ID
   */
  create: async (enquiryData) => {
    return await apiRequest('POST', BASE_PATH, enquiryData);
  },

  /**
   * Get all enquiries with optional filters
   * GET /enquiries
   * 
   * @param {Object} filters - Filter parameters
   *   {
   *     walk_in_id: number (optional),
   *     customer_id: number (optional),
   *     category: string (optional),
   *     status: string (optional),
   *     page: number (optional),
   *     page_size: number (optional)
   *   }
   * @returns {Promise<Object>} List of enquiries with pagination
   */
  getAll: async (filters = {}) => {
    return await apiRequest('GET', BASE_PATH, null, {
      params: filters
    });
  },

  /**
   * Get enquiry by ID
   * GET /enquiries/{id}
   * 
   * @param {number} enquiryId - Enquiry ID
   * @returns {Promise<Object>} Enquiry details
   */
  getById: async (enquiryId) => {
    return await apiRequest('GET', `${BASE_PATH}/${enquiryId}`);
  },

  /**
   * Update enquiry
   * PATCH /enquiries/{id}
   * 
   * @param {number} enquiryId - Enquiry ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated enquiry
   */
  update: async (enquiryId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${enquiryId}`, updateData);
  },

  /**
   * Delete enquiry
   * DELETE /enquiries/{id}
   * 
   * @param {number} enquiryId - Enquiry ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (enquiryId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${enquiryId}`);
  },

  /**
   * Get orders for an enquiry
   * GET /enquiries/{id}/orders
   * 
   * @param {number} enquiryId - Enquiry ID
   * @returns {Promise<Array>} List of custom orders
   */
  getOrders: async (enquiryId) => {
    return await apiRequest('GET', `${BASE_PATH}/${enquiryId}/orders`);
  },
};

export default enquiriesApi;


