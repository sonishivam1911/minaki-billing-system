import React, { useState, useEffect, useMemo } from 'react';
import { Package, X, IndianRupee, Gem, Plus, Trash2 } from 'lucide-react';
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
  Divider,
  Paper,
} from '@mui/material';
import { ImageUploader } from './ImageUploader';
import { ImageGallery } from './ImageGallery';
import imageUploadApi from '../services/imageUploadApi';

const CUT_OPTIONS = ['Round', 'Oval', 'Princess', 'Cushion', 'Emerald', 'Radiant', 'Pear', 'Marquise', 'Asscher', 'Heart'];
const COLOR_OPTIONS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const CLARITY_OPTIONS = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'SI3', 'I1', 'I2', 'I3'];

const emptyDiamond = () => ({ carat: '', cut: '', color: '', clarity: '', unit_price: '', quantity: 1, total_price: '' });
const emptyGold = () => ({ karat: '', weight_gms: '', price_per_gram: '', total_price: '', other_charges: '' });

/**
 * CustomProductModal - Lab Grown Diamond (Made to Order)
 * Full template: Article Code, Diamonds 1-4, Gold, Reference Images, etc.
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
    specifications: { diamonds: [], gold: {} },
    estimated_price: '',
    total_amount: '',
    status: 'draft'
  });
  const [diamonds, setDiamonds] = useState([]);
  const [gold, setGold] = useState(emptyGold());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      const specs = initialData.specifications || {};
      const rawD = specs.diamonds || [];
      const d = rawD.length > 0 ? rawD.map((r) => ({
        carat: r.carat ?? '',
        cut: r.cut ?? '',
        color: r.color ?? '',
        clarity: r.clarity ?? '',
        unit_price: r.unit_price ?? '',
        quantity: r.quantity ?? 1,
        total_price: r.total_price ?? ''
      })) : [];
      setDiamonds(d);
      const g = specs.gold || {};
      setGold({
        karat: g.karat ?? '',
        weight_gms: g.weight_gms ?? '',
        price_per_gram: g.price_per_gram ?? '',
        total_price: g.total_price ?? '',
        other_charges: g.other_charges ?? ''
      });
      setFormData({
        enquiry_id: initialData.enquiry_id || enquiryId || null,
        customer_id: initialData.customer_id || customerId || null,
        product_number: initialData.product_number || '',
        article_code: initialData.article_code || '',
        classification: initialData.classification || 'Made to Order',
        reference_images: initialData.reference_images || [],
        description: initialData.description || '',
        specifications: specs,
        estimated_price: initialData.estimated_price || '',
        total_amount: initialData.total_amount || '',
        status: initialData.status || 'draft'
      });
      setUploadedImageUrls(initialData.reference_images || []);
      setUploadedFiles([]);
    } else {
      setDiamonds([]);
      setGold(emptyGold());
      setFormData({
        enquiry_id: enquiryId || null,
        customer_id: customerId || null,
        product_number: '',
        article_code: '',
        classification: 'Made to Order',
        reference_images: [],
        description: '',
        specifications: { diamonds: [], gold: {} },
        estimated_price: '',
        total_amount: '',
        status: 'draft'
      });
      setUploadedImageUrls([]);
      setUploadedFiles([]);
    }
  }, [initialData, enquiryId, customerId, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleDiamondChange = (index, field, value) => {
    setDiamonds((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      const calcFields = ['carat', 'unit_price', 'quantity'];
      if (calcFields.includes(field)) {
        const carat = parseFloat(next[index].carat) || 0;
        const unitPrice = parseFloat(next[index].unit_price) || 0;
        const qty = parseInt(next[index].quantity, 10) || 1;
        next[index].total_price = carat && unitPrice ? (carat * unitPrice * qty).toFixed(2) : '';
      }
      return next;
    });
  };

  const addDiamond = () => {
    setDiamonds((prev) => [...prev, emptyDiamond()]);
  };

  const removeDiamond = (index) => {
    setDiamonds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGoldChange = (field, value) => {
    setGold((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'weight_gms' || field === 'price_per_gram') {
        const w = parseFloat(next.weight_gms) || 0;
        const p = parseFloat(next.price_per_gram) || 0;
        next.total_price = w && p ? (w * p).toFixed(2) : '';
      }
      return next;
    });
  };

  const handleImageUpload = async (files) => {
    if (files.length === 0) {
      setUploadedFiles([]);
      return;
    }
    setUploadedFiles(files);
    if (formData.product_number) await uploadImages(files);
  };

  const uploadImages = async (files) => {
    if (!files?.length) return;
    try {
      setIsUploading(true);
      setError(null);
      const productNumber = formData.product_number || `temp-${Date.now()}`;
      const result = await imageUploadApi.uploadCustomOrderImages(productNumber, files, { compress: true, makePublic: true });
      const imageUrls = result.uploaded?.map((img) => img.url) || [];
      setUploadedImageUrls((prev) => [...prev, ...imageUrls]);
    } catch (err) {
      setError(`Failed to upload images: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const totalPriceJewelry = useMemo(() => {
    let sum = 0;
    diamonds.forEach((d) => {
      const tp = parseFloat(d.total_price);
      if (!isNaN(tp)) sum += tp;
    });
    const gTotal = parseFloat(gold.total_price) || 0;
    const gOther = parseFloat(gold.other_charges) || 0;
    return sum + gTotal + gOther;
  }, [diamonds, gold]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.description) {
      setError('Description is required');
      return;
    }

    try {
      setIsSubmitting(true);
      if (uploadedFiles.length > 0 && uploadedImageUrls.length === 0) await uploadImages(uploadedFiles);

      const specs = {
        diamonds: diamonds.map((d, i) => ({
          index: i + 1,
          carat: parseFloat(d.carat) || null,
          cut: d.cut || null,
          color: d.color || null,
          clarity: d.clarity || null,
          unit_price: parseFloat(d.unit_price) || null,
          quantity: parseInt(d.quantity, 10) || 1,
          total_price: parseFloat(d.total_price) || null
        })),
        gold: {
          karat: parseInt(gold.karat, 10) || null,
          weight_gms: parseFloat(gold.weight_gms) || null,
          price_per_gram: parseFloat(gold.price_per_gram) || null,
          total_price: parseFloat(gold.total_price) || null,
          other_charges: parseFloat(gold.other_charges) || null
        }
      };

      const totalAmount = formData.total_amount ? parseFloat(formData.total_amount) : (totalPriceJewelry || formData.estimated_price ? parseFloat(formData.estimated_price) : null);

      const { product_number: _pn, ...restForm } = formData;
      const productData = {
        ...restForm,
        reference_images: uploadedImageUrls,
        specifications: specs,
        estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : totalPriceJewelry || null,
        total_amount: totalAmount || totalPriceJewelry || null,
        ...(initialData?.product_number ? { product_number: formData.product_number } : {})
      };

      await onSubmit(productData);
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
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}>
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
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fee', color: '#c33', borderRadius: 1 }}>{error}</Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Product Details</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                {initialData?.product_number && (
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Product #: <strong>{formData.product_number}</strong>
                  </Typography>
                )}
                <TextField
                  label="Article Code"
                  name="article_code"
                  value={formData.article_code}
                  onChange={handleChange}
                  fullWidth
                  placeholder="e.g. ART-001"
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>Classification</InputLabel>
                <Select name="classification" value={formData.classification} onChange={handleChange} label="Classification">
                  <MenuItem value="Made to Order">Made to Order</MenuItem>
                </Select>
              </FormControl>
            </Paper>

            {/* Reference Images */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Reference Images</Typography>
              {uploadedImageUrls.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <ImageGallery images={uploadedImageUrls} />
                </Box>
              )}
              <ImageUploader onUpload={handleImageUpload} maxImages={10} maxSizeMB={10} disabled={isUploading || isSubmitting} />
              {isUploading && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>Uploading images...</Typography>
                </Box>
              )}
            </Paper>

            {/* Diamonds - Dynamic */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Gem size={18} /> Diamond Details
                </Typography>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={addDiamond}
                  sx={{ borderColor: '#8b6f47', color: '#8b6f47', '&:hover': { borderColor: '#6d5637', bgcolor: 'rgba(139,111,71,0.08)' } }}
                >
                  Add Diamond
                </Button>
              </Box>
              {diamonds.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#6b7280', py: 2 }}>
                  No diamonds added. Click &quot;Add Diamond&quot; to add diamond details (e.g. bracelet with 20 small diamonds).
                </Typography>
              ) : (
                diamonds.map((d, i) => (
                  <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: '#fafafa', borderRadius: 1, position: 'relative' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Diamond {i + 1}</Typography>
                      <IconButton size="small" onClick={() => removeDiamond(i)} sx={{ color: '#d32f2f' }} title="Remove diamond">
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <TextField label="Carat" type="number" value={d.carat} onChange={(e) => handleDiamondChange(i, 'carat', e.target.value)} size="small" sx={{ width: 90 }} inputProps={{ step: 0.01, min: 0 }} />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Cut</InputLabel>
                        <Select value={d.cut} onChange={(e) => handleDiamondChange(i, 'cut', e.target.value)} label="Cut">
                          <MenuItem value="">—</MenuItem>
                          {CUT_OPTIONS.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>Color</InputLabel>
                        <Select value={d.color} onChange={(e) => handleDiamondChange(i, 'color', e.target.value)} label="Color">
                          <MenuItem value="">—</MenuItem>
                          {COLOR_OPTIONS.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Clarity</InputLabel>
                        <Select value={d.clarity} onChange={(e) => handleDiamondChange(i, 'clarity', e.target.value)} label="Clarity">
                          <MenuItem value="">—</MenuItem>
                          {CLARITY_OPTIONS.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField label="Qty" type="number" value={d.quantity} onChange={(e) => handleDiamondChange(i, 'quantity', e.target.value)} size="small" sx={{ width: 70 }} inputProps={{ min: 1 }} helperText="Same specs" />
                      <TextField label="Unit Price (₹)" type="number" value={d.unit_price} onChange={(e) => handleDiamondChange(i, 'unit_price', e.target.value)} size="small" sx={{ width: 110 }} InputProps={{ startAdornment: <IndianRupee size={14} style={{ marginRight: 4 }} /> }} />
                      <TextField label="Total (₹)" type="number" value={d.total_price} disabled size="small" sx={{ width: 110 }} InputProps={{ startAdornment: <IndianRupee size={14} style={{ marginRight: 4 }} /> }} />
                    </Box>
                  </Box>
                ))
              )}
            </Paper>

            {/* Gold */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Gold Details</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField label="Karat" type="number" value={gold.karat} onChange={(e) => handleGoldChange('karat', e.target.value)} size="small" sx={{ width: 90 }} />
                <TextField label="Weight (gms)" type="number" value={gold.weight_gms} onChange={(e) => handleGoldChange('weight_gms', e.target.value)} size="small" sx={{ width: 110 }} inputProps={{ step: 0.01 }} />
                <TextField label="Price/Gram (₹)" type="number" value={gold.price_per_gram} onChange={(e) => handleGoldChange('price_per_gram', e.target.value)} size="small" sx={{ width: 130 }} InputProps={{ startAdornment: <IndianRupee size={14} style={{ marginRight: 4 }} /> }} />
                <TextField label="Total Price (₹)" type="number" value={gold.total_price} disabled size="small" sx={{ width: 120 }} InputProps={{ startAdornment: <IndianRupee size={14} style={{ marginRight: 4 }} /> }} />
                <TextField label="Other Charges (₹)" type="number" value={gold.other_charges} onChange={(e) => handleGoldChange('other_charges', e.target.value)} size="small" sx={{ width: 130 }} InputProps={{ startAdornment: <IndianRupee size={14} style={{ marginRight: 4 }} /> }} />
              </Box>
            </Paper>

            {/* Total Price for Jewelry */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total Price for Jewelry</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
                  ₹{totalPriceJewelry.toLocaleString()}
                </Typography>
              </Box>
            </Paper>

            <Divider />

            <TextField label="Description *" name="description" value={formData.description} onChange={handleChange} fullWidth multiline rows={3} required placeholder="Describe the custom product..." />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Estimated Price (₹)" name="estimated_price" type="number" value={formData.estimated_price} onChange={handleChange} fullWidth InputProps={{ startAdornment: <IndianRupee size={20} style={{ marginRight: 8, color: '#666' }} /> }} />
              <TextField label="Total Amount (₹)" name="total_amount" type="number" value={formData.total_amount} onChange={handleChange} fullWidth helperText={totalPriceJewelry > 0 ? `Calculated from diamonds + gold: ₹${totalPriceJewelry.toLocaleString()}` : ''} InputProps={{ startAdornment: <IndianRupee size={20} style={{ marginRight: 8, color: '#666' }} /> }} />
            </Box>

            {initialData && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                  {statuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting || isUploading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting || isUploading} startIcon={isSubmitting ? <CircularProgress size={16} /> : null} sx={{ bgcolor: '#8b6f47', '&:hover': { bgcolor: '#6d5637' } }}>
            {isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : initialData ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
