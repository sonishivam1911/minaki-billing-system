import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { demistifiedProductsApi } from '../services/api';

/**
 * ProductEditModal Component
 * Modal for editing product details, especially for Zoho products
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.product - Product data to edit
 * @param {Function} props.onSave - Callback when product is saved successfully
 */
export const ProductEditModal = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({});
  const [loading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const isDemistified = product?.isDemistified;

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        rate: product.rate || product.price || 0,
        stock_on_hand: product.stock_on_hand || product.stock || 0,
        brand: product.brand || '',
        description: product.description || '',
      });
      setHasChanges(false);
    }
  }, [product]);

  // Check for changes
  useEffect(() => {
    if (!product) return;
    
    const originalData = {
      name: product.name || '',
      rate: product.rate || product.price || 0,
      stock_on_hand: product.stock_on_hand || product.stock || 0,
      brand: product.brand || '',
      description: product.description || '',
    };

    const changed = Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );
    
    setHasChanges(changed);
  }, [formData, product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSave = async () => {
    if (!product || !hasChanges) return;

    try {
      setSaveLoading(true);
      setError(null);

      if (isDemistified) {
        // Prepare updates for Zoho product
        const updates = {};
        
        // Only include changed fields
        Object.keys(formData).forEach(key => {
          const originalValue = key === 'rate' 
            ? (product.rate || product.price || 0)
            : key === 'stock_on_hand'
            ? (product.stock_on_hand || product.stock || 0)
            : (product[key] || '');
            
          if (formData[key] !== originalValue) {
            updates[key] = formData[key];
          }
        });

        if (Object.keys(updates).length > 0) {
          await demistifiedProductsApi.update(product.sku, updates);
          
          // Notify parent of successful save
          if (onSave) {
            onSave({
              ...product,
              ...updates
            });
          }
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content product-edit-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Product</h2>
            <p className="modal-subtitle">
              {isDemistified ? 'Zoho' : 'Custom'} Product • {product.sku || product.id}
            </p>
          </div>
          
          <button className="modal-close-btn" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            {/* Price */}
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                className="form-input"
                value={formData.rate || ''}
                onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            {/* Stock */}
            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input
                type="number"
                className="form-input"
                value={formData.stock_on_hand || ''}
                onChange={(e) => handleInputChange('stock_on_hand', parseInt(e.target.value) || 0)}
                min="0"
                placeholder="0"
              />
            </div>

            {/* Brand */}
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                className="form-input"
                value={formData.brand || ''}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Enter brand name"
              />
            </div>

            {/* Description */}
            <div className="form-group form-group-full">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!hasChanges || loading}
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};