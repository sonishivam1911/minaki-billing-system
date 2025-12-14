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
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  Gem
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
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    variant: true,
    metal: true,
    stones: true,
    pricing: true
  });

  const isDemified = type === 'demified';
  const isReal = type === 'real';

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const decodedId = decodeURIComponent(id);

        let response;
        if (isDemified) {
          response = await demifiedProductsApi.getById(decodedId);
        } else {
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
      setEditedProduct(product);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      if (isDemified) {
        const updates = {};
        Object.keys(editedProduct).forEach(key => {
          if (editedProduct[key] !== product[key] && 
              ['name', 'rate', 'stock_on_hand', 'brand', 'description'].includes(key)) {
            updates[key] = editedProduct[key];
          }
        });

        if (Object.keys(updates).length > 0) {
          await demifiedProductsApi.update(product.sku, updates);
          const updatedProduct = await demifiedProductsApi.getById(id);
          setProduct(updatedProduct);
          setEditedProduct(updatedProduct);
        }
      } else {
        // Update real product - need to structure the update properly
        await productsApi.update(product.id, editedProduct);
        const updatedProduct = await productsApi.getById(id);
        setProduct(updatedProduct);
        setEditedProduct(updatedProduct);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInputChange = (field, value, nestedPath = null) => {
    setEditedProduct(prev => {
      if (nestedPath) {
        const parts = nestedPath.split('.');
        const newValue = JSON.parse(JSON.stringify(prev)); // Deep clone
        
        if (parts[0] === 'metal_components' || parts[0] === 'diamond_components') {
          if (!newValue[parts[0]]) {
            newValue[parts[0]] = [];
          }
          newValue[parts[0]] = [...newValue[parts[0]]];
          if (!newValue[parts[0]][parseInt(parts[1])]) {
            newValue[parts[0]][parseInt(parts[1])] = {};
          }
          newValue[parts[0]][parseInt(parts[1])] = {
            ...newValue[parts[0]][parseInt(parts[1])],
            [parts[2]]: value
          };
        } else if (parts[0] === 'pricing_breakdown') {
          newValue.pricing_breakdown = {
            ...(newValue.pricing_breakdown || {}),
            [parts[1]]: value
          };
        }
        return newValue;
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        const productId = isDemified || product.isDemified
          ? (product.id || product.sku)
          : (product.variant_id || product.id);
        
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

  const calculateCostPer10gm = (metalComponent) => {
    if (!metalComponent.weight_g || parseFloat(metalComponent.weight_g) === 0) return 0;
    const costPerGm = parseFloat(metalComponent.metal_cost) / parseFloat(metalComponent.weight_g);
    return costPerGm * 10;
  };

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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
  const canEdit = isReal || isDemified; // Allow editing for both types
  const isOutOfStock = (product.stock || product.stock_on_hand || 0) === 0;
  const metalComponents = editedProduct.metal_components || product.metal_components || [];
  const diamondComponents = editedProduct.diamond_components || product.diamond_components || [];
  const pricingBreakdown = editedProduct.pricing_breakdown || product.pricing_breakdown || {};

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
        {/* Product Image and Basic Info */}
        <div className="product-detail-grid">
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
          </div>

          <div className="product-detail-info">
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

            <div className="product-price-section">
              {isEditing ? (
                <div className="edit-price">
                  <span className="currency">₹</span>
                  <input
                    type="number"
                    className="edit-price-input"
                    value={editedProduct.rate || editedProduct.price || editedProduct.final_price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : (
                <div className="product-price">
                  ₹{formatCurrency(product.final_price || product.price || product.rate || 0)}
                </div>
              )}
            </div>

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
          </div>
        </div>

        {/* Detailed Sections - Only for Real Products */}
        {isReal && (
          <div className="product-detail-sections">
            {/* Section 1: Product Basic Information */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('basic')}>
                <h2>Product Details</h2>
                {expandedSections.basic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.basic && (
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Title</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.name}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Handle/SKU</label>
                      <span className="read-only">{product.handle || product.sku || 'N/A'}</span>
                    </div>
                    <div className="info-item full-width">
                      <label>Description</label>
                      {isEditing ? (
                        <textarea
                          value={editedProduct.description || ''}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className="form-textarea"
                          rows="3"
                        />
                      ) : (
                        <span>{product.description || 'No description'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Vendor</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.vendor || ''}
                          onChange={(e) => handleInputChange('vendor', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.vendor || 'N/A'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Product Type</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.category || ''}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.category || 'N/A'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Tags</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editedProduct.tags || []).join(', ')}
                          onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()))}
                          className="form-input"
                          placeholder="tag1, tag2, tag3"
                        />
                      ) : (
                        <span>{(product.tags || []).join(', ') || 'No tags'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Status</label>
                      {isEditing ? (
                        <select
                          value={editedProduct.is_active ? 'active' : 'inactive'}
                          onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                          className="form-select"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Variant Information */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('variant')}>
                <h2>Variant Details</h2>
                {expandedSections.variant ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.variant && (
                <div className="section-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Variant ID</label>
                      <span className="read-only">{product.variant_id || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>SKU</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.sku || ''}
                          onChange={(e) => handleInputChange('sku', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.sku || 'N/A'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>SKU Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.sku_name || ''}
                          onChange={(e) => handleInputChange('sku_name', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.sku_name || 'N/A'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Barcode</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.barcode || ''}
                          onChange={(e) => handleInputChange('barcode', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.barcode || 'N/A'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Status</label>
                      {isEditing ? (
                        <select
                          value={editedProduct.variant_status || editedProduct.status || 'active'}
                          onChange={(e) => handleInputChange('variant_status', e.target.value)}
                          className="form-select"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${(product.variant_status || product.status) === 'active' ? 'active' : 'inactive'}`}>
                          {product.variant_status || product.status || 'N/A'}
                        </span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Price (₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedProduct.price || ''}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>₹{formatCurrency(product.price || 0)}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Weight (g)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedProduct.weight || ''}
                          onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>{product.weight || 0}g</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Net Weight (g)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedProduct.net_weight || ''}
                          onChange={(e) => handleInputChange('net_weight', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>{product.net_weight || 0}g</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Purity (K)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedProduct.purity_k || ''}
                          onChange={(e) => handleInputChange('purity_k', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>{product.purity_k || product.purity || 'N/A'}</span>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Track Serials</label>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editedProduct.track_serials || false}
                          onChange={(e) => handleInputChange('track_serials', e.target.checked)}
                          className="form-checkbox"
                        />
                      ) : (
                        <span>{product.track_serials ? 'Yes' : 'No'}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Metal Components */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('metal')}>
                <h2><Award size={18} /> Metal Components</h2>
                {expandedSections.metal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.metal && (
                <div className="section-content">
                  {metalComponents.length > 0 ? (
                    <div className="components-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Metal Type</th>
                            <th>Purity (K)</th>
                            <th>Weight (g)</th>
                            <th>Rate/Gram (₹)</th>
                            <th>Metal Cost (₹)</th>
                            <th>Cost/10gm (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metalComponents.map((metal, index) => {
                            const costPer10gm = calculateCostPer10gm(metal);
                            const isGold = metal.metal_type && (
                              metal.metal_type.includes('gold') || 
                              metal.metal_type === 'yellow_gold' || 
                              metal.metal_type === 'white_gold' || 
                              metal.metal_type === 'rose_gold'
                            );
                            
                            return (
                              <tr key={metal.id || index}>
                                <td>
                                  {isEditing ? (
                                    <select
                                      value={metal.metal_type || ''}
                                      onChange={(e) => handleInputChange('', e.target.value, `metal_components.${index}.metal_type`)}
                                      className="form-select"
                                    >
                                      <option value="white_gold">White Gold</option>
                                      <option value="yellow_gold">Yellow Gold</option>
                                      <option value="rose_gold">Rose Gold</option>
                                      <option value="platinum">Platinum</option>
                                      <option value="silver">Silver</option>
                                    </select>
                                  ) : (
                                    <span className="metal-type-badge">{metal.metal_type || 'N/A'}</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={metal.purity_k || ''}
                                      onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `metal_components.${index}.purity_k`)}
                                      className="form-input table-input"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span>{metal.purity_k || 'N/A'}K</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={metal.weight_g || ''}
                                      onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `metal_components.${index}.weight_g`)}
                                      className="form-input table-input"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span>{metal.weight_g || 0}g</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={metal.rate_per_g || ''}
                                      onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `metal_components.${index}.rate_per_g`)}
                                      className="form-input table-input"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span>₹{formatCurrency(metal.rate_per_g || 0)}</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={metal.metal_cost || ''}
                                      onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `metal_components.${index}.metal_cost`)}
                                      className="form-input table-input"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span>₹{formatCurrency(metal.metal_cost || 0)}</span>
                                  )}
                                </td>
                                <td>
                                  <span className={isGold ? 'cost-per-10gm highlight' : 'cost-per-10gm'}>
                                    ₹{formatCurrency(costPer10gm)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No metal components</p>
                  )}
                </div>
              )}
              </div>
              
            {/* Section 4: Diamond/Stone Components */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('stones')}>
                <h2><Gem size={18} /> Diamond & Stone Components</h2>
                {expandedSections.stones ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.stones && (
                <div className="section-content">
                  {diamondComponents.length > 0 ? (
                    <div className="components-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Stone Type</th>
                            <th>Quantity</th>
                            <th>Carat Weight</th>
                            <th>Clarity</th>
                            <th>Color</th>
                            <th>Cut Grade</th>
                            <th>Shape</th>
                            <th>Certificate #</th>
                            <th>Rate/Carat (₹)</th>
                            <th>Stone Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diamondComponents.map((stone, index) => (
                            <tr key={stone.id || index}>
                              <td>
                                {isEditing ? (
                                  <select
                                    value={stone.stone_type || ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.stone_type`)}
                                    className="form-select"
                                  >
                                    <option value="lab_grown_diamond">Lab Grown Diamond</option>
                                    <option value="natural_diamond">Natural Diamond</option>
                                    <option value="moissanite">Moissanite</option>
                                    <option value="other">Other</option>
                                  </select>
                                ) : (
                                  <span>{stone.stone_type || 'N/A'}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={stone.quantity || ''}
                                    onChange={(e) => handleInputChange('', parseInt(e.target.value) || 0, `diamond_components.${index}.quantity`)}
                                    className="form-input table-input"
                                  />
                                ) : (
                                  <span>{stone.quantity || 0}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={stone.carat_weight || ''}
                                    onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `diamond_components.${index}.carat_weight`)}
                                    className="form-input table-input"
                                    step="0.01"
                                  />
                                ) : (
                                  <span>{stone.carat_weight || 0}ct</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={stone.clarity || ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.clarity`)}
                                    className="form-input table-input"
                                  />
                                ) : (
                                  <span>{stone.clarity || 'N/A'}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={stone.color || ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.color`)}
                                    className="form-input table-input"
                                  />
                                ) : (
                                  <span>{stone.color || 'N/A'}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={stone.cut_grade || ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.cut_grade`)}
                                    className="form-input table-input"
                                  />
                                ) : (
                                  <span>{stone.cut_grade || 'N/A'}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={stone.shape || ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.shape`)}
                                    className="form-input table-input"
                                  />
                                ) : (
                                  <span>{stone.shape || 'N/A'}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={stone.certificate_no || ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.certificate_no`)}
                                    className="form-input table-input certificate-input"
                                    placeholder="Certificate number"
                                  />
                                ) : (
                                  <span className={stone.certificate_no ? 'certificate-badge' : 'no-certificate'}>
                                    {stone.certificate_no || 'N/A'}
                                  </span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={stone.rate_per_carat || ''}
                                    onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `diamond_components.${index}.rate_per_carat`)}
                                    className="form-input table-input"
                                    step="0.01"
                                  />
                                ) : (
                                  <span>₹{formatCurrency(stone.rate_per_carat || 0)}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                <input
                  type="number"
                                    value={stone.stone_cost || ''}
                                    onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `diamond_components.${index}.stone_cost`)}
                                    className="form-input table-input"
                                    step="0.01"
                                  />
                                ) : (
                                  <span>₹{formatCurrency(stone.stone_cost || 0)}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No diamond/stone components</p>
                  )}
                </div>
              )}
            </div>

            {/* Section 5: Pricing Breakdown */}
            <div className="detail-section">
              <div className="section-header" onClick={() => toggleSection('pricing')}>
                <h2>Pricing Breakdown</h2>
                {expandedSections.pricing ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {expandedSections.pricing && (
                <div className="section-content">
                  <div className="pricing-grid">
                    <div className="pricing-item">
                      <label>Making Charges (₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={pricingBreakdown.making_charges || ''}
                          onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, 'pricing_breakdown.making_charges')}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>₹{formatCurrency(pricingBreakdown.making_charges || 0)}</span>
                      )}
                    </div>
                    <div className="pricing-item">
                      <label>Wastage Charges (₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={pricingBreakdown.wastage_charges || ''}
                          onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, 'pricing_breakdown.wastage_charges')}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>₹{formatCurrency(pricingBreakdown.wastage_charges || 0)}</span>
                      )}
                    </div>
                    <div className="pricing-item">
                      <label>Other Charges (₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={pricingBreakdown.other_charges || ''}
                          onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, 'pricing_breakdown.other_charges')}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>₹{formatCurrency(pricingBreakdown.other_charges || 0)}</span>
                      )}
                    </div>
                    <div className="pricing-item calculated">
                      <label>GST Amount (₹)</label>
                      <span className="calculated-value">₹{formatCurrency(pricingBreakdown.gst_amount || 0)}</span>
                    </div>
                    <div className="pricing-item final-price">
                      <label>Final Price (₹)</label>
                      <span className="final-price-value">₹{formatCurrency(pricingBreakdown.final_price || product.final_price || product.price || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* For Demified Products - Show Simple View */}
        {isDemified && (
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
          </div>
        )}
      </div>
    </div>
  );
};
