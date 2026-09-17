/**
 * WhatsApp Order Redirection Utility for Craftoria
 *
 * The destination number is admin-configurable (Admin Panel > Settings,
 * backed by the `app_settings` table via SettingsContext) so it can change
 * without a redeploy. WHATSAPP_PHONE_NUMBER below is only the fallback used
 * before that setting has loaded, or if it's ever unreachable -- every
 * caller should pass its own `whatsappNumber` (from useSettings()) rather
 * than relying on this constant.
 */
import { calculateOrderTotals, formatINR } from './pricing';

export const WHATSAPP_PHONE_NUMBER = '919908860895';
export const INSTAGRAM_URL = 'https://www.instagram.com/_.craftoria._26?stkn=MTlvZTVvaWJnNmdoaQ==';

// Digits only, 10-15 chars (country code + number, no "+"/spaces/symbols) --
// the same trusted-input rule the Admin Panel's Settings tab enforces
// before saving. Anything else falls back to the safe default rather than
// ever building a URL from unvalidated input.
const isValidWhatsAppNumber = (value) => typeof value === 'string' && /^\d{10,15}$/.test(value);
const resolveWhatsAppNumber = (candidate) => (isValidWhatsAppNumber(candidate) ? candidate : WHATSAPP_PHONE_NUMBER);

/**
 * Formats a raw digit-only number ("919908860895") into a "tel:" href and a
 * human-readable display string ("+91 99088 60895"). Assumes a 2-digit
 * country code + 10-digit number (the only format this business has ever
 * used) -- falls back to a plain "+" prefix for anything else rather than
 * guessing at unfamiliar formats.
 */
export const formatPhoneForDisplay = (candidate) => {
  const number = resolveWhatsAppNumber(candidate);
  if (/^\d{2}\d{10}$/.test(number)) {
    const country = number.slice(0, 2);
    const rest = number.slice(2);
    return { tel: `tel:+${number}`, display: `+${country} ${rest.slice(0, 5)} ${rest.slice(5)}` };
  }
  return { tel: `tel:+${number}`, display: `+${number}` };
};

/**
 * Generate a clean, formatted WhatsApp order message string.
 */
export const generateWhatsAppOrderMessage = (cart, addressDetails = null, deliveryOption = 'standard') => {
  if (!cart || cart.length === 0) return '';

  let text = `*New Order Request - Craftoria*\n\n`;
  text += `*Cart Items:*\n`;

  cart.forEach((item, index) => {
    text += `${index + 1}. *${item.name}* (Qty: ${item.quantity})\n`;
    const custText = item.customText || item.customization?.text;
    if (custText) {
      text += `   _Personalization: ${custText}_\n`;
    }
    // Fields from the standalone /customize page (category, craft/style,
    // material, colour, size).
    if (item.customization?.category) {
      text += `   _Category: ${item.customization.category}_\n`;
    }
    if (item.customization?.craftStyle) {
      text += `   _Style: ${item.customization.craftStyle}_\n`;
    }
    if (item.customization?.material) {
      text += `   _Material: ${item.customization.material}_\n`;
    }
    if (item.customization?.colour) {
      text += `   _Colour: ${item.customization.colour}_\n`;
    }
    if (item.customization?.size) {
      text += `   _Size: ${item.customization.size}_\n`;
    }
    if (item.customization?.referenceImageNote) {
      text += `   _${item.customization.referenceImageNote}_\n`;
    }
    // Fields from per-product personalization (occasion, packaging, gift note).
    if (item.customization?.occasion) {
      text += `   _Occasion: ${item.customization.occasion}_\n`;
    }
    if (item.customization?.packaging) {
      text += `   _Packaging: ${item.customization.packaging}_\n`;
    }
    if (item.customization?.giftNote) {
      text += `   _Gift Note: "${item.customization.giftNote}"_\n`;
    }
    if (item.customization?.specialNotes) {
      text += `   _Special Instructions: "${item.customization.specialNotes}"_\n`;
    }
  });

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  text += `\n*Total Items:* ${totalItems}\n`;

  // Same calculation the cart drawer and checkout page display on-screen --
  // one shared source (utils/pricing.js) so this can never show a different
  // number than what the customer already saw before tapping the button.
  const { subtotal, deliveryFee, total } = calculateOrderTotals(cart, deliveryOption);
  text += `*Subtotal:* ${formatINR(subtotal)}\n`;
  text += `*Delivery:* ${deliveryFee > 0 ? formatINR(deliveryFee) : 'FREE'}\n`;
  text += `*Estimated Total:* ${formatINR(total)}\n`;

  if (addressDetails) {
    text += `\n*Delivery Details:*\n`;
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

  text += `\n*Photo / Reference Attachments:* If you have reference photos, polaroid pictures, or custom sketches, please attach them directly in this WhatsApp chat!\n`;
  text += `\n*Message:* Hi Craftoria! I would like to proceed with the payment and place an order for the above handcrafted items. Please share the pricing and payment details! ✨`;

  return text;
};

// Guards against a rapid double-click/double-tap firing this twice (opening
// two WhatsApp tabs with the same order) -- a short window is enough since
// opening the tab is effectively instant; it doesn't block a genuine second
// order a few seconds later.
let lastWhatsAppRedirectAt = 0;
const WHATSAPP_REDIRECT_COOLDOWN_MS = 2000;

/**
 * Redirect user to WhatsApp with the formatted order text.
 */
export const redirectToWhatsApp = (cart, addressDetails = null, deliveryOption = 'standard', whatsappNumber = WHATSAPP_PHONE_NUMBER) => {
  if (!cart || cart.length === 0) return;

  const now = Date.now();
  if (now - lastWhatsAppRedirectAt < WHATSAPP_REDIRECT_COOLDOWN_MS) return;
  lastWhatsAppRedirectAt = now;

  const text = generateWhatsAppOrderMessage(cart, addressDetails, deliveryOption);
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${resolveWhatsAppNumber(whatsappNumber)}&text=${encodedText}`;

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
export const generateCustomRequestWhatsAppMessage = ({ name, email, phone, productType, message }) => {
  let text = `*New Custom Commission Request - Craftoria*\n\n`;
  text += `*Client Information:*\n`;
  text += `• *Name:* ${name}\n`;
  text += `• *Email:* ${email}\n`;
  if (phone) text += `• *Mobile:* ${phone}\n`;
  text += `\n*Craft Category:* ${productType}\n\n`;
  text += `*Design Details & Requirements:*\n${message}\n\n`;
  text += `Sent via Craftoria Bespoke Commission Form`;

  return text;
};

/**
 * Open WhatsApp with the pre-filled custom request details.
 */
export const sendCustomRequestToWhatsApp = ({ name, email, phone, productType, message, whatsappNumber = WHATSAPP_PHONE_NUMBER }) => {
  const text = generateCustomRequestWhatsAppMessage({ name, email, phone, productType, message });
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${resolveWhatsAppNumber(whatsappNumber)}&text=${encodedText}`;

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
export const sendCustomRequestEmail = async ({ name, email, phone, productType, message }) => {
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${TARGET_CONTACT_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: `New Custom Commission Request from ${name} - Craftoria`,
        _template: 'table',
        name,
        email,
        phone: phone || 'Not provided',
        craft_category: productType,
        message,
        sent_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn('FormSubmit AJAX request encountered an issue:', err);
    return false;
  }
};
