/**
 * Storage Locations API Service
 * Manages physical locations/buildings/stores in the inventory system
 * 
 * API Prefix: /inventory/locations
 * Hierarchy: Location → Shelf → Box → Products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/inventory/locations';

export const locationsApi = {
  /**
   * Create a new storage location
   * POST /inventory/locations/
   * 
   * @param {Object} locationData - Location details
   *   {
   *     location_name: string,
   *     location_code: string,
   *     description: string (optional),
   *     is_active: boolean (optional, default: true)
   *   }
   * @returns {Promise<Object>} Created location with ID
   */
  create: async (locationData) => {
    return await apiRequest('POST', `${BASE_PATH}/`, locationData);
  },

  /**
   * Get all storage locations
   * GET /inventory/locations
   * 
   * @param {boolean} activeOnly - Filter to active locations only (optional)
   * @returns {Promise<Array>} List of locations
   */
  getAll: async (activeOnly = false) => {
    return await apiRequest('GET', BASE_PATH, null, {
      params: activeOnly ? { active_only: true } : {}
    });
  },

  /**
   * Get locations with statistics
   * GET /inventory/locations/with-stats
   * Returns shelf count, box count, and product count for each location
   * 
   * @returns {Promise<Array>} Locations with shelf_count, box_count, product_count
   */
  getWithStats: async () => {
    return await apiRequest('GET', `${BASE_PATH}/with-stats`);
  },

  /**
   * Get location by ID
   * GET /inventory/locations/{location_id}
   * 
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Location details
   */
  getById: async (locationId) => {
    return await apiRequest('GET', `${BASE_PATH}/${locationId}`);
  },

  /**
   * Get location statistics
   * GET /inventory/locations/{location_id}/statistics
   * Returns detailed statistics for the location
   * 
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Location statistics
   */
  getStatistics: async (locationId) => {
    return await apiRequest('GET', `${BASE_PATH}/${locationId}/statistics`);
  },

  /**
   * Update location
   * PATCH /inventory/locations/{location_id}
   * All fields are optional
   * 
   * @param {number} locationId - Location ID
   * @param {Object} updateData - Fields to update
   *   {
   *     location_name: string (optional),
   *     location_code: string (optional),
   *     description: string (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Updated location
   */
  update: async (locationId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${locationId}`, updateData);
  },

  /**
   * Delete (soft delete) location
   * DELETE /inventory/locations/{location_id}
   * Sets is_active to false
   * 
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (locationId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${locationId}`);
  },

  // Legacy method names for backwards compatibility
  createLocation: async (locationData) => {
    return locationsApi.create(locationData);
  },

  getAllLocations: async (activeOnly = true) => {
    return locationsApi.getAll(activeOnly);
  },

  getLocationsWithStats: async () => {
    return locationsApi.getWithStats();
  },

  getLocationById: async (locationId) => {
    return locationsApi.getById(locationId);
  },

  getLocationStatistics: async (locationId) => {
    return locationsApi.getStatistics(locationId);
  },

  updateLocation: async (locationId, updateData) => {
    return locationsApi.update(locationId, updateData);
  },

  deleteLocation: async (locationId) => {
    return locationsApi.delete(locationId);
  },
};

export default locationsApi;