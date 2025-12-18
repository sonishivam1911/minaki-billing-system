/**
 * PositionStorageTypesModal - Modal for positioning storage types on store map
 * Features: Drag-and-drop, pan/zoom, real-time coordinate updates
 * Updated: Removed deprecated begin/end callbacks for react-dnd v14+
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import shelvesApi from '../services/shelfApi';

// Draggable Storage Type Item
const DraggableStorageType = ({ shelf, onPositioned, onDragStateChange }) => {
  // Note: Using react-dnd v14+ compatible API (no begin/end callbacks)
  const [{ isDragging }, drag] = useDrag({
    type: 'storage-type',
    item: {
      id: shelf.id,
      name: shelf.shelf_name || shelf.name,
      code: shelf.shelf_code || shelf.code
    },
    collect: (monitor) => {
      const dragging = monitor.isDragging();
      if (dragging) {
        console.log('🟢 Drag started for shelf:', shelf.id);
      }
      return {
        isDragging: dragging,
      };
    },
  });

  // Track drag state changes - use shelf ID to track individual items
  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDragging, shelf.id);
    }
  }, [isDragging, onDragStateChange, shelf.id]);

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '12px',
        background: '#8b6f47',
        color: 'white',
        borderRadius: '8px',
        marginBottom: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
        {shelf.shelf_name || shelf.name}
      </div>
      <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
        {shelf.shelf_code || shelf.code}
      </div>
    </div>
  );
};

// Draggable Positioned Shelf Component
const DraggablePositionedShelf = ({ shelf, boxes, isSelected, onShelfClick, onUpdatePosition, onDragStateChange }) => {
  const shelfBoxes = boxes.filter(b => b.shelf_id === shelf.id);
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const clickTimeoutRef = useRef(null);

  const [{ isDragging: isDraggingDnd }, drag] = useDrag({
    type: 'positioned-shelf',
    item: {
      id: shelf.id,
      currentX: shelf.visual_x,
      currentY: shelf.visual_y
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // Reduce delay to make dragging more responsive
    delay: 50,
  });

  // Track drag state changes - use shelf ID to track individual items
  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDraggingDnd, shelf.id);
    }
  }, [isDraggingDnd, onDragStateChange, shelf.id]);

  const handleMouseDown = (e) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    
    // Set timeout to detect click (shorter than drag delay)
    clickTimeoutRef.current = setTimeout(() => {
      if (!hasMoved.current && !isDraggingDnd) {
        console.log('Click detected on shelf (timeout):', shelf.id);
        onShelfClick(shelf);
      }
    }, 150);
  };

  const handleMouseMove = () => {
    hasMoved.current = true;
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  };

  const handleMouseUp = (e) => {
    const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    // If mouse didn't move much, treat as click
    if (deltaX < 5 && deltaY < 5 && !hasMoved.current && !isDraggingDnd) {
      e.stopPropagation();
      console.log('Click detected on shelf (mouseup):', shelf.id);
      onShelfClick(shelf);
    }
  };

  return (
    <div
      ref={drag}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        left: `${shelf.visual_x}px`,
        top: `${shelf.visual_y}px`,
        width: '200px',
        padding: '12px',
        background: isSelected ? '#8b6f47' : 'white',
        color: isSelected ? 'white' : '#5d4e37',
        borderRadius: '8px',
        border: `2px solid ${isSelected ? '#5d4e37' : '#d4c4a8'}`,
        cursor: 'move',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: isSelected ? 10 : 1,
        transition: isDraggingDnd ? 'none' : 'all 0.2s',
        opacity: isDraggingDnd ? 0.7 : 1,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDraggingDnd) {
          e.currentTarget.style.borderColor = '#8b6f47';
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDraggingDnd) {
          e.currentTarget.style.borderColor = '#d4c4a8';
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {/* Clickable area */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          // Only select if we didn't just drag
          if (!hasMoved.current && !isDraggingDnd) {
            console.log('Click on shelf content:', shelf.id);
            onShelfClick(shelf);
          }
        }}
        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
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
        {isSelected && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '10px' }}>
              Position: ({Math.round(shelf.visual_x)}, {Math.round(shelf.visual_y)})
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Map Drop Zone Component
const MapDropZone = ({ 
  onDrop, 
  positionedShelves, 
  onShelfClick, 
  selectedShelfId,
  onUpdatePosition,
  boxes = [],
  transformState = null,
  onDragStateChange = null
}) => {
  const mapRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['storage-type', 'positioned-shelf'],
    drop: (item, monitor) => {
      console.log('✅ Drop triggered!', { item, monitor: monitor.getClientOffset() });
      if (!mapRef.current) {
        console.error('❌ Drop failed: mapRef.current is null');
        return;
      }
      
      const rect = mapRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      console.log('Drop details:', { rect, clientOffset, item });
      
      if (!clientOffset || !rect) {
        console.warn('❌ Drop failed: missing clientOffset or rect', { clientOffset, rect });
        return;
      }
      
      // Get coordinates relative to the map container
      let x = clientOffset.x - rect.left;
      let y = clientOffset.y - rect.top;
      
      // Account for transform (scale and translation) if available
      if (transformState) {
        const { scale, positionX, positionY } = transformState;
        // Transform coordinates back to original space
        // The transform applies: screenX = (x * scale) + positionX
        // So: x = (screenX - positionX) / scale
        x = (x - positionX) / scale;
        y = (y - positionY) / scale;
      }
      
      // Ensure coordinates are positive and within reasonable bounds
      x = Math.max(0, x);
      y = Math.max(0, y);
      
      console.log('✅ Drop event processed:', {
        item,
        clientOffset,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        calculated: { x, y },
        transformState
      });
      
      // If it's a positioned shelf being moved, use onUpdatePosition
      if (item.currentX !== undefined && item.currentY !== undefined) {
        console.log('Moving positioned shelf:', item.id);
        onUpdatePosition(item.id, x, y);
      } else {
        // New shelf being positioned
        console.log('Positioning new shelf:', item.id);
        onDrop(item.id, x, y);
      }
    },
    hover: (item, monitor) => {
      const isOverNow = monitor.isOver();
      setIsDraggingOver(isOverNow);
      if (isOverNow) {
        console.log('🟢 Hovering over drop zone');
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Notify parent when drag state changes (for drop zone hover state)
  // Note: This is different from item drag tracking - we don't need item ID here
  useEffect(() => {
    // Drop zone hover state doesn't need to disable panning
    // Only actual item dragging should disable panning
  }, [isOver, canDrop]);

  const handleMapClick = (e) => {
    // Allow clicking on map to select/deselect
    if (e.target === mapRef.current || e.target.closest('.map-background')) {
      // Map click - could be used for future features
    }
  };

  useEffect(() => {
    setIsDraggingOver(isOver);
    if (isOver) {
      console.log('Drag over drop zone');
    }
  }, [isOver]);
  
  // Debug: Log when drop zone is set up
  useEffect(() => {
    if (mapRef.current) {
      console.log('Drop zone ref set:', mapRef.current);
    }
  }, [mapRef.current]);

  // Combine refs properly
  const dropRef = useCallback((node) => {
    mapRef.current = node;
    drop(node);
    if (node) {
      console.log('✅ Drop zone ref attached:', node);
    }
  }, [drop]);

  return (
    <div
      ref={dropRef}
      onClick={handleMapClick}
      className="map-background"
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        minHeight: '600px',
        background: `
          linear-gradient(to right, #f5f1e8 0%, #f5f1e8 10%, transparent 10%, transparent 11%, #f5f1e8 11%),
          linear-gradient(to bottom, #f5f1e8 0%, #f5f1e8 10%, transparent 10%, transparent 11%, #f5f1e8 11%),
          repeating-linear-gradient(0deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          repeating-linear-gradient(90deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          #faf8f3
        `,
        backgroundSize: '50px 50px',
        border: `3px ${isDraggingOver ? 'dashed' : 'solid'} ${isDraggingOver ? '#8b6f47' : '#d4c4a8'}`,
        borderRadius: '8px',
        cursor: isDraggingOver ? 'copy' : 'default',
        transition: 'border-color 0.2s',
        overflow: 'visible',
        pointerEvents: 'auto',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(139, 111, 71, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 111, 71, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      {/* Positioned shelves */}
      {positionedShelves.map(shelf => (
        <DraggablePositionedShelf
          key={shelf.id}
          shelf={shelf}
          boxes={boxes}
          isSelected={selectedShelfId === shelf.id}
          onShelfClick={onShelfClick}
          onUpdatePosition={onUpdatePosition}
          onDragStateChange={onDragStateChange}
        />
      ))}

      {/* Drop indicator */}
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#8b6f47',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Drop here to position
          </div>
        </div>
      )}
    </div>
  );
};

const PositionStorageTypesModal = ({ 
  isOpen, 
  onClose, 
  shelves = [], 
  boxes = [],
  storeId,
  onPositionUpdated = () => {}
}) => {
  const [unpositionedShelves, setUnpositionedShelves] = useState([]);
  const [positionedShelves, setPositionedShelves] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState(null);
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const draggingItemsRef = useRef(new Set());

  // Callback to update drag state - track individual items
  const handleDragStateChange = useCallback((isDraggingNow, itemId) => {
    if (isDraggingNow) {
      draggingItemsRef.current.add(itemId);
    } else {
      draggingItemsRef.current.delete(itemId);
    }
    setIsDragging(draggingItemsRef.current.size > 0);
  }, []);

  // Separate shelves on mount/update
  useEffect(() => {
    if (isOpen && shelves.length > 0) {
      const unpositioned = shelves.filter(
        s => s.visual_x === null || s.visual_x === undefined || 
             s.visual_y === null || s.visual_y === undefined
      );
      const positioned = shelves.filter(
        s => s.visual_x !== null && s.visual_x !== undefined && 
             s.visual_y !== null && s.visual_y !== undefined
      );
      
      setUnpositionedShelves(unpositioned);
      setPositionedShelves(positioned);
    }
  }, [isOpen, shelves]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedShelfId(null);
      setSaving({});
      setErrors({});
      draggingItemsRef.current.clear();
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleDrop = useCallback(async (shelfId, x, y) => {
    try {
      setSaving(prev => ({ ...prev, [shelfId]: true }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[shelfId];
        return newErrors;
      });

      // Update coordinates via API
      await shelvesApi.updateCoordinates(shelfId, Math.round(x), Math.round(y));

      // Update local state
      const shelf = shelves.find(s => s.id === shelfId);
      if (shelf) {
        const updatedShelf = {
          ...shelf,
          visual_x: Math.round(x),
          visual_y: Math.round(y)
        };
        
        setPositionedShelves(prev => [...prev, updatedShelf]);
        setUnpositionedShelves(prev => prev.filter(s => s.id !== shelfId));
        setSelectedShelfId(shelfId);
        
        // Notify parent component
        onPositionUpdated(updatedShelf);
      }

      setSaving(prev => {
        const newSaving = { ...prev };
        delete newSaving[shelfId];
        return newSaving;
      });
    } catch (err) {
      console.error('Error positioning storage type:', err);
      setErrors(prev => ({
        ...prev,
        [shelfId]: err.message || 'Failed to save position'
      }));
      setSaving(prev => {
        const newSaving = { ...prev };
        delete newSaving[shelfId];
        return newSaving;
      });
    }
  }, [shelves, onPositionUpdated]);

  const handleUpdatePosition = useCallback(async (shelfId, x, y) => {
    try {
      setSaving(prev => ({ ...prev, [shelfId]: true }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[shelfId];
        return newErrors;
      });

      // Update coordinates via API
      await shelvesApi.updateCoordinates(shelfId, Math.round(x), Math.round(y));

      // Update local state
      setPositionedShelves(prev => 
        prev.map(s => 
          s.id === shelfId 
            ? { ...s, visual_x: Math.round(x), visual_y: Math.round(y) }
            : s
        )
      );
      
      // Notify parent component
      const updatedShelf = positionedShelves.find(s => s.id === shelfId);
      if (updatedShelf) {
        onPositionUpdated({
          ...updatedShelf,
          visual_x: Math.round(x),
          visual_y: Math.round(y)
        });
      }

      setSaving(prev => {
        const newSaving = { ...prev };
        delete newSaving[shelfId];
        return newSaving;
      });
    } catch (err) {
      console.error('Error updating position:', err);
      setErrors(prev => ({
        ...prev,
        [shelfId]: err.message || 'Failed to update position'
      }));
      setSaving(prev => {
        const newSaving = { ...prev };
        delete newSaving[shelfId];
        return newSaving;
      });
    }
  }, [positionedShelves, onPositionUpdated]);

  const handleShelfClick = (shelf) => {
    setSelectedShelfId(prev => prev === shelf.id ? null : shelf.id);
  };

  if (!isOpen) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '95vw', width: '1400px', height: '90vh' }}>
          <div className="modal-header">
            <h2>📍 Position Storage Types on Store Map</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            height: 'calc(90vh - 100px)',
            overflow: 'hidden'
          }}>
            {/* Left Sidebar - Unpositioned Storage Types */}
            <div style={{ 
              width: '280px', 
              borderRight: '2px solid #d4c4a8',
              paddingRight: '20px',
              overflowY: 'auto',
              flexShrink: 0
            }}>
              <h3 style={{ color: '#5d4e37', fontSize: '18px', marginBottom: '16px' }}>
                Unpositioned Storage Types ({unpositionedShelves.length})
              </h3>
              
              {unpositionedShelves.length === 0 ? (
                <div style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center', 
                  color: '#8b7355',
                  background: '#faf8f3',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    All storage types positioned!
                  </div>
                </div>
              ) : (
                <div>
                  {unpositionedShelves.map(shelf => (
                    <div key={shelf.id}>
                      <DraggableStorageType shelf={shelf} onDragStateChange={handleDragStateChange} />
                      {errors[shelf.id] && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#d32f2f', 
                          marginTop: '4px',
                          marginBottom: '12px',
                          padding: '8px',
                          background: '#ffebee',
                          borderRadius: '4px'
                        }}>
                          {errors[shelf.id]}
                        </div>
                      )}
                      {saving[shelf.id] && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#8b7355', 
                          marginTop: '4px',
                          marginBottom: '12px',
                          textAlign: 'center'
                        }}>
                          Saving...
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '12px', 
                    background: '#f5f1e8', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#5d4e37'
                  }}>
                    <strong>💡 Tip:</strong> Drag storage types from here and drop them on the map to position them.
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Map with Pan/Zoom */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#5d4e37', fontSize: '18px', margin: 0 }}>
                  Store Map
                </h3>
                <div style={{ fontSize: '12px', color: '#8b7355' }}>
                  {positionedShelves.length} positioned • {unpositionedShelves.length} unpositioned
                </div>
              </div>

              <div style={{ flex: 1, border: '2px solid #d4c4a8', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                <TransformWrapper
                  initialScale={1}
                  minScale={0.5}
                  maxScale={3}
                  wheel={{ step: 0.1, disabled: isDragging }}
                  pan={{ 
                    disabled: isDragging, // Disable panning when dragging
                    lockAxisX: false,
                    lockAxisY: false,
                    velocity: true,
                    velocityEqualToMove: true,
                    limitToBounds: false
                  }}
                  doubleClick={{ disabled: true }}
                  limitToBounds={false}
                  centerOnInit={false}
                  disablePadding={true}
                >
                  {({ zoomIn, zoomOut, resetTransform, state }) => {
                    // Provide default values if state is not available
                    const transformState = state ? {
                      scale: state.scale || 1,
                      positionX: state.positionX || 0,
                      positionY: state.positionY || 0
                    } : {
                      scale: 1,
                      positionX: 0,
                      positionY: 0
                    };
                    
                    return (
                      <>
                        {/* Zoom Controls */}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          background: 'white',
                          padding: '8px',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          <button
                            onClick={zoomIn}
                            style={{
                              width: '36px',
                              height: '36px',
                              border: '1px solid #d4c4a8',
                              background: '#faf8f3',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              color: '#5d4e37',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Zoom In"
                          >
                            +
                          </button>
                          <button
                            onClick={zoomOut}
                            style={{
                              width: '36px',
                              height: '36px',
                              border: '1px solid #d4c4a8',
                              background: '#faf8f3',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              color: '#5d4e37',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Zoom Out"
                          >
                            −
                          </button>
                          <button
                            onClick={resetTransform}
                            style={{
                              width: '36px',
                              height: '36px',
                              border: '1px solid #d4c4a8',
                              background: '#faf8f3',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#5d4e37',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Reset View"
                          >
                            ↺
                          </button>
                        </div>

                        <TransformComponent
                          wrapperStyle={{ 
                            width: '100%', 
                            height: '100%'
                          }}
                          contentStyle={{ 
                            width: '100%', 
                            height: '100%'
                          }}
                          wrapperClass="transform-wrapper"
                          contentClass="transform-content"
                        >
                          <MapDropZone
                            onDrop={handleDrop}
                            positionedShelves={positionedShelves}
                            onShelfClick={handleShelfClick}
                            selectedShelfId={selectedShelfId}
                            onUpdatePosition={handleUpdatePosition}
                            boxes={boxes}
                            transformState={transformState}
                          />
                        </TransformComponent>
                      </>
                    );
                  }}
                </TransformWrapper>
              </div>

              <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: '#f5f1e8', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#5d4e37'
              }}>
                <strong>💡 Instructions:</strong> Drag unpositioned storage types from the left sidebar onto the map. 
                You can drag positioned items to move them. Use zoom controls to adjust the view. 
                Positions are saved automatically.
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default PositionStorageTypesModal;

