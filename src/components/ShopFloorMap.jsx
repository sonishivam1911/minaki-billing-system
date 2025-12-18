/**
 * ShopFloorMap Component
 * Displays shelves positioned on a store map
 * Shows all shelves, even if they don't have coordinates (displays them in a grid)
 */
import React from 'react';

const ShopFloorMap = ({ 
  shelves = [], 
  boxes = [], 
  selectedShelf = null,
  onShelfClick = () => {},
  store = null,
  onPositionClick = null
}) => {
  // Separate shelves with and without coordinates
  const shelvesWithCoords = shelves.filter(
    s => s.visual_x !== null && s.visual_x !== undefined && 
         s.visual_y !== null && s.visual_y !== undefined
  );
  const shelvesWithoutCoords = shelves.filter(
    s => !(s.visual_x !== null && s.visual_x !== undefined && 
           s.visual_y !== null && s.visual_y !== undefined)
  );

  // Calculate map bounds for shelves with coordinates
  const mapBounds = shelvesWithCoords.length > 0 ? shelvesWithCoords.reduce((bounds, shelf) => {
    const x = shelf.visual_x;
    const y = shelf.visual_y;
    return {
      minX: Math.min(bounds.minX, x),
      maxX: Math.max(bounds.maxX, x),
      minY: Math.min(bounds.minY, y),
      maxY: Math.max(bounds.maxY, y),
    };
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }) : null;

  const mapPadding = 50;
  const mapWidth = mapBounds ? (mapBounds.maxX - mapBounds.minX + mapPadding * 2) : null;
  const mapHeight = mapBounds ? (mapBounds.maxY - mapBounds.minY + mapPadding * 2) : null;

  // Grid layout for shelves without coordinates
  const gridCols = Math.ceil(Math.sqrt(shelvesWithoutCoords.length));
  const gridItemWidth = 200;
  const gridItemHeight = 100;
  const gridGap = 20;

  return (
    <div className="summary-section" style={{ marginTop: '24px' }}>
      <h3>Store Map</h3>
      
      {/* Shelves with coordinates - positioned map */}
      {shelvesWithCoords.length > 0 && (
        <div style={{ 
          marginTop: '16px',
          marginBottom: shelvesWithoutCoords.length > 0 ? '32px' : '0',
          position: 'relative',
          width: '100%',
          height: mapHeight ? `${Math.max(mapHeight, 400)}px` : '500px',
          background: `
            linear-gradient(to right, #f5f1e8 0%, #f5f1e8 10%, transparent 10%, transparent 11%, #f5f1e8 11%),
            linear-gradient(to bottom, #f5f1e8 0%, #f5f1e8 10%, transparent 10%, transparent 11%, #f5f1e8 11%),
            repeating-linear-gradient(0deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
            repeating-linear-gradient(90deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
            #faf8f3
          `,
          backgroundSize: '50px 50px',
          border: '2px solid #d4c4a8',
          borderRadius: '8px',
          overflow: 'auto',
          minHeight: '400px'
        }}>
          {shelvesWithCoords.map(shelf => {
            const shelfBoxes = boxes.filter(b => b.shelf_id === shelf.id);
            const x = shelf.visual_x - (mapBounds?.minX || 0) + mapPadding;
            const y = shelf.visual_y - (mapBounds?.minY || 0) + mapPadding;
            
            return (
              <div
                key={shelf.id}
                onClick={() => onShelfClick(shelf)}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: '200px',
                  padding: '12px',
                  background: selectedShelf?.id === shelf.id ? '#8b6f47' : 'white',
                  color: selectedShelf?.id === shelf.id ? 'white' : '#5d4e37',
                  borderRadius: '8px',
                  border: `2px solid ${selectedShelf?.id === shelf.id ? '#5d4e37' : '#d4c4a8'}`,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: selectedShelf?.id === shelf.id ? 10 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedShelf?.id !== shelf.id) {
                    e.currentTarget.style.borderColor = '#8b6f47';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedShelf?.id !== shelf.id) {
                    e.currentTarget.style.borderColor = '#d4c4a8';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  {shelf.shelf_name || shelf.name}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
                  {shelf.shelf_code || shelf.code}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  {shelfBoxes.length} Storage Object{shelfBoxes.length !== 1 ? 's' : ''}
                </div>
                {selectedShelf?.id === shelf.id && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                    <div style={{ fontSize: '10px' }}>
                      Position: ({shelf.visual_x}, {shelf.visual_y})
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shelves without coordinates - grid layout */}
      {shelvesWithoutCoords.length > 0 && (
        <div style={{ marginTop: shelvesWithCoords.length > 0 ? '24px' : '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ color: '#5d4e37', fontSize: '16px', margin: 0 }}>
              Unpositioned Storage Types
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#8b7355', marginLeft: '8px' }}>
                ({shelvesWithoutCoords.length} need positioning)
              </span>
            </h4>
            {onPositionClick && (
              <button
                className="btn btn-primary btn-sm"
                onClick={onPositionClick}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                📍 Position on Map
              </button>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${gridItemWidth}px, 1fr))`,
            gap: `${gridGap}px`,
            padding: '16px',
            background: '#faf8f3',
            borderRadius: '8px',
            border: '2px solid #d4c4a8'
          }}>
            {shelvesWithoutCoords.map((shelf, index) => {
              const shelfBoxes = boxes.filter(b => b.shelf_id === shelf.id);
              return (
                <div
                  key={shelf.id}
                  onClick={() => onShelfClick(shelf)}
                  style={{
                    padding: '12px',
                    background: selectedShelf?.id === shelf.id ? '#8b6f47' : 'white',
                    color: selectedShelf?.id === shelf.id ? 'white' : '#5d4e37',
                    borderRadius: '8px',
                    border: `2px solid ${selectedShelf?.id === shelf.id ? '#5d4e37' : '#d4c4a8'}`,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    minHeight: `${gridItemHeight}px`
                  }}
                  onMouseEnter={(e) => {
                    if (selectedShelf?.id !== shelf.id) {
                      e.currentTarget.style.borderColor = '#8b6f47';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedShelf?.id !== shelf.id) {
                      e.currentTarget.style.borderColor = '#d4c4a8';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                    {shelf.shelf_name || shelf.name}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
                    {shelf.shelf_code || shelf.code}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    {shelfBoxes.length} Storage Object{shelfBoxes.length !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {shelves.length === 0 && (
        <div style={{
          marginTop: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          background: '#faf8f3',
          borderRadius: '8px',
          border: '2px solid #d4c4a8',
          color: '#8b7355'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            No storage types yet
          </div>
          <div style={{ fontSize: '14px' }}>
            Create storage types and position them on the map
          </div>
        </div>
      )}

      {/* Hint for positioning */}
      {shelvesWithoutCoords.length > 0 && (
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#8b7355', textAlign: 'center' }}>
          When creating storage types, use the map to position them on the store map
        </p>
      )}
    </div>
  );
};

export default ShopFloorMap;

