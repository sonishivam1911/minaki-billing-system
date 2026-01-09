import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingSpinner Component
 * Simple loading indicator
 * 
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 */
export const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: '#8b6f47' }} />
      <Typography variant="body1" sx={{ color: '#6b7280' }}>
        {message}
      </Typography>
    </Box>
  );
};
