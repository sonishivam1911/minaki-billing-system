/**
 * Currency utility functions for consistent formatting across the application
 */

/**
 * Format currency with Indian locale and proper decimal places
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, decimals = 2) => {
  const numericAmount = parseFloat(amount) || 0;
  return numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format currency with rupee symbol
 * @param {number|string} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string with ₹ symbol
 */
export const formatRupees = (amount, decimals = 2) => {
  return `₹${formatCurrency(amount, decimals)}`;
};

/**
 * Parse string amount to number with proper rounding
 * @param {string|number} amount - The amount to parse
 * @returns {number} Properly rounded number
 */
export const parseAmount = (amount) => {
  const parsed = parseFloat(amount) || 0;
  return Math.round(parsed * 100) / 100;
};

/**
 * Calculate percentage with proper rounding
 * @param {number} value - The value
 * @param {number} total - The total
 * @returns {number} Percentage rounded to 2 decimal places
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
};