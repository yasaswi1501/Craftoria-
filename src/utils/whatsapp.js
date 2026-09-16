/**
 * WhatsApp Order Redirection Utility for Craftoria
 * Destination Phone: 9908860895 (+91 9908860895)
 */

export const WHATSAPP_PHONE_NUMBER = '919908860895';

/**
 * Generate a clean, formatted WhatsApp order message string.
 */
export const generateWhatsAppOrderMessage = (cart, addressDetails = null, deliveryOption = 'standard') => {
  if (!cart || cart.length === 0) return '';

  let text = `🌸 *New Order Request - Craftoria* 🌸\n\n`;
  text += `🛍️ *Cart Items:*\n`;

  cart.forEach((item, index) => {
    text += `${index + 1}. *${item.name}* (Qty: ${item.quantity})\n`;
    if (item.customText) {
      text += `   ✍️ _Personalization: ${item.customText}_\n`;
    }
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  text += `\n📦 *Total Items:* ${totalItems}\n`;

  if (addressDetails) {
    text += `\n📍 *Delivery Details:*\n`;
    if (addressDetails.fullName) text += `• *Name:* ${addressDetails.fullName}\n`;
    if (addressDetails.phone) text += `• *Phone:* ${addressDetails.phone}\n`;
    if (addressDetails.building || addressDetails.street) {
      text += `• *Address:* ${[addressDetails.building, addressDetails.street].filter(Boolean).join(', ')}\n`;
    }
    if (addressDetails.landmark) text += `• *Landmark:* ${addressDetails.landmark}\n`;
    if (addressDetails.city || addressDetails.stateName || addressDetails.pinCode) {
      text += `• *City/State:* ${[addressDetails.city, addressDetails.stateName].filter(Boolean).join(', ')} - ${addressDetails.pinCode || ''}\n`;
    }
    text += `• *Shipping Option:* ${deliveryOption === 'express' ? 'Express Delivery (1–2 Days)' : 'Standard Delivery (3–5 Days)'}\n`;
  }

  text += `\n💬 *Message:* Hi Craftoria! I would like to proceed with the payment and place an order for the above handcrafted items. Please share the pricing and payment details! ✨`;

  return text;
};

/**
 * Redirect user to WhatsApp with the formatted order text.
 */
export const redirectToWhatsApp = (cart, addressDetails = null, deliveryOption = 'standard') => {
  if (!cart || cart.length === 0) return;

  const text = generateWhatsAppOrderMessage(cart, addressDetails, deliveryOption);
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodedText}`;

  try {
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = whatsappUrl;
    }
  } catch {
    window.location.href = whatsappUrl;
  }
};
