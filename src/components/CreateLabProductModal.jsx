/**
 * CreateLabProductModal - Modal for creating new lab-grown products
 * Uses /api/agent/lab-grown-diamond/create endpoint
 * Supports multiple variants, each with metal, stone, and diamond components
 */
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';

const METAL_TYPES = ['gold', 'white_gold', 'yellow_gold'];
const PURITY_OPTIONS = [24, 22, 21, 20, 18, 16, 14, 10];
const SHAPE_OPTIONS = ['round', 'princess', 'oval', 'pear', 'radiant', 'square', 'emerald', 'marquise', 'heart', 'cushion'];
const CLARITY_OPTIONS = ['VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];
const COLOR_OPTIONS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const CUT_OPTIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];
// Category options (same as jewelry_type in product detail page)
const CATEGORY_OPTIONS = ['Rings', 'Earrings', 'Bracelet', 'Necklace', 'Set'];
// Sub-category options (shown as jewelry_type dropdown)
const SUB_CATEGORY_OPTIONS = ['Studs', 'Engagement Ring', 'Band', 'Paired', 'Danglers', 'Bangle', 'Tennis Bracelet', 'With pendant', 'Without pendent'];
const FINISH_OPTIONS = ['polished', 'brushed', 'matte', 'satin', 'high-polish'];

const CreateLabProductModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    category: '',
    jewelry_type: '',
    vendor: 'MINAKI',
    product_type: '',
    finish: '',
    tags: '', // Comma-separated string
    occasions: 'weddings, engagements, special occasions',
    primary_color: '',
    secondary_color: '',
    variants: [{
      sku: '',
      weight_g: '',
      net_weight_g: '',
      purity_k: 18,
      metal_components: [{
        metal_type: 'gold',
        purity_k: 18,
        gross_weight_g: '',
        net_weight_g: '',
        metal_rate_per_g: '',
        wastage_percent: 8.0,
        making_charge_per_g: 150.0,
        making_charge_flat: 0,
        notes: ''
      }],
      diamond_components: [],
      making_charges: ''
    }]
  });
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [expandedVariants, setExpandedVariants] = useState({ 0: true });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        category: '',
        jewelry_type: '',
        vendor: 'MINAKI',
        product_type: '',
        finish: '',
        tags: '',
        occasions: 'weddings, engagements, special occasions',
        primary_color: '',
        secondary_color: '',
        variants: [{
          sku: '',
          weight_g: '',
          net_weight_g: '',
          purity_k: 18,
          metal_components: [{
            metal_type: 'gold',
            purity_k: 18,
            gross_weight_g: '',
            net_weight_g: '',
            metal_rate_per_g: '',
            wastage_percent: 8.0,
            making_charge_per_g: 150.0,
            making_charge_flat: 0,
            notes: ''
          }],
          diamond_components: [],
          making_charges: ''
        }]
      });
      setImages([]);
      setErrors({});
      setExpandedVariants({ 0: true });
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    // Required base fields
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.jewelry_type.trim()) {
      newErrors.jewelry_type = 'Jewelry type is required';
    }

    // Validate variants
    formData.variants.forEach((variant, vIndex) => {
      // Required variant fields
      // Price is calculated by backend - no validation needed
      if (!variant.net_weight_g || parseFloat(variant.net_weight_g) <= 0) {
        newErrors[`variant_${vIndex}_net_weight`] = 'Net weight is required and must be greater than 0';
      }

      // At least one metal component required
      if (!variant.metal_components || variant.metal_components.length === 0) {
        newErrors[`variant_${vIndex}_metal`] = 'At least one metal component is required';
      }

      // Validate metal components
      variant.metal_components?.forEach((metal, mIndex) => {
        if (!metal.metal_type) {
          newErrors[`variant_${vIndex}_metal_${mIndex}_type`] = 'Metal type is required';
        }
        if (!metal.purity_k) {
          newErrors[`variant_${vIndex}_metal_${mIndex}_purity`] = 'Purity is required';
        }
        if (!metal.gross_weight_g || parseFloat(metal.gross_weight_g) <= 0) {
          newErrors[`variant_${vIndex}_metal_${mIndex}_gross_weight`] = 'Gross weight must be greater than 0';
        }
        if (!metal.net_weight_g || parseFloat(metal.net_weight_g) <= 0) {
          newErrors[`variant_${vIndex}_metal_${mIndex}_net_weight`] = 'Net weight must be greater than 0';
        }
        // Metal rate per gram is calculated by backend - no validation needed
      });

      // Validate diamond components (optional but if present, must be complete)
      variant.diamond_components?.forEach((diamond, dIndex) => {
        if (!diamond.carat || parseFloat(diamond.carat) <= 0) {
          newErrors[`variant_${vIndex}_diamond_${dIndex}_carat`] = 'Carat must be greater than 0';
        }
        if (!diamond.shape) {
          newErrors[`variant_${vIndex}_diamond_${dIndex}_shape`] = 'Shape is required';
        }
        if (!diamond.stone_price_per_carat || parseFloat(diamond.stone_price_per_carat) <= 0) {
          newErrors[`variant_${vIndex}_diamond_${dIndex}_rate`] = 'Price per carat is required';
        }
      });
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleVariantChange = (vIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => 
        index === vIndex ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const handleMetalComponentChange = (vIndex, mIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, vIdx) => 
        vIdx === vIndex ? {
          ...variant,
          metal_components: variant.metal_components.map((metal, mIdx) =>
            mIdx === mIndex ? { ...metal, [field]: value } : metal
          )
        } : variant
      )
    }));

    // Clear error
    const errorKey = `variant_${vIndex}_metal_${mIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const handleDiamondComponentChange = (vIndex, dIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, vIdx) => 
        vIdx === vIndex ? {
          ...variant,
          diamond_components: variant.diamond_components.map((diamond, dIdx) =>
            dIdx === dIndex ? { ...diamond, [field]: value } : diamond
          )
        } : variant
      )
    }));

    // Clear error
    const errorKey = `variant_${vIndex}_diamond_${dIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        sku: '',
        weight_g: '',
        net_weight_g: '',
        purity_k: 18,
        metal_components: [{
          metal_type: 'gold',
          purity_k: 18,
          gross_weight_g: '',
          net_weight_g: '',
          wastage_percent: 8.0,
          making_charge_per_g: 150.0,
          making_charge_flat: 0,
          notes: ''
        }],
        diamond_components: [],
        making_charges: ''
      }]
    }));
    const newIndex = formData.variants.length;
    setExpandedVariants(prev => ({ ...prev, [newIndex]: true }));
  };

  const removeVariant = (vIndex) => {
    if (formData.variants.length === 1) {
      alert('At least one variant is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, index) => index !== vIndex)
    }));
    const newExpanded = { ...expandedVariants };
    delete newExpanded[vIndex];
    setExpandedVariants(newExpanded);
  };

  const addMetalComponent = (vIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => 
        index === vIndex ? {
          ...variant,
          metal_components: [...variant.metal_components, {
            metal_type: 'gold',
            purity_k: 18,
            gross_weight_g: '',
            net_weight_g: '',
            metal_rate_per_g: '',
            wastage_percent: 8.0,
            making_charge_per_g: 150.0,
            making_charge_flat: 0,
            notes: ''
          }]
        } : variant
      )
    }));
  };

  const removeMetalComponent = (vIndex, mIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => 
        index === vIndex ? {
          ...variant,
          metal_components: variant.metal_components.filter((_, mIdx) => mIdx !== mIndex)
        } : variant
      )
    }));
  };

  const addDiamondComponent = (vIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => 
        index === vIndex ? {
          ...variant,
          diamond_components: [...variant.diamond_components, {
            carat: '',
            shape: 'round',
            cut: '',
            clarity: '',
            color_grade: '',
            cert_no: '',
            stone_price_per_carat: '',
            origin: 'lab_grown',
            notes: ''
          }]
        } : variant
      )
    }));
  };

  const removeDiamondComponent = (vIndex, dIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, index) => 
        index === vIndex ? {
          ...variant,
          diamond_components: variant.diamond_components.filter((_, dIdx) => dIdx !== dIndex)
        } : variant
      )
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select valid image files');
      return;
    }

    setImages(prev => [...prev, ...imageFiles]);
    e.target.value = ''; // Reset input
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleVariant = (vIndex) => {
    setExpandedVariants(prev => ({
      ...prev,
      [vIndex]: !prev[vIndex]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Process tags: split by comma and trim
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare variants_json according to API structure
      const variantsJson = formData.variants.map(variant => ({
        ...(variant.sku && { sku: variant.sku }),
        // Price is calculated by backend - not sent in request
        ...(variant.weight_g && { weight_g: parseFloat(variant.weight_g) }),
        net_weight_g: parseFloat(variant.net_weight_g),
        ...(variant.purity_k && { purity_k: parseFloat(variant.purity_k) }),
        metal_components: variant.metal_components.map(metal => ({
          metal_type: metal.metal_type,
          purity_k: parseFloat(metal.purity_k),
          gross_weight_g: parseFloat(metal.gross_weight_g),
          net_weight_g: parseFloat(metal.net_weight_g),
          // metal_rate_per_g is calculated by backend based on metal_type and purity_k
          ...(metal.wastage_percent && { wastage_percent: parseFloat(metal.wastage_percent) }),
          ...(metal.making_charge_per_g && { making_charge_per_g: parseFloat(metal.making_charge_per_g) }),
          ...(metal.making_charge_flat && { making_charge_flat: parseFloat(metal.making_charge_flat) }),
          ...(metal.notes && { notes: metal.notes })
        })),
        diamond_components: variant.diamond_components.map(diamond => ({
          carat: parseFloat(diamond.carat),
          shape: diamond.shape,
          ...(diamond.cut && { cut: diamond.cut }),
          ...(diamond.clarity && { clarity: diamond.clarity }),
          ...(diamond.color_grade && { color_grade: diamond.color_grade }),
          ...(diamond.cert_no && { cert_no: diamond.cert_no }),
          stone_price_per_carat: parseFloat(diamond.stone_price_per_carat),
          ...(diamond.origin && { origin: diamond.origin }),
          ...(diamond.notes && { notes: diamond.notes })
        }))
      }));

      // Prepare product data for API
      const productData = {
        category: formData.category,
        jewelry_type: formData.jewelry_type,
        ...(formData.vendor && { vendor: formData.vendor }),
        ...(formData.product_type && { product_type: formData.product_type }),
        ...(formData.finish && { finish: formData.finish }),
        ...(tagsArray.length > 0 && { tags: tagsArray }),
        ...(formData.occasions && { occasions: formData.occasions }),
        ...(formData.primary_color && { primary_color: formData.primary_color }),
        ...(formData.secondary_color && { secondary_color: formData.secondary_color }),
        variants_json: variantsJson
      };

      await onSubmit(productData, images);
      
      // Reset form
      setFormData({
        category: '',
        jewelry_type: '',
        vendor: 'MINAKI',
        product_type: '',
        finish: '',
        tags: '',
        occasions: 'weddings, engagements, special occasions',
        primary_color: '',
        secondary_color: '',
        variants: [{
          sku: '',
          weight_g: '',
          net_weight_g: '',
          purity_k: 18,
          metal_components: [{
            metal_type: 'gold',
            purity_k: 18,
            gross_weight_g: '',
            net_weight_g: '',
            metal_rate_per_g: '',
            wastage_percent: 8.0,
            making_charge_per_g: 150.0,
            making_charge_flat: 0,
            notes: ''
          }],
          diamond_components: [],
          making_charges: ''
        }]
      });
      setImages([]);
      setErrors({});
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setErrors({ submit: err.message || 'Failed to create product' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-lab-product-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2>💍 Create Lab Grown Product</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* Product Details Section */}
          <div className="form-section">
            <h3>Product Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={errors.category ? 'input-error' : ''}
                >
                  <option value="">Select Category</option>
                  {CATEGORY_OPTIONS.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="jewelry_type">Jewelry Type (Sub Category) *</label>
                <select
                  id="jewelry_type"
                  name="jewelry_type"
                  value={formData.jewelry_type}
                  onChange={handleChange}
                  className={errors.jewelry_type ? 'input-error' : ''}
                >
                  <option value="">Select Sub Category</option>
                  {SUB_CATEGORY_OPTIONS.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.jewelry_type && <span className="error-text">{errors.jewelry_type}</span>}
                <small>Sub-category for the selected category</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vendor">Vendor</label>
                <input
                  id="vendor"
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  placeholder="e.g., MINAKI"
                />
                <small>Default: MINAKI</small>
              </div>

              <div className="form-group">
                <label htmlFor="product_type">Product Type</label>
                <input
                  id="product_type"
                  type="text"
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleChange}
                  placeholder="e.g., solitaire, cluster, halo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="finish">Finish</label>
                <select
                  id="finish"
                  name="finish"
                  value={formData.finish}
                  onChange={handleChange}
                >
                  <option value="">Select Finish</option>
                  {FINISH_OPTIONS.map(finish => (
                    <option key={finish} value={finish}>
                      {finish.charAt(0).toUpperCase() + finish.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  id="tags"
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g., gold, ring, lab-grown (comma-separated)"
                />
                <small>Separate tags with commas. Each tag will be created automatically.</small>
              </div>
            </div>
          </div>

          {/* AI Generation Fields Section */}
          <div className="form-section">
            <h3>AI Generation Fields (Optional)</h3>
            <small>These fields help AI generate unique product names and descriptions</small>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="occasions">Occasions</label>
                <input
                  id="occasions"
                  type="text"
                  name="occasions"
                  value={formData.occasions}
                  onChange={handleChange}
                  placeholder="e.g., weddings, engagements, special occasions"
                />
                <small>Default: weddings, engagements, special occasions</small>
              </div>

              <div className="form-group">
                <label htmlFor="primary_color">Primary Color</label>
                <input
                  id="primary_color"
                  type="text"
                  name="primary_color"
                  value={formData.primary_color}
                  onChange={handleChange}
                  placeholder="e.g., white, yellow, rose"
                />
              </div>

              <div className="form-group">
                <label htmlFor="secondary_color">Secondary Color</label>
                <input
                  id="secondary_color"
                  type="text"
                  name="secondary_color"
                  value={formData.secondary_color}
                  onChange={handleChange}
                  placeholder="e.g., white, yellow, rose"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="form-section">
            <h3>Product Images</h3>
            <div className="form-group">
              <label htmlFor="images">Upload Images (Multiple)</label>
              <div className="image-upload-area">
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <label htmlFor="images" className="file-input-label">
                  <Upload size={20} />
                  <span>Click to upload or drag and drop</span>
                  <small>PNG, JPG, GIF up to 10MB each</small>
                </label>
              </div>
              
              {images.length > 0 && (
                <div className="image-preview-grid">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Variants Section */}
          <div className="form-section">
            <div className="section-header-with-action">
              <h3>Variants</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addVariant}
              >
                <Plus size={16} /> Add Variant
              </button>
            </div>
            <small>Each SKU can have multiple variants. Each variant needs metal and diamond components.</small>

            {formData.variants.map((variant, vIndex) => (
              <div key={vIndex} className="variant-card">
                <div className="variant-header" onClick={() => toggleVariant(vIndex)}>
                  <h4>Variant {vIndex + 1}</h4>
                  <div className="variant-actions">
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVariant(vIndex);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <span>{expandedVariants[vIndex] ? '▼' : '▶'}</span>
                  </div>
                </div>

                {expandedVariants[vIndex] && (
                  <div className="variant-content">
                    {/* Variant Basic Info */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>SKU (Optional)</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(vIndex, 'sku', e.target.value)}
                          placeholder="e.g., LGD-RING-001-18K"
                        />
                      </div>

                      <div className="form-group">
                        <label>Net Weight (g) *</label>
                        <input
                          type="number"
                          value={variant.net_weight_g}
                          onChange={(e) => handleVariantChange(vIndex, 'net_weight_g', e.target.value)}
                          placeholder="e.g., 3.50"
                          step="0.01"
                          className={errors[`variant_${vIndex}_net_weight`] ? 'input-error' : ''}
                        />
                        {errors[`variant_${vIndex}_net_weight`] && (
                          <span className="error-text">{errors[`variant_${vIndex}_net_weight`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Weight (g) - Optional</label>
                        <input
                          type="number"
                          value={variant.weight_g}
                          onChange={(e) => handleVariantChange(vIndex, 'weight_g', e.target.value)}
                          placeholder="e.g., 3.80"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Metal Components */}
                    <div className="components-section">
                      <div className="components-header">
                        <h5>Metal Components</h5>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => addMetalComponent(vIndex)}
                        >
                          <Plus size={14} /> Add Metal
                        </button>
                      </div>
                      {errors[`variant_${vIndex}_metal`] && (
                        <span className="error-text">{errors[`variant_${vIndex}_metal`]}</span>
                      )}
                      
                      {variant.metal_components.map((metal, mIndex) => (
                        <div key={mIndex} className="component-item">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Metal Type *</label>
                              <select
                                value={metal.metal_type}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'metal_type', e.target.value)}
                                className={errors[`variant_${vIndex}_metal_${mIndex}_type`] ? 'input-error' : ''}
                              >
                                {METAL_TYPES.map(type => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </option>
                                ))}
                              </select>
                              {errors[`variant_${vIndex}_metal_${mIndex}_type`] && (
                                <span className="error-text">{errors[`variant_${vIndex}_metal_${mIndex}_type`]}</span>
                              )}
                            </div>

                            <div className="form-group">
                              <label>Purity (K) *</label>
                              <select
                                value={metal.purity_k}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'purity_k', parseFloat(e.target.value))}
                                className={errors[`variant_${vIndex}_metal_${mIndex}_purity`] ? 'input-error' : ''}
                              >
                                {PURITY_OPTIONS.map(purity => (
                                  <option key={purity} value={purity}>{purity}K</option>
                                ))}
                              </select>
                              {errors[`variant_${vIndex}_metal_${mIndex}_purity`] && (
                                <span className="error-text">{errors[`variant_${vIndex}_metal_${mIndex}_purity`]}</span>
                              )}
                            </div>

                            <div className="form-group">
                              <label>Gross Weight (g) *</label>
                              <input
                                type="number"
                                value={metal.gross_weight_g}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'gross_weight_g', e.target.value)}
                                placeholder="e.g., 3.80"
                                step="0.01"
                                className={errors[`variant_${vIndex}_metal_${mIndex}_gross_weight`] ? 'input-error' : ''}
                              />
                              {errors[`variant_${vIndex}_metal_${mIndex}_gross_weight`] && (
                                <span className="error-text">{errors[`variant_${vIndex}_metal_${mIndex}_gross_weight`]}</span>
                              )}
                            </div>

                            <div className="form-group">
                              <label>Net Weight (g) *</label>
                              <input
                                type="number"
                                value={metal.net_weight_g}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'net_weight_g', e.target.value)}
                                placeholder="e.g., 3.50"
                                step="0.01"
                                className={errors[`variant_${vIndex}_metal_${mIndex}_net_weight`] ? 'input-error' : ''}
                              />
                              {errors[`variant_${vIndex}_metal_${mIndex}_net_weight`] && (
                                <span className="error-text">{errors[`variant_${vIndex}_metal_${mIndex}_net_weight`]}</span>
                              )}
                            </div>

                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Wastage %</label>
                              <input
                                type="number"
                                value={metal.wastage_percent}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'wastage_percent', parseFloat(e.target.value))}
                                placeholder="e.g., 8.0"
                                step="0.1"
                              />
                              <small>Default: 8.0%</small>
                            </div>

                            <div className="form-group">
                              <label>Making Charge per Gram (₹)</label>
                              <input
                                type="number"
                                value={metal.making_charge_per_g}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'making_charge_per_g', parseFloat(e.target.value))}
                                placeholder="e.g., 150"
                                step="0.01"
                              />
                              <small>Default: ₹150</small>
                            </div>

                            <div className="form-group">
                              <label>Flat Making Charge (₹)</label>
                              <input
                                type="number"
                                value={metal.making_charge_flat}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'making_charge_flat', parseFloat(e.target.value))}
                                placeholder="e.g., 0"
                                step="0.01"
                              />
                              <small>Default: ₹0</small>
                            </div>

                            <div className="form-group">
                              <label>Notes</label>
                              <input
                                type="text"
                                value={metal.notes}
                                onChange={(e) => handleMetalComponentChange(vIndex, mIndex, 'notes', e.target.value)}
                                placeholder="Optional notes"
                              />
                            </div>

                            {variant.metal_components.length > 1 && (
                              <div className="form-group">
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => removeMetalComponent(vIndex, mIndex)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Diamond/Stone Components */}
                    <div className="components-section">
                      <div className="components-header">
                        <h5>Diamond/Stone Components</h5>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => addDiamondComponent(vIndex)}
                        >
                          <Plus size={14} /> Add Stone/Diamond
                        </button>
                      </div>

                      {variant.diamond_components.length === 0 ? (
                        <p className="no-components">No stone/diamond components added. Click "Add Stone/Diamond" to add.</p>
                      ) : (
                        variant.diamond_components.map((diamond, dIndex) => (
                          <div key={dIndex} className="component-item">
                            <div className="form-row">
                              <div className="form-group">
                                <label>Carat *</label>
                                <input
                                  type="number"
                                  value={diamond.carat}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'carat', e.target.value)}
                                  placeholder="e.g., 0.50"
                                  step="0.01"
                                  className={errors[`variant_${vIndex}_diamond_${dIndex}_carat`] ? 'input-error' : ''}
                                />
                                {errors[`variant_${vIndex}_diamond_${dIndex}_carat`] && (
                                  <span className="error-text">{errors[`variant_${vIndex}_diamond_${dIndex}_carat`]}</span>
                                )}
                              </div>

                              <div className="form-group">
                                <label>Shape *</label>
                                <select
                                  value={diamond.shape}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'shape', e.target.value)}
                                  className={errors[`variant_${vIndex}_diamond_${dIndex}_shape`] ? 'input-error' : ''}
                                >
                                  <option value="">Select Shape</option>
                                  {SHAPE_OPTIONS.map(shape => (
                                    <option key={shape} value={shape}>
                                      {shape.charAt(0).toUpperCase() + shape.slice(1)}
                                    </option>
                                  ))}
                                </select>
                                {errors[`variant_${vIndex}_diamond_${dIndex}_shape`] && (
                                  <span className="error-text">{errors[`variant_${vIndex}_diamond_${dIndex}_shape`]}</span>
                                )}
                              </div>

                              <div className="form-group">
                                <label>Cut Grade</label>
                                <select
                                  value={diamond.cut}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'cut', e.target.value)}
                                >
                                  <option value="">Select Cut</option>
                                  {CUT_OPTIONS.map(cut => (
                                    <option key={cut} value={cut}>{cut}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group">
                                <label>Clarity</label>
                                <select
                                  value={diamond.clarity}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'clarity', e.target.value)}
                                >
                                  <option value="">Select Clarity</option>
                                  {CLARITY_OPTIONS.map(clarity => (
                                    <option key={clarity} value={clarity}>{clarity}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="form-group">
                                <label>Color Grade</label>
                                <select
                                  value={diamond.color_grade}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'color_grade', e.target.value)}
                                >
                                  <option value="">Select Color</option>
                                  {COLOR_OPTIONS.map(color => (
                                    <option key={color} value={color}>{color}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="form-row">
                              <div className="form-group">
                                <label>Certificate #</label>
                                <input
                                  type="text"
                                  value={diamond.cert_no}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'cert_no', e.target.value)}
                                  placeholder="e.g., GIA12345"
                                />
                              </div>

                              <div className="form-group">
                                <label>Price per Carat (₹) *</label>
                                <input
                                  type="number"
                                  value={diamond.stone_price_per_carat}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'stone_price_per_carat', e.target.value)}
                                  placeholder="e.g., 120000"
                                  step="0.01"
                                  className={errors[`variant_${vIndex}_diamond_${dIndex}_rate`] ? 'input-error' : ''}
                                />
                                {errors[`variant_${vIndex}_diamond_${dIndex}_rate`] && (
                                  <span className="error-text">{errors[`variant_${vIndex}_diamond_${dIndex}_rate`]}</span>
                                )}
                              </div>

                              <div className="form-group">
                                <label>Origin</label>
                                <select
                                  value={diamond.origin}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'origin', e.target.value)}
                                >
                                  <option value="lab_grown">Lab Grown</option>
                                  <option value="natural">Natural</option>
                                </select>
                                <small>Default: lab_grown</small>
                              </div>

                              <div className="form-group">
                                <label>Notes</label>
                                <input
                                  type="text"
                                  value={diamond.notes}
                                  onChange={(e) => handleDiamondComponentChange(vIndex, dIndex, 'notes', e.target.value)}
                                  placeholder="Optional notes"
                                />
                              </div>

                              <div className="form-group">
                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => removeDiamondComponent(vIndex, dIndex)}
                                >
                                  <Trash2 size={16} /> Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLabProductModal;
