/**
 * useStoreLocator Hook - Storage Location Management
 * 
 * Uses the new inventory management API with proper hierarchy:
 * Location (Building/Store)
 *   └── Storage Type
 *         └── Storage Object
 *               └── Products (Inventory Items)
 */
import { useState, useCallback } from 'react';
import locationsApi from '../services/locationsApi';
import storageTypesApi from '../services/storageTypesApi';
import storageObjectsApi from '../services/storageObjectsApi';
import productsApi from '../services/productLocationApi';

export const useStoreLocator = () => {
  const [locations, setLocations] = useState([]);
  const [stores, setStores] = useState([]); // Using locations for "stores"
  const [storageTypes, setStorageTypes] = useState([]);
  const [sections, setSections] = useState([]); // Using storage types for "sections"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Legacy state names for backward compatibility
  const shelves = storageTypes;

  /**
   * Fetch all storage locations (replaces fetchStores)
   * GET /billing_system/api/inventory/locations
   */
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await locationsApi.getAll(true);
      // data is an array of locations
      const locationsList = Array.isArray(data) ? data : data.items || data;
      setStores(locationsList);
      setLocations(locationsList);
      return locationsList;
    } catch (err) {
      setError(err.message || 'Failed to fetch locations');
      console.error('Error fetching locations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch storage types for a specific location (replaces fetchStoreSections)
   * GET /billing_system/api/inventory/storage-types/location/{location_id}
   */
  const fetchStoreSections = useCallback(async (locationId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await storageTypesApi.getByLocation(locationId, true);
      // data is an array of storage types
      const storageTypesList = Array.isArray(data) ? data : data.items || data;
      setStorageTypes(storageTypesList);
      setSections(storageTypesList);
      return storageTypesList;
    } catch (err) {
      setError(err.message || 'Failed to fetch storage types');
      console.error('Error fetching storage types:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search products by SKU or name
   * GET /billing_system/api/inventory/products/search
   */
  const searchProductLocations = useCallback(async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      // Support both old interface (query string) and new interface (filters object)
      const searchFilters = typeof query === 'string' 
        ? { product_name: query, ...filters }
        : { ...query, ...filters };
      
      const data = await productsApi.search(searchFilters);
      const productsList = Array.isArray(data) ? data : data.items || data;
      setLocations(productsList);
      return productsList;
    } catch (err) {
      setError(err.message || 'Failed to search products');
      console.error('Error searching products:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get inventory summary
   * GET /billing_system/api/inventory/products/inventory/summary
   * Fetches inventory and maps storage_object_codes to storage_type_ids for proper grouping
   */
  const getStoreInventory = useCallback(async (locationId, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch inventory summary
      const data = await productsApi.getSummary(locationId);
      const inventoryList = Array.isArray(data) ? data : data.items || data;
      
      // Fetch storage types for the location
      const storageTypesList = await storageTypesApi.getByLocation(locationId, true);
      setStorageTypes(storageTypesList);
      setSections(storageTypesList);
      
      // Fetch storage objects for all storage types to create storage_object_code -> storage_type_id mapping
      const storageObjectCodeToStorageTypeMap = {};
      for (const storageType of storageTypesList) {
        try {
          const storageObjects = await storageObjectsApi.getByStorageType(storageType.id, true);
          const storageObjectsList = Array.isArray(storageObjects) ? storageObjects : storageObjects.items || storageObjects;
          storageObjectsList.forEach(so => {
            if (so.storage_object_code) {
              storageObjectCodeToStorageTypeMap[so.storage_object_code] = storageType.id;
            }
          });
        } catch (err) {
          console.warn(`Error fetching storage objects for storage type ${storageType.id}:`, err);
        }
      }
      
      // Transform inventory items to include storage_type_id based on storage_object_codes
      const transformedInventory = inventoryList.flatMap(item => {
        // Support both old field names (box_codes) and new field names (storage_object_codes)
        const storageObjectCodes = item.storage_object_codes || item.box_codes;
        // If item has storage_object_codes array, create one entry per storage_object_code
        if (storageObjectCodes && Array.isArray(storageObjectCodes) && storageObjectCodes.length > 0) {
          return storageObjectCodes.map(storageObjectCode => {
            const storageTypeId = storageObjectCodeToStorageTypeMap[storageObjectCode];
            // If we couldn't find the storage type for this storage object, assign to first storage type (fallback)
            const assignedStorageTypeId = storageTypeId || (storageTypesList.length > 0 ? storageTypesList[0].id : null);
            
            if (!storageTypeId) {
              console.warn(`Could not find storage type for storage_object_code: ${storageObjectCode}. Assigning to first storage type.`);
            }
            
            return {
              ...item,
              storage_object_code: storageObjectCode,
              storage_type_id: assignedStorageTypeId,
              // Legacy field names for backward compatibility
              box_code: storageObjectCode,
              shelf_id: assignedStorageTypeId,
              // Distribute quantity across storage objects (simple division)
              quantity: item.num_storage_objects > 0 || item.num_boxes > 0
                ? Math.ceil(item.total_quantity / (item.num_storage_objects || item.num_boxes))
                : item.total_quantity,
            };
          });
        }
        // If no storage_object_codes, try to find storage_type_id from other fields or assign to first storage type
        const assignedStorageTypeId = item.storage_type_id || item.shelf_id || (storageTypesList.length > 0 ? storageTypesList[0].id : null);
        return [{
          ...item,
          storage_type_id: assignedStorageTypeId,
          // Legacy field names for backward compatibility
          shelf_id: assignedStorageTypeId,
          quantity: item.total_quantity || item.quantity || 0,
        }];
      });
      
      console.log('Transformed inventory:', transformedInventory);
      console.log('Storage object code to storage type map:', storageObjectCodeToStorageTypeMap);
      
      setLocations(transformedInventory);
      return transformedInventory;
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory');
      console.error('Error fetching inventory:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get products in a specific storage type (section)
   * GET /billing_system/api/inventory/products/search?storage_type_id={storage_type_id}
   * 
   * This is called when a storage type is clicked to show all products in that storage type.
   */
  const getSectionInventory = useCallback(async (storageTypeId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('📦 Fetching products for storage type ID:', storageTypeId);
      console.log('📦 API: GET /billing_system/api/inventory/products/search?storage_type_id=' + storageTypeId);
      
      // Fetch products for this specific storage type
      const data = await productsApi.search({ storage_type_id: storageTypeId });
      const productsList = Array.isArray(data) ? data : data.items || data || [];
      
      console.log('✅ Products fetched for storage type:', productsList.length, 'products');
      console.log('✅ Sample product:', productsList[0]);
      
      // Ensure all products have storage_type_id set (in case API doesn't return it)
      const productsWithStorageTypeId = productsList.map(product => ({
        ...product,
        storage_type_id: product.storage_type_id || storageTypeId,
        // Legacy field name for backward compatibility
        shelf_id: product.storage_type_id || product.shelf_id || storageTypeId,
      }));
      
      // Update locations state with the products from this storage type
      setLocations(productsWithStorageTypeId);
      return productsWithStorageTypeId;
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch products for storage type';
      setError(errorMsg);
      console.error('❌ Error fetching products for storage type:', err);
      console.error('❌ Storage Type ID:', storageTypeId);
      // Don't clear locations on error, keep previous state
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Find all locations where a product is stored
   * GET /billing_system/api/inventory/products/find/{product_type}/{product_id}
   */
  const getProductLocations = useCallback(async (productType, productId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old interface (variantId) and new interface (productType, productId)
      let type = productType;
      let id = productId;
      
      // If called with single argument, assume it's a real_jewelry variant ID
      if (!productId) {
        type = 'real_jewelry';
        id = productType;
      }
      
      const data = await productsApi.find(type, id);
      const locationsList = Array.isArray(data) ? data : data.items || data;
      setLocations(locationsList);
      return locationsList;
    } catch (err) {
      setError(err.message || 'Failed to find product locations');
      console.error('Error finding product locations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update product quantity in a location
   * PATCH /billing_system/api/inventory/products/{location_id}/quantity
   */
  const updateLocationQuantity = useCallback(async (locationId, quantityData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old interface (object) and new interface (explicit params)
      let updateData = quantityData;
      if (typeof quantityData === 'object' && !quantityData.new_quantity) {
        // Assume it's { quantity: number } format, convert to new format
        updateData = {
          new_quantity: quantityData.quantity,
          updated_by: quantityData.updated_by || 'unknown',
          reason: quantityData.reason
        };
      }
      
      const updated = await productsApi.updateQuantity(
        locationId,
        updateData.new_quantity,
        updateData.updated_by,
        updateData.reason
      );
      
      // Update local state
      setLocations(prev => 
        prev.map(loc => loc.id === locationId ? updated : loc)
      );
      
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
      console.error('Error updating quantity:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Transfer product between storage objects
   * POST /billing_system/api/inventory/products/transfer
   */
  const transferStock = useCallback(async (transferData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old and new transfer data formats
      let transferPayload = { ...transferData };
      
      // Convert legacy field names to new ones
      if (transferPayload.to_box_id && !transferPayload.to_storage_object_id) {
        transferPayload.to_storage_object_id = transferPayload.to_box_id;
        delete transferPayload.to_box_id;
      }
      
      if (transferData.variant_id) {
        // Old format, need to adapt
        transferPayload = {
          from_location_id: transferData.from_location_id,
          to_storage_object_id: transferData.to_storage_object_id || transferData.to_box_id,
          quantity: transferData.quantity,
          moved_by: transferData.moved_by || 'unknown',
          reason: transferData.reason
        };
      }
      
      const result = await productsApi.transfer(transferPayload);
      
      // Refresh locations after transfer
      if (transferData.product_id || transferData.variant_id) {
        const id = transferData.product_id || transferData.variant_id;
        await getProductLocations('real_jewelry', id);
      }
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to transfer stock');
      console.error('Error transferring stock:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getProductLocations]);

  /**
   * Move product to different storage object
   * POST /billing_system/api/inventory/products/transfer
   */
  const moveProductToSection = useCallback(async (productType, fromLocationId, toStorageObjectId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old and new signatures
      let type = productType;
      let fromId = fromLocationId;
      let toId = toStorageObjectId;
      let qty = quantity;
      
      // If called with old signature (variantId, fromLocationId, toSectionId, quantity)
      // Note: Sections are now Storage Types, Storage Objects are the containers
      
      const transferPayload = {
        from_location_id: fromId,
        to_storage_object_id: toId,
        quantity: qty,
        moved_by: 'app_user'
      };
      
      const result = await productsApi.transfer(transferPayload);
      
      // Refresh locations
      await getProductLocations(type, productType);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to move product');
      console.error('Error moving product:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getProductLocations]);

  return {
    locations,
    stores,
    storageTypes,   // New: Direct access to storage types
    shelves,        // Legacy: Backward compatibility alias
    sections: storageTypes, // Legacy: Sections are now storage types
    loading,
    error,
    fetchStores,
    fetchStoreSections,
    searchProductLocations,
    getStoreInventory,
    getSectionInventory,
    getProductLocations,
    updateLocationQuantity,
    transferStock,
    moveProductToSection,
  };
};

export default useStoreLocator;