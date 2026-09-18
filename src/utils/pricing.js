// Single source of truth for order pricing math, so the amount shown in the
// cart drawer, the checkout summary, and the WhatsApp order message can
// never drift apart by each computing it slightly differently.
export const calculateOrderTotals = (cart, deliveryOption = 'standard') => {
  const subtotal = (cart || []).reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const deliveryFee = 0; // Free delivery for every product
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
};

export const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
