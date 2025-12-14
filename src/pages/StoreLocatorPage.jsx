/**
 * StoreLocatorPage - In-Store Product Locator
 * Browse stores and view inventory by shelf
 */
import React, { useState, useEffect } from 'react';
import { 
  LoadingSpinner, 
  ErrorMessage 
} from '../components';
import StoreGridView from '../components/StoreGridView';
import TransferStockModal from '../components/TransferStockModal';
import UpdateQuantityModal from '../components/UpdateQuantityModal';
import { useStoreLocator } from '../hooks';
import '../styles/App.css';

const StoreLocatorPage = () => {
  // State
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
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

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Fetch sections when store is selected
  useEffect(() => {
    if (selectedStore) {
      const locationId = selectedStore.location_id || selectedStore.id;
      fetchStoreSections(locationId);
    }
  }, [selectedStore, fetchStoreSections]);

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
    const locationId = store.location_id || store.id;
    await getStoreInventory(locationId, filters);
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