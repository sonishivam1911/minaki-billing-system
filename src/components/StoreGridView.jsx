import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ShelfBox from './ShelfBox';
import '../styles/StoreGridView.css';

/**
 * StoreGridView Component
 * Visual grid layout of shelves and boxes in a store
 * Supports drag-and-drop for moving products between locations
 * 
 * Props:
 * - store: Current store details
 * - sections: Array of shelf/section data
 * - inventory: Array of products with their locations
 * - onProductMove: Callback when product is moved (drag-drop)
 * - onSectionClick: Callback when a section/shelf is clicked
 */
const StoreGridView = ({
  store = {},
  sections = [],
  inventory = [],
  onProductMove,
  onSectionClick,
}) => {
  const [selectedSection, setSelectedSection] = useState(null);

  const handleSectionClick = (section) => {
    setSelectedSection(section.id === selectedSection ? null : section.id);
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  const handleProductDrop = async (product, fromLocation, toSectionId) => {
    try {
      if (onProductMove) {
        await onProductMove(product, fromLocation, toSectionId);
      }
    } catch (error) {
      console.error('Error moving product:', error);
      alert('Failed to move product: ' + error.message);
    }
  };

  // Group inventory by shelf_id
  // Handle both old format (item.location.section_id) and new format (item.shelf_id)
  const inventoryBySection = inventory.reduce((acc, item) => {
    // Try shelf_id first (new format), then location.shelf_id, then location.section_id (legacy)
    const shelfId = item.shelf_id || item.location?.shelf_id || item.location?.section_id || 'unknown';
    if (!acc[shelfId]) {
      acc[shelfId] = [];
    }
    acc[shelfId].push(item);
    return acc;
  }, {});

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="store-grid-view">
        <div className="store-header">
          <h2>🏬 {store.location_name || store.name || 'Store Layout'}</h2>
          <p className="store-info">
            {store.location_code && store.location_code}
            {store.city && store.state ? `${store.city}, ${store.state}` : ''}
            {store.is_warehouse && ' • 🏭 Warehouse'}
          </p>
        </div>

        <div className="shelves-grid">
          {sections.length === 0 ? (
            <div className="no-sections">
              <p>No shelves/sections available for this store</p>
            </div>
          ) : (
            sections.map((section) => (
              <ShelfBox
                key={section.id}
                section={section}
                inventory={inventoryBySection[section.id] || []}
                isSelected={selectedSection === section.id}
                onClick={() => handleSectionClick(section)}
                onProductDrop={handleProductDrop}
              />
            ))
          )}
        </div>

        {selectedSection && (
          <div className="section-detail">
            <h3>📦 Section Details</h3>
            <p>Selected Section ID: {selectedSection}</p>
            <p className="hint">
              💡 Drag products from other sections or use the Transfer button
            </p>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default StoreGridView;
