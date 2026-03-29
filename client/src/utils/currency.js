/**
 * Format currency based on store settings
 * @param {number} amount - The amount to format
 * @param {object} settings - Store settings object containing currency info
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, settings) => {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return `$0.00`;

  if (!settings?.currency) {
    // Fallback to USD if no settings
    return `$${addThousandSeparators(numAmount.toFixed(2))}`;
  }

  const { symbol, position } = settings.currency;
  const formattedAmount = addThousandSeparators(numAmount.toFixed(2));

  if (position === "after") {
    return `${formattedAmount}${symbol}`;
  }

  // Default: before
  return `${symbol}${formattedAmount}`;
};

/**
 * Add thousand separators to a formatted number string
 * "1234567.89" → "1,234,567.89"
 */
const addThousandSeparators = (numStr) => {
  const parts = numStr.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

/**
 * Get currency symbol from settings
 * @param {object} settings - Store settings object
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (settings) => {
  return settings?.currency?.symbol || "$";
};

/**
 * Get currency code from settings
 * @param {object} settings - Store settings object
 * @returns {string} Currency code (e.g., USD, EUR, INR)
 */
export const getCurrencyCode = (settings) => {
  return settings?.currency?.code || "USD";
};
