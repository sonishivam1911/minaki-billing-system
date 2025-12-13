/**
 * useStoreManagement Hook
 * Manages creation and manipulation of stores, shelves, and boxes
 */
import { useState, useCallback } from 'react';
import locationsApi from '../services/locationsApi';
import shelvesApi from '../services/shelfApi';
import boxesApi from '../services/boxApi';

export const useStoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
   * Fetch shelves for a specific store
   */
  const fetchShelvesByStore = useCallback(async (storeId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await shelvesApi.getByLocation(storeId);
      const shelvesList = Array.isArray(data) ? data : data.items || data;
      setShelves(shelvesList);
      return shelvesList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch shelves';
      setError(errorMessage);
      console.error('Error fetching shelves:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new shelf in a store
   */
  const createShelf = useCallback(async (shelfData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newShelf = await shelvesApi.create({
        location_id: shelfData.location_id,
        shelf_name: shelfData.name,
        shelf_code: shelfData.code,
        shelf_level: shelfData.level || 1,
        capacity: shelfData.capacity || 100,
        is_active: shelfData.is_active !== false
      });
      
      setShelves(prev => [...prev, newShelf]);
      setSuccess(`Shelf "${shelfData.name}" created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return newShelf;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create shelf';
      setError(errorMessage);
      console.error('Error creating shelf:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create multiple shelves at once
   */
  const createMultipleShelves = useCallback(async (shelvesData) => {
    try {
      setLoading(true);
      setError(null);
      
      const formattedShelves = shelvesData.map(shelf => ({
        location_id: shelf.location_id,
        shelf_name: shelf.name,
        shelf_code: shelf.code,
        shelf_level: shelf.level || 1,
        capacity: shelf.capacity || 100,
        is_active: shelf.is_active !== false
      }));
      
      const createdShelves = await shelvesApi.bulkCreate(formattedShelves);
      const createdList = Array.isArray(createdShelves) ? createdShelves : createdShelves.items || [createdShelves];
      
      setShelves(prev => [...prev, ...createdList]);
      setSuccess(`${createdList.length} shelves created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return createdList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create shelves';
      setError(errorMessage);
      console.error('Error creating shelves:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update shelf information
   */
  const updateShelf = useCallback(async (shelfId, shelfData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {};
      if (shelfData.name) updateData.shelf_name = shelfData.name;
      if (shelfData.code) updateData.shelf_code = shelfData.code;
      if (shelfData.capacity) updateData.capacity = shelfData.capacity;
      if (shelfData.is_active !== undefined) updateData.is_active = shelfData.is_active;
      
      const updated = await shelvesApi.update(shelfId, updateData);
      setShelves(prev => prev.map(s => s.id === shelfId ? updated : s));
      setSuccess('Shelf updated successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return updated;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update shelf';
      setError(errorMessage);
      console.error('Error updating shelf:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete shelf
   */
  const deleteShelf = useCallback(async (shelfId) => {
    try {
      setLoading(true);
      setError(null);
      
      await shelvesApi.delete(shelfId);
      setShelves(prev => prev.filter(s => s.id !== shelfId));
      setSuccess('Shelf deleted successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete shelf';
      setError(errorMessage);
      console.error('Error deleting shelf:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch boxes in a specific shelf
   */
  const fetchBoxesByShelf = useCallback(async (shelfId) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await boxesApi.getByShelf(shelfId);
      const boxesList = Array.isArray(data) ? data : data.items || data;
      setBoxes(boxesList);
      return boxesList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch boxes';
      setError(errorMessage);
      console.error('Error fetching boxes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new box in a shelf
   */
  const createBox = useCallback(async (boxData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newBox = await boxesApi.create({
        shelf_id: boxData.shelf_id,
        box_name: boxData.name,
        box_code: boxData.code,
        capacity: boxData.capacity || 50,
        is_active: boxData.is_active !== false
      });
      
      setBoxes(prev => [...prev, newBox]);
      setSuccess(`Box "${boxData.name}" created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return newBox;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create box';
      setError(errorMessage);
      console.error('Error creating box:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create multiple boxes at once
   */
  const createMultipleBoxes = useCallback(async (boxesData) => {
    try {
      setLoading(true);
      setError(null);
      
      const createdBoxesList = [];
      
      // Create boxes sequentially (API may not support bulk for boxes)
      for (const box of boxesData) {
        const newBox = await boxesApi.create({
          shelf_id: box.shelf_id,
          box_name: box.name,
          box_code: box.code,
          capacity: box.capacity || 50,
          is_active: box.is_active !== false
        });
        createdBoxesList.push(newBox);
      }
      
      setBoxes(prev => [...prev, ...createdBoxesList]);
      setSuccess(`${createdBoxesList.length} boxes created successfully!`);
      
      setTimeout(() => setSuccess(null), 5000);
      return createdBoxesList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create boxes';
      setError(errorMessage);
      console.error('Error creating boxes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update box information
   */
  const updateBox = useCallback(async (boxId, boxData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {};
      if (boxData.name) updateData.box_name = boxData.name;
      if (boxData.code) updateData.box_code = boxData.code;
      if (boxData.capacity) updateData.capacity = boxData.capacity;
      if (boxData.is_active !== undefined) updateData.is_active = boxData.is_active;
      
      const updated = await boxesApi.update(boxId, updateData);
      setBoxes(prev => prev.map(b => b.id === boxId ? updated : b));
      setSuccess('Box updated successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return updated;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update box';
      setError(errorMessage);
      console.error('Error updating box:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete box
   */
  const deleteBox = useCallback(async (boxId) => {
    try {
      setLoading(true);
      setError(null);
      
      await boxesApi.delete(boxId);
      setBoxes(prev => prev.filter(b => b.id !== boxId));
      setSuccess('Box deleted successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete box';
      setError(errorMessage);
      console.error('Error deleting box:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Move box to different shelf
   */
  const moveBox = useCallback(async (boxId, toShelfId, reason = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await boxesApi.move(boxId, {
        to_shelf_id: toShelfId,
        moved_by: 'app_user',
        reason: reason
      });
      
      // Update local state
      setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, shelf_id: toShelfId } : b));
      setSuccess('Box moved successfully!');
      
      setTimeout(() => setSuccess(null), 5000);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to move box';
      setError(errorMessage);
      console.error('Error moving box:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch box contents
   */
  const fetchBoxContents = useCallback(async (boxId) => {
    try {
      setLoading(true);
      setError(null);
      
      const contents = await boxesApi.getContents(boxId);
      return contents;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch box contents';
      setError(errorMessage);
      console.error('Error fetching box contents:', err);
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
    
    // Shelf operations
    fetchShelvesByStore,
    createShelf,
    createMultipleShelves,
    updateShelf,
    deleteShelf,
    
    // Box operations
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
