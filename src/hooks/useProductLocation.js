import { useState, useCallback, useEffect } from 'react';
import productsApi from '../services/productLocationApi';

/**
 * Hook to fetch location data for products
 * Used in catalog to display product locations
 */
export const useProductLocation = (productId, productType = 'real_jewelry') => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocation = useCallback(async () => {
    if (!productId) {
      setLocation(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Search for product locations
      const locations = await productsApi.find(productType, productId);
      
      if (locations && locations.length > 0) {
        // Use the first location found
        setLocation(locations[0]);
      } else {
        setLocation(null);
      }
    } catch (err) {
      console.error('Error fetching product location:', err);
      setError(err.message || 'Failed to fetch location');
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, [productId, productType]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    refetch: fetchLocation,
  };
};

/**
 * Hook to fetch locations for multiple products
 * Used to batch fetch locations for product list
 */
export const useProductLocations = (products = []) => {
  const [locationsMap, setLocationsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocations = useCallback(async () => {
    if (!products || products.length === 0) {
      setLocationsMap({});
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newLocationsMap = {};

      // Fetch locations for each product
      await Promise.all(
        products.map(async (product) => {
          try {
            const productType = product.isDemistified ? 'zakya_product' : 'real_jewelry';
            const productId = product.variant_id || product.id || product.sku;
            
            if (!productId) return;

            const locations = await productsApi.find(productType, productId);
            if (locations && locations.length > 0) {
              newLocationsMap[productId] = locations[0];
            }
          } catch (err) {
            console.error(`Error fetching location for product ${product.id}:`, err);
            // Continue with other products
          }
        })
      );

      setLocationsMap(newLocationsMap);
    } catch (err) {
      console.error('Error fetching product locations:', err);
      setError(err.message || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const getLocation = useCallback(
    (productId) => {
      return locationsMap[productId] || null;
    },
    [locationsMap]
  );

  return {
    locationsMap,
    getLocation,
    loading,
    error,
    refetch: fetchLocations,
  };
};

export default useProductLocation;
