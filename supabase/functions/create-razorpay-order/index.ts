import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createUserClient, createAdminClient } from '../_shared/supabaseClients.ts';

// Called by the client right after checkout() (Phase 5) creates a
// pending_payment order. Never trusts a client-supplied amount -- the
// Razorpay order is created for order.total_amount as stored server-side,
// looked up via the caller's own RLS-scoped session so they can't request a
// payment session for someone else's order.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return jsonResponse({ error: 'order_id is required' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization' }, 401);

    const supabaseUser = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: 'Invalid session' }, 401);

    const { data: order, error: orderErr } = await supabaseUser
      .from('orders')
      .select('id, total_amount, payment_status, status, payment_method')
      .eq('id', order_id)
      .single();
    if (orderErr || !order) return jsonResponse({ error: 'Order not found' }, 404);
    if (order.payment_method === 'cod') {
      return jsonResponse({ error: 'This order does not require a payment gateway' }, 400);
    }
    if (order.payment_status === 'paid') {
      return jsonResponse({ error: 'This order has already been paid' }, 400);
    }
    if (order.status !== 'pending_payment') {
      return jsonResponse({ error: 'This order is not awaiting payment' }, 400);
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured');
      return jsonResponse({ error: 'Payment gateway is not configured' }, 500);
    }

    const amountPaise = Math.round(Number(order.total_amount) * 100);

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: order.id,
        notes: { craftoria_order_id: order.id },
      }),
    });
    const rzpOrder = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('Razorpay order creation failed:', rzpOrder);
      return jsonResponse({ error: 'Could not initialize payment. Please try again.' }, 502);
    }

    const supabaseAdmin = createAdminClient();
    const { error: insertErr } = await supabaseAdmin.from('payments').insert({
      user_id: user.id,
      order_id: order.id,
      provider: 'razorpay',
      provider_order_id: rzpOrder.id,
      amount: order.total_amount,
      currency: 'INR',
      status: 'created',
    });
    if (insertErr) {
      console.error('Failed to record payment attempt:', insertErr);
      return jsonResponse({ error: 'Could not initialize payment. Please try again.' }, 500);
    }

    return jsonResponse({
      razorpay_order_id: rzpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: keyId,
    });
  } catch (err) {
    console.error('create-razorpay-order unexpected error:', err);
    return jsonResponse({ error: 'Unexpected error' }, 500);
  }
});
