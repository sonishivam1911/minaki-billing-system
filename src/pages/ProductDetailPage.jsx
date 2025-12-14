import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  ShoppingCart, 
  Package, 
  Star, 
  Eye, 
  Truck, 
  Shield,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { LoadingSpinner, ErrorMessage } from '../components';
import { productsApi, demifiedProductsApi } from '../services/api';

/**
 * ProductDetailPage Component
 * Displays detailed view of a single product with edit capabilities
 * Handles both real (billing system) and demified (Zakya) products
 */
export const ProductDetailPage = () => {
  const { type, id } = useParams(); // type = 'real' | 'demified', id = product ID/SKU
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const isDemified = type === 'demified';
  const isReal = type === 'real';

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Decode the ID parameter since React Router gives us URL-encoded values
        // This is especially important for SKUs with special characters like "/"
        const decodedId = decodeURIComponent(id);

        let response;
        if (isDemified) {
          // Fetch Zakya product by SKU
          // The API will encode it again, so we pass the decoded value
          response = await demifiedProductsApi.getById(decodedId);
        } else {
          // Fetch real product by ID
          response = await productsApi.getById(decodedId);
        }

        setProduct(response);
        setEditedProduct(response);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (type && id) {
      fetchProduct();
    } else {
      setError('Invalid product URL');
      setLoading(false);
    }
  }, [type, id, isDemified]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setEditedProduct(product);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      if (isDemified) {
        // Update Zakya product
        const updates = {};
        
        // Compare with original and only send changed fields
        Object.keys(editedProduct).forEach(key => {
          if (editedProduct[key] !== product[key] && 
              ['name', 'rate', 'stock_on_hand', 'brand', 'description'].includes(key)) {
            updates[key] = editedProduct[key];
          }
        });

        if (Object.keys(updates).length > 0) {
          await demifiedProductsApi.update(product.sku, updates);
          // Refresh product data
          const updatedProduct = await demifiedProductsApi.getById(id);
          setProduct(updatedProduct);
          setEditedProduct(updatedProduct);
        }
      } else {
        // Update real product
        await productsApi.update(product.id, editedProduct);
        setProduct(editedProduct);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        // Call addItem with proper parameters: (productId, quantity, productData)
        // For demified products use item_id/id/sku, for real jewelry use variant_id
        const productId = isDemified || product.isDemified
          ? (product.id || product.sku)
          : (product.variant_id || product.id);
        
        console.log('🛍️ ProductDetailPage - Adding to cart:', {
          productId,
          isDemified: isDemified || product.isDemified,
          isRealJewelry: product.isRealJewelry,
          variant_id: product.variant_id,
          product
        });
        
        await addItem(productId, 1, product);
        alert('✅ Item added to cart successfully!');
      } catch (err) {
        console.error('❌ Error adding to cart:', err);
        alert(`❌ Failed to add to cart: ${err.message}`);
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out-of-stock', text: 'Out of Stock', color: '#ef4444' };
    if (stock < 3) return { status: 'low-stock', text: `Low Stock (${stock})`, color: '#f59e0b' };
    return { status: 'in-stock', text: `${stock} Available`, color: '#10b981' };
  };

  if (loading) {
    return <LoadingSpinner message="Loading product details..." />;
  }

  if (error) {
    return (
      <div className="screen-container">
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="screen-container">
        <div className="empty-state">
          <h2>Product Not Found</h2>
          <p>The requested product could not be found.</p>
          <Link to="/catalog" className="btn btn-primary">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const stockInfo = getStockStatus(product.stock || product.stock_on_hand || 0);
  const canEdit = isDemified; // Currently only allow editing Zakya products
  const isOutOfStock = (product.stock || product.stock_on_hand || 0) === 0;

  return (
    <div className="screen-container">
      {/* Header */}
      <div className="product-detail-header">
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          
          {canEdit && (
            <div className="edit-actions">
              {!isEditing ? (
                <button 
                  className="btn btn-outline"
                  onClick={handleEditToggle}
                >
                  <Edit size={16} />
                  Edit Product
                </button>
              ) : (
                <div className="edit-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    <Save size={16} />
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={handleEditToggle}
                    disabled={saveLoading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="product-breadcrumb">
          <span className="product-type">{isDemified ? 'Demified' : 'Real'} Jewelry</span>
          <span className="separator">•</span>
          <span className="product-category">{product.category || product.category_name}</span>
        </div>
      </div>

      {/* Main Product Content */}
      <div className="product-detail-content">
        <div className="product-detail-grid">
          {/* Product Image */}
          <div className="product-detail-image">
            <div className="image-container">
              {product.image && typeof product.image === 'string' && 
               (product.image.startsWith('http') || product.image.startsWith('https')) ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="product-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <div 
                className="product-icon-large" 
                style={{ 
                  display: (product.image && 
                    (product.image.startsWith('http') || product.image.startsWith('https'))) 
                    ? 'none' : 'flex' 
                }}
              >
                💎
              </div>
            </div>
            
            <div className="image-actions">
              <button className="btn btn-outline btn-sm">
                <Eye size={14} />
                View Larger
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div className="product-detail-info">
            {/* Product Title */}
            <div className="product-title-section">
              {isEditing ? (
                <input
                  type="text"
                  className="edit-title-input"
                  value={editedProduct.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Product name"
                />
              ) : (
                <h1 className="product-title">{product.name}</h1>
              )}
              
              <div className="product-meta">
                <span className="product-id">ID: {product.id || product.sku}</span>
                <span className="product-type-badge">{isDemified ? 'Zakya' : 'Custom'}</span>
              </div>
            </div>

            {/* Price */}
            <div className="product-price-section">
              {isEditing ? (
                <div className="edit-price">
                  <span className="currency">₹</span>
                  <input
                    type="number"
                    className="edit-price-input"
                    value={editedProduct.rate || editedProduct.price || ''}
                    onChange={(e) => handleInputChange(isDemified ? 'rate' : 'price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : (
                <div className="product-price">₹{(product.rate || product.price || 0).toLocaleString()}</div>
              )}
            </div>

            {/* Stock Status */}
            <div className="stock-section">
              <div className="stock-info">
                <Package size={16} style={{ color: stockInfo.color }} />
                <span style={{ color: stockInfo.color }}>{stockInfo.text}</span>
              </div>
              
              {isEditing && (
                <input
                  type="number"
                  className="edit-stock-input"
                  value={editedProduct.stock_on_hand || editedProduct.stock || ''}
                  onChange={(e) => handleInputChange(isDemified ? 'stock_on_hand' : 'stock', parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="Stock quantity"
                />
              )}
            </div>

            {/* Product Details */}
            <div className="product-attributes">
              {product.brand && (
                <div className="attribute">
                  <span className="attribute-label">Brand:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editedProduct.brand || ''}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                    />
                  ) : (
                    <span className="attribute-value">{product.brand}</span>
                  )}
                </div>
              )}
              
              {product.category && (
                <div className="attribute">
                  <span className="attribute-label">Category:</span>
                  <span className="attribute-value">{product.category}</span>
                </div>
              )}
              
              {product.purity && (
                <div className="attribute">
                  <span className="attribute-label">Purity:</span>
                  <span className="attribute-value">{product.purity}</span>
                </div>
              )}
              
              {product.weight && (
                <div className="attribute">
                  <span className="attribute-label">Weight:</span>
                  <span className="attribute-value">{product.weight}</span>
                </div>
              )}

              {product.gender && (
                <div className="attribute">
                  <span className="attribute-label">Gender:</span>
                  <span className="attribute-value">{product.gender}</span>
                </div>
              )}

              {product.work && (
                <div className="attribute">
                  <span className="attribute-label">Work:</span>
                  <span className="attribute-value">{product.work}</span>
                </div>
              )}

              {product.finish && (
                <div className="attribute">
                  <span className="attribute-label">Finish:</span>
                  <span className="attribute-value">{product.finish}</span>
                </div>
              )}

              {product.collection && (
                <div className="attribute">
                  <span className="attribute-label">Collection:</span>
                  <span className="attribute-value">{product.collection}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {(product.description || isEditing) && (
              <div className="product-description-section">
                <h3>Description</h3>
                {isEditing ? (
                  <textarea
                    className="edit-description-input"
                    value={editedProduct.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Product description"
                    rows="3"
                  />
                ) : (
                  <p className="product-description">{product.description || 'No description available.'}</p>
                )}
              </div>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="product-actions">
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart size={16} />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Trust Signals */}
            <div className="trust-signals">
              <div className="trust-item">
                <Truck size={16} />
                <span>Free Delivery</span>
              </div>
              <div className="trust-item">
                <Shield size={16} />
                <span>Authentic Guarantee</span>
              </div>
              <div className="trust-item">
                <Star size={16} />
                <span>Premium Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};