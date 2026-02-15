/**
 * useStoreManagement Hook
 * Manages creation and manipulation of stores, storage types, and storage objects
 */
import { useState, useCallback } from 'react';
import locationsApi from '../services/locationsApi';
import storageTypesApi from '../services/storageTypesApi';
import storageObjectsApi from '../services/storageObjectsApi';

export const useStoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [storageTypes, setStorageTypes] = useState([]);
  const [storageObjects, setStorageObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Legacy state names for backward compatibility
  const shelves = storageTypes;
  const boxes = storageObjects;

  /**
   * Fetch all stores/locations
   */
  const fetchAllStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await locationsApi.getAll();
      const storesList = Array.isArray(data) ? data : data.items || data;
      setStores(storesList);
      return storesList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch stores';
      setError(errorMessage);
      console.error('Error fetching stores:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new store/location
   */
  const createStore = useCallback(async (storeData) => {
    try {
      setLoading(true);
      setError(null);
      
      const locationData = {
        location_name: storeData.name,
        location_code: storeData.code,
        description: storeData.description || '',
        is_active: storeData.is_active !== false
      };
      
      const newStore = await locationsApi.create(locationData);
      setStores(prev => [...prev, newStore]);
      setSuccess(`Store "${storeData.name}" created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return newStore;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create store';
      setError(errorMessage);
      console.error('Error creating store:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update store information
   */
  const updateStore = useCallback(async (storeId, storeData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {};
      if (storeData.name) updateData.location_name = storeData.name;
      if (storeData.code) updateData.location_code = storeData.code;
      if (storeData.description) updateData.description = storeData.description;
      if (storeData.is_active !== undefined) updateData.is_active = storeData.is_active;
      
      const updated = await locationsApi.update(storeId, updateData);
      setStores(prev => prev.map(s => s.id === storeId ? updated : s));
      setSuccess('Store updated successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return updated;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update store';
      setError(errorMessage);
      console.error('Error updating store:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete/deactivate store
   */
  const deleteStore = useCallback(async (storeId) => {
    try {
      setLoading(true);
      setError(null);
      
      await locationsApi.delete(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
      setSuccess('Store deleted successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete store';
      setError(errorMessage);
      console.error('Error deleting store:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch storage types for a specific store
   */
  const fetchShelvesByStore = useCallback(async (storeId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await storageTypesApi.getByLocation(storeId);
      const storageTypesList = Array.isArray(data) ? data : data.items || data;
      setStorageTypes(storageTypesList);
      return storageTypesList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch storage types';
      setError(errorMessage);
      console.error('Error fetching storage types:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new storage type in a store
   */
  const createShelf = useCallback(async (storageTypeData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Support both old and new field names
      const payload = {
        location_id: storageTypeData.location_id,
        storage_type_name: storageTypeData.storage_type_name || storageTypeData.name,
        storage_type_code: storageTypeData.storage_type_code || storageTypeData.code,
        capacity: storageTypeData.capacity || null,
        is_active: storageTypeData.is_active !== false
      };
      
      const newStorageType = await storageTypesApi.create(payload);
      setStorageTypes(prev => [...prev, newStorageType]);
      setSuccess(`Storage Type "${payload.storage_type_name}" created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return newStorageType;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create storage type';
      setError(errorMessage);
      console.error('Error creating storage type:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create multiple storage types at once
   */
  const createMultipleShelves = useCallback(async (storageTypesData) => {
    try {
      setLoading(true);
      setError(null);
      
      const formattedStorageTypes = storageTypesData.map(st => ({
        location_id: st.location_id,
        storage_type_name: st.storage_type_name || st.name,
        storage_type_code: st.storage_type_code || st.code,
        capacity: st.capacity || null,
        is_active: st.is_active !== false
      }));
      
      const createdStorageTypes = await storageTypesApi.bulkCreate(formattedStorageTypes);
      const createdList = Array.isArray(createdStorageTypes) ? createdStorageTypes : createdStorageTypes.items || [createdStorageTypes];
      
      setStorageTypes(prev => [...prev, ...createdList]);
      setSuccess(`${createdList.length} storage types created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return createdList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create storage types';
      setError(errorMessage);
      console.error('Error creating storage types:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update storage type information
   */
  const updateShelf = useCallback(async (storageTypeId, storageTypeData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {};
      if (storageTypeData.storage_type_name || storageTypeData.name) updateData.storage_type_name = storageTypeData.storage_type_name || storageTypeData.name;
      if (storageTypeData.storage_type_code || storageTypeData.code) updateData.storage_type_code = storageTypeData.storage_type_code || storageTypeData.code;
      if (storageTypeData.capacity !== undefined) updateData.capacity = storageTypeData.capacity;
      if (storageTypeData.is_active !== undefined) updateData.is_active = storageTypeData.is_active;
      
      const updated = await storageTypesApi.update(storageTypeId, updateData);
      setStorageTypes(prev => prev.map(s => s.id === storageTypeId ? updated : s));
      setSuccess('Storage type updated successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return updated;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update storage type';
      setError(errorMessage);
      console.error('Error updating storage type:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete storage type
   */
  const deleteShelf = useCallback(async (storageTypeId) => {
    try {
      setLoading(true);
      setError(null);
      
      await storageTypesApi.delete(storageTypeId);
      setStorageTypes(prev => prev.filter(s => s.id !== storageTypeId));
      setSuccess('Storage type deleted successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete storage type';
      setError(errorMessage);
      console.error('Error deleting storage type:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch storage objects in a specific storage type
   */
  const fetchBoxesByShelf = useCallback(async (storageTypeId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await storageObjectsApi.getByStorageType(storageTypeId);
      const storageObjectsList = Array.isArray(data) ? data : data.items || data;
      
      // Ensure each storage object has storage_type_id set, and merge with existing storage objects
      setStorageObjects(prev => {
        // Remove storage objects from this storage type first
        const otherStorageObjects = prev.filter(so => so.storage_type_id !== storageTypeId);
        // Add new storage objects with storage_type_id ensured
        const newStorageObjects = storageObjectsList.map(so => ({
          ...so,
          storage_type_id: so.storage_type_id || storageTypeId
        }));
        return [...otherStorageObjects, ...newStorageObjects];
      });
      
      return storageObjectsList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch storage objects';
      setError(errorMessage);
      console.error('Error fetching storage objects:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new storage object in a storage type
   */
  const createBox = useCallback(async (storageObjectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        storage_type_id: storageObjectData.storage_type_id || storageObjectData.shelf_id,
        storage_object_label: storageObjectData.storage_object_label || storageObjectData.name,
        storage_object_code: storageObjectData.storage_object_code || storageObjectData.code,
        capacity: storageObjectData.capacity || null,
        is_active: storageObjectData.is_active !== false
      };
      
      const newStorageObject = await storageObjectsApi.create(payload);
      setStorageObjects(prev => [...prev, newStorageObject]);
      setSuccess(`Storage Object "${payload.storage_object_label}" created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return newStorageObject;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create storage object';
      setError(errorMessage);
      console.error('Error creating storage object:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create multiple storage objects at once
   */
  const createMultipleBoxes = useCallback(async (storageObjectsData) => {
    try {
      setLoading(true);
      setError(null);
      
      const createdStorageObjectsList = [];
      
      // Create storage objects sequentially
      for (const so of storageObjectsData) {
        const payload = {
          storage_type_id: so.storage_type_id || so.shelf_id,
          storage_object_label: so.storage_object_label || so.name,
          storage_object_code: so.storage_object_code || so.code,
          capacity: so.capacity || null,
          is_active: so.is_active !== false
        };
        const newStorageObject = await storageObjectsApi.create(payload);
        createdStorageObjectsList.push(newStorageObject);
      }
      
      setStorageObjects(prev => [...prev, ...createdStorageObjectsList]);
      setSuccess(`${createdStorageObjectsList.length} storage objects created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return createdStorageObjectsList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create storage objects';
      setError(errorMessage);
      console.error('Error creating storage objects:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update storage object information
   */
  const updateBox = useCallback(async (storageObjectId, storageObjectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {};
      if (storageObjectData.storage_object_label || storageObjectData.name) updateData.storage_object_label = storageObjectData.storage_object_label || storageObjectData.name;
      if (storageObjectData.storage_object_code || storageObjectData.code) updateData.storage_object_code = storageObjectData.storage_object_code || storageObjectData.code;
      if (storageObjectData.capacity !== undefined) updateData.capacity = storageObjectData.capacity;
      if (storageObjectData.is_active !== undefined) updateData.is_active = storageObjectData.is_active;
      
      const updated = await storageObjectsApi.update(storageObjectId, updateData);
      setStorageObjects(prev => prev.map(so => so.id === storageObjectId ? updated : so));
      setSuccess('Storage object updated successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return updated;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update storage object';
      setError(errorMessage);
      console.error('Error updating storage object:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete storage object
   */
  const deleteBox = useCallback(async (storageObjectId) => {
    try {
      setLoading(true);
      setError(null);
      
      await storageObjectsApi.delete(storageObjectId);
      setStorageObjects(prev => prev.filter(so => so.id !== storageObjectId));
      setSuccess('Storage object deleted successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete storage object';
      setError(errorMessage);
      console.error('Error deleting storage object:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Move storage object to different storage type
   */
  const moveBox = useCallback(async (storageObjectId, toStorageTypeId, reason = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await storageObjectsApi.move(storageObjectId, {
        to_storage_type_id: toStorageTypeId,
        moved_by: 'app_user',
        reason: reason
      });
      
      // Update local state
      setStorageObjects(prev => prev.map(so => so.id === storageObjectId ? { ...so, storage_type_id: toStorageTypeId } : so));
      setSuccess('Storage object moved successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to move storage object';
      setError(errorMessage);
      console.error('Error moving storage object:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch storage object contents
   */
  const fetchBoxContents = useCallback(async (storageObjectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const contents = await storageObjectsApi.getContents(storageObjectId);
      return contents;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch storage object contents';
      setError(errorMessage);
      console.error('Error fetching storage object contents:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get location statistics
   */
  const getStoreStats = useCallback(async (storeId) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await locationsApi.getStatistics(storeId);
      return stats;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Error fetching statistics:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear success message
   */
  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  return {
    // State
    stores,
    storageTypes,
    storageObjects,
    // Legacy state names for backward compatibility
    shelves,
    boxes,
    loading,
    error,
    success,
    
    // Store operations
    fetchAllStores,
    createStore,
    updateStore,
    deleteStore,
    getStoreStats,
    
    // Storage Type operations (legacy names maintained for backward compatibility)
    fetchShelvesByStore,
    createShelf,
    createMultipleShelves,
    updateShelf,
    deleteShelf,
    
    // Storage Object operations (legacy names maintained for backward compatibility)
    fetchBoxesByShelf,
    createBox,
    createMultipleBoxes,
    updateBox,
    deleteBox,
    moveBox,
    fetchBoxContents,
    
    // Utilities
    clearError,
    clearSuccess
  };
};

export default useStoreManagement;
