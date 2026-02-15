import { useState, useEffect, useCallback } from 'react';
import customProductsApi from '../services/customProductsApi';

/**
 * Custom Hook: useCustomProducts
 * Manages custom products (Lab Grown Diamond) data and operations
 */
export const useCustomProducts = ({ autoFetch = false, filters = {} } = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (queryFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const finalFilters = { ...filters, ...queryFilters };
      const response = await customProductsApi.getAll(finalFilters);
      const productsList = Array.isArray(response) ? response : (response.items || response.products || []);
      setProducts(productsList);
      return productsList;
    } catch (err) {
      setError('Failed to load custom products');
      console.error('Fetch custom products error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch]);

  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      setError(null);
      const newProduct = await customProductsApi.create(productData);
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      setError('Failed to create custom product');
      console.error('Create custom product error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (productId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedProduct = await customProductsApi.update(productId, updateData);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updatedProduct } : p))
      );
      return updatedProduct;
    } catch (err) {
      setError('Failed to update custom product');
      console.error('Update custom product error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      await customProductsApi.delete(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      setError('Failed to delete custom product');
      console.error('Delete custom product error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProductById = useCallback(async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const product = await customProductsApi.getById(productId);
      return product;
    } catch (err) {
      setError('Failed to fetch custom product');
      console.error('Get custom product error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async (queryFilters = {}) => {
    return await fetchProducts(queryFilters);
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    refetch,
  };
};
