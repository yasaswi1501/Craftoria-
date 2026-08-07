// HMAC-SHA256 hex digest -- used both to verify the post-checkout signature
// Razorpay's widget returns to the browser and to verify webhook deliveries.
// Both are the same primitive (prove the message was signed by someone
// holding the secret) applied to two different message shapes.
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison -- a naive `===` on signature strings leaks
// timing information about how many leading characters matched, which is
// exactly the kind of side channel signature verification exists to avoid.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
