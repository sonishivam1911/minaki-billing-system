/**
 * CreateShelfModal - Modal for creating shelves in a store
 */
import React, { useState, useEffect } from 'react';

const CreateShelfModal = ({ isOpen, onClose, onSubmit, storeId, bulkMode = false, loading = false }) => {
  const [formMode, setFormMode] = useState('single'); // 'single' or 'bulk'
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true
  });
  const [bulkData, setBulkData] = useState([
    { name: 'Shelf A', code: 'SHELF_A' },
    { name: 'Shelf B', code: 'SHELF_B' },
    { name: 'Shelf C', code: 'SHELF_C' }
  ]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormMode('single');
      setFormData({
        name: '',
        code: '',
        is_active: true
      });
      setBulkData([
        { name: 'Shelf A', code: 'SHELF_A' },
        { name: 'Shelf B', code: 'SHELF_B' },
        { name: 'Shelf C', code: 'SHELF_C' }
      ]);
      setErrors({});
    }
  }, [isOpen]);

  const validateSingleForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Shelf name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Shelf code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBulkForm = () => {
    const newErrors = {};
    
    bulkData.forEach((shelf, index) => {
      if (!shelf.name.trim()) {
        newErrors[`bulk_name_${index}`] = 'Shelf name is required';
      }
      if (!shelf.code.trim()) {
        newErrors[`bulk_code_${index}`] = 'Shelf code is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      [field]: value
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

  const addBulkShelf = () => {
    setBulkData(prev => [...prev, {
      name: `Shelf ${String.fromCharCode(65 + prev.length)}`,
      code: `SHELF_${String.fromCharCode(65 + prev.length)}`
    }]);
  };

  const removeBulkShelf = (index) => {
    setBulkData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let isValid = false;
    let dataToSubmit = null;

    if (formMode === 'single') {
      isValid = validateSingleForm();
      dataToSubmit = { ...formData, location_id: storeId };
    } else {
      isValid = validateBulkForm();
      dataToSubmit = bulkData.map(shelf => ({
        ...shelf,
        location_id: storeId
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
        is_active: true
      });
      setBulkData([
        { name: 'Shelf A', code: 'SHELF_A' },
        { name: 'Shelf B', code: 'SHELF_B' },
        { name: 'Shelf C', code: 'SHELF_C' }
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
          <h2>📚 Create Shelves</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {bulkMode && (
          <div className="form-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${formMode === 'single' ? 'active' : ''}`}
              onClick={() => setFormMode('single')}
            >
              Single Shelf
            </button>
            <button
              type="button"
              className={`toggle-btn ${formMode === 'bulk' ? 'active' : ''}`}
              onClick={() => setFormMode('bulk')}
            >
              Multiple Shelves
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {formMode === 'single' ? (
            <>
              <div className="form-group">
                <label htmlFor="name">Shelf Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Shelf A, Display Shelf"
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="code">Shelf Code *</label>
                  <input
                    id="code"
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., SHELF_A"
                    className={errors.code ? 'input-error' : ''}
                  />
                  {errors.code && <span className="error-text">{errors.code}</span>}
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
                  <span>Active Shelf</span>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="bulk-form-container">
                {bulkData.map((shelf, index) => (
                  <div key={index} className="bulk-item">
                    <div className="bulk-item-header">
                      <h4>Shelf {index + 1}</h4>
                      {bulkData.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeBulkShelf(index)}
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
                          value={shelf.name}
                          onChange={(e) => handleBulkChange(index, 'name', e.target.value)}
                          placeholder="Shelf name"
                          className={errors[`bulk_name_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`bulk_name_${index}`] && (
                          <span className="error-text">{errors[`bulk_name_${index}`]}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Code *</label>
                        <input
                          type="text"
                          value={shelf.code}
                          onChange={(e) => handleBulkChange(index, 'code', e.target.value)}
                          placeholder="Shelf code"
                          className={errors[`bulk_code_${index}`] ? 'input-error' : ''}
                        />
                        {errors[`bulk_code_${index}`] && (
                          <span className="error-text">{errors[`bulk_code_${index}`]}</span>
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
                  onClick={addBulkShelf}
                >
                  + Add Another Shelf
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
              {loading ? 'Creating...' : formMode === 'bulk' ? `Create ${bulkData.length} Shelves` : 'Create Shelf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShelfModal;
