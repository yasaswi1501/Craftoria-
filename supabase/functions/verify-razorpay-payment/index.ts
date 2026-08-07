import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createUserClient, createAdminClient } from '../_shared/supabaseClients.ts';
import { hmacSha256Hex, timingSafeEqual } from '../_shared/hmac.ts';

// Called by the client immediately after Razorpay Checkout's own success
// handler fires. This is a UX accelerant (instant confirmation instead of
// waiting on the async webhook), NOT the source of trust -- what actually
// makes it trustworthy is the signature check below, which only someone
// holding RAZORPAY_KEY_SECRET (i.e. genuinely Razorpay) could have produced.
// A forged "it succeeded" POST from a browser with no valid signature is
// rejected outright, and the authoritative webhook below still runs
// independently as the safety net either way.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json().catch(() => ({}));
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: 'Missing payment verification fields' }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization' }, 401);

    const supabaseUser = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: 'Invalid session' }, 401);

    const supabaseAdmin = createAdminClient();

    // Confirm this payment attempt actually belongs to the caller before
    // trusting anything else in the request -- an IDOR check, not optional.
    const { data: payment, error: paymentErr } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, amount')
      .eq('provider', 'razorpay')
      .eq('provider_order_id', razorpay_order_id)
      .single();
    if (paymentErr || !payment) return jsonResponse({ error: 'Payment record not found' }, 404);
    if (payment.user_id !== user.id) return jsonResponse({ error: 'Forbidden' }, 403);

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return jsonResponse({ error: 'Payment gateway is not configured' }, 500);
    }

    const expectedSignature = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!timingSafeEqual(expectedSignature, razorpay_signature)) {
      console.warn('Razorpay signature mismatch for order', razorpay_order_id);
      await supabaseAdmin.rpc('confirm_payment_failure', {
        p_provider: 'razorpay',
        p_provider_order_id: razorpay_order_id,
        p_reason: 'client-side signature verification failed',
      });
      return jsonResponse({ error: 'Payment signature verification failed' }, 400);
    }

    // amount comes from our own payments record (set server-side at order
    // creation), never from this request body.
    const { data: result, error: confirmErr } = await supabaseAdmin.rpc('confirm_payment_success', {
      p_provider: 'razorpay',
      p_provider_order_id: razorpay_order_id,
      p_provider_payment_id: razorpay_payment_id,
      p_amount_paid: payment.amount,
    });
    if (confirmErr) {
      console.error('confirm_payment_success failed:', confirmErr);
      return jsonResponse({ error: 'Could not confirm payment' }, 500);
    }

    return jsonResponse({ success: true, ...result });
  } catch (err) {
    console.error('verify-razorpay-payment unexpected error:', err);
    return jsonResponse({ error: 'Unexpected error' }, 500);
  }
});
