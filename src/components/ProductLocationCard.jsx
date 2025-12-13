import React from 'react';
import '../styles/ProductLocationCard.css';

/**
 * ProductLocationCard Component
 * Displays a single product and all its locations
 * 
 * Props:
 * - product: Product details (name, sku, image, etc.)
 * - locations: Array of locations where this product is stored
 * - onTransfer: Callback when transfer button is clicked
 * - onUpdateQuantity: Callback when update quantity button is clicked
 */
const ProductLocationCard = ({ 
  product = {}, 
  locations = [], 
  onTransfer,
  onUpdateQuantity 
}) => {
  const handleTransfer = (location) => {
    if (onTransfer) {
      onTransfer(location);
    }
  };

  const handleUpdateQuantity = (location) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(location);
    }
  };

  const totalQuantity = locations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);

  return (
    <div className="product-location-card">
      <div className="card-header">
        <div className="product-info">
          <div className="product-image">
            {product.image || '💍'}
          </div>
          <div className="product-details">
            <h3 className="product-name">{product.name || 'Unknown Product'}</h3>
            <p className="product-sku">SKU: {product.sku || 'N/A'}</p>
            <p className="product-price">
              ₹{parseFloat(product.price || 0).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="product-summary">
          <span className="total-quantity">
            Total: <strong>{totalQuantity}</strong> units
          </span>
        </div>
      </div>

      <div className="locations-list">
        <h4>Locations:</h4>
        {locations.length === 0 ? (
          <p className="no-locations">No locations found</p>
        ) : (
          <table className="locations-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Section</th>
                <th>Box</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, idx) => (
                <tr key={location.id || idx}>
                  <td>{location.store_name || location.store?.name || 'N/A'}</td>
                  <td>{location.section_type || location.section?.type || 'N/A'}</td>
                  <td>{location.box_code || location.box?.code || 'N/A'}</td>
                  <td className="quantity">
                    <strong>{location.quantity || 0}</strong>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-small btn-transfer"
                      onClick={() => handleTransfer(location)}
                      title="Transfer to another location"
                    >
                      ↔️ Transfer
                    </button>
                    <button
                      className="btn-small btn-update"
                      onClick={() => handleUpdateQuantity(location)}
                      title="Update quantity"
                    >
                      📝 Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductLocationCard;
