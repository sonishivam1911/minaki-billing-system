/**
 * StorageObjectDropdown - Dropdown component for selecting storage objects
 * Fetches storage objects by storage_type_id and displays them in a select dropdown
 */
import React, { useState, useEffect } from 'react';
import storageObjectsApi from '../services/storageObjectsApi';

const StorageObjectDropdown = ({
  storageTypeId,
  value,
  onChange,
  activeOnly = true,
  placeholder = 'Select Storage Object',
  disabled = false,
  className = '',
  showEmptyOption = true
}) => {
  const [storageObjects, setStorageObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStorageObjects = async () => {
      if (!storageTypeId) {
        setStorageObjects([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await storageObjectsApi.getByStorageType(storageTypeId, activeOnly);
        const storageObjectsList = Array.isArray(data) ? data : data.items || data || [];
        setStorageObjects(storageObjectsList);
      } catch (err) {
        console.error('Error fetching storage objects:', err);
        setError(err.message || 'Failed to load storage objects');
        setStorageObjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageObjects();
  }, [storageTypeId, activeOnly]);

  const handleChange = (e) => {
    const selectedId = e.target.value ? parseInt(e.target.value, 10) : null;
    const selectedStorageObject = storageObjects.find(so => so.id === selectedId);
    onChange(selectedId, selectedStorageObject);
  };

  return (
    <div className={`storage-object-dropdown ${className}`}>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || loading || !storageTypeId}
        className="form-select"
      >
        {showEmptyOption && (
          <option value="">{loading ? 'Loading...' : placeholder}</option>
        )}
        {storageObjects.map((storageObject) => (
          <option key={storageObject.id} value={storageObject.id}>
            {storageObject.storage_object_label || storageObject.storage_object_code || `Storage Object ${storageObject.id}`}
            {storageObject.storage_object_code && storageObject.storage_object_label && ` (${storageObject.storage_object_code})`}
          </option>
        ))}
      </select>
      {error && (
        <small className="error-text" style={{ display: 'block', marginTop: '4px', color: '#dc3545' }}>
          {error}
        </small>
      )}
      {!storageTypeId && (
        <small className="hint-text" style={{ display: 'block', marginTop: '4px', color: '#6c757d' }}>
          Please select a storage type first
        </small>
      )}
    </div>
  );
};

export default StorageObjectDropdown;

