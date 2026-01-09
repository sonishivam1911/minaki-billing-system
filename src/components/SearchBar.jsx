import React from 'react';
import { Search } from 'lucide-react';
import { TextField, InputAdornment } from '@mui/material';

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
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search size={20} color="#6b7280" />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#ffffff',
        },
      }}
    />
  );
};
