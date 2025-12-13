/**
 * StoreLocatorPage - In-Store Product Locator
 * Supports both product search and store browse modes
 */
import React, { useState, useEffect } from 'react';
import { 
  SearchBar, 
  LoadingSpinner, 
  ErrorMessage 
} from '../components';
import ProductLocationCard from '../components/ProductLocationCard';
import StoreGridView from '../components/StoreGridView';
import TransferStockModal from '../components/TransferStockModal';
import UpdateQuantityModal from '../components/UpdateQuantityModal';
import { useStoreLocator } from '../hooks';
import '../styles/App.css';

const StoreLocatorPage = () => {
  // State
  const [viewMode, setViewMode] = useState('search'); // 'search' or 'browse'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [filters, setFilters] = useState({
    store_id: '',
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
    searchProductLocations,
    getStoreInventory,
    getSectionInventory,
    updateLocationQuantity,
    transferStock,
    moveProductToSection
  } = useStoreLocator();

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Fetch sections when store is selected
  useEffect(() => {
    if (selectedStore) {
      fetchStoreSections(selectedStore.id);
    }
  }, [selectedStore, fetchStoreSections]);

  // Load all sections from all stores for transfer modal
  useEffect(() => {
    const loadAllSections = async () => {
      const allSectionsList = [];
      for (const store of stores) {
        try {
          const storeSections = await fetchStoreSections(store.id);
          allSectionsList.push(...storeSections);
        } catch (err) {
          console.error(`Error loading sections for store ${store.id}:`, err);
        }
      }
      setAllSections(allSectionsList);
    };

    if (stores.length > 0) {
      loadAllSections();
    }
  }, [stores, fetchStoreSections]);

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    const searchFilters = {
      ...filters,
      store_id: filters.store_id || undefined,
      section_type: filters.section_type || undefined,
    };

    await searchProductLocations(query, searchFilters);
  };

  // Handle store selection for browse mode
  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setSelectedSection(null);
    await getStoreInventory(store.id, filters);
  };

  // Handle section click in grid view
  const handleSectionClick = async (section) => {
    setSelectedSection(section);
    await getSectionInventory(section.id);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);

    // Re-run search if in search mode
    if (viewMode === 'search' && searchQuery) {
      searchProductLocations(searchQuery, newFilters);
    }
    
    // Re-fetch store inventory if in browse mode
    if (viewMode === 'browse' && selectedStore) {
      getStoreInventory(selectedStore.id, newFilters);
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
    if (viewMode === 'search' && searchQuery) {
      await handleSearch(searchQuery);
    } else if (selectedStore) {
      await getStoreInventory(selectedStore.id, filters);
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
    if (viewMode === 'search' && searchQuery) {
      await handleSearch(searchQuery);
    } else if (selectedStore) {
      await getStoreInventory(selectedStore.id, filters);
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
        await getStoreInventory(selectedStore.id, filters);
      }
    } catch (err) {
      throw err;
    }
  };

  // Group locations by product for search view
  const groupedLocations = locations.reduce((acc, loc) => {
    const variantId = loc.variant_id || loc.variant?.id;
    if (!variantId) return acc;

    if (!acc[variantId]) {
      acc[variantId] = {
        product: loc.variant || loc.product,
        locations: []
      };
    }
    acc[variantId].locations.push(loc);
    return acc;
  }, {});

  // Prepare inventory for grid view
  const inventoryForGrid = locations.map(loc => ({
    product: loc.variant || loc.product || {},
    location: loc
  }));

  return (
    <div className="store-locator-page">
      {/* Header */}
      <div className="page-header">
        <h1>📍 In-Store Product Locator</h1>
        
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'search' ? 'active' : ''}`}
            onClick={() => setViewMode('search')}
          >
            🔍 Search Products
          </button>
          <button
            className={`toggle-btn ${viewMode === 'browse' ? 'active' : ''}`}
            onClick={() => setViewMode('browse')}
          >
            🏢 Browse Stores
          </button>
        </div>
      </div>

      {/* Search Mode */}
      {viewMode === 'search' && (
        <div className="search-mode">
          <div className="search-controls">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search by SKU or product name..."
              value={searchQuery}
            />
            
            <div className="filters">
              <select
                value={filters.store_id}
                onChange={(e) => handleFilterChange('store_id', e.target.value)}
                className="filter-select"
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.location_name || store.name}</option>
                ))}
              </select>

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

          {loading && <LoadingSpinner message="Searching locations..." />}
          {error && <ErrorMessage message={error} />}

          {!loading && !error && (
            <div className="search-results">
              {Object.keys(groupedLocations).length === 0 && searchQuery && (
                <div className="no-results">
                  <p>No locations found for "{searchQuery}"</p>
                  <p className="hint">Try a different search term or adjust filters</p>
                </div>
              )}

              {Object.values(groupedLocations).map((group) => (
                <ProductLocationCard
                  key={group.product.id}
                  product={group.product}
                  locations={group.locations}
                  onTransfer={handleTransferClick}
                  onUpdateQuantity={handleUpdateQuantityClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Browse Mode */}
      {viewMode === 'browse' && (
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
                <StoreGridView
                  store={selectedStore}
                  sections={sections}
                  inventory={inventoryForGrid}
                  onProductMove={handleProductMove}
                  onSectionClick={handleSectionClick}
                />
              )}
            </div>
          )}
        </div>
      )}

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