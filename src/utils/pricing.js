// Single source of truth for order pricing math, so the amount shown in the
// cart drawer, the checkout summary, and the WhatsApp order message can
// never drift apart by each computing it slightly differently.
const LOW_ORDER_DELIVERY_FEE = 79;
const LOW_ORDER_THRESHOLD = 999;
const EXPRESS_DELIVERY_FEE = 150;

export const calculateOrderTotals = (cart, deliveryOption = 'standard') => {
  const subtotal = (cart || []).reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const deliveryFee = deliveryOption === 'express'
    ? EXPRESS_DELIVERY_FEE
    : (subtotal > 0 && subtotal < LOW_ORDER_THRESHOLD ? LOW_ORDER_DELIVERY_FEE : 0);
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
};

export const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
