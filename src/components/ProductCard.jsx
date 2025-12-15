import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { formatRupees } from '../utils';

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
    item_id,
    name,
    category,
    price,
    rate,
    stock,
    stock_on_hand,
    weight,
    purity,
    image = '💎',
    brand,
    isDemified = false,
    sku,
  } = product;

  // Use the correct price and stock fields based on product type
  const finalPrice = isDemified ? (rate || price || 0) : (price || rate || 0);
  const finalStock = isDemified ? (stock_on_hand || stock || 0) : (stock || stock_on_hand || 0);
  // For demified products, use item_id instead of sku
  const productIdentifier = isDemified ? (item_id || id || sku) : id;
  const productType = isDemified ? 'demified' : 'real';

  const isOutOfStock = finalStock === 0;
  const isLowStock = finalStock < 3 && finalStock > 0;

  // Handle image display - check if it's a URL or emoji
  const isImageUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('https'));

  // Create product detail link
  const productDetailLink = `/product/${productType}/${encodeURIComponent(productIdentifier)}`;

  return (
    <div className={`product-card ${isDemified ? 'demified' : ''}`}>
      {/* Make the image clickable to view details */}
      <Link to={productDetailLink} className="product-image-link">
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
          
          {/* Overlay on hover */}
          <div className="product-overlay">
            <Eye size={20} />
            <span>View Details</span>
          </div>
        </div>
      </Link>

      <div className="product-info">
        <div className="product-category">{category}</div>
        
        {/* Make the product name clickable */}
        <Link to={productDetailLink} className="product-name-link">
          <h3 className="product-name">{name}</h3>
        </Link>

        <div className="product-details">
          {brand && isDemified && <span className="detail-badge brand">{brand}</span>}
          {purity && <span className="detail-badge">{purity}</span>}
          {weight && <span className="detail-badge">{weight}</span>}
          <span className={`stock-badge ${isLowStock ? 'low-stock' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}>
            {finalStock} in stock
          </span>
        </div>

        <div className="product-footer">
          <div className="product-price">{formatRupees(finalPrice)}</div>
          <div className="product-actions">
            <Link 
              to={productDetailLink}
              className="btn btn-outline btn-sm"
            >
              <Eye size={14} />
              View
            </Link>
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
    </div>
  );
};