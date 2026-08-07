import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { createUserClient, createAdminClient } from '../_shared/supabaseClients.ts';

// Staff-only. This is the one place actual money moves back to a customer
// -- "never directly issue refunds from unrestricted frontend operations"
// means getting here requires a human staff action (admin_approve_refund
// moved the row to 'initiated' first), not a bare customer cancel click.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const { refund_id } = await req.json().catch(() => ({}));
    if (!refund_id) return jsonResponse({ error: 'refund_id is required' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization' }, 401);

    const supabaseUser = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: 'Invalid session' }, 401);

    const { data: isStaff } = await supabaseUser.rpc('is_staff');
    if (!isStaff) return jsonResponse({ error: 'Forbidden' }, 403);

    const supabaseAdmin = createAdminClient();

    const { data: refund, error: refundErr } = await supabaseAdmin
      .from('refunds')
      .select('id, order_id, payment_id, amount, status')
      .eq('id', refund_id)
      .single();
    if (refundErr || !refund) return jsonResponse({ error: 'Refund not found' }, 404);
    if (refund.status !== 'initiated') {
      return jsonResponse({ error: `Refund is not ready to process (status: ${refund.status})` }, 400);
    }

    const { data: payment, error: paymentErr } = await supabaseAdmin
      .from('payments')
      .select('id, provider, provider_payment_id')
      .eq('id', refund.payment_id)
      .single();
    if (paymentErr || !payment?.provider_payment_id) {
      return jsonResponse({ error: 'Original payment not found or was never captured' }, 400);
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured');
      return jsonResponse({ error: 'Payment gateway is not configured' }, 500);
    }

    const amountPaise = Math.round(Number(refund.amount) * 100);

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${payment.provider_payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountPaise,
        notes: { craftoria_refund_id: refund.id, craftoria_order_id: refund.order_id },
      }),
    });
    const rzpRefund = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('Razorpay refund request failed:', rzpRefund);
      await supabaseAdmin.from('refunds').update({ status: 'failed' }).eq('id', refund.id);
      return jsonResponse({ error: rzpRefund?.error?.description || 'Refund request failed' }, 502);
    }

    await supabaseAdmin
      .from('refunds')
      .update({ provider: 'razorpay', provider_refund_id: rzpRefund.id, status: 'processing' })
      .eq('id', refund.id);

    // Some refunds (test mode, certain instant-refund-eligible banks) come
    // back already processed; most settle asynchronously via the
    // refund.processed webhook. Handle both rather than assuming either.
    if (rzpRefund.status === 'processed') {
      const { data: result, error: confirmErr } = await supabaseAdmin.rpc('confirm_refund_processed', {
        p_provider: 'razorpay',
        p_provider_refund_id: rzpRefund.id,
      });
      if (confirmErr) console.error('confirm_refund_processed failed:', confirmErr);
      return jsonResponse({ success: true, status: 'completed', ...result });
    }

    return jsonResponse({ success: true, status: 'processing', provider_refund_id: rzpRefund.id });
  } catch (err) {
    console.error('process-razorpay-refund unexpected error:', err);
    return jsonResponse({ error: 'Unexpected error' }, 500);
  }
});
