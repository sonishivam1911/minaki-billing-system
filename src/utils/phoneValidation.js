/**
 * Basic phone validation for international format.
 * Supports: +91 9876543210, +1 5551234567, 919876543210, 9876543210 (India default)
 */

/**
 * Normalize phone to digits only (strip +, spaces, dashes)
 */
export const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
};

/**
 * Validate phone has at least 10 digits (typical minimum for valid numbers)
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Format phone for WhatsApp API - digits with country code (e.g. 918130113217).
 * WhatsApp Cloud API expects international format: country code + number, digits only.
 */
export const formatPhoneForWhatsApp = (phone) => {
  const digits = normalizePhone(phone);
  if (digits.length === 0) return '';
  // If 10 digits starting with 6-9 (India mobile), prepend 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return '91' + digits;
  }
  return digits;
};

/**
 * Format phone for display with +91 country code (e.g. +91 81301 13217)
 */
export const formatPhoneForDisplay = (phone) => {
  const digits = normalizePhone(phone);
  if (digits.length === 0) return '';
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return digits.length > 10 ? `+${digits}` : digits;
};
