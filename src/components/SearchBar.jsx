import React from 'react';
import { Search } from 'lucide-react';

/**
 * SearchBar Component
 * Reusable search input with icon
 * 
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Callback when search value changes
 * @param {string} props.placeholder - Placeholder text
 */
export const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = 'Search...' 
}) => {
  return (
    <div className="search-container">
      <Search size={20} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-input"
      />
    </div>
  );
};