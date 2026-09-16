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
    const custText = item.customText || item.customization?.text;
    if (custText) {
      text += `   ✍️ _Personalization: ${custText}_\n`;
    }
    if (item.customization?.occasion) {
      text += `   🎁 _Occasion: ${item.customization.occasion}_\n`;
    }
    if (item.customization?.packaging) {
      text += `   📦 _Packaging: ${item.customization.packaging}_\n`;
    }
    if (item.customization?.giftNote) {
      text += `   💌 _Gift Note: "${item.customization.giftNote}"_\n`;
    }
    if (item.customization?.specialNotes) {
      text += `   📝 _Special Instructions: "${item.customization.specialNotes}"_\n`;
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

  text += `\n📸 *Photo / Reference Attachments:* If you have reference photos, polaroid pictures, or custom sketches, please attach them directly in this WhatsApp chat!\n`;
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

export const TARGET_CONTACT_EMAIL = 'thecraftoriaaa26@gmail.com';

/**
 * Generate a formatted WhatsApp message for custom bespoke requests.
 */
export const generateCustomRequestWhatsAppMessage = ({ 
  name, 
  email, 
  phone, 
  productType, 
  personalization,
  occasion,
  packaging,
  giftNote,
  specialNotes,
  message 
}) => {
  let text = `🌸 *New Custom Order Request - Craftoria* 🌸\n\n`;
  text += `👤 *Client Information:*\n`;
  if (name) text += `• *Name:* ${name}\n`;
  if (email) text += `• *Email:* ${email}\n`;
  if (phone) text += `• *Mobile:* ${phone}\n`;
  text += `\n🎨 *Craft Category:* ${productType}\n`;

  if (personalization) {
    text += `✍️ *Personalization / Monogram:* ${personalization}\n`;
  }
  if (occasion) {
    text += `🎁 *Occasion:* ${occasion}\n`;
  }
  if (packaging) {
    text += `📦 *Packaging Style:* ${packaging}\n`;
  }
  if (giftNote) {
    text += `💌 *Gift Note:* "${giftNote}"\n`;
  }
  if (specialNotes) {
    text += `📝 *Special Instructions:* "${specialNotes}"\n`;
  }
  if (message && message !== specialNotes) {
    text += `💬 *Additional Details:* ${message}\n`;
  }

  text += `\n📸 *Photo / Reference Attachments:* If you have reference photos, polaroid pictures, or custom sketches, please attach them directly in this WhatsApp chat!\n`;
  text += `\n✨ Sent via Craftoria Custom Orders Studio`;

  return text;
};

/**
 * Open WhatsApp with the pre-filled custom request details.
 */
export const sendCustomRequestToWhatsApp = (payload) => {
  const text = generateCustomRequestWhatsAppMessage(payload);
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

/**
 * Dispatch the custom request form data to the target email address (thecraftoriaaa26@gmail.com).
 */
export const sendCustomRequestEmail = async ({ 
  name, 
  email, 
  phone, 
  productType, 
  personalization,
  occasion,
  packaging,
  giftNote,
  specialNotes,
  message 
}) => {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${TARGET_CONTACT_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: `New Custom Order Request (${productType}) from ${name} - Craftoria`,
        _template: 'table',
        name,
        email,
        phone: phone || 'Not provided',
        craft_category: productType,
        personalization_text: personalization || 'None',
        occasion: occasion || 'Not specified',
        packaging_style: packaging || 'Standard',
        gift_note: giftNote || 'None',
        special_instructions: specialNotes || message || 'None',
        sent_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn('FormSubmit AJAX request encountered an issue:', err);
    return false;
  }
};
