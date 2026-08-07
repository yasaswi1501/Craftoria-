/**
 * Craftoria Payment Service -- real Razorpay integration.
 *
 * Every function here talks to a Supabase Edge Function, never to Razorpay
 * directly from the browser (that would require the secret key to be
 * client-side). The signature verification in verifyPaymentSignature is
 * what actually makes a "payment succeeded" claim trustworthy -- see
 * supabase/functions/verify-razorpay-payment.
 */
import { supabase } from '../lib/supabase';

let razorpayScriptPromise = null;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load the payment gateway. Check your connection and try again.'));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

export const paymentService = {
  /**
   * Request a Razorpay order for an already-created (pending_payment)
   * Craftoria order. The amount charged is whatever the order actually
   * costs server-side -- nothing here is client-supplied.
   * @param {{ orderId: string }} params
   */
  async createPaymentSession({ orderId }) {
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { order_id: orderId },
    });
    if (error) throw new Error(error.message || 'Could not initialize payment.');
    if (data?.error) throw new Error(data.error);
    return data; // { razorpay_order_id, amount, currency, key_id }
  },

  /**
   * Opens the real Razorpay Checkout widget and resolves with the
   * (unverified) callback payload once the customer completes payment.
   * @param {Object} session - Result of createPaymentSession.
   * @param {Object} customerInfo - Name, email, phone for prefill.
   */
  async triggerGatewayCheckout(session, customerInfo) {
    const Razorpay = await loadRazorpayScript();

    return new Promise((resolve, reject) => {
      const rzp = new Razorpay({
        key: session.key_id,
        amount: session.amount,
        currency: session.currency,
        name: 'Craftoria',
        description: 'Handmade with love',
        order_id: session.razorpay_order_id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone,
        },
        theme: { color: '#4B2E5D' },
        handler: (response) => {
          resolve({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            reject({ status: 'CANCELLED', message: 'Payment checkout popup closed by user.' });
          },
        },
      });

      rzp.on('payment.failed', (resp) => {
        reject({ status: 'FAILED', message: resp?.error?.description || 'Payment authorization was declined.' });
      });

      rzp.open();
    });
  },

  /**
   * Server-side signature verification -- the client's "it succeeded"
   * callback above is never trusted on its own. Only a verified signature
   * (or the independent webhook) actually marks the order paid.
   */
  async verifyPaymentSignature(verificationData) {
    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: verificationData,
    });
    if (error) return { verified: false, message: error.message || 'Could not verify payment.' };
    if (data?.error) return { verified: false, message: data.error };
    return { verified: true, orderStatus: data.status, paymentStatus: data.payment_status };
  }
};
