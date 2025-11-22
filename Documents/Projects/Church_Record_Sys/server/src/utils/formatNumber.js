/**
 * Format phone number for Arkesel SMS API
 * @param {string} number - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatNumber = (number) => {
  // Remove all non-digit characters
  let cleaned = number.replace(/\D/g, '');
  
  // If the number starts with 0, replace with country code (Ghana: 233)
  if (cleaned.startsWith('0')) {
    cleaned = '233' + cleaned.substring(1);
  }
  
  // If the number doesn't start with country code, add Ghana country code
  if (!cleaned.startsWith('233')) {
    cleaned = '233' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 * @param {string} number - Phone number to validate
 * @returns {boolean} - Whether the number is valid
 */
export const isValidPhoneNumber = (number) => {
  const cleaned = number.replace(/\D/g, '');
  
  // Ghana phone numbers should be 10 digits (starting with 0) or 12 digits (with country code)
  return cleaned.length === 10 || cleaned.length === 12;
};
