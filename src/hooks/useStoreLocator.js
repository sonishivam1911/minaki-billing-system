/**
 * useStoreLocator Hook - Storage Location Management
 * 
 * Uses the new inventory management API with proper hierarchy:
 * Location (Building/Store)
 *   └── Shelf (Physical Shelf)
 *         └── Box (Storage Container)
 *               └── Products (Inventory Items)
 */
import { useState, useCallback } from 'react';
import locationsApi from '../services/locationsApi';
import shelvesApi from '../services/shelfApi';
import boxesApi from '../services/boxApi';
import productsApi from '../services/productLocationApi';

export const useStoreLocator = () => {
  const [locations, setLocations] = useState([]);
  const [stores, setStores] = useState([]); // Using locations for "stores"
  const [shelves, setShelves] = useState([]);
  const [sections, setSections] = useState([]); // Using shelves for "sections"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
   * Fetch shelves for a specific location (replaces fetchStoreSections)
   * GET /billing_system/api/inventory/shelves/location/{location_id}
   */
  const fetchStoreSections = useCallback(async (locationId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await shelvesApi.getByLocation(locationId, true);
      // data is an array of shelves
      const shelvesList = Array.isArray(data) ? data : data.items || data;
      setShelves(shelvesList);
      setSections(shelvesList);
      return shelvesList;
    } catch (err) {
      setError(err.message || 'Failed to fetch shelves');
      console.error('Error fetching shelves:', err);
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
   * Fetches inventory and maps box_codes to shelf_ids for proper grouping
   */
  const getStoreInventory = useCallback(async (locationId, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch inventory summary
      const data = await productsApi.getSummary(locationId);
      const inventoryList = Array.isArray(data) ? data : data.items || data;
      
      // Fetch shelves for the location
      const shelvesList = await shelvesApi.getByLocation(locationId, true);
      setShelves(shelvesList);
      setSections(shelvesList);
      
      // Fetch boxes for all shelves to create box_code -> shelf_id mapping
      const boxCodeToShelfMap = {};
      for (const shelf of shelvesList) {
        try {
          const boxes = await boxesApi.getByShelf(shelf.id, true);
          const boxesList = Array.isArray(boxes) ? boxes : boxes.items || boxes;
          boxesList.forEach(box => {
            if (box.box_code) {
              boxCodeToShelfMap[box.box_code] = shelf.id;
            }
          });
        } catch (err) {
          console.warn(`Error fetching boxes for shelf ${shelf.id}:`, err);
        }
      }
      
      // Transform inventory items to include shelf_id based on box_codes
      const transformedInventory = inventoryList.flatMap(item => {
        // If item has box_codes array, create one entry per box_code
        if (item.box_codes && Array.isArray(item.box_codes) && item.box_codes.length > 0) {
          return item.box_codes.map(boxCode => {
            const shelfId = boxCodeToShelfMap[boxCode];
            // If we couldn't find the shelf for this box, try to find it by scanning the box QR
            // For now, we'll assign it to the first shelf if mapping fails (fallback)
            const assignedShelfId = shelfId || (shelvesList.length > 0 ? shelvesList[0].id : null);
            
            if (!shelfId) {
              console.warn(`Could not find shelf for box_code: ${boxCode}. Assigning to first shelf.`);
            }
            
            return {
              ...item,
              box_code: boxCode,
              shelf_id: assignedShelfId,
              // Distribute quantity across boxes (simple division)
              // If we have num_boxes, divide evenly; otherwise assume 1 per box
              quantity: item.num_boxes > 0 
                ? Math.ceil(item.total_quantity / item.num_boxes)
                : item.total_quantity,
            };
          });
        }
        // If no box_codes, try to find shelf_id from other fields or assign to first shelf
        const assignedShelfId = item.shelf_id || (shelvesList.length > 0 ? shelvesList[0].id : null);
        return [{
          ...item,
          shelf_id: assignedShelfId,
          quantity: item.total_quantity || item.quantity || 0,
        }];
      });
      
      console.log('Transformed inventory:', transformedInventory);
      console.log('Box code to shelf map:', boxCodeToShelfMap);
      
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
   * Get shelves in a location (replaces getSectionInventory)
   * GET /billing_system/api/inventory/shelves/location/{location_id}
   */
  const getSectionInventory = useCallback(async (locationId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await shelvesApi.getByLocation(locationId, true);
      const shelvesList = Array.isArray(data) ? data : data.items || data;
      setShelves(shelvesList);
      return shelvesList;
    } catch (err) {
      setError(err.message || 'Failed to fetch shelves');
      console.error('Error fetching shelves:', err);
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
   * Transfer product between boxes
   * POST /billing_system/api/inventory/products/transfer
   */
  const transferStock = useCallback(async (transferData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old and new transfer data formats
      let transferPayload = transferData;
      if (transferData.from_location_id && transferData.to_box_id) {
        // Already in new format
        transferPayload = transferData;
      } else if (transferData.variant_id) {
        // Old format, need to adapt
        transferPayload = {
          from_location_id: transferData.from_location_id,
          to_box_id: transferData.to_box_id,
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
   * Move product to different box
   * POST /billing_system/api/inventory/products/transfer
   */
  const moveProductToSection = useCallback(async (productType, fromLocationId, toBoxId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old and new signatures
      let type = productType;
      let fromId = fromLocationId;
      let toId = toBoxId;
      let qty = quantity;
      
      // If called with old signature (variantId, fromLocationId, toSectionId, quantity)
      // Note: Sections are now Shelves, not Boxes - need to clarify in UI
      
      const transferPayload = {
        from_location_id: fromId,
        to_box_id: toId,
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
    shelves,        // New: Direct access to shelves
    sections: shelves, // Legacy: Sections are now shelves
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