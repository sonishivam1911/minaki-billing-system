import React from 'react';

/**
 * LoadingSpinner Component
 * Simple loading indicator
 * 
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 */
export const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};