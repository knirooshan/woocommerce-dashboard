/**
 * Round to 2 decimal places using standard rounding
 */
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * Calculate the actual discount amount for an item
 * @param {number} lineAmount - price × quantity
 * @param {number} discount - discount value
 * @param {string} discountType - "fixed" or "percentage"
 * @returns {number} actual discount amount
 */
export const getDiscountAmount = (lineAmount, discount, discountType) => {
  if (!discount || discount <= 0) return 0;
  if (discountType === "percentage") {
    return round2((lineAmount * discount) / 100);
  }
  return round2(discount);
};

/**
 * Calculate tax for a single item
 * @param {object} item - { price, quantity, discount, discountType, isTaxable, taxMethod }
 * @param {number} taxRate - global tax rate as percentage (0-100)
 * @returns {object} { lineAmount, discountAmount, discountedAmount, itemTax, total }
 */
export const calculateItemTax = (item, taxRate) => {
  const lineAmount = round2(item.price * item.quantity);
  const discountAmount = getDiscountAmount(
    lineAmount,
    item.discount,
    item.discountType || "fixed",
  );
  const discountedAmount = round2(lineAmount - discountAmount);

  let itemTax = 0;
  if (item.isTaxable && taxRate > 0) {
    if (item.taxMethod === "exclusive") {
      itemTax = round2((discountedAmount * taxRate) / 100);
    } else if (item.taxMethod === "inclusive") {
      itemTax = round2(
        discountedAmount - discountedAmount / (1 + taxRate / 100),
      );
    }
  }

  return {
    lineAmount,
    discountAmount,
    discountedAmount,
    itemTax,
    total: discountedAmount, // total is always the discounted amount (same line display for both methods)
  };
};

/**
 * Calculate totals for an invoice/quotation
 * @param {Array} items - array of item objects
 * @param {number} taxRate - global tax rate as percentage
 * @param {number} orderDiscount - order-level discount amount (flat)
 * @param {number} deliveryCharge - delivery charge amount
 * @returns {object} { subtotal, exclusiveTax, total, itemsWithTax }
 */
export const calculateTotals = (
  items,
  taxRate,
  orderDiscount = 0,
  deliveryCharge = 0,
) => {
  let subtotal = 0;
  let exclusiveTax = 0;

  const itemsWithTax = items.map((item) => {
    const calc = calculateItemTax(item, taxRate);
    subtotal += calc.total;
    if (item.isTaxable && item.taxMethod === "exclusive") {
      exclusiveTax += calc.itemTax;
    }
    return {
      ...item,
      itemTax: calc.itemTax,
      total: calc.total,
    };
  });

  subtotal = round2(subtotal);
  exclusiveTax = round2(exclusiveTax);
  const total = round2(
    subtotal + exclusiveTax - (orderDiscount || 0) + (deliveryCharge || 0),
  );

  return {
    subtotal,
    tax: exclusiveTax, // only exclusive tax is shown/stored
    total,
    itemsWithTax,
  };
};

/**
 * Format discount for display
 * @param {number} discount - discount value
 * @param {string} discountType - "fixed" or "percentage"
 * @param {object} settings - settings for currency formatting
 * @param {function} formatCurrencyFn - currency formatting function
 * @returns {string} formatted discount string
 */
export const formatDiscount = (
  discount,
  discountType,
  settings,
  formatCurrencyFn,
) => {
  if (!discount || discount <= 0) return "";
  if (discountType === "percentage") {
    return `${discount}%`;
  }
  return formatCurrencyFn(discount, settings);
};

export { round2 };
