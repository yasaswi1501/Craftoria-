// Reads APP_URL (set via `supabase secrets set APP_URL=https://yourdomain.com`)
// and locks CORS to it in production. Falls back to "*" only when APP_URL
// isn't set at all -- i.e. local dev via `supabase functions serve` -- so
// nothing breaks before you've configured it, but a deployed environment
// with the secret set gets the real restriction. These endpoints are still
// gated by the caller's JWT/signature regardless of origin, so this is
// defense in depth, not the only thing standing between them and misuse.
const allowedOrigin = Deno.env.get('APP_URL') || '*';

export const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
