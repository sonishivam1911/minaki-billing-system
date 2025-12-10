import { useState, useEffect } from 'react';
import { productsApi } from '../services/api';

/**
 * Custom Hook: useProducts
 * Fetches and manages products data
 * 
 * @returns {Object} Products state and methods
 */
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getAll();
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load products');
        console.error('Fetch products error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Failed to reload products');
      console.error('Refetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    refetch,
  };
};