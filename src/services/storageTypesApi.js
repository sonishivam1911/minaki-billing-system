/**
 * Storage Types API Service
 * Manages storage types within locations
 * 
 * API Prefix: /inventory/storage-types
 * Hierarchy: Location → Storage Type → Storage Object → Products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/inventory/storage-types';

export const storageTypesApi = {
  /**
   * Create a single storage type
   * POST /inventory/storage-types/
   * 
   * @param {Object} storageTypeData - Storage type details
   *   {
   *     location_id: number (required),
   *     storage_type_name: string,
   *     storage_type_code: string,
   *     capacity: number (optional),
   *     row_position: number (optional),
   *     column_position: number (optional),
   *     visual_x: number (optional),
   *     visual_y: number (optional),
   *     description: string (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Created storage type with ID
   */
  create: async (storageTypeData) => {
    return await apiRequest('POST', `${BASE_PATH}/`, storageTypeData);
  },

  /**
   * Create multiple storage types (bulk)
   * POST /inventory/storage-types/bulk
   * 
   * @param {Array} storageTypesArray - Array of storage type objects
   *   [
   *     {
   *       location_id: number,
   *       storage_type_name: string,
   *       storage_type_code: string,
   *       capacity: number (optional)
   *     },
   *     ...
   *   ]
   * @returns {Promise<Array>} Array of created storage types
   */
  bulkCreate: async (storageTypesArray) => {
    return await apiRequest('POST', `${BASE_PATH}/bulk`, storageTypesArray);
  },

  /**
   * Get all storage types in a location
   * GET /inventory/storage-types/location/{location_id}
   * 
   * @param {number} locationId - Location ID
   * @param {boolean} activeOnly - Filter to active storage types only (optional)
   * @returns {Promise<Array>} All storage types in the location
   */
  getByLocation: async (locationId, activeOnly = false) => {
    return await apiRequest('GET', `${BASE_PATH}/location/${locationId}`, null, {
      params: activeOnly ? { active_only: true } : {}
    });
  },

  /**
   * Get storage type grid layout for visualization
   * GET /inventory/storage-types/location/{location_id}/grid
   * Returns grid layout data for UI visualization (drag-drop support)
   * 
   * @param {number} locationId - Location ID
   * @returns {Promise<Object>} Grid layout data
   */
  getGridLayout: async (locationId) => {
    return await apiRequest('GET', `${BASE_PATH}/location/${locationId}/grid`);
  },

  /**
   * Get storage type by ID
   * GET /inventory/storage-types/{storage_type_id}
   * 
   * @param {number} storageTypeId - Storage type ID
   * @returns {Promise<Object>} Storage type object with location details
   */
  getById: async (storageTypeId) => {
    return await apiRequest('GET', `${BASE_PATH}/${storageTypeId}`);
  },

  /**
   * Update storage type
   * PATCH /inventory/storage-types/{storage_type_id}
   * 
   * @param {number} storageTypeId - Storage type ID
   * @param {Object} updateData - Fields to update
   *   {
   *     storage_type_name: string (optional),
   *     storage_type_code: string (optional),
   *     capacity: number (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Updated storage type
   */
  update: async (storageTypeId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${storageTypeId}`, updateData);
  },

  /**
   * Update storage type position (UI drag-drop)
   * PATCH /inventory/storage-types/{storage_type_id}/position
   * 
   * @param {number} storageTypeId - Storage type ID
   * @param {number} visualX - X coordinate for UI
   * @param {number} visualY - Y coordinate for UI
   * @returns {Promise<Object>} Updated storage type with new coordinates
   */
  updatePosition: async (storageTypeId, visualX, visualY) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${storageTypeId}/position`, null, {
      params: { visual_x: visualX, visual_y: visualY }
    });
  },

  /**
   * Update single storage type coordinates
   * PATCH /inventory/storage-types/{storage_type_id}/coordinates
   * 
   * @param {number} storageTypeId - Storage type ID
   * @param {number} visualX - X coordinate
   * @param {number} visualY - Y coordinate
   * @returns {Promise<Object>} Updated storage type object
   */
  updateCoordinates: async (storageTypeId, visualX, visualY) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${storageTypeId}/coordinates`, {
      visual_x: visualX,
      visual_y: visualY
    });
  },

  /**
   * Bulk update storage type coordinates
   * PATCH /inventory/storage-types/bulk/coordinates
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
   * Delete storage type
   * DELETE /inventory/storage-types/{storage_type_id}
   * 
   * @param {number} storageTypeId - Storage type ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (storageTypeId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${storageTypeId}`);
  },

  // Legacy method names for backwards compatibility
  createShelf: async (shelfData) => {
    return storageTypesApi.create(shelfData);
  },

  bulkCreateShelves: async (shelvesArray) => {
    return storageTypesApi.bulkCreate(shelvesArray);
  },

  getShelvesByLocation: async (locationId, activeOnly = true) => {
    return storageTypesApi.getByLocation(locationId, activeOnly);
  },

  getShelfGridLayout: async (locationId) => {
    return storageTypesApi.getGridLayout(locationId);
  },

  getShelfById: async (shelfId) => {
    return storageTypesApi.getById(shelfId);
  },

  updateShelf: async (shelfId, updateData) => {
    return storageTypesApi.update(shelfId, updateData);
  },

  updateShelfPosition: async (shelfId, visualX, visualY) => {
    return storageTypesApi.updatePosition(shelfId, visualX, visualY);
  },

  deleteShelf: async (shelfId) => {
    return storageTypesApi.delete(shelfId);
  },
};

export default storageTypesApi;

