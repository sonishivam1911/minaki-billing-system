/**
 * React Hook for Product Location Tracking
 * Core inventory tracking functionality
 * 
 * Handles all product location management:
 * - Search and locate products
 * - Track product movements
 * - Update inventory quantities
 * - Transfer products between locations
 * 
 * API Structure:
 * - Locations: Buildings/Stores
 *   ├── Shelves: Physical shelves
 *   │   ├── Boxes: Storage containers
 *   │   │   └── Products: Inventory items
 * 
 * Supported product types:
 * - real_jewelry: Physical jewelry items
 * - zakya_product: Demistified/Other products
 */

import { useState, useCallback } from 'react';
import productsApi from '../services/productLocationApi';

export const useProductLocationTracking = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Search products with various filters
   * @param {Object} filters - Search filters (sku, product_name, product_type, location_id, etc.)
   * @returns {Promise<Array>} Matching products
   */
  const searchProducts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.search(filters);
      setProducts(data);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to search products';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Find all locations where a product is stored
   * @param {string} productType - "real_jewelry" or "zakya_product"
   * @param {string} productId - Product ID (UUID or SKU)
   * @returns {Promise<Array>} All storage locations
   */
  const findProductLocations = useCallback(async (productType, productId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.find(productType, productId);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to find product locations';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add product to a box
   * @param {Object} productData - Product details (see productsApi.addToBox)
   * @param {string} movedBy - Username/employee ID
   * @returns {Promise<Object>} Created product location
   */
  const addProductToBox = useCallback(async (productData, movedBy) => {
    setLoading(true);
    setError(null);
    try {
      const newProduct = await productsApi.addToBox(productData, movedBy);
      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to add product';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Transfer product from one box to another
   * @param {number} fromLocationId - Source product location ID
   * @param {number} toBoxId - Target box ID
   * @param {number} quantity - Quantity to transfer
   * @param {string} movedBy - Username/employee ID
   * @param {string} reason - Reason for transfer (optional)
   * @param {string} notes - Additional notes (optional)
   * @returns {Promise<Object>} Transfer result
   */
  const transferProduct = useCallback(async (fromLocationId, toBoxId, quantity, movedBy, reason, notes) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsApi.transfer({
        from_location_id: fromLocationId,
        to_box_id: toBoxId,
        quantity,
        moved_by: movedBy,
        reason,
        notes
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to transfer product';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bulk transfer multiple products to one box
   * @param {Array} productLocationIds - Array of product location IDs to transfer
   * @param {number} targetBoxId - Target box ID
   * @param {string} movedBy - Username/employee ID
   * @param {string} reason - Reason for transfer (optional)
   * @returns {Promise<Object>} Transfer summary
   */
  const bulkTransfer = useCallback(async (productLocationIds, targetBoxId, movedBy, reason = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsApi.bulkTransfer({
        product_locations: productLocationIds,
        target_box_id: targetBoxId,
        moved_by: movedBy,
        reason
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to bulk transfer';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update product quantity in a location
   * @param {number} locationId - Product location ID
   * @param {number} newQuantity - New quantity value
   * @param {string} updatedBy - Username/employee ID
   * @param {string} reason - Reason for update (optional)
   * @returns {Promise<Object>} Updated product location
   */
  const updateQuantity = useCallback(async (locationId, newQuantity, updatedBy, reason) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await productsApi.updateQuantity(locationId, newQuantity, updatedBy, reason);
      setProducts(prev => prev.map(p => p.id === locationId ? {...p, quantity: newQuantity} : p));
      return updated;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update quantity';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove product from a box
   * @param {number} locationId - Product location ID
   * @param {number} quantity - Quantity to remove
   * @param {string} removedBy - Username/employee ID
   * @param {string} reason - Reason for removal (optional)
   * @returns {Promise<boolean>} Success status
   */
  const removeProduct = useCallback(async (locationId, quantity, removedBy, reason) => {
    setLoading(true);
    setError(null);
    try {
      await productsApi.remove(locationId, quantity, removedBy, reason);
      setProducts(prev => prev.filter(p => p.id !== locationId));
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to remove product';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get product movement history/audit trail
   * @param {string} productType - "real_jewelry" or "zakya_product"
   * @param {string} productId - Product ID (UUID or SKU)
   * @param {number} limit - Maximum records (default: 100)
   * @returns {Promise<Array>} Movement history
   */
  const getMovementHistory = useCallback(async (productType, productId, limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const history = await productsApi.getMovements(productType, productId, limit);
      return history;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch movement history';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get inventory summary grouped by location
   * @param {number} locationId - Optional location ID to filter by
   * @returns {Promise<Object>} Inventory summary
   */
  const getInventorySummary = useCallback(async (locationId = null) => {
    setLoading(true);
    setError(null);
    try {
      const summary = await productsApi.getSummary(locationId);
      return summary;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch inventory summary';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    error,
    searchProducts,
    findProductLocations,
    addProductToBox,
    transferProduct,
    bulkTransfer,
    updateQuantity,
    removeProduct,
    getMovementHistory,
    getInventorySummary,
  };
};

export default useProductLocationTracking;