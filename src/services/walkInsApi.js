/**
 * Walk-in Visits API Service
 * Manages customer walk-in visits
 * 
 * API Prefix: /walk-ins
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/walk-ins';

export const walkInsApi = {
  /**
   * Create a new walk-in visit
   * POST /walk-ins
   * 
   * @param {Object} walkInData - Walk-in details
   *   {
   *     customer_id: number (optional, null if new customer),
   *     visit_date: string (ISO date, optional, auto-set),
   *     visit_time: string (ISO datetime, optional, auto-set),
   *     assigned_staff: string (required, username/employee ID),
   *     visit_purpose: string (required),
   *     notes: string (optional),
   *     status: string (optional, default: "active")
   *   }
   * @returns {Promise<Object>} Created walk-in with ID
   */
  create: async (walkInData) => {
    return await apiRequest('POST', BASE_PATH, walkInData);
  },

  /**
   * Get all walk-ins with optional filters
   * GET /walk-ins
   * 
   * @param {Object} filters - Filter parameters
   *   {
   *     customer_id: number (optional),
   *     assigned_staff: string (optional),
   *     status: string (optional),
   *     start_date: string (optional, ISO date),
   *     end_date: string (optional, ISO date),
   *     page: number (optional),
   *     page_size: number (optional)
   *   }
   * @returns {Promise<Object>} List of walk-ins with pagination
   */
  getAll: async (filters = {}) => {
    return await apiRequest('GET', BASE_PATH, null, {
      params: filters
    });
  },

  /**
   * Get walk-in by ID
   * GET /walk-ins/{id}
   * 
   * @param {number} walkInId - Walk-in ID
   * @returns {Promise<Object>} Walk-in details
   */
  getById: async (walkInId) => {
    return await apiRequest('GET', `${BASE_PATH}/${walkInId}`);
  },

  /**
   * Update walk-in
   * PATCH /walk-ins/{id}
   * 
   * @param {number} walkInId - Walk-in ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated walk-in
   */
  update: async (walkInId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${walkInId}`, updateData);
  },

  /**
   * Delete walk-in
   * DELETE /walk-ins/{id}
   * 
   * @param {number} walkInId - Walk-in ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (walkInId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${walkInId}`);
  },

  /**
   * Get enquiries for a walk-in
   * GET /walk-ins/{id}/enquiries
   * 
   * @param {number} walkInId - Walk-in ID
   * @returns {Promise<Array>} List of enquiries
   */
  getEnquiries: async (walkInId) => {
    return await apiRequest('GET', `${BASE_PATH}/${walkInId}/enquiries`);
  },
};

export default walkInsApi;


