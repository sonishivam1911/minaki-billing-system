/**
 * CreateStorageTypeModal - Modal for creating storage types in a store
 */
import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import storageTypesApi from '../services/storageTypesApi';

// Draggable Storage Type Preview Component
const DraggableStorageTypePreview = ({ storageTypeName, storageTypeCode }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'storage_type',
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '12px',
        background: '#8b6f47',
        color: 'white',
        borderRadius: '4px',
        textAlign: 'center',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
          📚 {storageTypeName || 'New Storage Type'}
      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
        {storageTypeCode || 'DRAG TO MAP'}
      </div>
    </div>
  );
};

// Drop Zone Component (The Map)
const StorageTypeLayoutMap = ({ onPlaceStorageType, visualX, visualY }) => {
  const mapRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [{ isOver }, drop] = useDrop({
    accept: 'storage_type',
    drop: (item, monitor) => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (clientOffset) {
          const x = clientOffset.x - rect.left;
          const y = clientOffset.y - rect.top;
          onPlaceStorageType(x, y);
        }
      }
    },
    hover: () => {
      setIsDraggingOver(true);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleMapClick = (e) => {
    if (mapRef.current && !isOver) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onPlaceStorageType(x, y);
    }
  };

  useEffect(() => {
    setIsDraggingOver(isOver);
  }, [isOver]);

  return (
    <div
      ref={(node) => {
        mapRef.current = node;
        drop(node);
      }}
      onClick={handleMapClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        background: `
          linear-gradient(to right, #f5f1e8 0%, #f5f1e8 10%, transparent 10%, transparent 11%, #f5f1e8 11%),
          linear-gradient(to bottom, #f5f1e8 0%, #f5f1e8 10%, transparent 10%, transparent 11%, #f5f1e8 11%),
          repeating-linear-gradient(0deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          repeating-linear-gradient(90deg, #e8e0d0 0px, #e8e0d0 1px, transparent 1px, transparent 50px),
          #faf8f3
        `,
        backgroundSize: '50px 50px',
        border: `2px dashed ${isDraggingOver ? '#8b6f47' : '#d4c4a8'}`,
        borderRadius: '8px',
        cursor: 'crosshair',
        transition: 'border-color 0.2s',
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
      
      {/* Marker for placed storage type */}
      {visualX !== null && visualY !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${visualX}px`,
            top: `${visualY}px`,
            transform: 'translate(-50%, -50%)',
            width: '120px',
            padding: '8px',
            background: '#8b6f47',
            color: 'white',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          📚 Storage Type
          <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.9 }}>
            ({Math.round(visualX)}, {Math.round(visualY)})
          </div>
        </div>
      )}

      {/* Instructions */}
      {visualX === null && visualY === null && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#8b7355',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>📍</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            {isDraggingOver ? 'Drop storage type here' : 'Drag storage type here or click to place'}
          </div>
        </div>
      )}
    </div>
  );
};

const CreateStorageTypeModal = ({ isOpen, onClose, onSubmit, storeId, bulkMode = false, loading = false }) => {
  const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'
  const [formData, setFormData] = useState({
    storage_type_name: '',
    storage_type_code: '',
    capacity: null,
    is_active: true,
    visual_x: null,
    visual_y: null
  });
  const [bulkData, setBulkData] = useState([
    { storage_type_name: 'Storage Type A', storage_type_code: 'ST_A', capacity: null, visual_x: null, visual_y: null },
    { storage_type_name: 'Storage Type B', storage_type_code: 'ST_B', capacity: null, visual_x: null, visual_y: null },
    { storage_type_name: 'Storage Type C', storage_type_code: 'ST_C', capacity: null, visual_x: null, visual_y: null }
  ]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormMode('single');
      setFormData({
        storage_type_name: '',
        storage_type_code: '',
        capacity: null,
        is_active: true,
        visual_x: null,
        visual_y: null
      });
      setBulkData([
        { storage_type_name: 'Storage Type A', storage_type_code: 'ST_A', capacity: null, visual_x: null, visual_y: null },
        { storage_type_name: 'Storage Type B', storage_type_code: 'ST_B', capacity: null, visual_x: null, visual_y: null },
        { storage_type_name: 'Storage Type C', storage_type_code: 'ST_C', capacity: null, visual_x: null, visual_y: null }
      ]);
      setErrors({});
    }
  }, [isOpen]);

  const validateSingleForm = () => {
    const newErrors = {};
    
    if (!formData.storage_type_name.trim()) {
      newErrors.storage_type_name = 'Storage Type name is required';
    }
    
    if (!formData.storage_type_code.trim()) {
      newErrors.storage_type_code = 'Storage Type code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBulkForm = () => {
    const newErrors = {};
    
    bulkData.forEach((storageType, index) => {
      if (!storageType.storage_type_name.trim()) {
        newErrors[`bulk_storage_type_name_${index}`] = 'Storage Type name is required';
      }
      if (!storageType.storage_type_code.trim()) {
        newErrors[`bulk_storage_type_code_${index}`] = 'Storage Type code is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked) : (name === 'capacity' ? (value ? parseFloat(value) : null) : value)
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePlaceStorageType = (x, y) => {
    setFormData(prev => ({
      ...prev,
      visual_x: Math.round(x),
      visual_y: Math.round(y)
    }));
  };

  const handleBulkChange = (index, field, value) => {
    const newBulkData = [...bulkData];
    newBulkData[index] = {
      ...newBulkData[index],
      [field]: field === 'capacity' ? (value ? parseFloat(value) : null) : value
    };
    setBulkData(newBulkData);
    
    const errorKey = `bulk_${field}_${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const handleBulkPlaceStorageType = (index, x, y) => {
    const newBulkData = [...bulkData];
    newBulkData[index] = {
      ...newBulkData[index],
      visual_x: Math.round(x),
      visual_y: Math.round(y)
    };
    setBulkData(newBulkData);
  };

  const addBulkStorageType = () => {
    setBulkData(prev => [...prev, {
      storage_type_name: `Storage Type ${String.fromCharCode(65 + prev.length)}`,
      storage_type_code: `ST_${String.fromCharCode(65 + prev.length)}`,
      capacity: null,
      visual_x: null,
      visual_y: null
    }]);
  };

  const removeBulkStorageType = (index) => {
    setBulkData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let isValid = false;
    let dataToSubmit = null;
    let coordinatesToSave = [];

    if (formMode === 'single') {
      isValid = validateSingleForm();
      const { visual_x, visual_y, ...storageTypeData } = formData;
      dataToSubmit = { 
        ...storageTypeData, 
        location_id: storeId
      };
      // Store coordinates separately to save after creation
      if (visual_x !== null && visual_y !== null) {
        coordinatesToSave = [{ visual_x, visual_y }];
      }
    } else {
      isValid = validateBulkForm();
      dataToSubmit = bulkData.map(storageType => {
        const { visual_x, visual_y, ...storageTypeData } = storageType;
        return {
          ...storageTypeData,
          location_id: storeId
        };
      });
      // Store coordinates separately
      coordinatesToSave = bulkData
        .filter(storageType => storageType.visual_x !== null && storageType.visual_y !== null)
        .map((storageType, index) => ({
          index,
          visual_x: storageType.visual_x,
          visual_y: storageType.visual_y
        }));
    }
    
    if (!isValid) {
      return;
    }
    
    try {
      const result = await onSubmit(dataToSubmit, formMode);
      
      // Save coordinates after creation if provided
      if (coordinatesToSave.length > 0) {
        try {
          if (formMode === 'single') {
            // Single storage type - result should be the created storage type object
            const createdStorageType = Array.isArray(result) ? result[0] : result;
            if (createdStorageType?.id && coordinatesToSave[0]) {
              await storageTypesApi.updateCoordinates(
                createdStorageType.id,
                coordinatesToSave[0].visual_x,
                coordinatesToSave[0].visual_y
              );
            }
          } else {
            // Bulk storage types - result should be array of created storage types
            const createdStorageTypes = Array.isArray(result) ? result : [];
            const updates = coordinatesToSave
              .map(coord => {
                const storageType = createdStorageTypes[coord.index];
                return storageType?.id ? {
                  id: storageType.id,
                  visual_x: coord.visual_x,
                  visual_y: coord.visual_y
                } : null;
              })
              .filter(Boolean);
            
            if (updates.length > 0) {
              await storageTypesApi.bulkUpdateCoordinates(updates);
            }
          }
        } catch (coordErr) {
          console.error('Error saving coordinates:', coordErr);
          // Don't fail the whole operation if coordinates fail
        }
      }
      
      // Reset form
      setFormMode('single');
      setFormData({
        storage_type_name: '',
        storage_type_code: '',
        capacity: null,
        is_active: true,
        visual_x: null,
        visual_y: null
      });
      setBulkData([
        { storage_type_name: 'Storage Type A', storage_type_code: 'ST_A', capacity: null, visual_x: null, visual_y: null },
        { storage_type_name: 'Storage Type B', storage_type_code: 'ST_B', capacity: null, visual_x: null, visual_y: null },
        { storage_type_name: 'Storage Type C', storage_type_code: 'ST_C', capacity: null, visual_x: null, visual_y: null }
      ]);
      setErrors({});
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📚 Create Storage Types</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {bulkMode && (
            <div className="form-mode-toggle">
              <button
                type="button"
                className={`toggle-btn ${formMode === 'single' ? 'active' : ''}`}
                onClick={() => setFormMode('single')}
              >
                Single Storage Type
              </button>
              <button
                type="button"
                className={`toggle-btn ${formMode === 'bulk' ? 'active' : ''}`}
                onClick={() => setFormMode('bulk')}
              >
                Multiple Storage Types
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            {formMode === 'single' ? (
              <>
                <div className="form-group">
                  <label htmlFor="storage_type_name">Storage Type Name *</label>
                  <input
                    id="storage_type_name"
                    type="text"
                    name="storage_type_name"
                    value={formData.storage_type_name}
                    onChange={handleChange}
                    placeholder="e.g., Storage Type A, Display Storage Type"
                    className={errors.storage_type_name ? 'input-error' : ''}
                  />
                  {errors.storage_type_name && <span className="error-text">{errors.storage_type_name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="storage_type_code">Storage Type Code *</label>
                    <input
                      id="storage_type_code"
                      type="text"
                      name="storage_type_code"
                      value={formData.storage_type_code}
                      onChange={handleChange}
                      placeholder="e.g., ST_A"
                      className={errors.storage_type_code ? 'input-error' : ''}
                    />
                    {errors.storage_type_code && <span className="error-text">{errors.storage_type_code}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="capacity">Capacity (optional)</label>
                    <input
                      id="capacity"
                      type="number"
                      name="capacity"
                      value={formData.capacity || ''}
                      onChange={handleChange}
                      placeholder="e.g., 100"
                      min="0"
                      step="0.01"
                      className={errors.capacity ? 'input-error' : ''}
                    />
                    {errors.capacity && <span className="error-text">{errors.capacity}</span>}
                  </div>
                </div>

                <div className="form-group checkbox">
                  <label htmlFor="is_active">
                    <input
                      id="is_active"
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <span>Active Storage Type</span>
                  </label>
                </div>

                {/* Drag and Drop Storage Type Placement */}
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label>Place Storage Type on Layout Map</label>
                  
                  {/* Draggable Storage Type Preview */}
                  <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <DraggableStorageTypePreview 
                      storageTypeName={formData.storage_type_name || 'New Storage Type'} 
                      storageTypeCode={formData.storage_type_code || 'DRAG TO MAP'}
                    />
                    <small style={{ color: '#8b7355' }}>
                      Drag this storage type to the map below or click on the map to place it
                    </small>
                  </div>

                  {/* Layout Map */}
                  <StorageTypeLayoutMap 
                    onPlaceStorageType={handlePlaceStorageType}
                    visualX={formData.visual_x}
                    visualY={formData.visual_y}
                  />

                  {/* Coordinate Display */}
                  {formData.visual_x !== null && formData.visual_y !== null && (
                    <div style={{ marginTop: '12px', padding: '8px', background: '#f5f1e8', borderRadius: '4px' }}>
                      <strong>Coordinates:</strong> X: {formData.visual_x}px, Y: {formData.visual_y}px
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, visual_x: null, visual_y: null }))}
                        style={{
                          marginLeft: '12px',
                          padding: '4px 8px',
                          background: '#8b6f47',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Clear Position
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bulk-form-container">
                  {bulkData.map((storageType, index) => (
                    <div key={index} className="bulk-item">
                      <div className="bulk-item-header">
                        <h4>Storage Type {index + 1}</h4>
                        {bulkData.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeBulkStorageType(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Storage Type Name *</label>
                          <input
                            type="text"
                            value={storageType.storage_type_name}
                            onChange={(e) => handleBulkChange(index, 'storage_type_name', e.target.value)}
                            placeholder="Storage Type name"
                            className={errors[`bulk_storage_type_name_${index}`] ? 'input-error' : ''}
                          />
                          {errors[`bulk_storage_type_name_${index}`] && (
                            <span className="error-text">{errors[`bulk_storage_type_name_${index}`]}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Code *</label>
                          <input
                            type="text"
                            value={storageType.storage_type_code}
                            onChange={(e) => handleBulkChange(index, 'storage_type_code', e.target.value)}
                            placeholder="Storage Type code"
                            className={errors[`bulk_storage_type_code_${index}`] ? 'input-error' : ''}
                          />
                          {errors[`bulk_storage_type_code_${index}`] && (
                            <span className="error-text">{errors[`bulk_storage_type_code_${index}`]}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Capacity (optional)</label>
                          <input
                            type="number"
                            value={storageType.capacity || ''}
                            onChange={(e) => handleBulkChange(index, 'capacity', e.target.value)}
                            placeholder="Capacity"
                            min="0"
                            step="0.01"
                            className={errors[`bulk_capacity_${index}`] ? 'input-error' : ''}
                          />
                          {errors[`bulk_capacity_${index}`] && (
                            <span className="error-text">{errors[`bulk_capacity_${index}`]}</span>
                          )}
                        </div>
                      </div>

                      {/* Layout Map for each bulk storage type */}
                      <div className="form-group" style={{ marginTop: '12px' }}>
                        <label>Place Storage Type on Map</label>
                        <div style={{ marginBottom: '8px' }}>
                          <DraggableStorageTypePreview 
                            storageTypeName={storageType.storage_type_name || `Storage Type ${index + 1}`} 
                            storageTypeCode={storageType.storage_type_code || 'DRAG TO MAP'}
                          />
                        </div>
                        <StorageTypeLayoutMap 
                          onPlaceStorageType={(x, y) => handleBulkPlaceStorageType(index, x, y)}
                          visualX={storageType.visual_x}
                          visualY={storageType.visual_y}
                        />
                        {storageType.visual_x !== null && storageType.visual_y !== null && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#8b7355' }}>
                            Position: ({storageType.visual_x}, {storageType.visual_y})
                            <button
                              type="button"
                              onClick={() => handleBulkPlaceStorageType(index, null, null)}
                              style={{
                                marginLeft: '8px',
                                padding: '2px 6px',
                                background: '#8b6f47',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addBulkStorageType}
                  >
                    + Add Another Storage Type
                  </button>
                </div>
              </>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : formMode === 'bulk' ? `Create ${bulkData.length} Storage Types` : 'Create Storage Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default CreateStorageTypeModal;

