/**
 * Storage Boxes API Service
 * Manages storage boxes/containers within shelves
 * 
 * API Prefix: /inventory/boxes
 * Hierarchy: Location → Shelf → Box → Products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/inventory/boxes';

export const boxesApi = {
  /**
   * Create a new box
   * POST /inventory/boxes/
   * 
   * @param {Object} boxData - Box details
   *   {
   *     shelf_id: number (required),
   *     box_name: string,
   *     box_code: string,
   *     capacity: number,
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Created box with ID and QR code
   */
  create: async (boxData) => {
    return await apiRequest('POST', `${BASE_PATH}/`, boxData);
  },

  /**
   * Scan box QR code
   * GET /inventory/boxes/qr/{box_code}
   * Returns box contents and metadata
   * 
   * @param {string} boxCode - Box code from QR
   * @returns {Promise<Object>} Box contents response
   *   {
   *     box_id: number,
   *     box_name: string,
   *     shelf_id: number,
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
  scanQR: async (boxCode) => {
    return await apiRequest('GET', `${BASE_PATH}/qr/${boxCode}`);
  },

  /**
   * Get all boxes in a shelf
   * GET /inventory/boxes/shelf/{shelf_id}
   * 
   * @param {number} shelfId - Shelf ID
   * @param {boolean} activeOnly - Filter to active boxes only (optional)
   * @returns {Promise<Array>} All boxes on the shelf
   */
  getByShelf: async (shelfId, activeOnly = false) => {
    return await apiRequest('GET', `${BASE_PATH}/shelf/${shelfId}`, null, {
      params: activeOnly ? { active_only: true } : {}
    });
  },

  /**
   * Get box details
   * GET /inventory/boxes/{box_id}
   * 
   * @param {number} boxId - Box ID
   * @returns {Promise<Object>} Box details
   */
  getById: async (boxId) => {
    return await apiRequest('GET', `${BASE_PATH}/${boxId}`);
  },

  /**
   * Get box contents
   * GET /inventory/boxes/{box_id}/contents
   * 
   * @param {number} boxId - Box ID
   * @returns {Promise<Object>} Detailed inventory in the box
   */
  getContents: async (boxId) => {
    return await apiRequest('GET', `${BASE_PATH}/${boxId}/contents`);
  },

  /**
   * Get box movement history
   * GET /inventory/boxes/{box_id}/movements
   * 
   * @param {number} boxId - Box ID
   * @param {number} limit - Maximum records to return (optional, default: 50)
   * @returns {Promise<Array>} Array of movement records
   */
  getMovementHistory: async (boxId, limit = 50) => {
    return await apiRequest('GET', `${BASE_PATH}/${boxId}/movements`, null, {
      params: { limit }
    });
  },

  /**
   * Update box
   * PATCH /inventory/boxes/{box_id}
   * 
   * @param {number} boxId - Box ID
   * @param {Object} updateData - Fields to update
   *   {
   *     box_name: string (optional),
   *     box_code: string (optional),
   *     capacity: number (optional),
   *     is_active: boolean (optional)
   *   }
   * @returns {Promise<Object>} Updated box
   */
  update: async (boxId, updateData) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${boxId}`, updateData);
  },

  /**
   * Move box to different shelf
   * POST /inventory/boxes/{box_id}/move
   * 
   * @param {number} boxId - Box ID
   * @param {Object} moveData - Move details
   *   {
   *     to_shelf_id: number (required),
   *     moved_by: string (required, username/employee ID),
   *     reason: string (optional),
   *     notes: string (optional)
   *   }
   * @returns {Promise<Object>} Success message
   */
  move: async (boxId, moveData) => {
    return await apiRequest('POST', `${BASE_PATH}/${boxId}/move`, moveData);
  },

  /**
   * Delete box
   * DELETE /inventory/boxes/{box_id}
   * Note: Box must be empty to delete
   * 
   * @param {number} boxId - Box ID
   * @returns {Promise<Object>} Success message
   */
  delete: async (boxId) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${boxId}`);
  },

  // Legacy method names for backwards compatibility
  createBox: async (boxData) => {
    return boxesApi.create(boxData);
  },

  scanQRCode: async (boxCode) => {
    return boxesApi.scanQR(boxCode);
  },

  getBoxesByShelf: async (shelfId, activeOnly = true) => {
    return boxesApi.getByShelf(shelfId, activeOnly);
  },

  getBoxById: async (boxId) => {
    return boxesApi.getById(boxId);
  },

  getBoxContents: async (boxId) => {
    return boxesApi.getContents(boxId);
  },

  getBoxMovementHistory: async (boxId, limit = 50) => {
    return boxesApi.getMovementHistory(boxId, limit);
  },

  updateBox: async (boxId, updateData) => {
    return boxesApi.update(boxId, updateData);
  },

  moveBoxToShelf: async (boxId, moveData) => {
    return boxesApi.move(boxId, moveData);
  },

  deleteBox: async (boxId) => {
    return boxesApi.delete(boxId);
  },
};

export default boxesApi;