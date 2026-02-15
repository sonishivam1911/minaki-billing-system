/**
 * StorageTypeDropdown - Dropdown component for selecting storage types
 * Fetches storage types by location_id and displays them in a select dropdown
 */
import React, { useState, useEffect } from 'react';
import storageTypesApi from '../services/storageTypesApi';

const StorageTypeDropdown = ({
  locationId,
  value,
  onChange,
  activeOnly = true,
  placeholder = 'Select Storage Type',
  disabled = false,
  className = '',
  showEmptyOption = true
}) => {
  const [storageTypes, setStorageTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStorageTypes = async () => {
      if (!locationId) {
        setStorageTypes([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await storageTypesApi.getByLocation(locationId, activeOnly);
        const storageTypesList = Array.isArray(data) ? data : data.items || data || [];
        setStorageTypes(storageTypesList);
      } catch (err) {
        console.error('Error fetching storage types:', err);
        setError(err.message || 'Failed to load storage types');
        setStorageTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageTypes();
  }, [locationId, activeOnly]);

  const handleChange = (e) => {
    const selectedId = e.target.value ? parseInt(e.target.value, 10) : null;
    const selectedStorageType = storageTypes.find(st => st.id === selectedId);
    onChange(selectedId, selectedStorageType);
  };

  return (
    <div className={`storage-type-dropdown ${className}`}>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || loading || !locationId}
        className="form-select"
      >
        {showEmptyOption && (
          <option value="">{loading ? 'Loading...' : placeholder}</option>
        )}
        {storageTypes.map((storageType) => (
          <option key={storageType.id} value={storageType.id}>
            {storageType.storage_type_name || storageType.storage_type_code || `Storage Type ${storageType.id}`}
            {storageType.storage_type_code && storageType.storage_type_name && ` (${storageType.storage_type_code})`}
          </option>
        ))}
      </select>
      {error && (
        <small className="error-text" style={{ display: 'block', marginTop: '4px', color: '#dc3545' }}>
          {error}
        </small>
      )}
    </div>
  );
};

export default StorageTypeDropdown;

