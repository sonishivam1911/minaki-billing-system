/**
 * CreateStorageObjectModal - Modal for creating storage objects in a storage type
 */
import React, { useState, useEffect } from 'react';
import storageObjectsApi from '../services/storageObjectsApi';
import StorageTypeDropdown from './StorageTypeDropdown';

const CreateStorageObjectModal = ({ isOpen, onClose, onSubmit, storageTypeId: initialStorageTypeId, locationId, bulkMode = false, loading = false }) => {
  const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'
  const [selectedStorageTypeId, setSelectedStorageTypeId] = useState(initialStorageTypeId || null);
  const [formData, setFormData] = useState({
    storage_object_label: '',
    storage_object_code: '',
    capacity: null,
    is_active: true
  });
  const [bulkData, setBulkData] = useState([
    { storage_object_label: 'Storage Object 1', storage_object_code: 'SO_1', capacity: null },
    { storage_object_label: 'Storage Object 2', storage_object_code: 'SO_2', capacity: null },
    { storage_object_label: 'Storage Object 3', storage_object_code: 'SO_3', capacity: null }
  ]);
  const [errors, setErrors] = useState({});
  const [existingStorageObjects, setExistingStorageObjects] = useState([]);
  const [isLoadingStorageObjects, setIsLoadingStorageObjects] = useState(false);

  /**
   * Generate unique storage object code based on existing storage objects
   * Finds the highest number in existing storage object codes and increments
   */
  const generateUniqueStorageObjectCode = (existingStorageObjects) => {
    if (!existingStorageObjects || existingStorageObjects.length === 0) {
      return 'SO_1';
    }

    // Extract all storage object codes and find the highest number
    const storageObjectCodes = existingStorageObjects
      .map(so => so.storage_object_code || so.code || '')
      .filter(code => code && /^SO_\d+$/i.test(code))
      .map(code => {
        const match = code.match(/^SO_(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = storageObjectCodes.length > 0 ? Math.max(...storageObjectCodes) : 0;
    return `SO_${maxNumber + 1}`;
  };

  /**
   * Generate unique storage object label based on existing storage objects
   */
  const generateUniqueStorageObjectLabel = (existingStorageObjects) => {
    if (!existingStorageObjects || existingStorageObjects.length === 0) {
      return 'Storage Object 1';
    }

    // Extract all storage object labels and find the highest number
    const storageObjectLabels = existingStorageObjects
      .map(so => so.storage_object_label || so.name || '')
      .filter(label => label && /^Storage Object \d+$/i.test(label))
      .map(label => {
        const match = label.match(/^Storage Object (\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = storageObjectLabels.length > 0 ? Math.max(...storageObjectLabels) : 0;
    return `Storage Object ${maxNumber + 1}`;
  };

  /**
   * Fetch existing storage objects when modal opens to generate unique IDs
   */
  useEffect(() => {
    const fetchExistingStorageObjects = async () => {
      if (isOpen && selectedStorageTypeId) {
        try {
          setIsLoadingStorageObjects(true);
          const storageObjects = await storageObjectsApi.getByStorageType(selectedStorageTypeId, false); // Get all storage objects, not just active
          const storageObjectsList = Array.isArray(storageObjects) ? storageObjects : (storageObjects.items || storageObjects.storage_objects || []);
          setExistingStorageObjects(storageObjectsList);

          // Generate unique codes/labels based on existing storage objects
          const nextCode = generateUniqueStorageObjectCode(storageObjectsList);
          const nextLabel = generateUniqueStorageObjectLabel(storageObjectsList);

          // Update single form with unique values
          setFormData({
            storage_object_label: nextLabel,
            storage_object_code: nextCode,
            capacity: null,
            is_active: true
          });

          // Update bulk form with unique values
          const bulkCount = 3;
          const newBulkData = [];
          let tempStorageObjects = [...storageObjectsList];
          
          for (let i = 0; i < bulkCount; i++) {
            const nextCode = generateUniqueStorageObjectCode(tempStorageObjects);
            const nextLabel = generateUniqueStorageObjectLabel(tempStorageObjects);
            
            newBulkData.push({
              storage_object_label: nextLabel,
              storage_object_code: nextCode,
              capacity: null
            });
            
            // Add to temp list so next iteration generates unique values
            tempStorageObjects.push({ storage_object_code: nextCode, storage_object_label: nextLabel });
          }
          setBulkData(newBulkData);
        } catch (err) {
          console.error('Error fetching existing storage objects:', err);
          // If fetch fails, use defaults
          setExistingStorageObjects([]);
        } finally {
          setIsLoadingStorageObjects(false);
        }
      } else if (!isOpen) {
        // Reset when modal closes
        setFormMode('single');
        setSelectedStorageTypeId(initialStorageTypeId || null);
        setFormData({
          storage_object_label: '',
          storage_object_code: '',
          capacity: null,
          is_active: true
        });
        setBulkData([
          { storage_object_label: 'Storage Object 1', storage_object_code: 'SO_1', capacity: null },
          { storage_object_label: 'Storage Object 2', storage_object_code: 'SO_2', capacity: null },
          { storage_object_label: 'Storage Object 3', storage_object_code: 'SO_3', capacity: null }
        ]);
        setErrors({});
        setExistingStorageObjects([]);
      }
    };

    fetchExistingStorageObjects();
  }, [isOpen, selectedStorageTypeId, initialStorageTypeId]);

  const handleStorageTypeChange = (storageTypeId, storageType) => {
    setSelectedStorageTypeId(storageTypeId);
    setExistingStorageObjects([]);
    setErrors({});
  };

  const validateSingleForm = () => {
    const newErrors = {};
    
    if (!selectedStorageTypeId) {
      newErrors.storage_type_id = 'Storage Type is required';
    }
    
    if (!formData.storage_object_label.trim()) {
      newErrors.storage_object_label = 'Storage Object label is required';
    }
    
    if (!formData.storage_object_code.trim()) {
      newErrors.storage_object_code = 'Storage Object code is required';
    } else {
      // Check for duplicate code in existing storage objects
      const codeExists = existingStorageObjects.some(
        so => (so.storage_object_code || so.code || '').toLowerCase() === formData.storage_object_code.trim().toLowerCase()
      );
      if (codeExists) {
        newErrors.storage_object_code = 'This storage object code already exists. Please use a unique code.';
      }
    }
    
    if (formData.capacity !== null && formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBulkForm = () => {
    const newErrors = {};
    const usedCodes = new Set();
    
    if (!selectedStorageTypeId) {
      newErrors.storage_type_id = 'Storage Type is required';
    }
    
    bulkData.forEach((storageObject, index) => {
      if (!storageObject.storage_object_label.trim()) {
        newErrors[`bulk_storage_object_label_${index}`] = 'Storage Object label is required';
      }
      if (!storageObject.storage_object_code.trim()) {
        newErrors[`bulk_storage_object_code_${index}`] = 'Storage Object code is required';
      } else {
        const codeLower = storageObject.storage_object_code.trim().toLowerCase();
        
        // Check for duplicate in existing storage objects
        const codeExists = existingStorageObjects.some(
          existingSO => (existingSO.storage_object_code || existingSO.code || '').toLowerCase() === codeLower
        );
        if (codeExists) {
          newErrors[`bulk_storage_object_code_${index}`] = 'This storage object code already exists in the database.';
        }
        
        // Check for duplicate within the bulk data itself
        if (usedCodes.has(codeLower)) {
          newErrors[`bulk_storage_object_code_${index}`] = 'Duplicate code in this form. Each storage object must have a unique code.';
        } else {
          usedCodes.add(codeLower);
        }
      }
      if (storageObject.capacity !== null && storageObject.capacity <= 0) {
        newErrors[`bulk_capacity_${index}`] = 'Capacity must be greater than 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'capacity') ? (value ? parseFloat(value) : null) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

  const addBulkStorageObject = () => {
    // Generate unique label and code based on existing storage objects + current bulk data
    const allStorageObjects = [...existingStorageObjects, ...bulkData];
    const nextCode = generateUniqueStorageObjectCode(allStorageObjects);
    const nextLabel = generateUniqueStorageObjectLabel(allStorageObjects);
    
    setBulkData(prev => [...prev, {
      storage_object_label: nextLabel,
      storage_object_code: nextCode,
      capacity: null
    }]);
  };

  const removeBulkStorageObject = (index) => {
    setBulkData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let isValid = false;
    let dataToSubmit = null;

    if (formMode === 'single') {
      isValid = validateSingleForm();
      dataToSubmit = { 
        ...formData, 
        storage_type_id: selectedStorageTypeId 
      };
    } else {
      isValid = validateBulkForm();
      dataToSubmit = bulkData.map(storageObject => ({
        ...storageObject,
        storage_type_id: selectedStorageTypeId
      }));
    }
    
    if (!isValid) {
      return;
    }
    
    try {
      await onSubmit(dataToSubmit, formMode);
      
      // Reset form
      setFormMode('single');
      setFormData({
        storage_object_label: '',
        storage_object_code: '',
        capacity: null,
        is_active: true
      });
      setBulkData([
        { storage_object_label: 'Storage Object 1', storage_object_code: 'SO_1', capacity: null },
        { storage_object_label: 'Storage Object 2', storage_object_code: 'SO_2', capacity: null },
        { storage_object_label: 'Storage Object 3', storage_object_code: 'SO_3', capacity: null }
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
          <h2>📦 Create Storage Objects</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {bulkMode && (
          <div className="form-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${formMode === 'single' ? 'active' : ''}`}
              onClick={() => setFormMode('single')}
            >
              Single Storage Object
            </button>
            <button
              type="button"
              className={`toggle-btn ${formMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setFormMode('bulk')}
            >
              Multiple Storage Objects
            </button>
          </div>
        )}

        {isLoadingStorageObjects && (
          <div className="loading-indicator" style={{ padding: '20px', textAlign: 'center' }}>
            <span>Loading existing storage objects...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Storage Type Selection */}
          <div className="form-group">
            <label htmlFor="storage_type_id">Storage Type *</label>
            <StorageTypeDropdown
              locationId={locationId}
              value={selectedStorageTypeId}
              onChange={handleStorageTypeChange}
              activeOnly={true}
              placeholder="Select Storage Type"
              disabled={!!initialStorageTypeId}
              className={errors.storage_type_id ? 'input-error' : ''}
            />
            {errors.storage_type_id && <span className="error-text">{errors.storage_type_id}</span>}
          </div>

          {formMode === 'single' ? (
            <>
              <div className="form-group">
                <label htmlFor="storage_object_label">Storage Object Label *</label>
                <input
                  id="storage_object_label"
                  type="text"
                  name="storage_object_label"
                  value={formData.storage_object_label}
                  onChange={handleChange}
                  placeholder="e.g., Storage Object A, Storage Box"
                  className={errors.storage_object_label ? 'input-error' : ''}
                />
                {errors.storage_object_label && <span className="error-text">{errors.storage_object_label}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="storage_object_code">Storage Object Code/QR *</label>
                  <input
                    id="storage_object_code"
                    type="text"
                    name="storage_object_code"
                    value={formData.storage_object_code}
                    onChange={handleChange}
                    placeholder="e.g., SO_001, QR_CODE"
                    className={errors.storage_object_code ? 'input-error' : ''}
                  />
                  {errors.storage_object_code && <span className="error-text">{errors.storage_object_code}</span>}
                  <small>Used for QR code scanning and identification</small>
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">Capacity (optional)</label>
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    value={formData.capacity || ''}
                    onChange={handleChange}
                    placeholder="e.g., 50"
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
                  <span>Active Storage Object</span>
                </label>
              </div>

            </>
          ) : (
            <>
              <div className="bulk-form-container">
                {bulkData.map((storageObject, index) => (
                    <div key={index} className="bulk-item">
                      <div className="bulk-item-header">
                        <h4>Storage Object {index + 1}</h4>
                        {bulkData.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeBulkStorageObject(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Storage Object Label *</label>
                        <input
                          type="text"
                          value={storageObject.storage_object_label}
                          onChange={(e) => handleBulkChange(index, 'storage_object_label', e.target.value)}
                          placeholder="Storage Object label"
                          className={errors[`bulk_storage_object_label_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`bulk_storage_object_label_${index}`] && (
                          <span className="error-text">{errors[`bulk_storage_object_label_${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Code/QR *</label>
                        <input
                          type="text"
                          value={storageObject.storage_object_code}
                          onChange={(e) => handleBulkChange(index, 'storage_object_code', e.target.value)}
                          placeholder="Storage Object code"
                          className={errors[`bulk_storage_object_code_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`bulk_storage_object_code_${index}`] && (
                          <span className="error-text">{errors[`bulk_storage_object_code_${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Capacity (optional)</label>
                        <input
                          type="number"
                          value={storageObject.capacity || ''}
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

                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addBulkStorageObject}
                >
                  + Add Another Storage Object
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
              {loading ? 'Creating...' : formMode === 'bulk' ? `Create ${bulkData.length} Storage Objects` : 'Create Storage Object'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStorageObjectModal;

