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
  Gem,
  Upload,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { LoadingSpinner, ErrorMessage } from '../components';
import { productsApi, demistifiedProductsApi, productFiltersApi } from '../services/api';

/**
 * ProductDetailPage Component
 * Displays detailed view of a single product with edit capabilities
 * Handles both real (billing system) and demistified (Zoho) products
 */
export const ProductDetailPage = () => {
  const { type, id } = useParams(); // type = 'real' | 'demistified', id = product ID/SKU
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    variant: true,
    metal: true,
    stones: true,
    pricing: true
  });
  const [productImages, setProductImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentError, setContentError] = useState(null);

  const isDemistified = type === 'demistified';
  const isReal = type === 'real';

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const decodedId = decodeURIComponent(id);

        let response;
        if (isDemistified) {
          response = await demistifiedProductsApi.getById(decodedId);
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
  }, [type, id, isDemistified]);

  // Fetch product images for real jewellery
  useEffect(() => {
    const fetchImages = async () => {
      if (!isReal || !product?.sku) return;
      
      try {
        setLoadingImages(true);
        const imagesData = await productsApi.getImagesForSku(product.sku);
        if (imagesData.success && imagesData.images) {
          setProductImages(imagesData.images);
        }
      } catch (err) {
        console.error('Error fetching images:', err);
        // Don't show error if images don't exist
      } finally {
        setLoadingImages(false);
      }
    };

    if (product?.sku) {
      fetchImages();
    }
  }, [isReal, product?.sku]);

  // Load filter options for demistified products
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!isDemistified) return;
      
      try {
        setLoadingFilters(true);
        const allOptions = await productFiltersApi.getAllFilterOptions();
        
        // Extract dropdown_filters from response
        const dropdownData = allOptions.dropdown_filters || allOptions.dropdown || allOptions;
        
        // Map to our cf_ fields
        const options = {
          cf_collection: dropdownData.cf_collection || [],
          cf_gender: dropdownData.cf_gender || [],
          cf_work: dropdownData.cf_work || [],
          cf_finish: dropdownData.cf_finish || [],
          cf_finding: dropdownData.cf_finding || []
        };
        
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
        setFilterOptions({});
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, [isDemistified]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedProduct(product);
      setSelectedImageFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      
      // Handle image upload first if there's a selected file
      if (isReal && selectedImageFile && product?.sku) {
        try {
          setUploadingImage(true);
          await productsApi.uploadImagesForSku(product.sku, [selectedImageFile]);
          // Refresh images after upload
          const imagesData = await productsApi.getImagesForSku(product.sku);
          if (imagesData.success && imagesData.images) {
            setProductImages(imagesData.images);
          }
          setSelectedImageFile(null);
        } catch (err) {
          console.error('Error uploading image:', err);
          setError('Failed to upload image. Product data will still be saved.');
        } finally {
          setUploadingImage(false);
        }
      }
      
      if (isDemistified) {
        const updates = {};
        Object.keys(editedProduct).forEach(key => {
          if (editedProduct[key] !== product[key] && 
              ['name', 'rate', 'stock_on_hand', 'brand', 'description', 'cf_collection', 'cf_gender', 'cf_work', 'cf_finish', 'cf_finding'].includes(key)) {
            updates[key] = editedProduct[key];
          }
        });

        if (Object.keys(updates).length > 0) {
          // Use item_id for demistified products, fallback to sku if item_id not available
          const identifier = product.item_id || product.sku;
          await demistifiedProductsApi.update(identifier, updates);
          const updatedProduct = await demistifiedProductsApi.getById(id);
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setError('Please select a valid image file (JPEG or PNG)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }
      setSelectedImageFile(file);
      setError(null);
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
        // For lab-grown products (real jewelry), we MUST use variant_id
        // For demistified products, we can use item_id, id, or sku
        let productId;
        if (isReal && !isDemistified && !product.isDemistified) {
          // Lab-grown products require variant_id
          if (!product.variant_id) {
            alert('❌ Error: This product is missing variant information. Cannot add to cart.');
            console.error('Lab-grown product missing variant_id:', product);
            return;
          }
          productId = product.variant_id;
        } else {
          // Demistified products can use item_id, id, or sku
          productId = product.item_id || product.id || product.sku;
        }
        
        // Ensure product data has the correct flags for cart API
        const productData = {
          ...product,
          // Explicitly set flags based on product type
          isRealJewelry: isReal && !isDemistified && !product.isDemistified,
          isDemistified: isDemistified || product.isDemistified || false,
          // Ensure variant_id is set for real jewellery - MUST be variant_id, not product.id
          variant_id: isReal && !isDemistified && !product.isDemistified ? product.variant_id : product.variant_id
        };
        
        await addItem(productId, 1, productData);
        alert('✅ Item added to cart successfully!');
      } catch (err) {
        console.error('❌ Error adding to cart:', err);
        alert(`❌ Failed to add to cart: ${err.message}`);
      }
    }
  };

  const handleGenerateContent = async () => {
    if (!product || !isReal || isDemistified) {
      return;
    }

    try {
      setGeneratingContent(true);
      setContentError(null);
      setGeneratedContent(null);

      // Extract diamond information from diamond_components
      const mainDiamond = product.diamond_components?.[0] || {};
      const caratWeight = mainDiamond.carat_weight || mainDiamond.carat || 0;
      const diamondShape = mainDiamond.cut || mainDiamond.shape || 'round';
      const cut = mainDiamond.cut || mainDiamond.cut_grade;
      const clarity = mainDiamond.clarity || mainDiamond.clarity_grade;
      const colorGrade = mainDiamond.color || mainDiamond.color_grade || mainDiamond.diamond_color;
      const certNo = mainDiamond.certificate_no || mainDiamond.cert_no;
      const stonePricePerCarat = mainDiamond.rate_per_carat || mainDiamond.stone_price_per_carat;

      // Extract metal information from metal_components
      const mainMetal = product.metal_components?.[0] || {};
      const metalType = mainMetal.metal_type || 'gold';
      const purityK = mainMetal.purity_k || product.purity_k || (product.purity ? parseFloat(product.purity.replace('K', '')) : null);
      const netWeightG = mainMetal.net_weight_g || mainMetal.net_weight || product.net_weight;
      const grossWeightG = mainMetal.weight_g || mainMetal.weight || product.weight;
      const metalRatePerG = mainMetal.rate_per_g;

      // Determine jewelry_type from category or product_type
      const jewelryType = product.jewelry_type || product.product_type || product.category?.toLowerCase() || 'ring';

      // Build request body according to API requirements
      const requestBody = {
        // Required fields
        category: product.category || 'Jewelry',
        jewelry_type: jewelryType,
        carat: caratWeight ? caratWeight.toString() : '0.50',
        diamond_shape: diamondShape.toLowerCase(),
        metal_type: metalType === 'white_gold' ? 'gold' : metalType === 'yellow_gold' ? 'gold' : metalType === 'rose_gold' ? 'gold' : metalType || 'gold',
        purity_k: purityK ? purityK.toString() : '18.00',
        
        // Optional fields
        ...(product.product_type && { product_type: product.product_type }),
        ...(product.finish && { finish: product.finish }),
        ...(cut && { cut }),
        ...(clarity && { clarity }),
        ...(colorGrade && { color_grade: colorGrade }),
        ...(certNo && { cert_no: certNo }),
        ...(stonePricePerCarat && { stone_price_per_carat: stonePricePerCarat.toString() }),
        ...(grossWeightG && { gross_weight_g: parseFloat(grossWeightG).toFixed(2) }),
        ...(netWeightG && { net_weight_g: parseFloat(netWeightG).toFixed(2) }),
        ...(metalRatePerG && { metal_rate_per_g: metalRatePerG.toString() }),
        ...(product.occasions && { occasions: product.occasions }),
        ...(product.primary_color && { primary_color: product.primary_color }),
        ...(product.secondary_color && { secondary_color: product.secondary_color }),
        ...(product.vendor && { vendor: product.vendor }),
      };

      console.log('🤖 Preparing content generation request:', requestBody);

      const result = await productsApi.generateLabGrownContent(requestBody);
      
      // Handle API response structure
      setGeneratedContent({
        title: result.title || '',
        description: result.description || '',
        styling_tip: result.styling_tip || null
      });
    } catch (err) {
      console.error('❌ Error generating content:', err);
      setContentError(err.message || 'Failed to generate title and description');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleApplyGeneratedContent = () => {
    if (!generatedContent) return;

    setEditedProduct(prev => ({
      ...prev,
      name: generatedContent.title || prev.name,
      description: generatedContent.description || prev.description
    }));

    // If not in edit mode, switch to edit mode
    if (!isEditing) {
      setIsEditing(true);
    }

    setGeneratedContent(null);
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

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-GB');
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Calculate totals for real jewellery display
  const calculateTotals = () => {
    const goldTotal = metalComponents.reduce((sum, metal) => sum + parseFloat(metal.metal_cost || 0), 0);
    const diamondTotal = diamondComponents.reduce((sum, diamond) => sum + parseFloat(diamond.stone_cost || 0), 0);
    const makingCharges = parseFloat(pricingBreakdown.making_charges || 0);
    const grandTotal = goldTotal + diamondTotal + makingCharges;
    const gstRate = parseFloat(pricingBreakdown.gst_rate_percent || 3);
    const gstAmount = (grandTotal * gstRate) / 100;
    const finalPrice = grandTotal + gstAmount;
    
    return {
      goldTotal,
      diamondTotal,
      makingCharges,
      grandTotal,
      gstRate,
      gstAmount,
      finalPrice
    };
  };

  // Get main certificate number (from first diamond component)
  const getMainCertificateNo = () => {
    return diamondComponents.find(d => d.certificate_no)?.certificate_no || 'N/A';
  };

  // Get gold rate today (from first metal component)
  const getGoldRateToday = () => {
    return metalComponents.find(m => m.rate_per_g)?.rate_per_g || 0;
  };

  // Get gold rate display with type and carat
  const getGoldRateDisplay = () => {
    if (metalComponents.length === 0) return { rate: 0, type: 'N/A', carat: 'N/A' };
    const mainMetal = metalComponents[0];
    const metalType = mainMetal.metal_type === 'white_gold' ? 'White Gold' : 
                     mainMetal.metal_type === 'yellow_gold' ? 'Yellow Gold' :
                     mainMetal.metal_type === 'rose_gold' ? 'Rose Gold' :
                     mainMetal.metal_type || 'N/A';
    return {
      rate: mainMetal.rate_per_g || 0,
      type: metalType,
      carat: `${mainMetal.purity_k || 'N/A'}KT`
    };
  };

  // Get price calculation breakdown
  const getPriceCalculationBreakdown = () => {
    const totals = calculateTotals();
    const mainMetal = metalComponents[0] || {};
    const netWeight = parseFloat(mainMetal.net_weight_g || product.net_weight || 0);
    
    return {
      goldTotal: totals.goldTotal,
      diamondTotal: totals.diamondTotal,
      makingCharges: totals.makingCharges,
      makingRate: pricingBreakdown.making_rate_per_gm || 2500,
      makingGoldWt: netWeight,
      grandTotal: totals.grandTotal,
      gstRate: totals.gstRate,
      gstAmount: totals.gstAmount,
      finalPrice: totals.finalPrice
    };
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
  const canEdit = isReal || isDemistified; // Allow editing for both types
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
            <div className="edit-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Generate Content Button - Only for lab-grown products */}
              {isReal && !isDemistified && (
                <button 
                  className="btn btn-outline"
                  onClick={handleGenerateContent}
                  disabled={generatingContent}
                  style={{ 
                    backgroundColor: generatingContent ? '#f3f4f6' : '#fff',
                    borderColor: '#8b6f47',
                    color: '#8b6f47'
                  }}
                >
                  <Sparkles size={16} />
                  {generatingContent ? 'Generating...' : 'Generate Title & Description'}
                </button>
              )}
              {!isEditing ? (
                <button 
                  className="btn btn-outline"
                  onClick={handleEditToggle}
                >
                  <Edit size={16} />
                  Edit Product
                </button>
              ) : (
                <div className="edit-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
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
          <span className="product-type">{isDemistified ? 'Demistified' : 'Real'} Jewelry</span>
          <span className="separator">•</span>
          <span className={`product-category ${(!product.category && !product.category_name) ? 'uncategorised' : ''}`}>
            {product.category || product.category_name || 'Uncategorised'}
          </span>
        </div>
      </div>

      {/* Main Product Content */}
      <div className="product-detail-content">
        {/* Product Image and Basic Info */}
        <div className="product-detail-grid">
          <div className="product-detail-image">
            <div className="image-container">
              {isReal && productImages.length > 0 ? (
                <img 
                  src={productImages[0].url} 
                  alt={product.name || product.item_name}
                  className="product-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (product.image && typeof product.image === 'string' && 
               (product.image.startsWith('http') || product.image.startsWith('https'))) ||
               (product.shopify_image && product.shopify_image.url) ? (
                <img 
                  src={product.image || product.shopify_image?.url} 
                  alt={product.name || product.item_name}
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
                  display: ((isReal && productImages.length > 0) ||
                    (product.image && typeof product.image === 'string' && 
                    (product.image.startsWith('http') || product.image.startsWith('https'))) ||
                    (product.shopify_image && product.shopify_image.url))
                    ? 'none' : 'flex' 
                }}
              >
                💎
              </div>
              {isReal && isEditing && (
                <div className="image-upload-section">
                  <label className="image-upload-btn-large">
                    <ImageIcon size={24} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    {selectedImageFile ? 'Change Image' : 'Upload Image'}
                  </label>
                  {selectedImageFile && (
                    <div className="selected-image-info">
                      <span className="selected-image-name">{selectedImageFile.name}</span>
                      <span className="selected-image-size">
                        {(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="upload-progress">
                      Uploading image...
                    </div>
                  )}
                </div>
              )}
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
                <span className="product-id">ID: {isDemistified ? (product.item_id || product.id || product.sku) : (product.id || product.sku)}</span>
                <span className="product-type-badge">{isDemistified ? 'Zoho' : 'Custom'}</span>
              </div>
            </div>

            {/* Generated Content Preview - Only for lab-grown products */}
            {isReal && !isDemistified && generatedContent && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={18} color="#3b82f6" />
                  <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1rem', fontWeight: 600 }}>
                    Generated Content Preview
                  </h3>
                </div>
                
                {contentError && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    marginBottom: '0.75rem',
                    color: '#991b1b'
                  }}>
                    <strong>Error:</strong> {contentError}
                  </div>
                )}

                {generatedContent.title && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: '#1e40af' }}>
                      Generated Title:
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      fontSize: '0.95rem',
                      lineHeight: '1.5'
                    }}>
                      {generatedContent.title}
                    </div>
                  </div>
                )}

                {generatedContent.description && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: '#1e40af' }}>
                      Generated Description:
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '4px',
                      fontSize: '0.95rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {generatedContent.description}
                    </div>
                  </div>
                )}

                {generatedContent.styling_tip && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: '#1e40af' }}>
                      💡 Styling Tip:
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fbbf24',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      color: '#92400e'
                    }}>
                      {generatedContent.styling_tip}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleApplyGeneratedContent}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <Save size={14} />
                    Apply to Product
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setGeneratedContent(null);
                      setContentError(null);
                    }}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <X size={14} />
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Product Description */}
            {(product.description || (isEditing && editedProduct.description !== undefined)) && (
              <div className="product-description-section" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                {isEditing ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#2c2416' }}>
                      Description:
                    </label>
                    <textarea
                      className="form-textarea"
                      value={editedProduct.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Product description"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      marginBottom: '0.5rem', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Description
                    </h3>
                    <p style={{
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      color: '#374151',
                      margin: 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            )}

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
        {isReal && (() => {
          const totals = calculateTotals();
          const mainCertificateNo = getMainCertificateNo();
          const goldRateToday = getGoldRateToday();
          const mainMetal = metalComponents[0] || {};
          const netWeight = parseFloat(mainMetal.net_weight_g || product.net_weight || 0);
          const grossWeight = parseFloat(mainMetal.weight_g || product.weight || 0);
          
          return (
          <div className="product-detail-sections">
              {/* General Information Section */}
              <div className="detail-section">
                <div className="section-header">
                  <h2>General Information</h2>
                </div>
                <div className="section-content">
                  <div className="info-grid-simple">
                    <div className="info-item">
                      <label>Date</label>
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                    <div className="info-item">
                      <label>Gold Rate Today</label>
                      {(() => {
                        const goldRateInfo = getGoldRateDisplay();
                        return isEditing ? (
                          <div className="gold-rate-edit-group">
                            <div className="gold-rate-type-display">
                              <span className="gold-type-badge">{goldRateInfo.type}</span>
                              <span className="gold-carat-badge">{goldRateInfo.carat}</span>
                            </div>
                            <input
                              type="number"
                              value={goldRateInfo.rate || ''}
                              onChange={(e) => {
                                if (metalComponents.length > 0) {
                                  handleInputChange('', parseFloat(e.target.value) || 0, `metal_components.0.rate_per_g`);
                                }
                              }}
                              className="form-input"
                              step="0.01"
                              placeholder="Rate per gram"
                            />
                          </div>
                        ) : (
                          <div className="gold-rate-display">
                            <span className="gold-rate-value">₹{formatCurrency(goldRateInfo.rate)}</span>
                            <div className="gold-rate-meta">
                              <span className="gold-type-badge">{goldRateInfo.type}</span>
                              <span className="gold-carat-badge">{goldRateInfo.carat}</span>
                            </div>
                          </div>
                        );
                      })()}
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
                      <label>Certificate No</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={mainCertificateNo !== 'N/A' ? mainCertificateNo : ''}
                          onChange={(e) => {
                            if (diamondComponents.length > 0) {
                              handleInputChange('', e.target.value, `diamond_components.0.certificate_no`);
                            }
                          }}
                          className="form-input"
                          placeholder="Certificate number"
                        />
                      ) : (
                        <span>{mainCertificateNo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gold Details Section */}
            <div className="detail-section">
                <div className="section-header">
                  <h2><Award size={18} /> Gold Details</h2>
              </div>
                <div className="section-content">
                  {metalComponents.length > 0 ? (
                    <div className="components-table-simple">
                      <table>
                        <thead>
                          <tr>
                            <th>Gold Carat</th>
                            <th>Gold Color</th>
                            <th>Gross Wt</th>
                            <th>Net Wt</th>
                            <th>Rate</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metalComponents.map((metal, index) => {
                            const metalColor = metal.metal_type === 'white_gold' ? 'White' : 
                                             metal.metal_type === 'yellow_gold' ? 'Yellow' :
                                             metal.metal_type === 'rose_gold' ? 'Rose' :
                                             metal.metal_type || 'N/A';
                            
                            return (
                              <tr key={metal.id || index}>
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
                                    <span>{metal.purity_k || 'N/A'}KT</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <select
                                      value={metal.metal_type || ''}
                                      onChange={(e) => handleInputChange('', e.target.value, `metal_components.${index}.metal_type`)}
                                      className="form-select table-input"
                                    >
                                      <option value="white_gold">White</option>
                                      <option value="yellow_gold">Yellow</option>
                                      <option value="rose_gold">Rose</option>
                                    </select>
                                  ) : (
                                    <span>{metalColor}</span>
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
                                    <span>{formatCurrency(metal.weight_g || 0)}</span>
                                  )}
                                </td>
                                <td>
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={metal.net_weight_g || metal.net_weight || ''}
                                      onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, `metal_components.${index}.net_weight_g`)}
                                      className="form-input table-input"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span>{formatCurrency(metal.net_weight_g || metal.net_weight || 0)}</span>
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No gold details</p>
                  )}
                </div>
              </div>
              
              {/* Diamond Details Section */}
            <div className="detail-section">
                <div className="section-header">
                  <h2><Gem size={18} /> Diamond Details</h2>
              </div>
                <div className="section-content">
                  {diamondComponents.length > 0 ? (
                    <div className="components-table-simple">
                      <table>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Shape</th>
                            <th>No of Pcs</th>
                            <th>Wt</th>
                            <th>Rate</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diamondComponents.map((stone, index) => {
                            const description = stone.stone_type || stone.description || 'N/A';
                            const shape = stone.cut || stone.shape || 'N/A';
                            
                            return (
                            <tr key={stone.id || index}>
                              <td>
                                {isEditing ? (
                                  <input
                                      type="text"
                                      value={description !== 'N/A' ? description : ''}
                                      onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.description`)}
                                    className="form-input table-input"
                                      placeholder="Description"
                                  />
                                ) : (
                                    <span>{description}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <select
                                      value={shape !== 'N/A' ? shape : ''}
                                    onChange={(e) => handleInputChange('', e.target.value, `diamond_components.${index}.cut`)}
                                    className="form-select table-input"
                                  >
                                      <option value="">Select Shape</option>
                                    <option value="Round">Round</option>
                                    <option value="Oval">Oval</option>
                                    <option value="Pear">Pear</option>
                                    <option value="Radiant">Radiant</option>
                                    <option value="Square">Square</option>
                                    <option value="Princess">Princess</option>
                                    <option value="Emerald Cut">Emerald Cut</option>
                                    <option value="Marquise">Marquise</option>
                                    <option value="Heart">Heart</option>
                                  </select>
                                ) : (
                                    <span>{shape}</span>
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
                                    <span>{formatCurrency(stone.carat_weight || 0)}</span>
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
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No diamond details</p>
                  )}
                </div>
            </div>

              {/* Making Charges Section */}
            <div className="detail-section">
                <div className="section-header">
                  <h2>Making Charges</h2>
              </div>
                <div className="section-content">
                  <div className="making-charges-grid">
                    <div className="making-item">
                      <label>Gold Wt</label>
                      <span>{formatCurrency(netWeight)}</span>
                    </div>
                    <div className="making-item">
                      <label>Rate</label>
                      {isEditing ? (
                        <div className="rate-input-group">
                          <span>@</span>
                        <input
                          type="number"
                            value={pricingBreakdown.making_rate_per_gm || 2500}
                            onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, 'pricing_breakdown.making_rate_per_gm')}
                          className="form-input"
                          step="0.01"
                        />
                          <span>per gm</span>
                        </div>
                      ) : (
                        <span>@₹{formatCurrency(pricingBreakdown.making_rate_per_gm || 2500)} per gm</span>
                      )}
                    </div>
                    <div className="making-item">
                      <label>Total</label>
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
                  </div>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="detail-section">
                <div className="section-header">
                  <h2>Price Calculation</h2>
                </div>
                <div className="section-content">
                  {(() => {
                    const calc = getPriceCalculationBreakdown();
                    return (
                      <div className="price-calculation-breakdown">
                        <div className="calc-step">
                          <div className="calc-label">1. Gold Total</div>
                          <div className="calc-value">₹{formatCurrency(calc.goldTotal)}</div>
                        </div>
                        <div className="calc-step">
                          <div className="calc-label">2. Diamond Total</div>
                          <div className="calc-value">₹{formatCurrency(calc.diamondTotal)}</div>
                        </div>
                        <div className="calc-step">
                          <div className="calc-label">
                            3. Making Charges
                            <span className="calc-sub-label">
                              ({formatCurrency(calc.makingGoldWt)}g × ₹{formatCurrency(calc.makingRate)}/gm)
                            </span>
                          </div>
                          {isEditing ? (
                            <div className="calc-input-group">
                              <input
                                type="number"
                                value={calc.makingCharges || ''}
                                onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, 'pricing_breakdown.making_charges')}
                                className="form-input"
                                step="0.01"
                              />
                            </div>
                          ) : (
                            <div className="calc-value">₹{formatCurrency(calc.makingCharges)}</div>
                          )}
                        </div>
                        <div className="calc-divider"></div>
                        <div className="calc-step calc-grand-total">
                          <div className="calc-label">Grand Total (1+2+3)</div>
                          <div className="calc-value">₹{formatCurrency(calc.grandTotal)}</div>
                        </div>
                        <div className="calc-step">
                          <div className="calc-label">
                            GST (@{calc.gstRate}%)
                            <span className="calc-sub-label">
                              ({formatCurrency(calc.grandTotal)} × {calc.gstRate}%)
                            </span>
                          </div>
                          {isEditing ? (
                            <div className="gst-input-group">
                              <span>@</span>
                              <input
                                type="number"
                                value={calc.gstRate}
                                onChange={(e) => handleInputChange('', parseFloat(e.target.value) || 0, 'pricing_breakdown.gst_rate_percent')}
                                className="form-input"
                                step="0.01"
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <div className="calc-value">₹{formatCurrency(calc.gstAmount)}</div>
                          )}
                        </div>
                        <div className="calc-divider"></div>
                        <div className="calc-step calc-final-price">
                          <div className="calc-label">Price (Final)</div>
                          <div className="calc-value-large">₹{formatCurrency(calc.finalPrice)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })()}

        {/* For Demistified Products - Show All Fields */}
        {isDemistified && (
          <div className="product-detail-sections">
            <div className="detail-section">
              <div className="section-header">
                <h2>Product Information</h2>
              </div>
              <div className="section-content">
                <div className="info-grid">
                  {product.item_id && (
                    <div className="info-item">
                      <label>Item ID</label>
                      <span className="read-only">{product.item_id}</span>
                    </div>
                  )}
                  {product.name && (
                    <div className="info-item">
                      <label>Name</label>
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
                  )}
                  {product.item_name && product.item_name !== product.name && (
                    <div className="info-item">
                      <label>Item Name</label>
                      <span>{product.item_name}</span>
                    </div>
                  )}
                  {product.category_name && (
                    <div className="info-item">
                      <label>Category</label>
                      <span>{product.category_name}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="info-item">
                      <label>Brand</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedProduct.brand || ''}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          className="form-input"
                        />
                      ) : (
                        <span>{product.brand}</span>
                      )}
                    </div>
                  )}
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
                  {product.rate !== undefined && product.rate !== null && (
                    <div className="info-item">
                      <label>Rate (₹)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedProduct.rate || ''}
                          onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>₹{formatCurrency(product.rate)}</span>
                      )}
                    </div>
                  )}
                  {isDemistified && product.item_id && (
                    <div className="info-item">
                      <label>Item ID</label>
                      <span className="read-only">{product.item_id}</span>
                    </div>
                  )}
                  {product.sku && (
                    <div className="info-item">
                      <label>SKU</label>
                      <span className="read-only">{product.sku}</span>
                    </div>
                  )}
                  {product.stock_on_hand !== undefined && product.stock_on_hand !== null && (
                    <div className="info-item">
                      <label>Stock on Hand</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedProduct.stock_on_hand || ''}
                          onChange={(e) => handleInputChange('stock_on_hand', parseFloat(e.target.value) || 0)}
                          className="form-input"
                          step="0.01"
                        />
                      ) : (
                        <span>{product.stock_on_hand}</span>
                      )}
                    </div>
                  )}
                  {product.available_stock !== undefined && product.available_stock !== null && (
                    <div className="info-item">
                      <label>Available Stock</label>
                      <span>{product.available_stock}</span>
                    </div>
                  )}
                  {isDemistified && (
                    <>
                      <div className="info-item">
                        <label>Collection</label>
                        {isEditing ? (
                          <select
                            value={editedProduct.cf_collection || ''}
                            onChange={(e) => handleInputChange('cf_collection', e.target.value)}
                            className="form-input"
                          >
                            <option value="">Select Collection</option>
                            {(filterOptions.cf_collection || []).map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{product.cf_collection || ''}</span>
                        )}
                      </div>
                      <div className="info-item">
                        <label>Gender</label>
                        {isEditing ? (
                          <select
                            value={editedProduct.cf_gender || ''}
                            onChange={(e) => handleInputChange('cf_gender', e.target.value)}
                            className="form-input"
                          >
                            <option value="">Select Gender</option>
                            {(filterOptions.cf_gender || []).map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{product.cf_gender || ''}</span>
                        )}
                      </div>
                      <div className="info-item">
                        <label>Work</label>
                        {isEditing ? (
                          <select
                            value={editedProduct.cf_work || ''}
                            onChange={(e) => handleInputChange('cf_work', e.target.value)}
                            className="form-input"
                          >
                            <option value="">Select Work</option>
                            {(filterOptions.cf_work || []).map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{product.cf_work || ''}</span>
                        )}
                      </div>
                      <div className="info-item">
                        <label>Finish</label>
                        {isEditing ? (
                          <select
                            value={editedProduct.cf_finish || ''}
                            onChange={(e) => handleInputChange('cf_finish', e.target.value)}
                            className="form-input"
                          >
                            <option value="">Select Finish</option>
                            {(filterOptions.cf_finish || []).map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{product.cf_finish || ''}</span>
                        )}
                      </div>
                      <div className="info-item">
                        <label>Finding</label>
                        {isEditing ? (
                          <select
                            value={editedProduct.cf_finding || ''}
                            onChange={(e) => handleInputChange('cf_finding', e.target.value)}
                            className="form-input"
                          >
                            <option value="">Select Finding</option>
                            {(filterOptions.cf_finding || []).map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{product.cf_finding || ''}</span>
                        )}
                      </div>
                    </>
                  )}
                  {product.shopify_image && product.shopify_image.url && (
                    <div className="info-item full-width">
                      <label>Image URL</label>
                      <span className="read-only">
                        <a href={product.shopify_image.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                          {product.shopify_image.url}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
