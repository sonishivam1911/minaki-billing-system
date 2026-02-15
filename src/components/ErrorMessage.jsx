import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';

/**
 * ErrorMessage Component
 * Displays error messages
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Optional retry callback
 */
export const ErrorMessage = ({ message, onRetry }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Alert 
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>Error</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};
