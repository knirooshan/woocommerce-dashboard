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
    return `$${numAmount.toFixed(2)}`;
  }

  const { symbol, position } = settings.currency;
  const formattedAmount = numAmount.toFixed(2);

  if (position === "after") {
    return `${formattedAmount}${symbol}`;
  }

  // Default: before
  return `${symbol}${formattedAmount}`;
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
