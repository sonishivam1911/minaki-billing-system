import React from 'react';
import { InputBase, Box } from '@mui/material';
import { Search, X } from 'lucide-react';

const DriveSearchBar = ({ value, onChange }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 1.5,
      py: 0.75,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.045)',
      minWidth: 220,
    }}
  >
    <Search size={16} color="#5d4e37" />
    <InputBase
      placeholder="Search Drive"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      sx={{ flex: 1, fontSize: '0.875rem' }}
    />
    {value ? (
      <X size={14} style={{ cursor: 'pointer' }} onClick={() => onChange?.('')} />
    ) : null}
  </Box>
);

export default DriveSearchBar;
