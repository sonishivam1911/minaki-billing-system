/**
 * ShopFloorMap Component
 * Displays shelves positioned on a store map
 * Supports drag-and-drop positioning when in edit mode
 */
import React, { useState, useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import shelvesApi from '../services/shelfApi';

const ItemTypes = {
  STORAGE_TYPE: 'STORAGE_TYPE',
  POSITIONED_SHELF: 'POSITIONED_SHELF',
};

// Grid size for snapping (matches the background grid)
const GRID_SIZE = 50;

/**
 * Snap a coordinate to the nearest grid point
 * @param {number} coord - The coordinate to snap
 * @returns {number} The snapped coordinate
 */
const snapToGrid = (coord) => {
  return Math.round(coord / GRID_SIZE) * GRID_SIZE;
};

const DraggableStorageType = ({ shelf }) => {
  const [{ isDragging, canDrag }, drag, dragPreview] = useDrag({
    type: ItemTypes.STORAGE_TYPE,
    item: () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:18',message:'Drag item created',data:{shelfId:shelf.id,type:'STORAGE_TYPE'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return {
        id: shelf.id,
        name: shelf.shelf_name || shelf.name,
        code: shelf.shelf_code || shelf.code,
        type: 'new'
      };
    },
    collect: (monitor) => {
      const dragging = monitor.isDragging();
      const canDragValue = monitor.canDrag();
      // #region agent log
      if (dragging) {
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:30',message:'Dragging state changed',data:{shelfId:shelf.id,isDragging:dragging,canDrag:canDragValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      return {
        isDragging: dragging,
        canDrag: canDragValue,
      };
    },
  });

  // Use default drag preview
  React.useEffect(() => {
    dragPreview(null);
  }, [dragPreview]);

  // #region agent log
  const dragRef = React.useCallback((node) => {
    if (node) {
      drag(node);
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:48',message:'Drag ref attached',data:{shelfId:shelf.id,nodeExists:!!node,tagName:node?.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
  }, [drag, shelf.id]);
  // #endregion

  // Debug logging
  React.useEffect(() => {
    console.log('📦 DraggableStorageType mounted:', shelf.id, 'canDrag:', canDrag);
  }, [shelf.id, canDrag]);

  return (
    <div
      ref={dragRef}
      onMouseDown={(e) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:55',message:'Mouse down on draggable storage type',data:{shelfId:shelf.id,canDrag,isDragging,targetTag:e.target.tagName,clientX:e.clientX,clientY:e.clientY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }}
      onMouseMove={(e) => {
        // #region agent log
        if (e.buttons === 1) {
          fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:62',message:'Mouse move while button down',data:{shelfId:shelf.id,buttons:e.buttons},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        }
        // #endregion
      }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '12px',
        background: '#8b6f47',
        color: 'white',
        borderRadius: '8px',
        marginBottom: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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

const DraggablePositionedShelf = ({ shelf, boxes, isSelected, onShelfClick, isEditMode, saving, error, originalX, originalY }) => {
  const shelfBoxes = boxes.filter(b => b.shelf_id === shelf.id);

  const [{ isDragging, canDrag }, drag, dragPreview] = useDrag({
    type: ItemTypes.POSITIONED_SHELF,
    item: () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:104',message:'Drag item created for positioned shelf',data:{shelfId:shelf.id,type:'POSITIONED_SHELF'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return {
        id: shelf.id,
        currentX: originalX !== undefined ? originalX : shelf.visual_x,
        currentY: originalY !== undefined ? originalY : shelf.visual_y,
        type: 'existing'
      };
    },
    canDrag: isEditMode,
    collect: (monitor) => {
      const dragging = monitor.isDragging();
      const canDragValue = monitor.canDrag();
      // #region agent log
      if (dragging) {
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:117',message:'Dragging started for positioned shelf',data:{shelfId:shelf.id,isDragging:dragging,canDrag:canDragValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion
      return {
        isDragging: dragging,
        canDrag: canDragValue,
      };
    },
  });

  // Use default drag preview
  React.useEffect(() => {
    dragPreview(null);
  }, [dragPreview]);

  // #region agent log
  const dragRef = React.useCallback((node) => {
    if (node) {
      drag(node);
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:132',message:'Drag ref attached to positioned shelf',data:{shelfId:shelf.id,nodeExists:!!node,tagName:node?.tagName,isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
  }, [drag, shelf.id, isEditMode]);
  // #endregion

  // Debug logging
  React.useEffect(() => {
    if (isEditMode) {
      console.log('✅ Edit mode enabled for shelf:', shelf.id);
    }
  }, [isEditMode, shelf.id]);

  return (
    <div
      ref={dragRef}
      onClick={(e) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:147',message:'Click on positioned shelf',data:{shelfId:shelf.id,isEditMode,isDragging,willHandle:!isDragging && !isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        // Only handle click if not dragging and not in edit mode
        if (!isDragging && !isEditMode) {
          e.stopPropagation();
          onShelfClick(shelf);
        }
        // In edit mode, don't handle clicks - let drag work
      }}
      onMouseDown={(e) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:166',message:'Mouse down on positioned shelf',data:{shelfId:shelf.id,isEditMode,canDrag,isDragging,targetTag:e.target.tagName,clientX:e.clientX,clientY:e.clientY,buttons:e.buttons},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Don't prevent default - let React DND handle it
      }}
      onMouseMove={(e) => {
        // #region agent log
        if (e.buttons === 1) {
          fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:173',message:'Mouse move while button down on positioned shelf',data:{shelfId:shelf.id,buttons:e.buttons,deltaX:e.movementX,deltaY:e.movementY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        }
        // #endregion
      }}
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
        cursor: isEditMode ? 'move' : 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: isSelected ? 10 : (isDragging ? 100 : 1),
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        transition: isEditMode ? 'none' : 'all 0.2s',
        pointerEvents: 'auto'
      }}
      onMouseEnter={(e) => {
        if (!isEditMode && !isSelected && !isDragging) {
          e.currentTarget.style.borderColor = '#8b6f47';
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isEditMode && !isSelected && !isDragging) {
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
      {isSelected && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '10px' }}>
            Position: ({Math.round(shelf.visual_x)}, {Math.round(shelf.visual_y)})
          </div>
        </div>
      )}
      {saving && (
        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
          Saving...
        </div>
      )}
      {error && (
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#d32f2f' }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Empty map drop zone for when there are no positioned shelves
const EmptyMapDropZone = ({ onDrop, isEditMode }) => {
  const mapRef = useRef(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.STORAGE_TYPE, ItemTypes.POSITIONED_SHELF],
    drop: (item, monitor) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:245',message:'Drop handler called on empty map',data:{itemId:item.id,itemType:item.type,isEditMode,hasMapRef:!!mapRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      if (!isEditMode) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:249',message:'Drop rejected on empty map - not in edit mode',data:{isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return;
      }
      
      if (!mapRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:255',message:'Drop failed on empty map - mapRef is null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('❌ mapRef.current is null');
        return;
      }
      
      const clientOffset = monitor.getClientOffset();
      const rect = mapRef.current.getBoundingClientRect();
      
      if (!clientOffset) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:264',message:'Drop failed on empty map - no clientOffset',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('❌ No clientOffset');
        return;
      }
      
      // Account for scroll position in the map container
      const scrollLeft = mapRef.current.scrollLeft || 0;
      const scrollTop = mapRef.current.scrollTop || 0;
      
      // Calculate position relative to the map container (including scroll)
      let x = Math.max(0, clientOffset.x - rect.left + scrollLeft);
      let y = Math.max(0, clientOffset.y - rect.top - scrollTop);
      
      // Snap to grid for proper alignment
      x = snapToGrid(x);
      y = snapToGrid(y);
      
      // Enhanced logging for debugging coordinate issues
      console.log('📍 Empty Map Drop Coordinate Calculation:', {
        itemId: item.id,
        clientX: clientOffset.x,
        clientY: clientOffset.y,
        rectLeft: rect.left,
        rectTop: rect.top,
        rectWidth: rect.width,
        rectHeight: rect.height,
        scrollLeft,
        scrollTop,
        calculatedX: x,
        calculatedY: y
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:280',message:'Drop coordinates calculated on empty map',data:{itemId:item.id,clientX:clientOffset.x,clientY:clientOffset.y,rectLeft:rect.left,rectTop:rect.top,rectWidth:rect.width,rectHeight:rect.height,scrollLeft,scrollTop,x,y},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      // For empty map, use raw coordinates (already snapped to grid)
      onDrop(item, x, y);
      return { success: true };
    },
    collect: (monitor) => {
      const over = monitor.isOver();
      const canDropValue = monitor.canDrop();
      // #region agent log
      if (over) {
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:281',message:'Drag over empty map drop zone',data:{isOver:over,canDrop:canDropValue,isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      }
      // #endregion
      return {
        isOver: over,
        canDrop: canDropValue,
      };
    },
  });

  const attachRef = useCallback((node) => {
    if (node) {
      mapRef.current = node;
      drop(node);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:293',message:'Empty map drop zone ref attached',data:{nodeExists:!!node,tagName:node?.tagName,isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    }
  }, [drop, isEditMode]);

  return (
    <div
      ref={attachRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        background: `
          repeating-linear-gradient(0deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          repeating-linear-gradient(90deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          #faf8f3
        `,
        backgroundSize: '50px 50px',
        border: `3px ${isOver && isEditMode ? 'dashed' : 'solid'} ${isOver && isEditMode ? '#8b6f47' : '#d4c4a8'}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        pointerEvents: 'auto'
      }}
    >
      {isEditMode ? (
        <div style={{ textAlign: 'center', color: '#8b7355', pointerEvents: 'none' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Drop storage types here</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Drag from the sidebar to position them on the map
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#8b7355', pointerEvents: 'none' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            No positioned storage types yet
          </div>
          <div style={{ fontSize: '14px' }}>
            Enable edit mode to position storage types on the map
          </div>
        </div>
      )}
      {isOver && isEditMode && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#8b6f47',
          pointerEvents: 'none',
          zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          padding: '20px',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📍</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Drop here to position</div>
        </div>
      )}
    </div>
  );
};

const MapDropZone = ({ positionedShelves, onShelfClick, selectedShelfId, boxes, onDrop, isEditMode, savingStates, errorStates }) => {
  const mapRef = useRef(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.STORAGE_TYPE, ItemTypes.POSITIONED_SHELF],
    drop: (item, monitor) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:349',message:'Drop handler called',data:{itemId:item.id,itemType:item.type,isEditMode,hasMapRef:!!mapRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      
      if (!isEditMode) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:353',message:'Drop rejected - not in edit mode',data:{isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return;
      }
      
      if (!mapRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:359',message:'Drop failed - mapRef is null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('❌ mapRef.current is null');
        return;
      }
      
      const clientOffset = monitor.getClientOffset();
      const rect = mapRef.current.getBoundingClientRect();
      
      if (!clientOffset) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:368',message:'Drop failed - no clientOffset',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('❌ No clientOffset');
        return;
      }
      
      // Account for scroll position in the map container
      const scrollLeft = mapRef.current.scrollLeft || 0;
      const scrollTop = mapRef.current.scrollTop || 0;
      
      // Calculate position relative to the map container (including scroll)
      // This gives us the pixel position within the scrollable content area
      let x = Math.max(0, clientOffset.x - rect.left + scrollLeft);
      let y = Math.max(0, clientOffset.y - rect.top + scrollTop);
      
      // CRITICAL: Snap coordinates to grid for alignment
      // Simple: Drop at (x, y) → snap to grid → store directly
      // No coordinate transformations needed!
      const adjustedX = snapToGrid(x);
      const adjustedY = snapToGrid(y);
      
      // Enhanced logging for debugging coordinate issues
      console.log('📍 Drop Coordinate Calculation:', {
        itemId: item.id,
        clientX: clientOffset.x,
        clientY: clientOffset.y,
        rectLeft: rect.left,
        rectTop: rect.top,
        rectWidth: rect.width,
        rectHeight: rect.height,
        scrollLeft,
        scrollTop,
        calculatedX: x,
        calculatedY: y,
        snappedX: adjustedX,
        snappedY: adjustedY,
        mapContainer: {
          scrollWidth: mapRef.current.scrollWidth,
          scrollHeight: mapRef.current.scrollHeight,
          clientWidth: mapRef.current.clientWidth,
          clientHeight: mapRef.current.clientHeight
        }
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:415',message:'Drop coordinate calculation',data:{itemId:item.id,clientX:clientOffset.x,clientY:clientOffset.y,rectLeft:rect.left,rectTop:rect.top,rectWidth:rect.width,rectHeight:rect.height,scrollLeft,scrollTop,x,y,adjustedX,adjustedY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      
      onDrop(item, adjustedX, adjustedY);
      return { success: true };
    },
    collect: (monitor) => {
      const over = monitor.isOver();
      const canDropValue = monitor.canDrop();
      // #region agent log
      if (over) {
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:392',message:'Drag over drop zone',data:{isOver:over,canDrop:canDropValue,isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      }
      // #endregion
      return {
        isOver: over,
        canDrop: canDropValue,
      };
    },
  });

  const attachRef = useCallback((node) => {
    if (node) {
      mapRef.current = node;
      drop(node);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:405',message:'Drop zone ref attached',data:{nodeExists:!!node,tagName:node?.tagName,isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    }
  }, [drop, isEditMode]);

  // Calculate display positions - use coordinates directly, no transformations needed!
  const displayShelves = positionedShelves.map(shelf => {
    // Simple: visual_x and visual_y are already the display coordinates
    // No coordinate conversion needed - just use them directly
    const displayX = shelf.visual_x;
    const displayY = shelf.visual_y;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:475',message:'Calculating display position',data:{shelfId:shelf.id,visualX:shelf.visual_x,visualY:shelf.visual_y,displayX,displayY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    
    return { ...shelf, displayX, displayY, originalX: shelf.visual_x, originalY: shelf.visual_y };
  });

  return (
    <div
      ref={attachRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        background: `
          repeating-linear-gradient(0deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          repeating-linear-gradient(90deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          #faf8f3
        `,
        backgroundSize: '50px 50px',
        border: `3px ${isOver && isEditMode ? 'dashed' : 'solid'} ${isOver && isEditMode ? '#8b6f47' : '#d4c4a8'}`,
        borderRadius: '8px',
        overflow: 'auto',
        minHeight: '400px',
        pointerEvents: 'auto'
      }}
    >
      {displayShelves.map(shelf => (
        <DraggablePositionedShelf
          key={shelf.id}
          shelf={{ ...shelf, visual_x: shelf.displayX, visual_y: shelf.displayY }}
          boxes={boxes}
          isSelected={selectedShelfId === shelf.id}
          onShelfClick={onShelfClick}
          isEditMode={isEditMode}
          saving={savingStates[shelf.id]}
          error={errorStates[shelf.id]}
          originalX={shelf.originalX}
          originalY={shelf.originalY}
        />
      ))}

      {isOver && isEditMode && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#8b6f47',
          pointerEvents: 'none',
          zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          padding: '20px',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📍</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Drop here to position</div>
        </div>
      )}
    </div>
  );
};

const ShopFloorMap = ({ 
  shelves = [], 
  boxes = [], 
  selectedShelf = null,
  onShelfClick = () => {},
  store = null,
  onPositionUpdated = () => {}
}) => {
  // Use ref to persist edit mode across re-renders caused by prop updates
  const editModeRef = React.useRef(false);
  const [isEditMode, setIsEditModeState] = useState(false);
  
  // Wrapper to update both ref and state
  const setIsEditMode = React.useCallback((value) => {
    editModeRef.current = value;
    setIsEditModeState(value);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:540',message:'isEditMode setter called',data:{value,currentRef:editModeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
  }, []);
  
  // Sync state with ref on mount/re-render to preserve edit mode
  React.useEffect(() => {
    if (editModeRef.current !== isEditMode) {
      setIsEditModeState(editModeRef.current);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:548',message:'Syncing edit mode from ref',data:{refValue:editModeRef.current,stateValue:isEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    }
  }, [isEditMode]);
  
  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:556',message:'isEditMode state changed',data:{isEditMode,refValue:editModeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  }, [isEditMode]);
  // #endregion
  
  const [savingStates, setSavingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});
  const [localShelves, setLocalShelves] = useState(shelves);

  // Track if we're currently updating to prevent reset during drop
  const isUpdatingRef = React.useRef(false);
  
  // Update local shelves when props change, but only if we're not in the middle of an update
  React.useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:547',message:'Shelves prop changed',data:{shelvesCount:shelves.length,localShelvesCount:localShelves.length,isEditMode,isUpdating:isUpdatingRef.current,propsShelves:shelves.map(s => ({id:s.id,name:s.shelf_name || s.name,visual_x:s.visual_x,visual_y:s.visual_y,visual_x_type:typeof s.visual_x,visual_y_type:typeof s.visual_y}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
    
    // Don't reset local shelves if we're currently updating (during drop)
    // This prevents the refresh from resetting our local state
    if (!isUpdatingRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:612',message:'Updating localShelves from props',data:{shelvesCount:shelves.length,willUpdate:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
      setLocalShelves(shelves);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:616',message:'Skipping localShelves update - isUpdating=true',data:{isUpdating:isUpdatingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
    }
  }, [shelves]);

  // Separate shelves with and without coordinates
  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:615',message:'Checking shelf coordinates',data:{totalShelves:localShelves.length,shelves:localShelves.map(s => ({id:s.id,name:s.shelf_name || s.name,visual_x:s.visual_x,visual_y:s.visual_y,visual_x_type:typeof s.visual_x,visual_y_type:typeof s.visual_y,visual_x_null:s.visual_x === null,visual_x_undefined:s.visual_x === undefined,visual_y_null:s.visual_y === null,visual_y_undefined:s.visual_y === undefined}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
  }, [localShelves]);
  // #endregion
  
  const shelvesWithCoords = localShelves.filter(
    s => s.visual_x !== null && s.visual_x !== undefined && 
         s.visual_y !== null && s.visual_y !== undefined
  );
  const shelvesWithoutCoords = localShelves.filter(
    s => !(s.visual_x !== null && s.visual_x !== undefined && 
           s.visual_y !== null && s.visual_y !== undefined)
  );
  
  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:625',message:'Shelves categorization result',data:{withCoords:shelvesWithCoords.length,withoutCoords:shelvesWithoutCoords.length,withCoordsIds:shelvesWithCoords.map(s => s.id),withoutCoordsIds:shelvesWithoutCoords.map(s => s.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
  }, [shelvesWithCoords.length, shelvesWithoutCoords.length]);
  // #endregion

  // No mapBounds or mapPadding needed - using direct pixel coordinates!

  const handleDrop = useCallback(async (item, x, y) => {
    const shelfId = item.id;
    const currentEditMode = editModeRef.current; // Use ref to get current value
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:575',message:'handleDrop called',data:{shelfId,itemType:item.type,x,y,isEditMode:currentEditMode,refValue:editModeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    // Mark that we're updating to prevent prop changes from resetting local state
    isUpdatingRef.current = true;
    
    try {
      setSavingStates(prev => ({ ...prev, [shelfId]: true }));
      setErrorStates(prev => {
        const newErrors = { ...prev };
        delete newErrors[shelfId];
        return newErrors;
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:590',message:'Calling API to update coordinates',data:{shelfId,x:Math.round(x),y:Math.round(y)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      await shelvesApi.updateCoordinates(shelfId, Math.round(x), Math.round(y));

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:594',message:'API call succeeded',data:{shelfId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      // Update local state
      const updatedShelf = localShelves.find(s => s.id === shelfId);
      if (updatedShelf) {
        const newShelf = {
          ...updatedShelf,
          visual_x: Math.round(x),
          visual_y: Math.round(y)
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:604',message:'Updating local shelves state',data:{shelfId,itemType:item.type,newX:newShelf.visual_x,newY:newShelf.visual_y},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        setLocalShelves(prev => {
          if (item.type === 'new') {
            // Move from unpositioned to positioned
            return prev.map(s => s.id === shelfId ? newShelf : s);
          } else {
            // Update existing positioned shelf
            return prev.map(s => s.id === shelfId ? newShelf : s);
          }
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:661',message:'Calling onPositionUpdated callback',data:{shelfId,isEditModeBefore:editModeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // Preserve edit mode before calling callback (it might trigger a refresh)
        const wasInEditMode = editModeRef.current;
        
        // Don't call onPositionUpdated immediately - it causes a refresh that resets edit mode
        // Instead, batch updates and only refresh when user exits edit mode
        // For now, we'll skip the callback to prevent the reload issue
        // The data is already saved via API, so we can refresh later
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:669',message:'Skipping onPositionUpdated to prevent reload',data:{shelfId,wasInEditMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // Reset updating flag
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      } else {
        // Reset immediately if no shelf found
        isUpdatingRef.current = false;
      }

      setSavingStates(prev => {
        const newSaving = { ...prev };
        delete newSaving[shelfId];
        return newSaving;
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:636',message:'handleDrop completed successfully',data:{shelfId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:639',message:'handleDrop error',data:{shelfId,error:err.message,errorStack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      console.error('❌ Error in handleDrop:', err);
      setErrorStates(prev => ({ ...prev, [shelfId]: err.message || 'Failed to save position' }));
      setSavingStates(prev => {
        const newSaving = { ...prev };
        delete newSaving[shelfId];
        return newSaving;
      });
      isUpdatingRef.current = false;
    }
  }, [localShelves, onPositionUpdated]);

  const handleShelfClick = (shelf) => {
    if (!editModeRef.current) { // Use ref instead of state
      onShelfClick(shelf);
    }
  };
  
  // Refresh data when exiting edit mode
  const handleEditModeToggle = React.useCallback((newValue) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:717',message:'handleEditModeToggle called',data:{newValue,currentRef:editModeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    setIsEditMode(newValue);
    
    // When exiting edit mode, refresh data from parent
    if (!newValue && editModeRef.current) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:723',message:'Exiting edit mode - refreshing data',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      // Trigger refresh for all positioned shelves
      const positionedShelves = localShelves.filter(
        s => s.visual_x !== null && s.visual_x !== undefined && 
             s.visual_y !== null && s.visual_y !== undefined
      );
      
      // Call onPositionUpdated for the last updated shelf, or just refresh once
      if (positionedShelves.length > 0) {
        // Use the most recently positioned shelf, or just refresh
        setTimeout(() => {
          // This will trigger parent to refresh, but edit mode is already false so it won't reset
          onPositionUpdated(positionedShelves[positionedShelves.length - 1]);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:736',message:'Called onPositionUpdated on exit',data:{shelfCount:positionedShelves.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
        }, 100);
      }
    }
  }, [localShelves, onPositionUpdated]);

  // Debug: log edit mode changes
  React.useEffect(() => {
    console.log('🔄 Edit mode changed:', isEditMode);
  }, [isEditMode]);

  return (
    <div className="summary-section" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Store Map</h3>
        <button
          className={`btn ${isEditMode ? 'btn-secondary' : 'btn-primary'}`}
          onClick={(e) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e8108bd9-bb63-4042-831f-98035e7b18c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ShopFloorMap.jsx:760',message:'Button clicked',data:{currentIsEditMode:isEditMode,refValue:editModeRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
            // #endregion
            console.log('🔘 Toggle edit mode clicked, current:', isEditMode);
            handleEditModeToggle(!isEditMode);
          }}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isEditMode ? '✓ Done Editing' : '📍 Position Storage Types'}
        </button>
      </div>

      {isEditMode && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          background: '#f5f1e8', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#5d4e37'
        }}>
          <strong>💡 Edit Mode:</strong> Drag unpositioned storage types from the sidebar onto the map, or drag existing positioned shelves to reposition them. Positions are saved automatically.
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar for unpositioned shelves (only in edit mode) */}
        {isEditMode && shelvesWithoutCoords.length > 0 && (
          <div style={{ 
            width: '280px', 
            borderRight: '2px solid #d4c4a8', 
            paddingRight: '20px', 
            overflowY: 'auto', 
            flexShrink: 0,
            maxHeight: '600px'
          }}>
            <h4 style={{ color: '#5d4e37', fontSize: '16px', marginBottom: '16px' }}>
              Unpositioned Storage Types ({shelvesWithoutCoords.length})
            </h4>
            
            {shelvesWithoutCoords.map(shelf => (
              <DraggableStorageType key={shelf.id} shelf={shelf} />
            ))}
            
            <div style={{ marginTop: '20px', padding: '12px', background: '#faf8f3', borderRadius: '8px', fontSize: '12px', color: '#5d4e37' }}>
              <strong>💡 Tip:</strong> Drag storage types from here and drop them on the map.
                    </div>
                  </div>
                )}

        {/* Map Area */}
        <div style={{ flex: 1 }}>
          {shelvesWithCoords.length > 0 ? (
            <MapDropZone
              positionedShelves={shelvesWithCoords}
              onShelfClick={handleShelfClick}
              selectedShelfId={selectedShelf?.id}
              boxes={boxes}
              onDrop={handleDrop}
              isEditMode={isEditMode}
              savingStates={savingStates}
              errorStates={errorStates}
            />
          ) : (
            <EmptyMapDropZone
              onDrop={handleDrop}
              isEditMode={isEditMode}
            />
          )}
        </div>
      </div>

      {/* Unpositioned shelves grid (only when not in edit mode) */}
      {!isEditMode && shelvesWithoutCoords.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ color: '#5d4e37', fontSize: '16px', marginBottom: '12px' }}>
              Unpositioned Storage Types
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#8b7355', marginLeft: '8px' }}>
                ({shelvesWithoutCoords.length} need positioning)
              </span>
            </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px',
            padding: '16px',
            background: '#faf8f3',
            borderRadius: '8px',
            border: '2px solid #d4c4a8'
          }}>
            {shelvesWithoutCoords.map((shelf) => {
              const shelfBoxes = boxes.filter(b => b.shelf_id === shelf.id);
              return (
                <div
                  key={shelf.id}
                  onClick={() => handleShelfClick(shelf)}
                  style={{
                    padding: '12px',
                    background: selectedShelf?.id === shelf.id ? '#8b6f47' : 'white',
                    color: selectedShelf?.id === shelf.id ? 'white' : '#5d4e37',
                    borderRadius: '8px',
                    border: `2px solid ${selectedShelf?.id === shelf.id ? '#5d4e37' : '#d4c4a8'}`,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    minHeight: '100px'
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
      {localShelves.length === 0 && (
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
    </div>
  );
};

export default ShopFloorMap;
