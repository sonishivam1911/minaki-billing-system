/**
 * CreateBoxModal - Modal for creating boxes in a shelf
 */
import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (!isOpen) {
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
    }
  }, [isOpen]);

  const validateSingleForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Box name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Box code is required';
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBulkForm = () => {
    const newErrors = {};
    
    bulkData.forEach((box, index) => {
      if (!box.name.trim()) {
        newErrors[`bulk_name_${index}`] = 'Box name is required';
      }
      if (!box.code.trim()) {
        newErrors[`bulk_code_${index}`] = 'Box code is required';
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
    setBulkData(prev => [...prev, {
      name: `Box ${prev.length + 1}`,
      code: `BOX_${prev.length + 1}`,
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
