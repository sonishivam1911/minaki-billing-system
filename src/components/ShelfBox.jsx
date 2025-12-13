import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
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
    (sum, item) => sum + (item.location?.quantity || 0),
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
        <h4>{section.name || section.type || 'Shelf'}</h4>
        <span className="shelf-type">{section.type || 'N/A'}</span>
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
 * Individual product item that can be dragged
 */
const DraggableProduct = ({ product = {}, location = {} }) => {
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

  return (
    <div
      ref={dragRef}
      className={`draggable-product ${isDragging ? 'dragging' : ''}`}
      title={`${product.name || 'Product'} - Qty: ${location.quantity || 0}`}
    >
      <span className="product-image">{product.image || '💍'}</span>
      <span className="product-name">
        {product.name?.substring(0, 15) || 'Product'}
      </span>
      <span className="product-qty">x{location.quantity || 0}</span>
    </div>
  );
};

export default ShelfBox;
