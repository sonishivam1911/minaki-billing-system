import React from 'react';

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
    <div className="error-state">
      <p>{message}</p>
      {onRetry && (
        <button className="btn-primary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
};