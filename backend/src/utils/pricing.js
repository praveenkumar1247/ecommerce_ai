/**
 * Server-side Pricing and Financial Calculation Utilities
 */

const roundTo2 = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates offer price from original price and discount percentage
 * Offer Price = Price * (1 - Discount / 100)
 */
const calculateOfferPrice = (price, discountPercent = 0) => {
  const p = Number(price);
  const d = Math.max(0, Math.min(100, Number(discountPercent || 0)));
  const offer = p * (1 - d / 100);
  return roundTo2(offer);
};

/**
 * Calculates order financial summary from product snapshot lines
 * Tax: 18% standard GST (or configurable)
 * Shipping: Free for orders >= ₹1000, else ₹99
 */
const calculateOrderTotals = (items) => {
  let subtotal = 0; // Sum of original prices * qty
  let offerSubtotal = 0; // Sum of offer prices * qty

  for (const item of items) {
    const originalPrice = Number(item.price);
    const offerPrice = Number(item.offerPrice);
    const qty = Number(item.quantity);

    subtotal += originalPrice * qty;
    offerSubtotal += offerPrice * qty;
  }

  subtotal = roundTo2(subtotal);
  offerSubtotal = roundTo2(offerSubtotal);
  const discount = roundTo2(subtotal - offerSubtotal);

  // 18% tax on the discounted offer subtotal
  const tax = roundTo2(offerSubtotal * 0.18);
  // Free shipping over ₹1000
  const shippingFee = offerSubtotal >= 1000 || offerSubtotal === 0 ? 0 : 99.0;
  const totalAmount = roundTo2(offerSubtotal + tax + shippingFee);

  return {
    subtotal,
    discount,
    offerSubtotal,
    shippingFee,
    tax,
    totalAmount,
  };
};

module.exports = {
  roundTo2,
  calculateOfferPrice,
  calculateOrderTotals,
};
