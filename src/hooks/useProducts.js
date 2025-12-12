import { useState, useEffect } from 'react';
import { productsApi } from '../services/api';

/**
 * Custom Hook: useProducts
 * Fetches and manages real jewelry products data with pagination support
 * 
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Whether to auto-fetch on mount (default: true)
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.pageSize - Number of items per page (default: 20)
 * @returns {Object} Products state and methods
 */
export const useProducts = ({ 
  autoFetch = true, 
  initialPage = 1, 
  pageSize = 20 
} = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Cache to avoid refetching the same page
  const [cachedPages, setCachedPages] = useState(new Map());

  const fetchProducts = async (page = currentPage, params = {}) => {
    try {
      console.log(`� useProducts - Fetching real jewelry page ${page}...`);
      setLoading(true);
      
      // Check cache first
      const cacheKey = JSON.stringify({ page, pageSize, ...params });
      if (cachedPages.has(cacheKey)) {
        console.log(`📋 Using cached data for page ${page}`);
        const cachedData = cachedPages.get(cacheKey);
        setProducts(cachedData.products);
        setTotalPages(cachedData.totalPages);
        setTotalItems(cachedData.totalItems);
        setCurrentPage(page);
        setError(null);
        setLoading(false);
        return cachedData;
      }
      
      const response = await productsApi.getAll({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...params
      });
      
      console.log('📦 useProducts - API Response:', {
        products: response.products?.length,
        total: response.total,
        page: response.page
      });
      
      // Process pagination data
      const paginationData = {
        products: response.products || [],
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || response.total || 0,
        currentPage: response.pagination?.currentPage || page
      };
      
      // Cache the result
      setCachedPages(prev => new Map(prev).set(cacheKey, paginationData));
      
      setProducts(paginationData.products);
      setTotalPages(paginationData.totalPages);
      setTotalItems(paginationData.totalItems);
      setCurrentPage(paginationData.currentPage);
      setHasInitiallyLoaded(true);
      setError(null);
      
      return paginationData;
      
    } catch (err) {
      setError('Failed to load jewelry products');
      console.error('Fetch jewelry products error:', err);
      throw err;
    } finally {
      setLoading(false);
      console.log('✅ useProducts - Loading set to false');
    }
  };

  useEffect(() => {
    if (!autoFetch) {
      console.log('📦 useProducts - Auto-fetch disabled, skipping initial load');
      setLoading(false);
      return;
    }

    fetchProducts(currentPage);
  }, [autoFetch]); // Only run on mount

  const refetch = async () => {
    // Clear cache and refetch current page
    setCachedPages(new Map());
    return await fetchProducts(currentPage);
  };

  const forceRefetch = async () => {
    // Force refetch regardless of cache state
    setCachedPages(new Map());
    return await fetchProducts(currentPage);
  };

  const goToPage = async (page) => {
    if (page === currentPage || page < 1) return;
    
    try {
      return await fetchProducts(page);
    } catch (err) {
      console.error('Error navigating to page:', page, err);
      throw err;
    }
  };

  const nextPage = async () => {
    if (currentPage < totalPages) {
      return await fetchProducts(currentPage + 1);
    }
  };

  const prevPage = async () => {
    if (currentPage > 1) {
      return await fetchProducts(currentPage - 1);
    }
  };

  const searchProducts = async (searchQuery, page = 1) => {
    try {
      setLoading(true);
      
      // Clear cache when searching
      setCachedPages(new Map());
      
      const response = await productsApi.search(searchQuery, {
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      console.log('🔍 useProducts - Search Response:', {
        products: response.products?.length,
        query: searchQuery
      });
      
      // Handle search results (assuming similar structure)
      const searchResults = response.products || response || [];
      
      setProducts(searchResults);
      setTotalPages(1); // Search results might not have pagination
      setTotalItems(searchResults.length);
      setCurrentPage(1);
      setError(null);
      
    } catch (err) {
      setError('Failed to search jewelry products');
      console.error('Search jewelry products error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    hasInitiallyLoaded,
    // Pagination data
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    // Methods
    refetch,
    forceRefetch,
    searchProducts,
    goToPage,
    nextPage,
    prevPage,
  };
};