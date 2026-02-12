import React, { useState, useEffect } from 'react';
import { Package, X, Upload, IndianRupee } from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import { ImageUploader } from './ImageUploader';
import { ImageGallery } from './ImageGallery';
import imageUploadApi from '../services/imageUploadApi';

/**
 * CustomOrderModal Component
 * Modal for creating/editing custom orders with reference image uploads
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Function} props.onSubmit - Function called when order is submitted
 * @param {Object} props.initialData - Initial order data (for editing)
 * @param {number} props.enquiryId - Pre-filled enquiry ID (optional)
 * @param {number} props.customerId - Pre-filled customer ID (optional)
 */
export const CustomOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  enquiryId = null,
  customerId = null
}) => {
  const [formData, setFormData] = useState({
    enquiry_id: enquiryId || null,
    customer_id: customerId || null,
    order_number: '',
    reference_images: [],
    description: '',
    specifications: {},
    estimated_price: '',
    status: 'draft'
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        enquiry_id: initialData.enquiry_id || enquiryId || null,
        customer_id: initialData.customer_id || customerId || null,
        order_number: initialData.order_number || '',
        reference_images: initialData.reference_images || [],
        description: initialData.description || '',
        specifications: initialData.specifications || {},
        estimated_price: initialData.estimated_price || '',
        status: initialData.status || 'draft'
      });
      setUploadedImageUrls(initialData.reference_images || []);
    } else if (enquiryId || customerId) {
      setFormData(prev => ({
        ...prev,
        enquiry_id: enquiryId || prev.enquiry_id,
        customer_id: customerId || prev.customer_id
      }));
    }
  }, [initialData, enquiryId, customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleImageUpload = async (files) => {
    if (files.length === 0) {
      setUploadedFiles([]);
      return;
    }

    setUploadedFiles(files);
    
    // If we have an order number, upload immediately
    // Otherwise, we'll upload when the order is created
    if (formData.order_number) {
      await uploadImages(files);
    }
  };

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);

      // Generate order number if not exists
      const orderNumber = formData.order_number || generateOrderNumber();
      
      if (!formData.order_number) {
        setFormData(prev => ({ ...prev, order_number: orderNumber }));
      }

      const result = await imageUploadApi.uploadCustomOrderImages(orderNumber, files, {
        compress: true,
        makePublic: true
      });

      const imageUrls = result.uploaded?.map(img => img.url) || [];
      setUploadedImageUrls(prev => [...prev, ...imageUrls]);
      
    } catch (err) {
      setError(`Failed to upload images: ${err.message}`);
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CO-${year}-${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customer_id) {
      setError('Customer is required');
      return;
    }

    if (!formData.description) {
      setError('Description is required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload images if we have files but no URLs yet
      if (uploadedFiles.length > 0 && uploadedImageUrls.length === 0) {
        await uploadImages(uploadedFiles);
      }

      const orderData = {
        ...formData,
        reference_images: uploadedImageUrls,
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : null,
        order_number: formData.order_number || generateOrderNumber()
      };

      await onSubmit(orderData);
      
      // Reset form
      setFormData({
        enquiry_id: enquiryId || null,
        customer_id: customerId || null,
        order_number: '',
        reference_images: [],
        description: '',
        specifications: {},
        estimated_price: '',
        status: 'draft'
      });
      setUploadedFiles([]);
      setUploadedImageUrls([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save custom order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_production', label: 'In Production' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Package size={20} />
            <span>{initialData ? 'Edit Custom Order' : 'New Custom Order'}</span>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ overflowY: 'auto' }}>
          {error && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fee', color: '#c33', borderRadius: 1 }}>
              {error}
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Order Number */}
            {formData.order_number && (
              <TextField
                label="Order Number"
                name="order_number"
                value={formData.order_number}
                onChange={handleChange}
                fullWidth
                disabled
                helperText="Auto-generated order number"
              />
            )}

            {/* Reference Images */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Reference Images
              </Typography>
              {uploadedImageUrls.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  <ImageGallery images={uploadedImageUrls} />
                </Box>
              ) : null}
              <ImageUploader
                onUpload={handleImageUpload}
                maxImages={10}
                maxSizeMB={10}
                disabled={isUploading || isSubmitting}
              />
              {isUploading && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Uploading images...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Description */}
            <TextField
              label="Order Description *"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe the custom order requirements..."
            />

            {/* Estimated Price */}
            <TextField
              label="Estimated Price (₹)"
              name="estimated_price"
              type="number"
              value={formData.estimated_price}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: <IndianRupee size={20} style={{ marginRight: 8, color: '#666' }} />
              }}
            />

            {/* Status (only show when editing) */}
            {initialData && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting || isUploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || isUploading}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            sx={{
              bgcolor: '#8b6f47',
              '&:hover': { bgcolor: '#6d5637' }
            }}
          >
            {isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : initialData ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

