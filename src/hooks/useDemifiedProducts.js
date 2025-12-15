import { useState, useEffect } from 'react';
import { demifiedProductsApi } from '../services/api';

/**
 * Custom Hook: useDemifiedProducts
 * Fetches and manages demified products data with pagination support
 * 
 * @param {Object} options - Hook options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.pageSize - Number of items per page (default: 20)
 * @param {boolean} options.autoFetch - Whether to auto-fetch on mount (default: true)
 * @returns {Object} Demified products state and methods
 */
export const useDemifiedProducts = ({ 
  initialPage = 1, 
  pageSize = 20,
  autoFetch = true 
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
  
  // Filters state
  const [filters, setFilters] = useState({});

  // Convert filters object to API params
  const filtersToParams = (filterObj) => {
    const params = {};
    
    // Dropdown filters
    Object.keys(filterObj).forEach(key => {
      if (key.endsWith('_min') || key.endsWith('_max')) {
        // Range filters
        params[key] = filterObj[key].toString();
      } else {
        // Dropdown filters
        params[key] = filterObj[key];
      }
    });
    
    return params;
  };

  const fetchProducts = async (page = currentPage, params = {}, useFilters = true, filtersOverride = null) => {
    try {
      console.log(`🚀 useDemifiedProducts - Fetching page ${page}...`);
      setLoading(true);
      
      // Merge filters with additional params FIRST to build proper cache key
      // Use filtersOverride if provided (for immediate filter application), otherwise use state
      const activeFilters = filtersOverride !== null ? filtersOverride : filters;
      const filterParams = useFilters ? filtersToParams(activeFilters) : {};
      const finalParams = {
        page: page.toString(),
        page_size: pageSize.toString(),
        with_images: 'true',
        ...filterParams,
        ...params
      };
      
      console.log('🔍 useDemifiedProducts - Filters being applied:', {
        filtersState: filters,
        filterParams: filterParams,
        finalParams: finalParams
      });
      
      // Check cache first - cache key must include filters!
      const cacheKey = JSON.stringify({ page, pageSize, filters: filterParams, ...params });
      if (cachedPages.has(cacheKey)) {
        console.log(`📋 Using cached data for page ${page} with filters:`, filterParams);
        const cachedData = cachedPages.get(cacheKey);
        setProducts(cachedData.products);
        setTotalPages(cachedData.totalPages);
        setTotalItems(cachedData.totalItems);
        setCurrentPage(page);
        setError(null);
        setLoading(false);
        return cachedData;
      }
      
      const response = await demifiedProductsApi.getAll(finalParams);
      
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
      setHasInitiallyLoaded(true);
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
    if (!autoFetch) {
      console.log('📦 useDemifiedProducts - Auto-fetch disabled, skipping initial load');
      setLoading(false);
      return;
    }

    fetchProducts(currentPage);
  }, [autoFetch]); // Only run on mount and when autoFetch changes

  const refetch = async () => {
    // Clear cache and refetch current page with current filters
    setCachedPages(new Map());
    return await fetchProducts(currentPage, {}, true);
  };

  const goToPage = async (page) => {
    if (page === currentPage || page < 1) return;
    
    // Allow going to any page - let the API handle invalid pages
    // Filters are automatically applied via fetchProducts
    try {
      return await fetchProducts(page, {}, true);
    } catch (err) {
      console.error('Error navigating to page:', page, err);
      throw err;
    }
  };

  const goToPageIfNeeded = async (page) => {
    // Only navigate if we're not already on the page and have no cached data for it
    if (page === currentPage) return;
    
    const cacheKey = JSON.stringify({ page, pageSize });
    if (cachedPages.has(cacheKey)) {
      // Use cached data instead of making API call
      const cachedData = cachedPages.get(cacheKey);
      setProducts(cachedData.products);
      setTotalPages(cachedData.totalPages);
      setTotalItems(cachedData.totalItems);
      setCurrentPage(page);
      setError(null);
      return cachedData;
    }
    
    // Only fetch if we don't have cached data
    return await fetchProducts(page);
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
      
      // Include filters in search
      const filterParams = filtersToParams(filters);
      
      const response = await demifiedProductsApi.search(searchQuery, {
        page: page.toString(),
        page_size: pageSize.toString(),
        ...filterParams
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

  // Apply filters and refetch
  const applyFilters = async (newFilters) => {
    // Clear cache when filters change
    setCachedPages(new Map());
    // Reset to page 1 when filters change
    setCurrentPage(1);
    // Update filters state
    setFilters(newFilters);
    // Fetch with new filters immediately (pass filters directly to avoid state timing issue)
    return await fetchProducts(1, {}, true, newFilters);
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
    // Filters
    filters,
    // Methods
    refetch,
    searchProducts,
    goToPage,
    goToPageIfNeeded,
    nextPage,
    prevPage,
    applyFilters,
  };
};