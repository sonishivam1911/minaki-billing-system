import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import '../styles/ShelfBox.css';

const ITEM_TYPE = 'PRODUCT';

/**
 * ShelfBox Component
 * Individual shelf/section within a store
 * Supports dropping products for inventory management
 */
const ShelfBox = ({
  section = {},
  inventory = [],
  isSelected = false,
  onClick,
  onProductDrop,
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => {
      if (onProductDrop) {
        onProductDrop(item.product, item.fromLocation, section.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const totalQuantity = inventory.reduce(
    (sum, item) => {
      // Handle both old format (item.location.quantity) and new format (item.quantity or item.location.quantity)
      const qty = item.location?.quantity || item.quantity || item.total_quantity || 0;
      return sum + qty;
    },
    0
  );

  return (
    <div
      ref={dropRef}
      className={`shelf-box ${isSelected ? 'selected' : ''} ${
        isOver ? 'drag-over' : ''
      }`}
      onClick={onClick}
    >
      <div className="shelf-header">
        <h4>{section.storage_type_name || section.shelf_name || section.name || section.type || 'Storage Type'}</h4>
        <span className="shelf-type">{section.storage_type_code || section.shelf_code || section.type || 'N/A'}</span>
      </div>

      <div className="shelf-content">
        {inventory.length === 0 ? (
          <p className="empty-shelf">📭 Empty</p>
        ) : (
          <div className="inventory-list">
            {inventory.slice(0, 3).map((item, idx) => (
              <div key={idx} className="inventory-item">
                <DraggableProduct
                  product={item.product}
                  location={item.location}
                />
              </div>
            ))}
            {inventory.length > 3 && (
              <p className="more-items">+{inventory.length - 3} more</p>
            )}
          </div>
        )}
      </div>

      <div className="shelf-footer">
        <span className="quantity-badge">{totalQuantity} units</span>
      </div>
    </div>
  );
};

/**
 * DraggableProduct Component
 * Individual product item that can be dragged and clicked to view details
 */
const DraggableProduct = ({ product = {}, location = {} }) => {
  const navigate = useNavigate();
  
  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: {
      product,
      fromLocation: location,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Get quantity from location, handling different data formats
  const quantity = location.quantity || location.total_quantity || 0;
  const productName = product.name || product.product_name || 'Product';
  const sku = product.sku || location.sku || 'N/A';
  const storageObjectCode = location.storage_object_code || location.box_code || 'N/A';
  const itemId = product.item_id || location.item_id;
  
  // Determine product type for navigation
  // product_type can be "zakya_product" or "real_jewelry"
  const productType = location.product_type || product.product_type;
  const isZakya = productType === 'zakya_product';
  const routeType = isZakya ? 'demistified' : 'real';
  
  // For zakya products, use item_id (preferred) or fallback to product_id/sku; for real jewelry, use product_id
  const productIdentifier = isZakya 
    ? (itemId || location.product_id || product.product_id || product.id || (sku !== 'N/A' ? sku : null))
    : (location.product_id || product.product_id || product.id || sku);
  
  // Create product detail link
  const productDetailLink = productIdentifier ? `/product/${routeType}/${encodeURIComponent(productIdentifier)}` : null;

  const handleClick = (e) => {
    // Prevent navigation if dragging
    if (isDragging) return;
    
    // Only navigate if we have a valid product ID
    if (productDetailLink) {
      e.stopPropagation(); // Prevent shelf click
      navigate(productDetailLink);
    }
  };

  return (
    <div
      ref={dragRef}
      className={`draggable-product ${isDragging ? 'dragging' : ''} ${productDetailLink ? 'clickable' : ''}`}
      title={`${productName} - SKU: ${sku} - Storage Object: ${storageObjectCode} - Qty: ${quantity}`}
      onClick={handleClick}
    >
      <div className="product-info">
        <div className="product-details">
          <span className="product-sku">{sku}</span>
          <span className="product-box">Storage Object: {storageObjectCode}</span>
        </div>
        <span className="product-qty">x{quantity}</span>
      </div>
    </div>
  );
};

export default ShelfBox;
