import { createClient } from 'jsr:@supabase/supabase-js@2';

// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically into every Edge Function's environment by the platform --
// nothing to configure for these three.

// Scoped to the caller's own JWT: RLS applies normally, so any query through
// this client only ever sees rows the calling user is actually allowed to see.
// This is how we prove "this order belongs to this user" without trusting
// anything the client claims about itself.
export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Bypasses RLS entirely -- for the privileged writes (payments rows,
// confirm_payment_* RPCs) that a customer's own session must never be able
// to perform directly. Only ever used inside these server-side functions.
export function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}
