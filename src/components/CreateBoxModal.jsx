/**
 * CreateBoxModal - Modal for creating boxes in a shelf
 */
import React, { useState, useEffect } from 'react';
import boxesApi from '../services/boxApi';

const CreateBoxModal = ({ isOpen, onClose, onSubmit, shelfId, bulkMode = false, loading = false }) => {
  const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 50,
    is_active: true
  });
  const [bulkData, setBulkData] = useState([
    { name: 'Box 1', code: 'BOX_1', capacity: 50 },
    { name: 'Box 2', code: 'BOX_2', capacity: 50 },
    { name: 'Box 3', code: 'BOX_3', capacity: 50 }
  ]);
  const [errors, setErrors] = useState({});
  const [existingBoxes, setExistingBoxes] = useState([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);

  /**
   * Generate unique box code based on existing boxes
   * Finds the highest number in existing box codes and increments
   */
  const generateUniqueBoxCode = (existingBoxes) => {
    if (!existingBoxes || existingBoxes.length === 0) {
      return 'BOX_1';
    }

    // Extract all box codes and find the highest number
    const boxCodes = existingBoxes
      .map(box => box.box_code || box.code || '')
      .filter(code => code && /^BOX_\d+$/i.test(code))
      .map(code => {
        const match = code.match(/^BOX_(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = boxCodes.length > 0 ? Math.max(...boxCodes) : 0;
    return `BOX_${maxNumber + 1}`;
  };

  /**
   * Generate unique box name based on existing boxes
   */
  const generateUniqueBoxName = (existingBoxes) => {
    if (!existingBoxes || existingBoxes.length === 0) {
      return 'Box 1';
    }

    // Extract all box names and find the highest number
    const boxNames = existingBoxes
      .map(box => box.box_name || box.name || '')
      .filter(name => name && /^Box \d+$/i.test(name))
      .map(name => {
        const match = name.match(/^Box (\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      });

    const maxNumber = boxNames.length > 0 ? Math.max(...boxNames) : 0;
    return `Box ${maxNumber + 1}`;
  };

  /**
   * Fetch existing boxes when modal opens to generate unique IDs
   */
  useEffect(() => {
    const fetchExistingBoxes = async () => {
      if (isOpen && shelfId) {
        try {
          setIsLoadingBoxes(true);
          const boxes = await boxesApi.getByShelf(shelfId, false); // Get all boxes, not just active
          const boxesList = Array.isArray(boxes) ? boxes : (boxes.items || boxes.boxes || []);
          setExistingBoxes(boxesList);

          // Generate unique codes/names based on existing boxes
          const nextCode = generateUniqueBoxCode(boxesList);
          const nextName = generateUniqueBoxName(boxesList);

          // Update single form with unique values
          setFormData({
            name: nextName,
            code: nextCode,
            capacity: 50,
            is_active: true
          });

          // Update bulk form with unique values
          const bulkCount = 3;
          const newBulkData = [];
          let tempBoxes = [...boxesList];
          
          for (let i = 0; i < bulkCount; i++) {
            const nextCode = generateUniqueBoxCode(tempBoxes);
            const nextName = generateUniqueBoxName(tempBoxes);
            
            newBulkData.push({
              name: nextName,
              code: nextCode,
              capacity: 50
            });
            
            // Add to temp list so next iteration generates unique values
            tempBoxes.push({ box_code: nextCode, box_name: nextName });
          }
          setBulkData(newBulkData);
        } catch (err) {
          console.error('Error fetching existing boxes:', err);
          // If fetch fails, use defaults
          setExistingBoxes([]);
        } finally {
          setIsLoadingBoxes(false);
        }
      } else if (!isOpen) {
        // Reset when modal closes
        setFormMode('single');
        setFormData({
          name: '',
          code: '',
          capacity: 50,
          is_active: true
        });
        setBulkData([
          { name: 'Box 1', code: 'BOX_1', capacity: 50 },
          { name: 'Box 2', code: 'BOX_2', capacity: 50 },
          { name: 'Box 3', code: 'BOX_3', capacity: 50 }
        ]);
        setErrors({});
        setExistingBoxes([]);
      }
    };

    fetchExistingBoxes();
  }, [isOpen, shelfId]);

  const validateSingleForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Box name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Box code is required';
    } else {
      // Check for duplicate code in existing boxes
      const codeExists = existingBoxes.some(
        box => (box.box_code || box.code || '').toLowerCase() === formData.code.trim().toLowerCase()
      );
      if (codeExists) {
        newErrors.code = 'This box code already exists. Please use a unique code.';
      }
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBulkForm = () => {
    const newErrors = {};
    const usedCodes = new Set();
    
    bulkData.forEach((box, index) => {
      if (!box.name.trim()) {
        newErrors[`bulk_name_${index}`] = 'Box name is required';
      }
      if (!box.code.trim()) {
        newErrors[`bulk_code_${index}`] = 'Box code is required';
      } else {
        const codeLower = box.code.trim().toLowerCase();
        
        // Check for duplicate in existing boxes
        const codeExists = existingBoxes.some(
          existingBox => (existingBox.box_code || existingBox.code || '').toLowerCase() === codeLower
        );
        if (codeExists) {
          newErrors[`bulk_code_${index}`] = 'This box code already exists in the database.';
        }
        
        // Check for duplicate within the bulk data itself
        if (usedCodes.has(codeLower)) {
          newErrors[`bulk_code_${index}`] = 'Duplicate code in this form. Each box must have a unique code.';
        } else {
          usedCodes.add(codeLower);
        }
      }
      if (box.capacity <= 0) {
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
      [name]: type === 'checkbox' ? checked : (name === 'capacity') ? parseInt(value) : value
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
      [field]: field === 'capacity' ? parseInt(value) : value
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

  const addBulkBox = () => {
    // Generate unique name and code based on existing boxes + current bulk data
    const allBoxes = [...existingBoxes, ...bulkData];
    const nextCode = generateUniqueBoxCode(allBoxes);
    const nextName = generateUniqueBoxName(allBoxes);
    
    setBulkData(prev => [...prev, {
      name: nextName,
      code: nextCode,
      capacity: 50
    }]);
  };

  const removeBulkBox = (index) => {
    setBulkData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let isValid = false;
    let dataToSubmit = null;

    if (formMode === 'single') {
      isValid = validateSingleForm();
      dataToSubmit = { ...formData, shelf_id: shelfId };
    } else {
      isValid = validateBulkForm();
      dataToSubmit = bulkData.map(box => ({
        ...box,
        shelf_id: shelfId
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
        name: '',
        code: '',
        capacity: 50,
        is_active: true
      });
      setBulkData([
        { name: 'Box 1', code: 'BOX_1', capacity: 50 },
        { name: 'Box 2', code: 'BOX_2', capacity: 50 },
        { name: 'Box 3', code: 'BOX_3', capacity: 50 }
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
          <h2>📦 Create Boxes</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {bulkMode && (
          <div className="form-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${formMode === 'single' ? 'active' : ''}`}
              onClick={() => setFormMode('single')}
            >
              Single Box
            </button>
            <button
              type="button"
              className={`toggle-btn ${formMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setFormMode('bulk')}
            >
              Multiple Boxes
            </button>
          </div>
        )}

        {isLoadingBoxes && (
          <div className="loading-indicator" style={{ padding: '20px', textAlign: 'center' }}>
            <span>Loading existing boxes...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {formMode === 'single' ? (
            <>
              <div className="form-group">
                <label htmlFor="name">Box Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Box A, Storage Box"
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="code">Box Code/QR *</label>
                  <input
                    id="code"
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., BOX_001, QR_CODE"
                    className={errors.code ? 'input-error' : ''}
                  />
                  {errors.code && <span className="error-text">{errors.code}</span>}
                  <small>Used for QR code scanning and identification</small>
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">Capacity (items) *</label>
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    placeholder="50"
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
                  <span>Active Box</span>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="bulk-form-container">
                {bulkData.map((box, index) => (
                  <div key={index} className="bulk-item">
                    <div className="bulk-item-header">
                      <h4>Box {index + 1}</h4>
                      {bulkData.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeBulkBox(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Name *</label>
                        <input
                          type="text"
                          value={box.name}
                          onChange={(e) => handleBulkChange(index, 'name', e.target.value)}
                          placeholder="Box name"
                          className={errors[`bulk_name_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`bulk_name_${index}`] && (
                          <span className="error-text">{errors[`bulk_name_${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Code/QR *</label>
                        <input
                          type="text"
                          value={box.code}
                          onChange={(e) => handleBulkChange(index, 'code', e.target.value)}
                          placeholder="Box code"
                          className={errors[`bulk_code_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`bulk_code_${index}`] && (
                          <span className="error-text">{errors[`bulk_code_${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Capacity *</label>
                        <input
                          type="number"
                          value={box.capacity}
                          onChange={(e) => handleBulkChange(index, 'capacity', e.target.value)}
                          min="1"
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
                  onClick={addBulkBox}
                >
                  + Add Another Box
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
              {loading ? 'Creating...' : formMode === 'bulk' ? `Create ${bulkData.length} Boxes` : 'Create Box'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoxModal;
