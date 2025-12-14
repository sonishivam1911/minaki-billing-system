/**
 * BoxProductsModal - Modal to display all products in a box in table format
 * Shows product details without images
 */
import React from 'react';
import '../styles/BoxProductsModal.css';

const BoxProductsModal = ({ 
  isOpen, 
  onClose, 
  boxName,
  boxCode,
  products = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content box-products-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>📦 {boxName || 'Box'}</h2>
            {boxCode && <p className="box-code-text">{boxCode}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {products.length === 0 ? (
            <div className="empty-products">
              <p>📭 No products in this box</p>
            </div>
          ) : (
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Product Type</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => {
                    const sku = product.sku || 'N/A';
                    const productName = product.product_name || product.name || 'Product';
                    const productType = product.product_type || 'N/A';
                    const quantity = product.quantity || product.total_quantity || 0;
                    
                    return (
                      <tr key={idx}>
                        <td className="sku-cell">{sku}</td>
                        <td className="name-cell">{productName}</td>
                        <td className="type-cell">
                          <span className="type-badge">
                            {productType === 'real_jewelry' ? 'Real Jewelry' : 
                             productType === 'zakya_product' ? 'Zakya Product' : 
                             productType}
                          </span>
                        </td>
                        <td className="quantity-cell">{quantity}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">Total Items:</td>
                    <td className="total-value">{products.length}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="total-label">Total Quantity:</td>
                    <td className="total-value">
                      {products.reduce((sum, p) => sum + (p.quantity || p.total_quantity || 0), 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoxProductsModal;

