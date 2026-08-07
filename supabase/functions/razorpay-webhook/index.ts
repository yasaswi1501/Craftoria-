import { createAdminClient } from '../_shared/supabaseClients.ts';
import { hmacSha256Hex, timingSafeEqual } from '../_shared/hmac.ts';

// Called directly by Razorpay's servers, not by the browser -- there is no
// Supabase session here, so this function must be deployed with
// --no-verify-jwt (see README notes in this repo). The webhook signature is
// the *entire* authentication mechanism for this endpoint: no signature, no
// trust, full stop.
//
// This is also the authoritative confirmation path. verify-razorpay-payment
// is a UX accelerant that can be skipped, blocked by an ad blocker, or hit a
// network error after Razorpay already captured the payment -- this handler
// is what guarantees the order still gets marked paid regardless.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return new Response('Webhook not configured', { status: 500 });
  }
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const expectedSignature = await hmacSha256Hex(webhookSecret, rawBody);
  if (!timingSafeEqual(expectedSignature, signature)) {
    console.warn('Webhook signature mismatch');
    return new Response('Invalid signature', { status: 400 });
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType: string = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderEntity = payload.payload?.order?.entity;
  // Razorpay sends a distinct event id header on modern webhook deliveries;
  // fall back to a composite key so redeliveries without it still dedupe.
  const eventId: string =
    req.headers.get('x-razorpay-event-id') ||
    `${eventType}:${paymentEntity?.id ?? orderEntity?.id ?? crypto.randomUUID()}`;

  const supabaseAdmin = createAdminClient();

  // Record + de-duplicate before doing anything else -- a redelivered event
  // must be a safe no-op, not reprocessed. The unique constraint on
  // (provider, provider_event_id) is what actually enforces this.
  const { error: insertErr } = await supabaseAdmin.from('payment_events').insert({
    provider: 'razorpay',
    provider_event_id: eventId,
    event_type: eventType,
    payload,
  });
  if (insertErr) {
    if (insertErr.code === '23505') {
      return new Response('OK (duplicate event, already processed)', { status: 200 });
    }
    console.error('Failed to store webhook event:', insertErr);
    return new Response('Storage error', { status: 500 });
  }

  try {
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;
      const amountPaisePaid = paymentEntity?.amount ?? orderEntity?.amount_paid ?? 0;

      if (razorpayOrderId && razorpayPaymentId) {
        const { error } = await supabaseAdmin.rpc('confirm_payment_success', {
          p_provider: 'razorpay',
          p_provider_order_id: razorpayOrderId,
          p_provider_payment_id: razorpayPaymentId,
          p_amount_paid: amountPaisePaid / 100,
        });
        if (error) console.error('confirm_payment_success (webhook) failed:', error);
      }
    } else if (eventType === 'payment.failed') {
      const razorpayOrderId = paymentEntity?.order_id;
      if (razorpayOrderId) {
        const { error } = await supabaseAdmin.rpc('confirm_payment_failure', {
          p_provider: 'razorpay',
          p_provider_order_id: razorpayOrderId,
          p_reason: paymentEntity?.error_description || 'payment failed',
        });
        if (error) console.error('confirm_payment_failure (webhook) failed:', error);
      }
    } else if (eventType === 'refund.processed') {
      // The authoritative confirmation for refunds initiated as 'processing'
      // by process-razorpay-refund (most refunds settle asynchronously).
      const refundEntity = payload.payload?.refund?.entity;
      if (refundEntity?.id) {
        const { error } = await supabaseAdmin.rpc('confirm_refund_processed', {
          p_provider: 'razorpay',
          p_provider_refund_id: refundEntity.id,
        });
        if (error) console.error('confirm_refund_processed (webhook) failed:', error);
      }
    } else if (eventType === 'refund.failed') {
      const refundEntity = payload.payload?.refund?.entity;
      if (refundEntity?.id) {
        const { error } = await supabaseAdmin.rpc('confirm_refund_failed', {
          p_provider: 'razorpay',
          p_provider_refund_id: refundEntity.id,
          p_reason: 'refund failed at gateway',
        });
        if (error) console.error('confirm_refund_failed (webhook) failed:', error);
      }
    }

    await supabaseAdmin
      .from('payment_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('provider', 'razorpay')
      .eq('provider_event_id', eventId);

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // 500, not 200: the event is already stored and de-duplicated, so it's
    // safe to let Razorpay retry delivery rather than silently swallowing a
    // real failure.
    return new Response('Processing error', { status: 500 });
  }
});
