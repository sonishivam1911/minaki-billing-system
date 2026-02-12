/**
 * Image Upload API Service
 * Handles image uploads for custom orders
 * Extends existing GCS image upload functionality
 */

// API Base URL
let VITE_API_URL = import.meta.env.VITE_API_URL;
if (!VITE_API_URL || VITE_API_URL.startsWith('http://localhost:')) {
  VITE_API_URL = null;
}
const API_BASE_URL = VITE_API_URL || '/billing_system/api';

export const imageUploadApi = {
  /**
   * Upload images for a custom order
   * POST /api/gcs/custom-orders/{order_number}/upload-images
   * 
   * @param {string} orderNumber - Custom order number (e.g., "CO-2024-001")
   * @param {Array<File>} images - Array of image files
   * @param {Object} options - Upload options
   *   {
   *     compress: boolean (default: true),
   *     makePublic: boolean (default: true)
   *   }
   * @returns {Promise<Object>} Upload result with image URLs
   */
  uploadCustomOrderImages: async (orderNumber, images, options = {}) => {
    if (!orderNumber || !orderNumber.trim()) {
      throw new Error('Order number is required for image upload');
    }

    if (!images || images.length === 0) {
      throw new Error('At least one image is required');
    }

    const formData = new FormData();
    
    // Add all image files
    images.forEach((image) => {
      formData.append('files', image);
    });
    
    // Add optional parameters
    formData.append('compress', options.compress !== false ? 'true' : 'false');
    formData.append('make_public', options.makePublic !== false ? 'true' : 'false');
    
    const url = `${API_BASE_URL}/gcs/custom-orders/${orderNumber}/upload-images`;
    
    console.log('📸 Image Upload API - Uploading images for order:', orderNumber);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload images: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📸 Image Upload API - Upload successful:', result);
    
    return result;
  },

  /**
   * Get images for a custom order
   * GET /api/gcs/custom-orders/{order_number}/images
   * 
   * @param {string} orderNumber - Custom order number
   * @returns {Promise<Array>} List of image URLs
   */
  getCustomOrderImages: async (orderNumber) => {
    const url = `${API_BASE_URL}/gcs/custom-orders/${orderNumber}/images`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  },
};

export default imageUploadApi;


