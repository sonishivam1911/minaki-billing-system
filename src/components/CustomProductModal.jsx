import React, { useState, useEffect } from 'react';
import { Package, X, IndianRupee } from 'lucide-react';
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
 * CustomProductModal Component
 * Modal for creating/editing custom products (Lab Grown Diamond) with reference image uploads
 */
export const CustomProductModal = ({
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
    product_number: '',
    article_code: '',
    classification: 'Made to Order',
    reference_images: [],
    description: '',
    specifications: {},
    estimated_price: '',
    total_amount: '',
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
        product_number: initialData.product_number || '',
        article_code: initialData.article_code || '',
        classification: initialData.classification || 'Made to Order',
        reference_images: initialData.reference_images || [],
        description: initialData.description || '',
        specifications: initialData.specifications || {},
        estimated_price: initialData.estimated_price || '',
        total_amount: initialData.total_amount || '',
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
    if (formData.product_number) {
      await uploadImages(files);
    }
  };

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setIsUploading(true);
      setError(null);
      const productNumber = formData.product_number || `CP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      if (!formData.product_number) {
        setFormData(prev => ({ ...prev, product_number: productNumber }));
      }
      const result = await imageUploadApi.uploadCustomOrderImages(productNumber, files, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.description) {
      setError('Description is required');
      return;
    }

    try {
      setIsSubmitting(true);

      if (uploadedFiles.length > 0 && uploadedImageUrls.length === 0) {
        await uploadImages(uploadedFiles);
      }

      const productData = {
        ...formData,
        reference_images: uploadedImageUrls,
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        product_number: formData.product_number || undefined
      };

      await onSubmit(productData);

      setFormData({
        enquiry_id: enquiryId || null,
        customer_id: customerId || null,
        product_number: '',
        article_code: '',
        classification: 'Made to Order',
        reference_images: [],
        description: '',
        specifications: {},
        estimated_price: '',
        total_amount: '',
        status: 'draft'
      });
      setUploadedFiles([]);
      setUploadedImageUrls([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save custom product');
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
            <span>{initialData ? 'Edit Custom Product' : 'New Custom Product'}</span>
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
            {formData.product_number && (
              <TextField
                label="Product Number"
                name="product_number"
                value={formData.product_number}
                onChange={handleChange}
                fullWidth
                disabled
                helperText="Auto-generated"
              />
            )}

            <TextField
              label="Article Code"
              name="article_code"
              value={formData.article_code}
              onChange={handleChange}
              fullWidth
              placeholder="e.g. ART-001"
            />

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

            <TextField
              label="Description *"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe the custom product (Lab Grown Diamond)..."
            />

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

            <TextField
              label="Total Amount (₹)"
              name="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: <IndianRupee size={20} style={{ marginRight: 8, color: '#666' }} />
              }}
            />

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
            {isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : initialData ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
