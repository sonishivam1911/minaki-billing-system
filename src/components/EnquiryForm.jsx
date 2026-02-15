import React, { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
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
} from '@mui/material';

/**
 * EnquiryForm Component
 * Form for creating/editing customer enquiries
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Function} props.onSubmit - Function called when enquiry is submitted
 * @param {Object} props.initialData - Initial enquiry data (for editing)
 * @param {number} props.walkInId - Pre-filled walk-in ID (optional)
 * @param {number} props.customerId - Pre-filled customer ID (optional)
 */
export const EnquiryForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  walkInId = null,
  customerId = null
}) => {
  const [formData, setFormData] = useState({
    walk_in_id: walkInId || null,
    customer_id: customerId || null,
    category: '',
    product_type: '',
    budget_min: '',
    budget_max: '',
    timeline: '',
    description: '',
    status: 'new'
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        walk_in_id: initialData.walk_in_id || walkInId || null,
        customer_id: initialData.customer_id || customerId || null,
        category: initialData.category || '',
        product_type: initialData.product_type || '',
        budget_min: initialData.budget_min || '',
        budget_max: initialData.budget_max || '',
        timeline: initialData.timeline || '',
        description: initialData.description || '',
        status: initialData.status || 'new'
      });
    } else if (walkInId || customerId) {
      setFormData(prev => ({
        ...prev,
        walk_in_id: walkInId || prev.walk_in_id,
        customer_id: customerId || prev.customer_id
      }));
    }
  }, [initialData, walkInId, customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customer_id) {
      setError('Customer is required');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.product_type) {
      setError('Product type is required');
      return;
    }

    if (!formData.description) {
      setError('Description is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const enquiryData = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      };

      await onSubmit(enquiryData);
      
      // Reset form
      setFormData({
        walk_in_id: walkInId || null,
        customer_id: customerId || null,
        category: '',
        product_type: '',
        budget_min: '',
        budget_max: '',
        timeline: '',
        description: '',
        status: 'new'
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save enquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'ring', label: 'Ring' },
    { value: 'necklace', label: 'Necklace' },
    { value: 'earring', label: 'Earring' },
    { value: 'bracelet', label: 'Bracelet' },
    { value: 'custom', label: 'Custom' }
  ];

  const productTypes = [
    { value: 'real_jewelry', label: 'Real Jewelry' },
    { value: 'lab_diamond', label: 'Lab Diamond' },
    { value: 'custom', label: 'Custom' }
  ];

  const timelines = [
    { value: 'urgent', label: 'Urgent' },
    { value: '1_week', label: '1 Week' },
    { value: '2_weeks', label: '2 Weeks' },
    { value: '1_month', label: '1 Month' },
    { value: 'flexible', label: 'Flexible' }
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
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={20} />
            <span>{initialData ? 'Edit Enquiry' : 'New Enquiry'}</span>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fee', color: '#c33', borderRadius: 1 }}>
              {error}
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {/* Category */}
              <FormControl fullWidth required>
                <InputLabel>Category *</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category *"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Product Type */}
              <FormControl fullWidth required>
                <InputLabel>Product Type *</InputLabel>
                <Select
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleChange}
                  label="Product Type *"
                >
                  {productTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              {/* Budget Min */}
              <TextField
                label="Budget Min (₹)"
                name="budget_min"
                type="number"
                value={formData.budget_min}
                onChange={handleChange}
                fullWidth
              />

              {/* Budget Max */}
              <TextField
                label="Budget Max (₹)"
                name="budget_max"
                type="number"
                value={formData.budget_max}
                onChange={handleChange}
                fullWidth
              />

              {/* Timeline */}
              <FormControl fullWidth>
                <InputLabel>Timeline</InputLabel>
                <Select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  label="Timeline"
                >
                  {timelines.map((timeline) => (
                    <MenuItem key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Description */}
            <TextField
              label="Description *"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe what the customer is looking for..."
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
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="quoted">Quoted</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            sx={{
              bgcolor: '#8b6f47',
              '&:hover': { bgcolor: '#6d5637' }
            }}
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Enquiry' : 'Create Enquiry'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};


