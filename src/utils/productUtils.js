/**
 * Product Utility Functions
 * Helper functions for product data extraction, formatting, and filtering
 */

/**
 * Extract 4C's of Diamond from product
 * @param {Object} product - Product object
 * @returns {Object|null} Object with carat, cut, color, clarity or null if no diamond data
 */
export const getDiamondFourCs = (product) => {
  if (!product || !product.diamond_components || product.diamond_components.length === 0) {
    return null;
  }

  const mainDiamond = product.diamond_components[0];
  if (!mainDiamond) return null;

  const fourCs = {
    carat: mainDiamond.carat_weight ? `${roundCarat(mainDiamond.carat_weight)}ct` : null,
    cut: mainDiamond.cut || mainDiamond.shape || null,
    color: mainDiamond.color || mainDiamond.color_grade || mainDiamond.diamond_color || null,
    clarity: mainDiamond.clarity || mainDiamond.clarity_grade || mainDiamond.diamond_clarity || null,
  };

  // Return only if at least one value exists
  return Object.values(fourCs).some(val => val !== null) ? fourCs : null;
};

/**
 * Get gold finish from product
 * @param {Object} product - Product object
 * @returns {string|null} Gold finish (Rose/Yellow/White) or null
 */
export const getGoldFinish = (product) => {
  if (!product || !product.metal_components || product.metal_components.length === 0) {
    return null;
  }

  const mainMetal = product.metal_components[0];
  if (!mainMetal || !mainMetal.metal_type) return null;

  const metalType = mainMetal.metal_type.toLowerCase();
  if (metalType === 'white_gold' || metalType === 'white') return 'White';
  if (metalType === 'yellow_gold' || metalType === 'yellow') return 'Yellow';
  if (metalType === 'rose_gold' || metalType === 'rose') return 'Rose';
  
  return mainMetal.metal_type || null;
};

/**
 * Get gold weight from product
 * @param {Object} product - Product object
 * @returns {Object|null} Object with netWeight and grossWeight or null
 */
export const getGoldWeight = (product) => {
  if (!product || !product.metal_components || product.metal_components.length === 0) {
    // Fallback to direct product fields
    if (product.net_weight || product.weight) {
      return {
        netWeight: product.net_weight || null,
        grossWeight: product.weight || null,
      };
    }
    return null;
  }

  const mainMetal = product.metal_components[0];
  if (!mainMetal) return null;

  return {
    netWeight: mainMetal.net_weight_g || mainMetal.net_weight || null,
    grossWeight: mainMetal.weight_g || mainMetal.weight || null,
  };
};

/**
 * Format location hierarchy string
 * @param {Object} locationData - Location data object
 * @returns {string} Formatted location string
 */
export const getProductLocation = (locationData) => {
  if (!locationData) return 'Not Located';

  const parts = [];
  
  if (locationData.location_name || locationData.store_name) {
    parts.push(locationData.location_name || locationData.store_name);
  }
  
  if (locationData.storage_type_name || locationData.shelf_name) {
    parts.push(locationData.storage_type_name || locationData.shelf_name);
  }
  
  if (locationData.storage_object_name || locationData.box_name) {
    parts.push(locationData.storage_object_name || locationData.box_name);
  }

  return parts.length > 0 ? parts.join(' → ') : 'Not Located';
};

/**
 * Format carat weight display
 * @param {number|string} weight - Carat weight
 * @returns {string} Formatted carat string (e.g., "1.50 CT")
 */
export const formatCaratWeight = (weight) => {
  if (!weight) return null;
  const num = parseFloat(weight);
  if (isNaN(num)) return null;
  return `${num.toFixed(2)} CT`;
};

/**
 * Get certificate number from product
 * @param {Object} product - Product object
 * @returns {string|null} Certificate number or null
 */
export const getCertificateNumber = (product) => {
  if (!product || !product.diamond_components || product.diamond_components.length === 0) {
    return null;
  }

  const mainDiamond = product.diamond_components[0];
  return mainDiamond.certificate_no || mainDiamond.cert_no || null;
};

/**
 * Round carat to 2 decimal places
 * @param {number|string} value - Carat value
 * @returns {number|null} Rounded carat or null
 */
const roundCarat = (value) => {
  if (!value) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return parseFloat(num.toFixed(2));
};

/**
 * Filter products by category
 * @param {Array} products - Array of products
 * @param {string|Array} categories - Category or array of categories to filter by
 * @returns {Array} Filtered products
 */
export const filterProductsByCategory = (products, categories) => {
  if (!products || products.length === 0) return [];
  if (!categories || (Array.isArray(categories) && categories.length === 0)) return products;

  const categoryList = Array.isArray(categories) ? categories : [categories];
  
  return products.filter(product => {
    const productCategory = (product.category || product.product_type || '').toLowerCase();
    return categoryList.some(cat => 
      productCategory.includes(cat.toLowerCase()) || 
      cat.toLowerCase() === productCategory
    );
  });
};

/**
 * Filter products by diamond size (carat range)
 * @param {Array} products - Array of products
 * @param {number} minCarat - Minimum carat weight
 * @param {number} maxCarat - Maximum carat weight
 * @returns {Array} Filtered products
 */
export const filterProductsByDiamondSize = (products, minCarat, maxCarat) => {
  if (!products || products.length === 0) return [];
  if (minCarat === undefined && maxCarat === undefined) return products;

  return products.filter(product => {
    const fourCs = getDiamondFourCs(product);
    if (!fourCs || !fourCs.carat) return false;

    // Extract numeric carat value from string like "1.50ct"
    const caratMatch = fourCs.carat.match(/(\d+\.?\d*)/);
    if (!caratMatch) return false;

    const caratValue = parseFloat(caratMatch[1]);
    
    if (minCarat !== undefined && caratValue < minCarat) return false;
    if (maxCarat !== undefined && caratValue > maxCarat) return false;
    
    return true;
  });
};

/**
 * Filter products by diamond cut/shape
 * @param {Array} products - Array of products
 * @param {string} cut - Cut/shape value to filter by
 * @returns {Array} Filtered products
 */
export const filterProductsByDiamondCut = (products, cut) => {
  if (!products || products.length === 0) return [];
  if (!cut) return products;

  return products.filter(product => {
    if (!product.diamond_components || product.diamond_components.length === 0) return false;
    
    const mainDiamond = product.diamond_components[0];
    const productCut = mainDiamond.cut || mainDiamond.shape || '';
    
    // Case-insensitive comparison
    return productCut.toLowerCase() === cut.toLowerCase();
  });
};

/**
 * Filter products by diamond color
 * @param {Array} products - Array of products
 * @param {string} color - Color grade to filter by
 * @returns {Array} Filtered products
 */
export const filterProductsByDiamondColor = (products, color) => {
  if (!products || products.length === 0) return [];
  if (!color) return products;

  return products.filter(product => {
    if (!product.diamond_components || product.diamond_components.length === 0) return false;
    
    const mainDiamond = product.diamond_components[0];
    const productColor = mainDiamond.color || mainDiamond.color_grade || mainDiamond.diamond_color || '';
    
    // Extract color grade (e.g., "D", "E", "F") from string like "D" or "Color: D"
    const colorMatch = productColor.toString().match(/\b([DEFGHIJKLMN])\b/i);
    const extractedColor = colorMatch ? colorMatch[1].toUpperCase() : productColor.toUpperCase();
    
    return extractedColor === color.toUpperCase();
  });
};

/**
 * Filter products by diamond clarity
 * @param {Array} products - Array of products
 * @param {string} clarity - Clarity grade to filter by
 * @returns {Array} Filtered products
 */
export const filterProductsByDiamondClarity = (products, clarity) => {
  if (!products || products.length === 0) return [];
  if (!clarity) return products;

  return products.filter(product => {
    if (!product.diamond_components || product.diamond_components.length === 0) return false;
    
    const mainDiamond = product.diamond_components[0];
    const productClarity = mainDiamond.clarity || mainDiamond.clarity_grade || mainDiamond.diamond_clarity || '';
    
    // Extract clarity grade (e.g., "VS1", "SI1") from string
    const clarityMatch = productClarity.toString().match(/\b(FL|IF|VVS1|VVS2|VS1|VS2|SI1|SI2|I1|I2|I3)\b/i);
    const extractedClarity = clarityMatch ? clarityMatch[1].toUpperCase() : productClarity.toUpperCase();
    
    return extractedClarity === clarity.toUpperCase();
  });
};

/**
 * Filter products by price range
 * @param {Array} products - Array of products
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Array} Filtered products
 */
export const filterProductsByPrice = (products, minPrice, maxPrice) => {
  if (!products || products.length === 0) return [];
  if (minPrice === undefined && maxPrice === undefined) return products;

  return products.filter(product => {
    const price = product.final_price || product.price || product.rate || 0;
    
    if (minPrice !== undefined && price < minPrice) return false;
    if (maxPrice !== undefined && price > maxPrice) return false;
    
    return true;
  });
};

/**
 * Filter products by location
 * @param {Array} products - Array of products
 * @param {number|string} locationId - Location ID to filter by
 * @returns {Array} Filtered products
 */
export const filterProductsByLocation = (products, locationId) => {
  if (!products || products.length === 0) return [];
  if (!locationId) return products;

  return products.filter(product => {
    return product.location_id === locationId || 
           product.store_id === locationId ||
           product.location?.id === locationId;
  });
};

/**
 * Apply all filters to products
 * @param {Array} products - Array of products
 * @param {Object} filters - Filter object with category, diamondSize, diamondCut, diamondColor, diamondClarity, price, location
 * @returns {Array} Filtered products
 */
export const applyProductFilters = (products, filters) => {
  if (!products || products.length === 0) return [];
  if (!filters) return products;

  let filtered = [...products];

  // Category filter
  if (filters.category && filters.category.length > 0) {
    filtered = filterProductsByCategory(filtered, filters.category);
  }

  // Diamond size (Carat) filter
  if (filters.diamondSize) {
    const { min, max } = filters.diamondSize;
    filtered = filterProductsByDiamondSize(filtered, min, max);
  }

  // Diamond cut filter
  if (filters.diamondCut) {
    filtered = filterProductsByDiamondCut(filtered, filters.diamondCut);
  }

  // Diamond color filter
  if (filters.diamondColor) {
    filtered = filterProductsByDiamondColor(filtered, filters.diamondColor);
  }

  // Diamond clarity filter
  if (filters.diamondClarity) {
    filtered = filterProductsByDiamondClarity(filtered, filters.diamondClarity);
  }

  // Price filter
  if (filters.price) {
    const { min, max } = filters.price;
    filtered = filterProductsByPrice(filtered, min, max);
  }

  // Location filter
  if (filters.location) {
    filtered = filterProductsByLocation(filtered, filters.location);
  }

  return filtered;
};

