/**
 * TransferStockModal - Modal for transferring stock between locations
 */
import React, { useState, useEffect } from 'react';
import '../styles/App.css';

const TransferStockModal = ({ 
  isOpen, 
  onClose, 
  product, 
  fromLocation, 
  stores = [],
  sections = [],
  onTransfer 
}) => {
  const [toStoreId, setToStoreId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availableSections, setAvailableSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (toStoreId) {
      const filtered = sections.filter(s => s.store_id === parseInt(toStoreId));
      setAvailableSections(filtered);
      setToSectionId('');
    } else {
      setAvailableSections([]);
    }
  }, [toStoreId, sections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!toStoreId || !toSectionId || quantity <= 0) {
      setError('Please fill in all fields');
      return;
    }

    const maxQuantity = fromLocation?.quantity_available || 0;
    if (quantity > maxQuantity) {
      setError(`Maximum available quantity is ${maxQuantity}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onTransfer({
        variant_id: product.id,
        from_location_id: fromLocation.id,
        to_store_id: parseInt(toStoreId),
        to_section_id: parseInt(toSectionId),
        quantity: quantity,
        movement_type: 'transfer'
      });
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const maxQuantity = fromLocation?.quantity_available || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transfer Stock</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {product && (
            <div className="transfer-product-info">
              <h3>{product.sku_name || product.sku}</h3>
              <p className="product-sku">SKU: {product.sku}</p>
            </div>
          )}

          {fromLocation && (
            <div className="transfer-from-info">
              <h4>From Location</h4>
              <div className="location-badge">
                <span className="store-name">{fromLocation.store?.name}</span>
                {fromLocation.section && (
                  <span className="section-name">→ {fromLocation.section.section_name}</span>
                )}
              </div>
              <p className="available-qty">
                Available: <strong>{maxQuantity} pieces</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="transfer-form">
            <div className="form-group">
              <label htmlFor="toStore">To Store *</label>
              <select
                id="toStore"
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">Select Store</option>
                {stores.filter(s => s.is_active).map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="toSection">To Section *</label>
              <select
                id="toSection"
                value={toSectionId}
                onChange={(e) => setToSectionId(e.target.value)}
                required
                disabled={loading || !toStoreId}
              >
                <option value="">Select Section</option>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.section_name} ({section.section_type || 'general'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
                disabled={loading}
              />
              <small>Max: {maxQuantity} pieces</small>
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
                disabled={loading || !toStoreId || !toSectionId || quantity <= 0}
              >
                {loading ? 'Transferring...' : `Transfer ${quantity} piece${quantity !== 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferStockModal;