// ============================================================================
//  BILLING LAYER  —  Stripe + service-role Supabase writes
//  Everything here is lazy + graceful: if STRIPE_SECRET_KEY or the Supabase
//  service-role key isn't set, `billingConfigured`/`adminConfigured` are false
//  and callers fall back to current (free) behavior. Nothing crashes.
// ============================================================================

import Stripe from 'stripe';

const SECRET = (process.env.STRIPE_SECRET_KEY || '').trim();
export const billingConfigured = !!SECRET && !SECRET.includes('REPLACE');
export const WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

let _stripe = null;
export function stripe() {
  if (!billingConfigured) throw new Error('Stripe is not configured');
  if (!_stripe) _stripe = new Stripe(SECRET);
  return _stripe;
}

// --- Supabase service-role (bypasses RLS) for webhook + plan lookups ---
export const SB_URL = (process.env.SUPABASE_URL || 'https://ladcpxqwvfiosffrvwdq.supabase.co').trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
export const adminConfigured = !!SERVICE && !SERVICE.includes('REPLACE');

async function sbAdmin(path, opts = {}) {
  if (!adminConfigured) throw new Error('Supabase service role not configured');
  // Bound every call so a cold/slow Supabase can NEVER stall the request that
  // triggered it (a scan must not wait on a plan lookup). On timeout we throw,
  // and callers on the hot path (planContext) fail open to free behavior.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs || 4000);
  try {
    const r = await fetch(SB_URL + '/rest/v1/' + path, {
      method: opts.method, body: opts.body, signal: ctrl.signal,
      headers: {
        apikey: SERVICE, authorization: 'Bearer ' + SERVICE,
        'content-type': 'application/json', prefer: 'return=representation',
        ...(opts.headers || {}),
      },
    });
    if (!r.ok) throw new Error('supabase ' + r.status + ' ' + (await r.text()).slice(0, 200));
    if (r.status === 204) return null;
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  } finally { clearTimeout(timer); }
}

export async function accountByOwner(uid) {
  const rows = await sbAdmin('accounts?owner=eq.' + encodeURIComponent(uid) + '&select=*&limit=1');
  return (rows && rows[0]) || null;
}
export async function accountByCustomer(cid) {
  const rows = await sbAdmin('accounts?stripe_customer_id=eq.' + encodeURIComponent(cid) + '&select=*&limit=1');
  return (rows && rows[0]) || null;
}
export async function updateAccount(id, patch) {
  return sbAdmin('accounts?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(patch) });
}
