import { useState, useEffect } from 'react';
import { demifiedProductsApi } from '../services/api';

/**
 * Custom Hook: useDemifiedProducts
 * Fetches and manages demified products data with pagination support
 * 
 * @param {Object} options - Hook options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.pageSize - Number of items per page (default: 20)
 * @returns {Object} Demified products state and methods
 */
export const useDemifiedProducts = ({ 
  initialPage = 1, 
  pageSize = 20 
} = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Cache to avoid refetching the same page
  const [cachedPages, setCachedPages] = useState(new Map());

  const fetchProducts = async (page = currentPage, params = {}) => {
    try {
      console.log(`🚀 useDemifiedProducts - Fetching page ${page}...`);
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
      
      const response = await demifiedProductsApi.getAll({
        page: page.toString(),
        page_size: pageSize.toString(),
        with_images: 'true',
        ...params
      });
      
      console.log('📦 useDemifiedProducts - API Response:', {
        products: response.products?.length,
        pagination: response.pagination,
        rawCount: response.rawCount
      });
      
      // Use actual pagination metadata from the API response
      const paginationData = {
        products: response.products || [],
        totalPages: response.pagination?.totalPages || 1,
        totalItems: response.pagination?.totalItems || response.products?.length || 0,
        currentPage: response.pagination?.currentPage || page
      };
      
      // Cache the result
      setCachedPages(prev => new Map(prev).set(cacheKey, paginationData));
      
      setProducts(paginationData.products);
      setTotalPages(paginationData.totalPages);
      setTotalItems(paginationData.totalItems);
      setCurrentPage(paginationData.currentPage);
      setError(null);
      
      return paginationData;
      
    } catch (err) {
      setError('Failed to load demified products');
      console.error('Fetch demified products error:', err);
      throw err;
    } finally {
      setLoading(false);
      console.log('✅ useDemifiedProducts - Loading set to false');
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, []); // Only run on mount

  const refetch = async () => {
    // Clear cache and refetch current page
    setCachedPages(new Map());
    return await fetchProducts(currentPage);
  };

  const goToPage = async (page) => {
    if (page === currentPage || page < 1) return;
    
    // Allow going to any page - let the API handle invalid pages
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
      
      const response = await demifiedProductsApi.search(searchQuery, {
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      console.log('🔍 useDemifiedProducts - Search Response:', {
        products: response.products?.length,
        pagination: response.pagination,
        query: searchQuery
      });
      
      // Use actual search pagination metadata
      const searchData = response.products || [];
      const searchPagination = response.pagination || {};
      
      setProducts(searchData);
      setTotalPages(searchPagination.totalPages || Math.ceil(searchData.length / pageSize) || 1);
      setTotalItems(searchPagination.totalItems || searchData.length);
      setCurrentPage(searchPagination.currentPage || page);
      setError(null);
      
    } catch (err) {
      setError('Failed to search demified products');
      console.error('Search demified products error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    // Pagination data
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    // Methods
    refetch,
    searchProducts,
    goToPage,
    nextPage,
    prevPage,
  };
};