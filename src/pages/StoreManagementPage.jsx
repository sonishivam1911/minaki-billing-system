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
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import '../styles/StoreManagement.css';

const StoreManagementPage = () => {
  // Modals
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [showCreateShelf, setShowCreateShelf] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Selection state
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [selectedBox, setSelectedBox] = useState(null);
  const [expandedStores, setExpandedStores] = useState(new Set());
  const [expandedShelves, setExpandedShelves] = useState(new Set());
  const [boxProducts, setBoxProducts] = useState({});

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
      fetchShelvesByStore(selectedStore.id);
    }
  }, [selectedStore, fetchShelvesByStore]);

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
      if (mode === 'single') {
        await createShelf(shelfData);
      } else {
        await createMultipleShelves(shelfData);
      }
      if (selectedStore) {
        await fetchShelvesByStore(selectedStore.id);
      }
    } catch (err) {
      console.error('Error creating shelf:', err);
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
    if (window.confirm('Are you sure you want to delete this shelf? This action cannot be undone.')) {
      try {
        await deleteShelf(shelfId);
        if (selectedShelf?.id === shelfId) {
          setSelectedShelf(null);
        }
        if (selectedStore) {
          await fetchShelvesByStore(selectedStore.id);
        }
      } catch (err) {
        console.error('Error deleting shelf:', err);
      }
    }
  };

  const handleDeleteBox = async (boxId) => {
    if (window.confirm('Are you sure you want to delete this box? This action cannot be undone.')) {
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

  return (
    <div className="store-management-page">
      {/* Header */}
      <div className="page-header">
        <h1>🏢 Store Management</h1>
        <p className="subtitle">Create and manage your stores, shelves, and storage boxes</p>
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
            <h2>📦 Stores & Locations</h2>
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
                        {store.is_active ? '✓ Active' : '⊗ Inactive'}
                      </span>
                      <button
                        className="btn btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStore(store.id);
                        }}
                        title="Delete store"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Shelves List - Show when store is expanded and selected */}
                  {expandedStores.has(store.id) && selectedStore?.id === store.id && (
                    <div className="shelves-list">
                      <div className="shelves-header">
                        <h4>📚 Shelves ({shelves.length})</h4>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setShowCreateShelf(true)}
                        >
                          + Add Shelf
                        </button>
                      </div>

                      {shelves.length === 0 ? (
                        <div className="empty-sublevel">
                          <p>No shelves in this store</p>
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
                                  title="Delete shelf"
                                >
                                  🗑️
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
                                    <h6>📦 Boxes ({boxes.length})</h6>
                                    <button
                                      className="btn btn-secondary btn-xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCreateBox(true);
                                      }}
                                    >
                                      + Box
                                    </button>
                                  </div>

                                  {boxes.length === 0 ? (
                                    <p className="empty-sublevel-text">No boxes yet</p>
                                  ) : (
                                    <div className="boxes-sublevel">
                                      {boxes.map(box => (
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
                                              title="Delete box"
                                            >
                                              🗑️
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
                  <label>Box Code:</label>
                  <p>{selectedBox.box_code || selectedBox.code}</p>
                </div>
                
                <div className="detail-item">
                  <label>Capacity:</label>
                  <p>{selectedBox.capacity} units</p>
                </div>

                <div className="detail-item">
                  <label>Shelf ID:</label>
                  <p>{selectedBox.shelf_id}</p>
                </div>

                <div className="detail-item">
                  <label>Status:</label>
                  <p>
                    <span className={`status-badge ${selectedBox.is_active !== false ? 'active' : 'inactive'}`}>
                      {selectedBox.is_active !== false ? '✓ Active' : '⊗ Inactive'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Box Actions */}
              <div className="quick-actions">
                <h3>Box Actions</h3>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddProduct(true)}
                  >
                    ➕ Add Product to Box
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedBox(null)}
                  >
                    ← Back to Shelves
                  </button>
                </div>
              </div>

              {/* Products in Box */}
              <div className="box-products-section">
                <h3>📦 Products in Box</h3>
                
                {boxProducts[selectedBox.id]?.length === 0 ? (
                  <div className="empty-products">
                    <p>No products in this box yet</p>
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
                              {product.product_type === 'real_jewelry' ? '💍' : '👜'} {product.product_type}
                            </span>
                          </div>
                          <button
                            className="btn btn-icon btn-sm"
                            onClick={() => handleRemoveProduct(product.id, product.product_name)}
                            title="Remove product"
                          >
                            🗑️
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
                                  <span className="value">⚖️ {product.metal_weight_g}g</span>
                                </div>
                              )}
                              {product.purity_k && (
                                <div className="detail-row">
                                  <span className="label">Purity:</span>
                                  <span className="value">🔱 {product.purity_k}K</span>
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
                      {selectedStore.is_active ? '✓ Active' : '⊗ Inactive'}
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
                    📚 Add Shelf to This Store
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCreateStore(true)}
                  >
                    🏢 Create Another Store
                  </button>
                </div>
              </div>

              {/* Shelves Summary */}
              {selectedStore && (
                <div className="summary-section">
                  <h3>Store Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-card">
                      <h4>Total Shelves</h4>
                      <p className="summary-value">{shelves.length}</p>
                    </div>
                    <div className="summary-card">
                      <h4>Total Boxes</h4>
                      <p className="summary-value">{boxes.length}</p>
                    </div>
                  </div>
                </div>
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
        storeId={selectedStore?.id}
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
    </div>
  );
};

export default StoreManagementPage;
