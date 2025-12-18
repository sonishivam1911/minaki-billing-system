/**
 * Storage Shelves API Service
 * Manages physical shelves within locations
 * 
 * API Prefix: /inventory/shelves
 * Hierarchy: Location → Shelf → Box → Products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/inventory/shelves';

export const shelvesApi = {
  /**
   * Create a single shelf
   * POST /inventory/shelves/
   * 
   * @param {Object} shelfData - Shelf details
   *   {
   *     location_id: number (required),
   *     shelf_name: string,
   *     shelf_code: string,
   *     shelf_level: number,
   *     capacity: number,
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Created shelf with ID
   */
  create: async (shelfData) => {
    return await apiRequest('POST', `${BASE_PATH}/`, shelfData);
  },

  /**
   * Create multiple shelves (bulk)
   * POST /inventory/shelves/bulk
   * 
   * @param {Array} shelvesArray - Array of shelf objects
   *   [
   *     {
   *       location_id: number,
   *       shelf_name: string,
   *       shelf_code: string,
   *       shelf_level: number,
   *       capacity: number
   *     },
   *     ...
   *   ]
   * @returns {Promise<Array>} Array of created shelves
   */
  bulkCreate: async (shelvesArray) => {
    return await apiRequest('POST', `${BASE_PATH}/bulk`, shelvesArray);
  },

  /**
   * Get all shelves in a location
   * GET /inventory/shelves/location/{location_id}
   * 
   * @param {number} locationId - Location ID
   * @param {boolean} activeOnly - Filter to active shelves only (optional)
   * @returns {Promise<Array>} All shelves in the location
   */
  getByLocation: async (locationId, activeOnly = false) => {
    return await apiRequest('GET', `${BASE_PATH}/location/${locationId}`, null, {
      params: activeOnly ? { active_only: true } : {}
    });
  },

  /**
   * Get shelf grid layout for visualization
   * GET /inventory/shelves/location/{location_id}/grid
   * Returns grid layout data for UI visualization (drag-drop support)
   * 
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Grid layout data
   */
  getGridLayout: async (locationId) => {
    return await apiRequest('GET', `${BASE_PATH}/location/${locationId}/grid`);
  },

  /**
   * Get shelf by ID
   * GET /inventory/shelves/{shelf_id}
   * 
   * @param {number} shelfId - Shelf ID
   * @returns {Promise<Object>} Shelf object with location details
   */
  getById: async (shelfId) => {
    return await apiRequest('GET', `${BASE_PATH}/${shelfId}`);
  },

  /**
   * Update shelf
   * PATCH /inventory/shelves/{shelf_id}
   * 
   * @param {number} shelfId - Shelf ID
   * @param {Object} updateData - Fields to update
   *   {
   *     shelf_name: string (optional),
   *     shelf_code: string (optional),
   *     capacity: number (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Updated shelf
   */
  update: async (shelfId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${shelfId}`, updateData);
  },

  /**
   * Update shelf position (UI drag-drop)
   * PATCH /inventory/shelves/{shelf_id}/position
   * 
   * @param {number} shelfId - Shelf ID
   * @param {number} visualX - X coordinate for UI
   * @param {number} visualY - Y coordinate for UI
   * @returns {Promise<Object>} Updated shelf with new coordinates
   */
  updatePosition: async (shelfId, visualX, visualY) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${shelfId}/position`, null, {
      params: { visual_x: visualX, visual_y: visualY }
    });
  },

  /**
   * Update single shelf coordinates
   * PATCH /inventory/shelves/{shelf_id}/coordinates
   * 
   * @param {number} shelfId - Shelf ID
   * @param {number} visualX - X coordinate
   * @param {number} visualY - Y coordinate
   * @returns {Promise<Object>} Updated shelf object
   */
  updateCoordinates: async (shelfId, visualX, visualY) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${shelfId}/coordinates`, {
      visual_x: visualX,
      visual_y: visualY
    });
  },

  /**
   * Bulk update shelf coordinates
   * PATCH /inventory/shelves/bulk/coordinates
   * 
   * @param {Array} updates - Array of {id, visual_x, visual_y}
   * @returns {Promise<Object>} {updated: [...], errors: [...], message: string}
   */
  bulkUpdateCoordinates: async (updates) => {
    return await apiRequest('PATCH', `${BASE_PATH}/bulk/coordinates`, {
      updates: updates
    });
  },

  /**
   * Delete shelf
   * DELETE /inventory/shelves/{shelf_id}
   * 
   * @param {number} shelfId - Shelf ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (shelfId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${shelfId}`);
  },

  // Legacy method names for backwards compatibility
  createShelf: async (shelfData) => {
    return shelvesApi.create(shelfData);
  },

  bulkCreateShelves: async (shelvesArray) => {
    return shelvesApi.bulkCreate(shelvesArray);
  },

  getShelvesByLocation: async (locationId, activeOnly = true) => {
    return shelvesApi.getByLocation(locationId, activeOnly);
  },

  getShelfGridLayout: async (locationId) => {
    return shelvesApi.getGridLayout(locationId);
  },

  getShelfById: async (shelfId) => {
    return shelvesApi.getById(shelfId);
  },

  updateShelf: async (shelfId, updateData) => {
    return shelvesApi.update(shelfId, updateData);
  },

  updateShelfPosition: async (shelfId, visualX, visualY) => {
    return shelvesApi.updatePosition(shelfId, visualX, visualY);
  },

  deleteShelf: async (shelfId) => {
    return shelvesApi.delete(shelfId);
  },
};

export default shelvesApi;