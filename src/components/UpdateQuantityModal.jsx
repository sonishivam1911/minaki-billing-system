/**
 * UpdateQuantityModal - Modal for updating inventory quantity at a location
 */
import React, { useState } from 'react';
import '../styles/App.css';

const UpdateQuantityModal = ({ 
  isOpen, 
  onClose, 
  product, 
  location, 
  onUpdate 
}) => {
  const [quantityAvailable, setQuantityAvailable] = useState(
    location?.quantity_available || 0
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (quantityAvailable < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onUpdate(location.id, {
        quantity_available: quantityAvailable
      });
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Quantity</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {product && (
            <div className="update-product-info">
              <h3>{product.sku_name || product.sku}</h3>
              <p className="product-sku">SKU: {product.sku}</p>
            </div>
          )}

          {location && (
            <div className="update-location-info">
              <div className="location-badge">
                <span className="store-name">{location.store?.name}</span>
                {location.section && (
                  <span className="section-name">→ {location.section.section_name}</span>
                )}
              </div>
              <div className="current-quantities">
                <div className="qty-item">
                  <span className="qty-label">Current Available:</span>
                  <span className="qty-value">{location.quantity_available}</span>
                </div>
                {location.quantity_reserved > 0 && (
                  <div className="qty-item">
                    <span className="qty-label">Reserved:</span>
                    <span className="qty-value reserved">{location.quantity_reserved}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="update-form">
            <div className="form-group">
              <label htmlFor="quantityAvailable">New Available Quantity *</label>
              <input
                type="number"
                id="quantityAvailable"
                min="0"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(parseInt(e.target.value) || 0)}
                required
                disabled={loading}
                autoFocus
              />
              <small className="form-hint">
                Change: {quantityAvailable - (location?.quantity_available || 0) > 0 ? '+' : ''}
                {quantityAvailable - (location?.quantity_available || 0)}
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                disabled={loading || quantityAvailable === (location?.quantity_available || 0)}
              >
                {loading ? 'Updating...' : 'Update Quantity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateQuantityModal;