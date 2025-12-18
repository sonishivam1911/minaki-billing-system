/**
 * StoreManagementPage - Complete management interface for stores, shelves, and boxes
 */
import React, { useState, useEffect } from 'react';
import { useStoreManagement } from '../hooks/useStoreManagement';
import { useProductLocationTracking } from '../hooks';
import CreateStoreModal from '../components/CreateStoreModal';
import CreateShelfModal from '../components/CreateShelfModal';
import CreateBoxModal from '../components/CreateBoxModal';
import AddProductToBoxModal from '../components/AddProductToBoxModal';
import PositionStorageTypesModal from '../components/PositionStorageTypesModal';
import ShopFloorMap from '../components/ShopFloorMap';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import '../styles/StoreManagement.css';

const StoreManagementPage = () => {
  // Modals
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showCreateShelf, setShowCreateShelf] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);

  // Selection state
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [expandedStores, setExpandedStores] = useState(new Set());
  const [expandedShelves, setExpandedShelves] = useState(new Set());
  const [boxProducts, setBoxProducts] = useState({});
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Hook
  const {
    stores,
    shelves,
    boxes,
    loading,
    error,
    success,
    fetchAllStores,
    createStore,
    updateStore,
    deleteStore,
    getStoreStats,
    fetchShelvesByStore,
    createShelf,
    createMultipleShelves,
    updateShelf,
    deleteShelf,
    fetchBoxesByShelf,
    createBox,
    createMultipleBoxes,
    updateBox,
    deleteBox,
    moveBox,
    clearError,
    clearSuccess
  } = useStoreManagement();

  // Product location tracking hook
  const {
    addProductToBox,
    removeProduct,
    searchProducts,
    error: productError
  } = useProductLocationTracking();

  // Fetch stores on mount
  useEffect(() => {
    fetchAllStores();
  }, [fetchAllStores]);

  // Fetch shelves when store is selected
  useEffect(() => {
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      fetchShelvesByStore(locationId).then(async (shelvesList) => {
        // Fetch boxes for all shelves so they're available when shelves are expanded
        if (Array.isArray(shelvesList)) {
          for (const shelf of shelvesList) {
            try {
              await fetchBoxesByShelf(shelf.id);
            } catch (err) {
              console.error(`Error pre-fetching boxes for shelf ${shelf.id}:`, err);
            }
          }
        }
      });
      fetchStoreProducts(locationId);
    }
  }, [selectedStore, fetchShelvesByStore, fetchBoxesByShelf]);

  /**
   * Fetch all products in the store with their shelf and box information
   */
  const fetchStoreProducts = async (locationId) => {
    try {
      setLoadingProducts(true);
      // Fetch all products in this location
      const products = await searchProducts({ location_id: locationId });
      const productsList = Array.isArray(products) ? products : products?.items || [];
      
      // Fetch all shelves and boxes to map IDs to names
      const shelvesList = await fetchShelvesByStore(locationId);
      const shelvesMap = {};
      const boxesMap = {};
      
      // Create shelf ID to name mapping
      for (const shelf of shelvesList) {
        shelvesMap[shelf.id] = {
          name: shelf.shelf_name || shelf.name,
          code: shelf.shelf_code || shelf.code
        };
        
        // Fetch boxes for each shelf
        try {
          const boxesList = await fetchBoxesByShelf(shelf.id);
          boxesList.forEach(box => {
            boxesMap[box.id] = {
              name: box.box_name || box.name,
              code: box.box_code || box.code,
              shelf_id: shelf.id
            };
          });
        } catch (err) {
          console.error(`Error fetching boxes for shelf ${shelf.id}:`, err);
        }
      }
      
      // Enrich products with shelf and box names
      const enrichedProducts = productsList.map(product => ({
        ...product,
        shelf_name: shelvesMap[product.shelf_id]?.name || '—',
        shelf_code: shelvesMap[product.shelf_id]?.code || '—',
        box_name: boxesMap[product.box_id]?.name || '—',
        box_code: boxesMap[product.box_id]?.code || '—'
      }));
      
      setStoreProducts(enrichedProducts);
    } catch (err) {
      console.error('Error fetching store products:', err);
      setStoreProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch boxes when shelf is selected
  useEffect(() => {
    if (selectedShelf) {
      fetchBoxesByShelf(selectedShelf.id);
    }
  }, [selectedShelf, fetchBoxesByShelf]);

  // Fetch box products when box is selected
  useEffect(() => {
    if (selectedBox) {
      fetchBoxProducts(selectedBox.id);
    }
  }, [selectedBox]);

  /**
   * Fetch products in a specific box
   */
  const fetchBoxProducts = async (boxId) => {
    try {
      // Search for products in this specific box
      const products = await searchProducts({ box_id: boxId });
      setBoxProducts(prev => ({
        ...prev,
        [boxId]: Array.isArray(products) ? products : products?.items || []
      }));
    } catch (err) {
      console.error('Error fetching box products:', err);
      setBoxProducts(prev => ({
        ...prev,
        [boxId]: []
      }));
    }
  };

  const handleCreateStore = async (storeData) => {
    try {
      await createStore(storeData);
      await fetchAllStores();
    } catch (err) {
      console.error('Error creating store:', err);
    }
  };

  const handleCreateShelf = async (shelfData, mode) => {
    try {
      let result;
      if (mode === 'single') {
        result = await createShelf(shelfData);
      } else {
        result = await createMultipleShelves(shelfData);
      }
      if (selectedStore) {
        const locationId = selectedStore.location_id || selectedStore.id;
        await fetchShelvesByStore(locationId);
        await fetchStoreProducts(locationId);
      }
      // Return result so modal can save coordinates
      return result;
    } catch (err) {
      console.error('Error creating shelf:', err);
      throw err;
    }
  };

  const handleCreateBox = async (boxData, mode) => {
    try {
      if (mode === 'single') {
        await createBox(boxData);
      } else {
        await createMultipleBoxes(boxData);
      }
      if (selectedShelf) {
        await fetchBoxesByShelf(selectedShelf.id);
      }
      if (selectedStore) {
        const locationId = selectedStore.location_id || selectedStore.id;
        await fetchStoreProducts(locationId);
      }
    } catch (err) {
      console.error('Error creating box:', err);
    }
  };

  const toggleStoreExpanded = (storeId) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
    }
    setExpandedStores(newExpanded);
  };

  const toggleShelfExpanded = (shelfId) => {
    const newExpanded = new Set(expandedShelves);
    if (newExpanded.has(shelfId)) {
      newExpanded.delete(shelfId);
    } else {
      newExpanded.add(shelfId);
    }
    setExpandedShelves(newExpanded);
  };

  const handleSelectStore = async (store) => {
    setSelectedStore(store);
    setSelectedShelf(null);
    setSelectedBox(null);
    toggleStoreExpanded(store.id);
  };

  const handleSelectShelf = async (shelf) => {
    setSelectedShelf(shelf);
    setSelectedBox(null);
    toggleShelfExpanded(shelf.id);
  };

  const handleSelectBox = (box) => {
    setSelectedBox(box);
  };

  const handleDeleteStore = async (storeId) => {
    if (window.confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      try {
        await deleteStore(storeId);
        if (selectedStore?.id === storeId) {
          setSelectedStore(null);
          setSelectedShelf(null);
        }
      } catch (err) {
        console.error('Error deleting store:', err);
      }
    }
  };

  const handleDeleteShelf = async (shelfId) => {
    if (window.confirm('Are you sure you want to delete this storage type? This action cannot be undone.')) {
      try {
        await deleteShelf(shelfId);
        if (selectedShelf?.id === shelfId) {
          setSelectedShelf(null);
        }
        if (selectedStore) {
          const locationId = selectedStore.location_id || selectedStore.id;
          await fetchShelvesByStore(locationId);
        }
      } catch (err) {
        console.error('Error deleting shelf:', err);
      }
    }
  };

  const handleDeleteBox = async (boxId) => {
    if (window.confirm('Are you sure you want to delete this storage object? This action cannot be undone.')) {
      try {
        await deleteBox(boxId);
        if (selectedBox?.id === boxId) {
          setSelectedBox(null);
        }
        if (selectedShelf) {
          await fetchBoxesByShelf(selectedShelf.id);
        }
      } catch (err) {
        console.error('Error deleting box:', err);
      }
    }
  };

  /**
   * Handle product removal from box
   */
  const handleRemoveProduct = async (locationId, productName) => {
    if (window.confirm(`Are you sure you want to remove "${productName}" from this box?`)) {
      try {
        await removeProduct(locationId, 1, 'app_user', 'Removed from store management');
        if (selectedBox) {
          await fetchBoxProducts(selectedBox.id);
        }
      } catch (err) {
        console.error('Error removing product:', err);
      }
    }
  };

  /**
   * Handle product added successfully
   */
  const handleProductAdded = async () => {
    if (selectedBox) {
      await fetchBoxProducts(selectedBox.id);
    }
  };

  /**
   * Handle storage type position updated
   */
  const handlePositionUpdated = async (updatedShelf) => {
    // Refresh shelves to get updated positions
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      await fetchShelvesByStore(locationId);
    }
  };

  return (
    <div className="store-management-page">
      {/* Header */}
      <div className="page-header">
        <h1>Store Management</h1>
        <p className="subtitle">Create and manage your stores, storage types, and storage objects</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={clearError} className="btn-close">✕</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={clearSuccess} className="btn-close">✕</button>
        </div>
      )}

      {loading && stores.length === 0 && <LoadingSpinner message="Loading stores..." />}

      {/* Main Content */}
      <div className="management-container">
        {/* Stores Panel */}
        <div className="stores-panel">
          <div className="panel-header">
            <h2>Stores & Locations</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateStore(true)}
            >
              + New Store
            </button>
          </div>

          <div className="stores-list">
            {stores.length === 0 ? (
              <div className="empty-state">
                <p>No stores created yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateStore(true)}
                >
                  Create Your First Store
                </button>
              </div>
            ) : (
              stores.map(store => (
                <div
                  key={store.id}
                  className={`store-item ${selectedStore?.id === store.id ? 'selected' : ''}`}
                >
                  <div className="store-item-header" onClick={() => handleSelectStore(store)}>
                    <div className="store-info">
                      <h3>{store.location_name || store.name}</h3>
                      <p className="store-code">{store.location_code || store.code}</p>
                    </div>
                    <div className="store-actions">
                      <span className={`status-badge ${store.is_active ? 'active' : 'inactive'}`}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        className="btn btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStore(store.id);
                        }}
                        title="Delete store"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Shelves List - Show when store is expanded and selected */}
                  {expandedStores.has(store.id) && selectedStore?.id === store.id && (
                    <div className="shelves-list">
                      <div className="shelves-header">
                        <h4>Storage Types ({shelves.length})</h4>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowCreateShelf(true)}
                        >
                          + Add Storage Type
                        </button>
                      </div>

                      {shelves.length === 0 ? (
                        <div className="empty-sublevel">
                          <p>No storage types in this store</p>
                        </div>
                      ) : (
                        <div className="shelves-grid">
                          {shelves.map(shelf => (
                            <div
                              key={shelf.id}
                              className={`shelf-card ${selectedShelf?.id === shelf.id ? 'selected' : ''}`}
                              onClick={() => handleSelectShelf(shelf)}
                            >
                              <div className="shelf-card-header">
                                <h5>{shelf.shelf_name || shelf.name}</h5>
                                <button
                                  className="btn btn-icon btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShelf(shelf.id);
                                  }}
                                  title="Delete storage type"
                                >
                                  Delete
                                </button>
                              </div>
                              <p className="shelf-code">{shelf.shelf_code || shelf.code}</p>
                              <div className="shelf-details">
                                <span>Level: {shelf.shelf_level || '—'}</span>
                                <span>Cap: {shelf.capacity || '—'}</span>
                              </div>

                              {/* Boxes List - Show when shelf is expanded */}
                              {expandedShelves.has(shelf.id) && selectedShelf?.id === shelf.id && (
                                <div className="boxes-list">
                                  <div className="boxes-header">
                                    <h6>Storage Objects ({boxes.filter(b => b.shelf_id === shelf.id).length})</h6>
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCreateBox(true);
                                      }}
                                    >
                                      + Storage Object
                                    </button>
                                  </div>

                                  {(() => {
                                    const shelfBoxes = boxes.filter(b => b.shelf_id === shelf.id);
                                    return shelfBoxes.length === 0 ? (
                                      <p className="empty-sublevel-text">No storage objects yet</p>
                                    ) : (
                                      <div className="boxes-sublevel">
                                        {shelfBoxes.map(box => (
                                          <div 
                                            key={box.id} 
                                            className={`box-item ${selectedBox?.id === box.id ? 'selected' : ''}`}
                                            onClick={() => handleSelectBox(box)}
                                          >
                                            <div className="box-name">{box.box_name || box.name}</div>
                                            <div className="box-code">{box.box_code || box.code}</div>
                                            <div className="box-capacity">Cap: {box.capacity}</div>
                                            <div className="box-actions">
                                              <button
                                                className="btn btn-primary btn-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedBox(box);
                                                  setShowAddProduct(true);
                                                }}
                                                title="Add product to box"
                                              >
                                                + Product
                                              </button>
                                              <button
                                                className="btn btn-icon btn-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteBox(box.id);
                                                }}
                                                title="Delete storage object"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="details-panel">
          {!selectedStore && !selectedBox ? (
            <div className="empty-details">
              <p>Select a store or box to view details</p>
            </div>
          ) : selectedBox ? (
            // Box Details Panel
            <div className="box-details">
              <h2>{selectedBox.box_name || selectedBox.name}</h2>
              
              <div className="details-grid">
                <div className="detail-item">
                  <label>Storage Object Code:</label>
                  <p>{selectedBox.box_code || selectedBox.code}</p>
                </div>
                
                <div className="detail-item">
                  <label>Capacity:</label>
                  <p>{selectedBox.capacity} units</p>
                </div>

                <div className="detail-item">
                  <label>Storage Type ID:</label>
                  <p>{selectedBox.shelf_id}</p>
                </div>

                <div className="detail-item">
                  <label>Status:</label>
                  <p>
                    <span className={`status-badge ${selectedBox.is_active !== false ? 'active' : 'inactive'}`}>
                      {selectedBox.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Storage Object Actions */}
              <div className="quick-actions">
                <h3>Storage Object Actions</h3>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddProduct(true)}
                  >
                    ➕ Add Product to Storage Object
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedBox(null)}
                  >
                    ← Back to Storage Types
                  </button>
                </div>
              </div>

              {/* Products in Storage Object */}
              <div className="box-products-section">
                <h3>Products in Storage Object</h3>
                
                {boxProducts[selectedBox.id]?.length === 0 ? (
                  <div className="empty-products">
                    <p>No products in this storage object yet</p>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddProduct(true)}
                    >
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="products-list">
                    {boxProducts[selectedBox.id]?.map(product => (
                      <div key={product.id} className="product-item">
                        <div className="product-header">
                          <div className="product-info">
                            <h5>{product.product_name}</h5>
                            <span className="product-type-badge">
                              {product.product_type === 'real_jewelry' ? 'Jewelry' : 'Product'} {product.product_type}
                            </span>
                          </div>
                          <button
                            className="btn btn-icon btn-sm"
                            onClick={() => handleRemoveProduct(product.id, product.product_name)}
                            title="Remove product"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="product-details">
                          <div className="detail-row">
                            <span className="label">SKU:</span>
                            <span className="value">{product.sku}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Product ID:</span>
                            <span className="value">{product.product_id}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Quantity:</span>
                            <span className="value">{product.quantity}</span>
                          </div>

                          {product.product_type === 'real_jewelry' && (
                            <>
                              {product.metal_weight_g && (
                                <div className="detail-row">
                                  <span className="label">Weight:</span>
                                  <span className="value">Weight: {product.metal_weight_g}g</span>
                                </div>
                              )}
                              {product.purity_k && (
                                <div className="detail-row">
                                  <span className="label">Purity:</span>
                                  <span className="value">Purity: {product.purity_k}K</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Store Details Panel
            <div className="store-details">
              <h2>{selectedStore.location_name || selectedStore.name}</h2>
              
              <div className="details-grid">
                <div className="detail-item">
                  <label>Store Code:</label>
                  <p>{selectedStore.location_code || selectedStore.code}</p>
                </div>
                
                <div className="detail-item">
                  <label>Status:</label>
                  <p>
                    <span className={`status-badge ${selectedStore.is_active ? 'active' : 'inactive'}`}>
                      {selectedStore.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                {selectedStore.description && (
                  <div className="detail-item full-width">
                    <label>Description:</label>
                    <p>{selectedStore.description}</p>
                  </div>
                )}
              </div>

              {/* Shelf Creation Quick Action */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateShelf(true)}
                  >
                    Add Storage Type to This Store
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateStore(true)}
                  >
                    Create Another Store
                  </button>
                </div>
              </div>

              {/* Store Summary */}
              {selectedStore && (
                <div className="summary-section">
                  <h3>Store Summary</h3>
                  <div className="summary-grid" style={{ marginBottom: '20px' }}>
                    <div className="summary-card">
                      <h4>Total Storage Types</h4>
                      <p className="summary-value">{shelves.length}</p>
                    </div>
                    <div className="summary-card">
                      <h4>Total Storage Objects</h4>
                      <p className="summary-value">{boxes.length}</p>
                    </div>
                    <div className="summary-card">
                      <h4>Total Products</h4>
                      <p className="summary-value">{storeProducts.length}</p>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#5d4e37', fontFamily: "'Cormorant Garamond', serif" }}>
                      Complete Products Inventory
                    </h3>
                    {loadingProducts ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355' }}>
                        Loading products...
                      </div>
                    ) : storeProducts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#8b7355' }}>
                        <p>No products in this store yet</p>
                      </div>
                    ) : (
                      <div style={{ 
                        background: 'white', 
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        border: '1px solid #d4c4a8',
                        maxHeight: '600px',
                        overflowY: 'auto',
                        overflowX: 'auto'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                          <thead>
                            <tr style={{ background: '#8b6f47', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Product ID</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Product Name</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>SKU</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Product Type</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Quantity</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Storage Type</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Storage Type Code</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Storage Object</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Storage Object Code</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {storeProducts.map((product, index) => (
                              <tr 
                                key={product.id || index}
                                style={{ 
                                  borderBottom: '1px solid #e8e0d0',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#faf8f3'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <td style={{ padding: '12px', color: '#8b7355', fontSize: '12px', fontFamily: 'monospace' }}>
                                  {product.product_id ? product.product_id.substring(0, 8) + '...' : '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#5d4e37', fontWeight: '500', fontSize: '13px' }}>
                                  {product.product_name || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#8b7355', fontSize: '12px' }}>
                                  {product.sku || '—'}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    background: product.product_type === 'real_jewelry' ? '#f5f1e8' : '#e8e0d0',
                                    color: '#5d4e37',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {product.product_type === 'real_jewelry' ? 'Jewelry' : 'Product'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#5d4e37', fontWeight: 'bold', fontSize: '14px' }}>
                                  {product.quantity || product.total_quantity || 0}
                                </td>
                                <td style={{ padding: '12px', color: '#5d4e37', fontSize: '13px', fontWeight: '500' }}>
                                  {product.shelf_name || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#8b7355', fontSize: '12px' }}>
                                  {product.shelf_code || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#5d4e37', fontSize: '13px', fontWeight: '500' }}>
                                  {product.box_name || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#8b7355', fontSize: '12px' }}>
                                  {product.box_code || '—'}
                                </td>
                                <td style={{ padding: '12px', fontSize: '11px', color: '#8b7355' }}>
                                  {product.product_type === 'real_jewelry' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      {product.metal_weight_g && (
                                        <span>Weight: {product.metal_weight_g}g</span>
                                      )}
                                      {product.purity_k && (
                                        <span>Purity: {product.purity_k}K</span>
                                      )}
                                      {!product.metal_weight_g && !product.purity_k && <span>—</span>}
                                    </div>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Store Map */}
              {selectedStore && (
                <ShopFloorMap
                  shelves={shelves}
                  boxes={boxes}
                  selectedShelf={selectedShelf}
                  onShelfClick={handleSelectShelf}
                  store={selectedStore}
                  onPositionClick={() => setShowPositionModal(true)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateStoreModal
        isOpen={showCreateStore}
        onClose={() => setShowCreateStore(false)}
        onSubmit={handleCreateStore}
        loading={loading}
      />

      <CreateShelfModal
        isOpen={showCreateShelf}
        onClose={() => setShowCreateShelf(false)}
        onSubmit={handleCreateShelf}
        storeId={selectedStore?.location_id || selectedStore?.id}
        bulkMode={true}
        loading={loading}
      />

      <CreateBoxModal
        isOpen={showCreateBox}
        onClose={() => setShowCreateBox(false)}
        onSubmit={handleCreateBox}
        shelfId={selectedShelf?.id}
        bulkMode={true}
        loading={loading}
      />

      <AddProductToBoxModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        boxId={selectedBox?.id}
        boxName={selectedBox?.box_name || selectedBox?.name}
        boxCapacity={selectedBox?.capacity}
        onProductAdded={handleProductAdded}
        loading={loading}
      />

      <PositionStorageTypesModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        shelves={shelves}
        boxes={boxes}
        storeId={selectedStore?.location_id || selectedStore?.id}
        onPositionUpdated={handlePositionUpdated}
      />
    </div>
  );
};

export default StoreManagementPage;
