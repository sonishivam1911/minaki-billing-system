/**
 * Storage Objects API Service
 * Manages storage objects/containers within storage types
 * 
 * API Prefix: /inventory/storage-objects
 * Hierarchy: Location → Storage Type → Storage Object → Products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/inventory/storage-objects';

export const storageObjectsApi = {
  /**
   * Create a new storage object
   * POST /inventory/storage-objects/
   * 
   * @param {Object} storageObjectData - Storage object details
   *   {
   *     storage_type_id: number (required),
   *     storage_object_label: string,
   *     storage_object_code: string,
   *     capacity: number (optional),
   *     length_cm: number (optional),
   *     width_cm: number (optional),
   *     height_cm: number (optional),
   *     weight_capacity_kg: number (optional),
   *     color_code: string (optional),
   *     description: string (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Created storage object with ID and QR code
   */
  create: async (storageObjectData) => {
    return await apiRequest('POST', `${BASE_PATH}/`, storageObjectData);
  },

  /**
   * Scan storage object QR code
   * GET /inventory/storage-objects/qr/{storage_object_code}
   * Returns storage object contents and metadata
   * 
   * @param {string} storageObjectCode - Storage object code from QR
   * @returns {Promise<Object>} Storage object contents response
   *   {
   *     storage_object_id: number,
   *     storage_object_label: string,
   *     storage_type_id: number,
   *     products: [
   *       {
   *         product_id: string,
   *         product_name: string,
   *         sku: string,
   *         quantity: number,
   *         product_type: string
   *       }
   *     ],
   *     total_items: number
   *   }
   */
  scanQR: async (storageObjectCode) => {
    return await apiRequest('GET', `${BASE_PATH}/qr/${storageObjectCode}`);
  },

  /**
   * Get all storage objects in a storage type
   * GET /inventory/storage-objects/storage-type/{storage_type_id}
   * 
   * @param {number} storageTypeId - Storage type ID
   * @param {boolean} activeOnly - Filter to active storage objects only (optional)
   * @returns {Promise<Array>} All storage objects in the storage type
   */
  getByStorageType: async (storageTypeId, activeOnly = false) => {
    return await apiRequest('GET', `${BASE_PATH}/storage-type/${storageTypeId}`, null, {
      params: activeOnly ? { active_only: true } : {}
    });
  },

  /**
   * Get storage object details
   * GET /inventory/storage-objects/{storage_object_id}
   * 
   * @param {number} storageObjectId - Storage object ID
   * @returns {Promise<Object>} Storage object details
   */
  getById: async (storageObjectId) => {
    return await apiRequest('GET', `${BASE_PATH}/${storageObjectId}`);
  },

  /**
   * Get storage object contents
   * GET /inventory/storage-objects/{storage_object_id}/contents
   * 
   * @param {number} storageObjectId - Storage object ID
   * @returns {Promise<Object>} Detailed inventory in the storage object
   */
  getContents: async (storageObjectId) => {
    return await apiRequest('GET', `${BASE_PATH}/${storageObjectId}/contents`);
  },

  /**
   * Get storage object movement history
   * GET /inventory/storage-objects/{storage_object_id}/movements
   * 
   * @param {number} storageObjectId - Storage object ID
   * @param {number} limit - Maximum records to return (optional, default: 50)
   * @returns {Promise<Array>} Array of movement records
   */
  getMovementHistory: async (storageObjectId, limit = 50) => {
    return await apiRequest('GET', `${BASE_PATH}/${storageObjectId}/movements`, null, {
      params: { limit }
    });
  },

  /**
   * Update storage object
   * PATCH /inventory/storage-objects/{storage_object_id}
   * 
   * @param {number} storageObjectId - Storage object ID
   * @param {Object} updateData - Fields to update
   *   {
   *     storage_object_label: string (optional),
   *     storage_object_code: string (optional),
   *     capacity: number (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Updated storage object
   */
  update: async (storageObjectId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${storageObjectId}`, updateData);
  },

  /**
   * Move storage object to different storage type
   * POST /inventory/storage-objects/{storage_object_id}/move
   * 
   * @param {number} storageObjectId - Storage object ID
   * @param {Object} moveData - Move details
   *   {
   *     to_storage_type_id: number (required),
   *     moved_by: string (required, username/employee ID),
   *     reason: string (optional),
   *     notes: string (optional)
   *   }
   * @returns {Promise<Object>} Success message
   */
  move: async (storageObjectId, moveData) => {
    return await apiRequest('POST', `${BASE_PATH}/${storageObjectId}/move`, moveData);
  },

  /**
   * Delete storage object
   * DELETE /inventory/storage-objects/{storage_object_id}
   * Note: Storage object must be empty to delete
   * 
   * @param {number} storageObjectId - Storage object ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (storageObjectId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${storageObjectId}`);
  },

  // Legacy method names for backwards compatibility
  createBox: async (boxData) => {
    return storageObjectsApi.create(boxData);
  },

  scanQRCode: async (boxCode) => {
    return storageObjectsApi.scanQR(boxCode);
  },

  getBoxesByShelf: async (shelfId, activeOnly = true) => {
    return storageObjectsApi.getByStorageType(shelfId, activeOnly);
  },

  getByShelf: async (shelfId, activeOnly = true) => {
    return storageObjectsApi.getByStorageType(shelfId, activeOnly);
  },

  getBoxById: async (boxId) => {
    return storageObjectsApi.getById(boxId);
  },

  getBoxContents: async (boxId) => {
    return storageObjectsApi.getContents(boxId);
  },

  getBoxMovementHistory: async (boxId, limit = 50) => {
    return storageObjectsApi.getMovementHistory(boxId, limit);
  },

  updateBox: async (boxId, updateData) => {
    return storageObjectsApi.update(boxId, updateData);
  },

  moveBoxToShelf: async (boxId, moveData) => {
    return storageObjectsApi.move(boxId, moveData);
  },

  deleteBox: async (boxId) => {
    return storageObjectsApi.delete(boxId);
  },
};

export default storageObjectsApi;

