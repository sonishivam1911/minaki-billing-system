/**
 * Product Location API Service
 * Core inventory tracking - manages products within storage objects
 * 
 * API Prefix: /inventory/products
 * Supports: real_jewelry, zakya_product
 * Hierarchy: Location → Storage Type → Storage Object → Products
 */

import { apiRequest } from './apiClient';

const BASE_PATH = '/inventory/products';

export const productsApi = {
  /**
   * Add product to a storage object
   * POST /inventory/products/
   * 
   * @param {Object} productData - Product details
   *   For real_jewelry:
   *   {
   *     storage_object_id: number (required),
   *     product_type: "real_jewelry" (required),
   *     product_id: string (UUID, required),
   *     product_name: string,
   *     sku: string,
   *     quantity: number,
   *     metal_weight_g: number,
   *     purity_k: number
   *   }
   *   For zakya_product:
   *   {
   *     storage_object_id: number (required),
   *     product_type: "zakya_product" (required),
   *     product_id: string (required),
   *     product_name: string,
   *     sku: string,
   *     quantity: number
   *   }
   * @param {string} movedBy - Username/employee ID of person adding product
   * @returns {Promise<Object>} Created product location record
   */
  addToBox: async (productData, movedBy) => {
    return await apiRequest('POST', `${BASE_PATH}/`, productData, {
      params: { moved_by: movedBy }
    });
  },

  /**
   * Add product to a storage object (new method name)
   * POST /inventory/products/
   */
  addToStorageObject: async (productData, movedBy) => {
    return await productsApi.addToBox(productData, movedBy);
  },

  /**
   * Search products with filters
   * GET /inventory/products/search
   * 
   * @param {Object} filters - Search filters
   *   {
   *     sku: string (optional),
   *     product_name: string (optional, partial match),
   *     product_type: string (optional - "real_jewelry" or "zakya_product"),
   *     location_id: number (optional),
   *     storage_type_id: number (optional),
   *     storage_object_id: number (optional),
   *     has_serials: boolean (optional),
   *     min_quantity: number (optional),
   *     max_quantity: number (optional)
   *   }
   * @returns {Promise<Array>} Matching products with full details
   */
  search: async (filters = {}) => {
    // Convert legacy field names to new ones if present
    const normalizedFilters = { ...filters };
    if (normalizedFilters.shelf_id !== undefined) {
      normalizedFilters.storage_type_id = normalizedFilters.storage_type_id || normalizedFilters.shelf_id;
      delete normalizedFilters.shelf_id;
    }
    if (normalizedFilters.box_id !== undefined) {
      normalizedFilters.storage_object_id = normalizedFilters.storage_object_id || normalizedFilters.box_id;
      delete normalizedFilters.box_id;
    }
    return await apiRequest('GET', `${BASE_PATH}/search`, null, {
      params: normalizedFilters
    });
  },

  /**
   * Find all locations where a product is stored
   * GET /inventory/products/find/{product_type}/{product_id}
   * 
   * @param {string} productType - "real_jewelry" or "zakya_product"
   * @param {string} productId - Product ID (UUID for jewelry, SKU for zakya)
   * @returns {Promise<Array>} All locations where product is stored
   */
  find: async (productType, productId) => {
    return await apiRequest('GET', `${BASE_PATH}/find/${productType}/${productId}`);
  },

  /**
   * Get inventory summary
   * GET /inventory/products/inventory/summary
   * Returns inventory grouped by location
   * 
   * @param {number} locationId - Optional location ID to filter by
   * @returns {Promise<Object>} Inventory summary
   */
  getSummary: async (locationId = null) => {
    const params = locationId ? { location_id: locationId } : {};
    return await apiRequest('GET', `${BASE_PATH}/inventory/summary`, null, { params });
  },

  /**
   * Get product location details by ID
   * GET /inventory/products/{location_id}
   * 
   * @param {number} locationId - Product location record ID
   * @returns {Promise<Object>} Product location details
   */
  getById: async (locationId) => {
    return await apiRequest('GET', `${BASE_PATH}/${locationId}`);
  },

  /**
   * Update product quantity in a location
   * PATCH /inventory/products/{location_id}/quantity
   * 
   * @param {number} locationId - Product location record ID
   * @param {number} newQuantity - New quantity value
   * @param {string} updatedBy - Username/employee ID
   * @param {string} reason - Reason for update (optional)
   * @returns {Promise<Object>} Updated product location
   */
  updateQuantity: async (locationId, newQuantity, updatedBy, reason = null) => {
    return await apiRequest('PATCH', `${BASE_PATH}/${locationId}/quantity`, {
      new_quantity: newQuantity,
      updated_by: updatedBy,
      reason
    });
  },

  /**
   * Transfer product between storage objects
   * POST /inventory/products/transfer
   * 
   * @param {Object} transferData - Transfer details
   *   {
   *     from_location_id: number (required),
   *     to_storage_object_id: number (required),
   *     quantity: number (required),
   *     moved_by: string (required, username/employee ID),
   *     reason: string (optional),
   *     notes: string (optional)
   *   }
   * @returns {Promise<Object>} Transfer result
   */
  transfer: async (transferData) => {
    // Convert legacy field name if present
    const normalizedData = { ...transferData };
    if (normalizedData.to_box_id !== undefined && normalizedData.to_storage_object_id === undefined) {
      normalizedData.to_storage_object_id = normalizedData.to_box_id;
      delete normalizedData.to_box_id;
    }
    return await apiRequest('POST', `${BASE_PATH}/transfer`, normalizedData);
  },

  /**
   * Bulk transfer multiple products to one storage object
   * POST /inventory/products/bulk-transfer
   * 
   * @param {Object} bulkData - Bulk transfer details
   *   {
   *     product_locations: array of location IDs (required),
   *     target_storage_object_id: number (required),
   *     moved_by: string (required),
   *     reason: string (optional)
   *   }
   * @returns {Promise<Object>} Transfer summary
   *   {
   *     transferred_count: number,
   *     failed_count: number,
   *     transferred: array of IDs,
   *     failed: array of IDs
   *   }
   */
  bulkTransfer: async (bulkData) => {
    // Convert legacy field name if present
    const normalizedData = { ...bulkData };
    if (normalizedData.target_box_id !== undefined && normalizedData.target_storage_object_id === undefined) {
      normalizedData.target_storage_object_id = normalizedData.target_box_id;
      delete normalizedData.target_box_id;
    }
    return await apiRequest('POST', `${BASE_PATH}/bulk-transfer`, normalizedData);
  },

  /**
   * Remove product from box
   * DELETE /inventory/products/{location_id}
   * Note: If quantity equals total, the location record is deleted
   * 
   * @param {number} locationId - Product location record ID
   * @param {number} quantity - Quantity to remove
   * @param {string} removedBy - Username/employee ID
   * @param {string} reason - Reason for removal (optional)
   * @returns {Promise<Object>} Success message
   */
  remove: async (locationId, quantity, removedBy, reason = null) => {
    return await apiRequest('DELETE', `${BASE_PATH}/${locationId}`, null, {
      params: { quantity, removed_by: removedBy, reason }
    });
  },

  /**
   * Get product movement history
   * GET /inventory/products/movements/{product_type}/{product_id}
   * Returns complete audit trail of all movements for the product
   * 
   * @param {string} productType - "real_jewelry" or "zoho_product"
   * @param {string} productId - Product ID
   * @param {number} limit - Maximum records (optional, default: 100)
   * @returns {Promise<Array>} Array of movement records
   */
  getMovements: async (productType, productId, limit = 100) => {
    return await apiRequest('GET', `${BASE_PATH}/movements/${productType}/${productId}`, null, {
      params: { limit }
    });
  },

  // Legacy method names for backwards compatibility
  addProductToBox: async (productData, movedBy) => {
    return productsApi.addToBox(productData, movedBy);
  },

  searchProducts: async (filters = {}) => {
    return productsApi.search(filters);
  },

  findProductLocations: async (productType, productId) => {
    return productsApi.find(productType, productId);
  },

  getInventorySummary: async (locationId = null) => {
    return productsApi.getSummary(locationId);
  },

  getProductLocationById: async (locationId) => {
    return productsApi.getById(locationId);
  },

  updateProductQuantity: async (locationId, newQuantity, updatedBy, reason = null) => {
    return productsApi.updateQuantity(locationId, newQuantity, updatedBy, reason);
  },

  transferProduct: async (fromLocationId, toStorageObjectId, quantity, movedBy, reason = null, notes = null) => {
    return productsApi.transfer({
      from_location_id: fromLocationId,
      to_storage_object_id: toStorageObjectId,
      quantity,
      moved_by: movedBy,
      reason,
      notes
    });
  },

  bulkTransferProducts: async (productLocationIds, targetStorageObjectId, movedBy, reason = null) => {
    return productsApi.bulkTransfer({
      product_locations: productLocationIds,
      target_storage_object_id: targetStorageObjectId,
      moved_by: movedBy,
      reason
    });
  },

  removeProductFromBox: async (locationId, quantity, removedBy, reason = null) => {
    return productsApi.remove(locationId, quantity, removedBy, reason);
  },

  getProductMovementHistory: async (productType, productId, limit = 100) => {
    return productsApi.getMovements(productType, productId, limit);
  },
};

export default productsApi;