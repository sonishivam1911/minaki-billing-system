/**
 * StoreManagementPage - Complete management interface for stores, shelves, and boxes
 */
import React, { useState, useEffect } from 'react';
import { useStoreManagement } from '../hooks/useStoreManagement';
import { useProductLocationTracking } from '../hooks';
import CreateStoreModal from '../components/CreateStoreModal';
import CreateStorageTypeModal from '../components/CreateStorageTypeModal';
import CreateStorageObjectModal from '../components/CreateStorageObjectModal';
import AddProductToBoxModal from '../components/AddProductToBoxModal';
import StorageTypeDropdown from '../components/StorageTypeDropdown';
import StorageObjectDropdown from '../components/StorageObjectDropdown';
// Legacy imports for backward compatibility
import CreateShelfModal from '../components/CreateStorageTypeModal';
import CreateBoxModal from '../components/CreateStorageObjectModal';
import ShopFloorMap from '../components/ShopFloorMap';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import '../styles/StoreManagement.css';

const StoreManagementPage = () => {
  // Modals
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showCreateStorageType, setShowCreateStorageType] = useState(false);
  const [showCreateStorageObject, setShowCreateStorageObject] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Selection state
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedStorageType, setSelectedStorageType] = useState(null);
  const [selectedStorageObject, setSelectedStorageObject] = useState(null);
  const [expandedStores, setExpandedStores] = useState(new Set());
  const [expandedStorageTypes, setExpandedStorageTypes] = useState(new Set());
  const [storageObjectProducts, setStorageObjectProducts] = useState({});
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Legacy state names for backward compatibility
  const selectedShelf = selectedStorageType;
  const selectedBox = selectedStorageObject;
  const expandedShelves = expandedStorageTypes;
  const boxProducts = storageObjectProducts;
  const showCreateShelf = showCreateStorageType;
  const showCreateBox = showCreateStorageObject;

  // Hook
  const {
    stores,
    storageTypes,
    storageObjects,
    // Legacy names for backward compatibility
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

  // Fetch storage types when store is selected
  useEffect(() => {
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      fetchShelvesByStore(locationId).then(async (storageTypesList) => {
        // Fetch storage objects for all storage types so they're available when storage types are expanded
        if (Array.isArray(storageTypesList)) {
          for (const storageType of storageTypesList) {
            try {
              await fetchBoxesByShelf(storageType.id);
            } catch (err) {
              console.error(`Error pre-fetching storage objects for storage type ${storageType.id}:`, err);
            }
          }
        }
      });
      fetchStoreProducts(locationId);
    }
  }, [selectedStore, fetchShelvesByStore, fetchBoxesByShelf]);

  /**
   * Fetch all products in the store with their storage type and storage object information
   */
  const fetchStoreProducts = async (locationId) => {
    try {
      setLoadingProducts(true);
      // Fetch all products in this location
      const products = await searchProducts({ location_id: locationId });
      const productsList = Array.isArray(products) ? products : products?.items || [];
      
      // Fetch all storage types and storage objects to map IDs to names
      const storageTypesList = await fetchShelvesByStore(locationId);
      const storageTypesMap = {};
      const storageObjectsMap = {};
      
      // Create storage type ID to name mapping
      for (const storageType of storageTypesList) {
        storageTypesMap[storageType.id] = {
          name: storageType.storage_type_name || storageType.name,
          code: storageType.storage_type_code || storageType.code
        };
        
        // Fetch storage objects for each storage type
        try {
          const storageObjectsList = await fetchBoxesByShelf(storageType.id);
          storageObjectsList.forEach(so => {
            storageObjectsMap[so.id] = {
              name: so.storage_object_label || so.storage_object_name || so.name,
              code: so.storage_object_code || so.code,
              storage_type_id: storageType.id
            };
          });
        } catch (err) {
          console.error(`Error fetching storage objects for storage type ${storageType.id}:`, err);
        }
      }
      
      // Enrich products with storage type and storage object names
      const enrichedProducts = productsList.map(product => ({
        ...product,
        storage_type_name: storageTypesMap[product.storage_type_id || product.shelf_id]?.name || '—',
        storage_type_code: storageTypesMap[product.storage_type_id || product.shelf_id]?.code || '—',
        storage_object_name: storageObjectsMap[product.storage_object_id || product.box_id]?.name || '—',
        storage_object_code: storageObjectsMap[product.storage_object_id || product.box_id]?.code || '—',
        // Legacy field names for backward compatibility
        shelf_name: storageTypesMap[product.storage_type_id || product.shelf_id]?.name || '—',
        shelf_code: storageTypesMap[product.storage_type_id || product.shelf_id]?.code || '—',
        box_name: storageObjectsMap[product.storage_object_id || product.box_id]?.name || '—',
        box_code: storageObjectsMap[product.storage_object_id || product.box_id]?.code || '—'
      }));
      
      setStoreProducts(enrichedProducts);
    } catch (err) {
      console.error('Error fetching store products:', err);
      setStoreProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch storage objects when storage type is selected
  useEffect(() => {
    if (selectedStorageType) {
      fetchBoxesByShelf(selectedStorageType.id);
    }
  }, [selectedStorageType, fetchBoxesByShelf]);

  // Fetch storage object products when storage object is selected
  useEffect(() => {
    if (selectedStorageObject) {
      fetchStorageObjectProducts(selectedStorageObject.id);
    }
  }, [selectedStorageObject]);

  /**
   * Fetch products in a specific storage object
   */
  const fetchStorageObjectProducts = async (storageObjectId) => {
    try {
      // Search for products in this specific storage object
      const products = await searchProducts({ storage_object_id: storageObjectId });
      setStorageObjectProducts(prev => ({
        ...prev,
        [storageObjectId]: Array.isArray(products) ? products : products?.items || []
      }));
    } catch (err) {
      console.error('Error fetching storage object products:', err);
      setStorageObjectProducts(prev => ({
        ...prev,
        [storageObjectId]: []
      }));
    }
  };
  
  // Legacy function name for backward compatibility
  const fetchBoxProducts = fetchStorageObjectProducts;

  const handleCreateStore = async (storeData) => {
    try {
      await createStore(storeData);
      await fetchAllStores();
    } catch (err) {
      console.error('Error creating store:', err);
    }
  };

  const handleCreateStorageType = async (storageTypeData, mode) => {
    try {
      let result;
      if (mode === 'single') {
        result = await createShelf(storageTypeData);
      } else {
        result = await createMultipleShelves(storageTypeData);
      }
      if (selectedStore) {
        const locationId = selectedStore.location_id || selectedStore.id;
        await fetchShelvesByStore(locationId);
        await fetchStoreProducts(locationId);
      }
      // Return result so modal can save coordinates
      return result;
    } catch (err) {
      console.error('Error creating storage type:', err);
      throw err;
    }
  };
  
  // Legacy function name for backward compatibility
  const handleCreateShelf = handleCreateStorageType;

  const handleCreateStorageObject = async (storageObjectData, mode) => {
    try {
      if (mode === 'single') {
        await createBox(storageObjectData);
      } else {
        await createMultipleBoxes(storageObjectData);
      }
      if (selectedStorageType) {
        await fetchBoxesByShelf(selectedStorageType.id);
      }
      if (selectedStore) {
        const locationId = selectedStore.location_id || selectedStore.id;
        await fetchStoreProducts(locationId);
      }
    } catch (err) {
      console.error('Error creating storage object:', err);
    }
  };
  
  // Legacy function name for backward compatibility
  const handleCreateBox = handleCreateStorageObject;

  const toggleStoreExpanded = (storeId) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
    }
    setExpandedStores(newExpanded);
  };

  const toggleStorageTypeExpanded = (storageTypeId) => {
    const newExpanded = new Set(expandedStorageTypes);
    if (newExpanded.has(storageTypeId)) {
      newExpanded.delete(storageTypeId);
    } else {
      newExpanded.add(storageTypeId);
    }
    setExpandedStorageTypes(newExpanded);
  };
  
  // Legacy function name for backward compatibility
  const toggleShelfExpanded = toggleStorageTypeExpanded;

  const handleSelectStore = async (store) => {
    setSelectedStore(store);
    setSelectedStorageType(null);
    setSelectedStorageObject(null);
    toggleStoreExpanded(store.id);
  };

  const handleSelectStorageType = async (storageType) => {
    setSelectedStorageType(storageType);
    setSelectedStorageObject(null);
    toggleStorageTypeExpanded(storageType.id);
  };
  
  // Legacy function name for backward compatibility
  const handleSelectShelf = handleSelectStorageType;

  const handleSelectStorageObject = (storageObject) => {
    setSelectedStorageObject(storageObject);
  };
  
  // Legacy function name for backward compatibility
  const handleSelectBox = handleSelectStorageObject;

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

  const handleDeleteStorageType = async (storageTypeId) => {
    if (window.confirm('Are you sure you want to delete this storage type? This action cannot be undone.')) {
      try {
        await deleteShelf(storageTypeId);
        if (selectedStorageType?.id === storageTypeId) {
          setSelectedStorageType(null);
        }
        if (selectedStore) {
          const locationId = selectedStore.location_id || selectedStore.id;
          await fetchShelvesByStore(locationId);
        }
      } catch (err) {
        console.error('Error deleting storage type:', err);
      }
    }
  };
  
  // Legacy function name for backward compatibility
  const handleDeleteShelf = handleDeleteStorageType;

  const handleDeleteStorageObject = async (storageObjectId) => {
    if (window.confirm('Are you sure you want to delete this storage object? This action cannot be undone.')) {
      try {
        await deleteBox(storageObjectId);
        if (selectedStorageObject?.id === storageObjectId) {
          setSelectedStorageObject(null);
        }
        if (selectedStorageType) {
          await fetchBoxesByShelf(selectedStorageType.id);
        }
      } catch (err) {
        console.error('Error deleting storage object:', err);
      }
    }
  };
  
  // Legacy function name for backward compatibility
  const handleDeleteBox = handleDeleteStorageObject;

  /**
   * Handle product removal from storage object
   */
  const handleRemoveProduct = async (locationId, productName) => {
    if (window.confirm(`Are you sure you want to remove "${productName}" from this storage object?`)) {
      try {
        await removeProduct(locationId, 1, 'app_user', 'Removed from store management');
        if (selectedStorageObject) {
          await fetchStorageObjectProducts(selectedStorageObject.id);
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
    if (selectedStorageObject) {
      await fetchStorageObjectProducts(selectedStorageObject.id);
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
                        <h4>Storage Types ({storageTypes.length})</h4>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowCreateStorageType(true)}
                        >
                          + Add Storage Type
                        </button>
                      </div>

                      {storageTypes.length === 0 ? (
                        <div className="empty-sublevel">
                          <p>No storage types in this store</p>
                        </div>
                      ) : (
                        <div className="shelves-grid">
                          {storageTypes.map(storageType => (
                            <div
                              key={storageType.id}
                              className={`shelf-card ${selectedStorageType?.id === storageType.id ? 'selected' : ''}`}
                              onClick={() => handleSelectStorageType(storageType)}
                            >
                              <div className="shelf-card-header">
                                <h5>{storageType.storage_type_name || storageType.name}</h5>
                                <button
                                  className="btn btn-icon btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteStorageType(storageType.id);
                                  }}
                                  title="Delete storage type"
                                >
                                  Delete
                                </button>
                              </div>
                              <p className="shelf-code">{storageType.storage_type_code || storageType.code}</p>
                              <div className="shelf-details">
                                <span>Cap: {storageType.capacity || '—'}</span>
                              </div>

                              {/* Storage Objects List - Show when storage type is expanded */}
                              {expandedStorageTypes.has(storageType.id) && selectedStorageType?.id === storageType.id && (
                                <div className="boxes-list">
                                  <div className="boxes-header">
                                    <h6>Storage Objects ({storageObjects.filter(so => so.storage_type_id === storageType.id).length})</h6>
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStorageType(storageType);
                                        setShowCreateStorageObject(true);
                                      }}
                                    >
                                      + Storage Object
                                    </button>
                                  </div>

                                  {(() => {
                                    const typeStorageObjects = storageObjects.filter(so => so.storage_type_id === storageType.id);
                                    return typeStorageObjects.length === 0 ? (
                                      <p className="empty-sublevel-text">No storage objects yet</p>
                                    ) : (
                                      <div className="boxes-sublevel">
                                        {typeStorageObjects.map(storageObject => (
                                          <div 
                                            key={storageObject.id} 
                                            className={`box-item ${selectedStorageObject?.id === storageObject.id ? 'selected' : ''}`}
                                            onClick={() => handleSelectStorageObject(storageObject)}
                                          >
                                            <div className="box-name">{storageObject.storage_object_label || storageObject.storage_object_name || storageObject.name}</div>
                                            <div className="box-code">{storageObject.storage_object_code || storageObject.code}</div>
                                            <div className="box-capacity">Cap: {storageObject.capacity || '—'}</div>
                                            <div className="box-actions">
                                              <button
                                                className="btn btn-primary btn-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedStorageObject(storageObject);
                                                  setShowAddProduct(true);
                                                }}
                                                title="Add product to storage object"
                                              >
                                                + Product
                                              </button>
                                              <button
                                                className="btn btn-icon btn-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteStorageObject(storageObject.id);
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
          {!selectedStore && !selectedStorageObject ? (
            <div className="empty-details">
              <p>Select a store or storage object to view details</p>
            </div>
          ) : selectedStorageObject ? (
            // Storage Object Details Panel
            <div className="box-details">
              <h2>{selectedStorageObject.storage_object_label || selectedStorageObject.storage_object_name || selectedStorageObject.name}</h2>
              
              <div className="details-grid">
                <div className="detail-item">
                  <label>Storage Object Code:</label>
                  <p>{selectedStorageObject.storage_object_code || selectedStorageObject.code}</p>
                </div>
                
                <div className="detail-item">
                  <label>Capacity:</label>
                  <p>{selectedStorageObject.capacity || '—'} units</p>
                </div>

                <div className="detail-item">
                  <label>Storage Type ID:</label>
                  <p>{selectedStorageObject.storage_type_id || selectedStorageObject.shelf_id}</p>
                </div>

                <div className="detail-item">
                  <label>Status:</label>
                  <p>
                    <span className={`status-badge ${selectedStorageObject.is_active !== false ? 'active' : 'inactive'}`}>
                      {selectedStorageObject.is_active !== false ? 'Active' : 'Inactive'}
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
                    onClick={() => setSelectedStorageObject(null)}
                  >
                    ← Back to Storage Types
                  </button>
                </div>
              </div>

              {/* Products in Storage Object */}
              <div className="box-products-section">
                <h3>Products in Storage Object</h3>
                
                {storageObjectProducts[selectedStorageObject.id]?.length === 0 ? (
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
                    {storageObjectProducts[selectedStorageObject.id]?.map(product => (
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

              {/* Storage Type Creation Quick Action */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateStorageType(true)}
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
                      <p className="summary-value">{storageTypes.length}</p>
                    </div>
                    <div className="summary-card">
                      <h4>Total Storage Objects</h4>
                      <p className="summary-value">{storageObjects.length}</p>
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
                                  {product.storage_type_name || product.shelf_name || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#8b7355', fontSize: '12px' }}>
                                  {product.storage_type_code || product.shelf_code || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#5d4e37', fontSize: '13px', fontWeight: '500' }}>
                                  {product.storage_object_name || product.box_name || '—'}
                                </td>
                                <td style={{ padding: '12px', color: '#8b7355', fontSize: '12px' }}>
                                  {product.storage_object_code || product.box_code || '—'}
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
                  shelves={storageTypes}
                  boxes={storageObjects}
                  selectedShelf={selectedStorageType}
                  onShelfClick={handleSelectStorageType}
                  store={selectedStore}
                  onPositionUpdated={handlePositionUpdated}
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

      <CreateStorageTypeModal
        isOpen={showCreateStorageType}
        onClose={() => setShowCreateStorageType(false)}
        onSubmit={handleCreateStorageType}
        storeId={selectedStore?.location_id || selectedStore?.id}
        bulkMode={true}
        loading={loading}
      />

      <CreateStorageObjectModal
        isOpen={showCreateStorageObject}
        onClose={() => setShowCreateStorageObject(false)}
        onSubmit={handleCreateStorageObject}
        storageTypeId={selectedStorageType?.id}
        bulkMode={true}
        loading={loading}
      />

      <AddProductToBoxModal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        storageObjectId={selectedStorageObject?.id}
        storageObjectName={selectedStorageObject?.storage_object_label || selectedStorageObject?.storage_object_name || selectedStorageObject?.name}
        storageObjectCapacity={selectedStorageObject?.capacity}
        onProductAdded={handleProductAdded}
        loading={loading}
      />
    </div>
  );
};

export default StoreManagementPage;
