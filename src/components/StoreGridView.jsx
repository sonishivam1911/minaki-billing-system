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

  // Check if shelves have map coordinates (visual_x, visual_y)
  // Handle 0 values correctly (0 is a valid coordinate)
  // Only use map layout if ALL shelves have coordinates defined
  const sectionsWithCoordinates = sections.filter(
    section => (section.visual_x !== null && section.visual_x !== undefined) &&
                (section.visual_y !== null && section.visual_y !== undefined)
  );
  const hasMapCoordinates = sections.length > 0 && sectionsWithCoordinates.length === sections.length;

  // Calculate map container dimensions if using map layout
  const mapBounds = hasMapCoordinates ? sections.reduce((bounds, section) => {
    const x = section.visual_x;
    const y = section.visual_y;
    return {
      minX: Math.min(bounds.minX, x),
      maxX: Math.max(bounds.maxX, x),
      minY: Math.min(bounds.minY, y),
      maxY: Math.max(bounds.maxY, y),
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }) : null;

  // Add padding to map bounds
  const mapPadding = 50;
  const mapWidth = mapBounds ? (mapBounds.maxX - mapBounds.minX + mapPadding * 2) : null;
  const mapHeight = mapBounds ? (mapBounds.maxY - mapBounds.minY + mapPadding * 2) : null;

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

        {hasMapCoordinates ? (
          <div className="shelves-map-container">
            <div 
              className="shelves-map"
              style={{
                position: 'relative',
                width: mapWidth ? `${Math.max(mapWidth, 800)}px` : '100%',
                height: mapHeight ? `${Math.max(mapHeight, 400)}px` : '600px',
                minHeight: '400px',
                minWidth: '800px',
              }}
            >
            {sections.length === 0 ? (
              <div className="no-sections">
                <p>No shelves/sections available for this store</p>
              </div>
            ) : (
              sections.map((section) => {
                // All sections have coordinates at this point (hasMapCoordinates ensures this)
                const x = section.visual_x - (mapBounds?.minX || 0) + mapPadding;
                const y = section.visual_y - (mapBounds?.minY || 0) + mapPadding;
                return (
                  <div
                    key={section.id}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      width: '280px',
                      zIndex: selectedSection === section.id ? 10 : 1,
                    }}
                  >
                    <ShelfBox
                      section={section}
                      inventory={inventoryBySection[section.id] || []}
                      isSelected={selectedSection === section.id}
                      onClick={() => handleSectionClick(section)}
                      onProductDrop={handleProductDrop}
                    />
                  </div>
                );
              })
            )}
            </div>
          </div>
        ) : (
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
        )}

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
