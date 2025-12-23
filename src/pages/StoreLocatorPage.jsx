/**
 * StoreLocatorPage - In-Store Product Locator
 * Browse stores and view inventory by shelf
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LoadingSpinner, 
  ErrorMessage 
} from '../components';
import StoreGridView from '../components/StoreGridView';
import ShopFloorMap from '../components/ShopFloorMap';
import TransferStockModal from '../components/TransferStockModal';
import UpdateQuantityModal from '../components/UpdateQuantityModal';
import { useStoreLocator } from '../hooks';
import { useStoreManagement } from '../hooks/useStoreManagement';
import { useProductLocationTracking } from '../hooks';
import boxesApi from '../services/boxApi';
import productsApi from '../services/productLocationApi';
import '../styles/App.css';

const StoreLocatorPage = () => {
  const navigate = useNavigate();
  
  // State
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [shelfBoxes, setShelfBoxes] = useState([]);
  const [boxProducts, setBoxProducts] = useState({});
  const [storeSummary, setStoreSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'map'
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [allBoxes, setAllBoxes] = useState([]);
  const [filters, setFilters] = useState({
    section_type: '',
    in_stock_only: false
  });
  
  // Modals
  const [transferModal, setTransferModal] = useState({
    isOpen: false,
    product: null,
    location: null
  });
  const [updateModal, setUpdateModal] = useState({
    isOpen: false,
    product: null,
    location: null
  });

  // All sections across all stores (for transfer modal)
  const [allSections, setAllSections] = useState([]);

  // Hook
  const {
    locations,
    stores,
    sections,
    loading,
    error,
    fetchStores,
    fetchStoreSections,
    getStoreInventory,
    getSectionInventory,
    updateLocationQuantity,
    transferStock,
    moveProductToSection
  } = useStoreLocator();

  // Additional hooks for products and boxes
  const { searchProducts } = useProductLocationTracking();
  const { fetchBoxesByShelf } = useStoreManagement();

  // Ref to track if we're currently fetching to prevent duplicate calls
  const fetchingRef = useRef(false);
  const lastStoreIdRef = useRef(null);

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  /**
   * Fetch all products in the store with their shelf and box information for the table
   */
  const fetchStoreProductsForTable = useCallback(async (locationId) => {
    try {
      setLoadingProducts(true);
      // Fetch all products in this location
      const products = await searchProducts({ location_id: locationId });
      const productsList = Array.isArray(products) ? products : products?.items || [];
      
      // Fetch all shelves and boxes to map IDs to names
      const shelvesList = await fetchStoreSections(locationId);
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
  }, [searchProducts, fetchStoreSections, fetchBoxesByShelf]);

  // Fetch sections when store is selected
  useEffect(() => {
    if (!selectedStore) {
      setAllBoxes([]);
      setStoreProducts([]);
      lastStoreIdRef.current = null;
      return;
    }

    const locationId = selectedStore.location_id || selectedStore.id;
    
    // Prevent duplicate calls for the same store
    if (lastStoreIdRef.current === locationId && fetchingRef.current) {
      return;
    }

    // Prevent infinite loops
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    lastStoreIdRef.current = locationId;

    const fetchData = async () => {
      try {
        // Fetch shelves first
        const shelvesList = await fetchStoreSections(locationId);
        
        // Fetch boxes for all shelves for the map
        if (Array.isArray(shelvesList)) {
          const allBoxesList = [];
          for (const shelf of shelvesList) {
            try {
              const boxesList = await fetchBoxesByShelf(shelf.id);
              allBoxesList.push(...boxesList);
            } catch (err) {
              console.error(`Error fetching boxes for shelf ${shelf.id}:`, err);
            }
          }
          setAllBoxes(allBoxesList);
        }
        
        // Fetch products for the table
        await fetchStoreProductsForTable(locationId);
      } catch (err) {
        console.error('Error fetching store data:', err);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();
  }, [selectedStore?.id, selectedStore?.location_id, fetchStoreSections, fetchBoxesByShelf, fetchStoreProductsForTable]);

  // Load all sections from all stores for transfer modal
  useEffect(() => {
    const loadAllSections = async () => {
      const allSectionsList = [];
      for (const store of stores) {
        try {
          const locationId = store.location_id || store.id;
          const storeSections = await fetchStoreSections(locationId);
          allSectionsList.push(...storeSections);
        } catch (err) {
          const locationId = store.location_id || store.id;
          console.error(`Error loading sections for location ${locationId}:`, err);
        }
      }
      setAllSections(allSectionsList);
    };

    if (stores.length > 0) {
      loadAllSections();
    }
  }, [stores, fetchStoreSections]);

  // Handle store selection
  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setSelectedSection(null);
    setSelectedShelf(null);
    setShelfBoxes([]);
    setBoxProducts({});
    const locationId = store.location_id || store.id;
    await getStoreInventory(locationId, filters);
    // Calculate summary
    calculateStoreSummary(locationId);
  };

  // Calculate store summary
  const calculateStoreSummary = async (locationId) => {
    try {
      const inventory = await productsApi.getSummary(locationId);
      const inventoryList = Array.isArray(inventory) ? inventory : inventory.items || inventory;
      
      const summary = {
        totalProducts: inventoryList.length,
        totalQuantity: inventoryList.reduce((sum, item) => sum + (item.total_quantity || item.quantity || 0), 0),
        byType: {},
        byShelf: {}
      };

      inventoryList.forEach(item => {
        // By product type
        const type = item.product_type || 'unknown';
        if (!summary.byType[type]) {
          summary.byType[type] = { count: 0, quantity: 0 };
        }
        summary.byType[type].count++;
        summary.byType[type].quantity += item.total_quantity || item.quantity || 0;

        // By shelf
        const shelfId = item.shelf_id || 'unknown';
        if (!summary.byShelf[shelfId]) {
          summary.byShelf[shelfId] = { count: 0, quantity: 0 };
        }
        summary.byShelf[shelfId].count++;
        summary.byShelf[shelfId].quantity += item.total_quantity || item.quantity || 0;
      });

      setStoreSummary(summary);
    } catch (err) {
      console.error('Error calculating summary:', err);
    }
  };

  // Handle shelf click - show boxes
  const handleShelfClick = async (shelf) => {
    setSelectedShelf(shelf);
    try {
      const boxes = await boxesApi.getByShelf(shelf.id, true);
      const boxesList = Array.isArray(boxes) ? boxes : boxes.items || boxes;
      setShelfBoxes(boxesList);

      // Fetch products for each box
      const productsMap = {};
      for (const box of boxesList) {
        try {
          const products = await productsApi.search({ box_id: box.id });
          const productsList = Array.isArray(products) ? products : products.items || products || [];
          productsMap[box.id] = productsList;
        } catch (err) {
          console.error(`Error fetching products for box ${box.id}:`, err);
          productsMap[box.id] = [];
        }
      }
      setBoxProducts(productsMap);
    } catch (err) {
      console.error('Error fetching boxes:', err);
      setShelfBoxes([]);
    }
  };

  // Handle section click in grid view - show boxes
  const handleSectionClick = (section) => {
    handleShelfClick(section);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // Re-fetch store inventory when filters change
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      getStoreInventory(locationId, newFilters);
    }
  };

  // Handle transfer stock
  const handleTransferClick = (location) => {
    setTransferModal({
      isOpen: true,
      product: location.variant || location.product?.variant,
      location: location
    });
  };

  const handleTransferSubmit = async (transferData) => {
    await transferStock(transferData);
    setTransferModal({ isOpen: false, product: null, location: null });
    
    // Refresh current view
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      await getStoreInventory(locationId, filters);
    }
  };

  // Handle update quantity
  const handleUpdateQuantityClick = (location) => {
    setUpdateModal({
      isOpen: true,
      product: location.variant || location.product?.variant,
      location: location
    });
  };

  const handleUpdateQuantitySubmit = async (locationId, data) => {
    await updateLocationQuantity(locationId, data);
    setUpdateModal({ isOpen: false, product: null, location: null });
    
    // Refresh current view
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      await getStoreInventory(locationId, filters);
    }
  };

  // Handle product drag-and-drop in grid view
  const handleProductMove = async (product, fromLocation, toSection) => {
    try {
      await moveProductToSection(
        product.id,
        fromLocation.id,
        toSection.id,
        fromLocation.quantity_available
      );
      
      // Refresh store inventory
      if (selectedStore) {
        const locationId = selectedStore.location_id || selectedStore.id;
        await getStoreInventory(locationId, filters);
      }
    } catch (err) {
      throw err;
    }
  };

  // Prepare inventory for grid view
  // Transform inventory data to match ShelfBox expected format
  const inventoryForGrid = locations.map(loc => {
    // Handle both old format (with variant/product) and new format (product info directly in loc)
    const product = loc.variant || loc.product || {
      id: loc.product_id,
      name: loc.product_name,
      sku: loc.sku,
      product_type: loc.product_type,
      product_id: loc.product_id,
      product_name: loc.product_name,
    };
    
    // Create location object with all necessary fields for navigation and display
    const location = {
      ...loc,
      quantity: loc.quantity || loc.total_quantity || 0,
      shelf_id: loc.shelf_id,
      box_code: loc.box_code,
      product_id: loc.product_id,
      sku: loc.sku,
      product_type: loc.product_type,
      product_name: loc.product_name,
    };
    
    return {
      product,
      location
    };
  });

  return (
    <div className="store-locator-page">
      {/* Browse Mode */}
      <div className="browse-mode">
        {!selectedStore ? (
          <div className="store-selection">
            <h2>Select a Store</h2>
            <div className="stores-grid">
              {stores.map(store => (
                <div
                  key={store.id}
                  className="store-card"
                  onClick={() => handleStoreSelect(store)}
                >
                  <h3>{store.location_name || store.name}</h3>
                  <p>{store.location_code || 'Location'}</p>
                  {store.is_warehouse && (
                    <span className="store-badge">Warehouse</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="store-view">
            <div className="store-view-header">
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedStore(null)}
              >
                ← Back to Stores
              </button>
              
              <div className="filters">
                <select
                  value={filters.section_type}
                  onChange={(e) => handleFilterChange('section_type', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Section Types</option>
                  <option value="display">Display</option>
                  <option value="vault">Vault</option>
                  <option value="storage">Storage</option>
                  <option value="counter">Counter</option>
                </select>

                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.in_stock_only}
                    onChange={(e) => handleFilterChange('in_stock_only', e.target.checked)}
                  />
                  In Stock Only
                </label>
              </div>
            </div>

            {loading && <LoadingSpinner message="Loading store layout..." />}
            {error && <ErrorMessage message={error} />}

            {!loading && !error && (
              <>
                {/* Tabs */}
                <div style={{ 
                  marginBottom: '24px',
                  borderBottom: '2px solid #d4c4a8'
                }}>
                  <div style={{ display: 'flex', gap: '0' }}>
                    <button
                      onClick={() => setActiveTab('summary')}
                      style={{
                        padding: '12px 24px',
                        background: activeTab === 'summary' ? '#8b6f47' : 'transparent',
                        color: activeTab === 'summary' ? 'white' : '#5d4e37',
                        border: 'none',
                        borderBottom: activeTab === 'summary' ? '3px solid #5d4e37' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: activeTab === 'summary' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('map')}
                      style={{
                        padding: '12px 24px',
                        background: activeTab === 'map' ? '#8b6f47' : 'transparent',
                        color: activeTab === 'map' ? 'white' : '#5d4e37',
                        border: 'none',
                        borderBottom: activeTab === 'map' ? '3px solid #5d4e37' : '3px solid transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: activeTab === 'map' ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      Map
                    </button>
                  </div>
                </div>

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <>
                    {/* Summary Cards */}
                {storeSummary && (
                  <div style={{ 
                    marginBottom: '24px', 
                    background: '#faf8f3', 
                    padding: '20px', 
                    borderRadius: '8px',
                    border: '2px solid #d4c4a8'
                  }}>
                    <h3 style={{ marginTop: 0, color: '#5d4e37', fontFamily: "'Cormorant Garamond', serif" }}>
                      Store Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#8b7355', marginBottom: '4px' }}>Total Products</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4e37' }}>{storeSummary.totalProducts}</div>
                      </div>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#8b7355', marginBottom: '4px' }}>Total Quantity</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4e37' }}>{storeSummary.totalQuantity}</div>
                      </div>
                      <div style={{ background: 'white', padding: '12px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#8b7355', marginBottom: '4px' }}>Storage Types</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#5d4e37' }}>{sections.length}</div>
                      </div>
                    </div>

                    {/* Product Types Breakdown */}
                    {Object.keys(storeSummary.byType).length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <h4 style={{ color: '#5d4e37', fontSize: '16px', marginBottom: '8px' }}>By Product Type</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
                          <thead>
                            <tr style={{ background: '#8b6f47', color: 'white' }}>
                              <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px' }}>Type</th>
                              <th style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>Products</th>
                              <th style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(storeSummary.byType).map(([type, data]) => (
                              <tr key={type} style={{ borderBottom: '1px solid #e8e0d0' }}>
                                <td style={{ padding: '10px', color: '#5d4e37' }}>{type}</td>
                                <td style={{ padding: '10px', textAlign: 'right', color: '#5d4e37' }}>{data.count}</td>
                                <td style={{ padding: '10px', textAlign: 'right', color: '#5d4e37', fontWeight: 'bold' }}>{data.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

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
                  </>
                )}

                {/* Map Tab */}
                {activeTab === 'map' && (
                  <>
                {selectedShelf ? (
                  <div style={{ marginBottom: '24px' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedShelf(null)}
                      style={{ marginBottom: '16px' }}
                    >
                      ← Back to Map
                    </button>
                    <div style={{ 
                      background: '#faf8f3', 
                      padding: '20px', 
                      borderRadius: '8px',
                      border: '2px solid #d4c4a8'
                    }}>
                      <h3 style={{ color: '#5d4e37', fontFamily: "'Cormorant Garamond', serif", marginTop: 0 }}>
                        {selectedShelf.shelf_name || selectedShelf.name} - Storage Objects
                      </h3>
                      {shelfBoxes.length === 0 ? (
                        <p style={{ color: '#8b7355', textAlign: 'center', padding: '40px' }}>
                          No storage objects in this storage type
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                          {shelfBoxes.map(box => (
                            <div 
                              key={box.id}
                              style={{
                                background: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '2px solid #d4c4a8',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b6f47'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d4c4a8'}
                            >
                              <h4 style={{ margin: '0 0 8px 0', color: '#5d4e37' }}>
                                {box.box_name || box.name}
                              </h4>
                              <p style={{ margin: '4px 0', fontSize: '12px', color: '#8b7355' }}>
                                Code: {box.box_code || box.code}
                              </p>
                              <p style={{ margin: '4px 0', fontSize: '12px', color: '#8b7355' }}>
                                Capacity: {box.capacity || '—'}
                              </p>
                              {boxProducts[box.id] && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8e0d0' }}>
                                  <div style={{ fontSize: '12px', color: '#8b7355', marginBottom: '4px' }}>
                                    Products: {boxProducts[box.id].length}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#5d4e37', fontWeight: 'bold' }}>
                                    Total: {boxProducts[box.id].reduce((sum, p) => sum + (p.quantity || 0), 0)} units
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                      <ShopFloorMap
                        shelves={sections}
                        boxes={allBoxes}
                        selectedShelf={selectedShelf}
                        onShelfClick={handleShelfClick}
                        store={selectedStore}
                        onPositionUpdated={async (updatedShelf) => {
                          // Refresh sections to get updated positions
                          if (selectedStore) {
                            const locationId = selectedStore.location_id || selectedStore.id;
                            await fetchStoreSections(locationId);
                          }
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TransferStockModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({ isOpen: false, product: null, location: null })}
        product={transferModal.product}
        fromLocation={transferModal.location}
        stores={stores}
        sections={allSections}
        onTransfer={handleTransferSubmit}
      />

      <UpdateQuantityModal
        isOpen={updateModal.isOpen}
        onClose={() => setUpdateModal({ isOpen: false, product: null, location: null })}
        product={updateModal.product}
        location={updateModal.location}
        onUpdate={handleUpdateQuantitySubmit}
      />
    </div>
  );
};

export default StoreLocatorPage;