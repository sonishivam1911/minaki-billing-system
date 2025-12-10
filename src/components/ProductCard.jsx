import React from 'react';

/**
 * ProductCard Component
 * Displays a single product with details and add to cart button
 * 
 * @param {Object} props
 * @param {Object} props.product - Product data
 * @param {Function} props.onAddToCart - Callback when add to cart is clicked
 */
export const ProductCard = ({ product, onAddToCart }) => {
  const {
    id,
    name,
    category,
    price,
    stock,
    weight,
    purity,
    image = '💎',
    brand,
    isDemified = false,
  } = product;

  const isOutOfStock = stock === 0;
  const isLowStock = stock < 3 && stock > 0;

  // Handle image display - check if it's a URL or emoji
  const isImageUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('https'));

  return (
    <div className={`product-card ${isDemified ? 'demified' : ''}`}>
      <div className="product-image">
        {isImageUrl ? (
          <img 
            src={image} 
            alt={name} 
            className="product-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <div className="product-icon" style={{ display: isImageUrl ? 'none' : 'block' }}>
          {isImageUrl ? '💎' : image}
        </div>
      </div>

      <div className="product-info">
        <div className="product-category">{category}</div>
        <h3 className="product-name">{name}</h3>

        <div className="product-details">
          {brand && isDemified && <span className="detail-badge brand">{brand}</span>}
          {purity && <span className="detail-badge">{purity}</span>}
          {weight && <span className="detail-badge">{weight}</span>}
          <span className={`stock-badge ${isLowStock ? 'low-stock' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}>
            {stock} in stock
          </span>
        </div>

        <div className="product-footer">
          <div className="product-price">₹{price.toLocaleString()}</div>
          <button
            className="btn-add-cart"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};