// ============================================================================
//  XPI BD Intelligence — proof server
//  Serves the app UI and three live endpoints:
//    POST /api/extract   card image  -> contact fields
//    POST /api/research  {name,url}  -> full prospect intelligence (live AI)
//    GET  /api/health
// ============================================================================

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runResearch } from './lib/research.js';
import { extractCard, generateVariations, generateCloser } from './lib/anthropic.js';
import { CATALOG } from './lib/catalog.js';
import { plansPublic, planByKey, modelForPlan, scanCapForPlan, planForPriceId, statusIsLive } from './lib/plans.js';
import {
  billingConfigured, adminConfigured, WEBHOOK_SECRET, stripe,
  accountByOwner, accountByCustomer, updateAccount,
} from './lib/billing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Stripe webhook needs the RAW body for signature verification — mount BEFORE express.json.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '12mb' })); // card images arrive as base64

const KEY_OK = !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('REPLACE_ME');

// --- auth gate: only signed-in users can spend AI, and cap how much ---
const SB_URL = 'https://ladcpxqwvfiosffrvwdq.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZGNweHF3dmZpb3NmZnJ2d2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI3OTQsImV4cCI6MjEwNDc1ODc5NH0.0Se1F_572VXg5Z3QzDVxGdjhehci5ljM8-FFRyiR8dQ';
async function getUser(req) {
  const a = req.headers.authorization || '';
  const token = a.startsWith('Bearer ') ? a.slice(7) : '';
  if (!token) return null;
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_ANON, authorization: 'Bearer ' + token } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch (_) { return null; }
}
const _scans = new Map(); // uid -> [timestamps]
function underLimit(uid, max) {
  const now = Date.now(), WIN = 3600000;
  const arr = (_scans.get(uid) || []).filter((t) => now - t < WIN);
  if (arr.length >= max) return false;
  arr.push(now); _scans.set(uid, arr); return true;
}
async function gate(req, res, cost) {
  const u = await getUser(req);
  if (!u) { res.status(401).json({ error: 'auth', message: 'Please sign in to run this.' }); return null; }
  if (!underLimit(u.id, cost || 60)) { res.status(429).json({ error: 'rate', message: 'You’ve hit the hourly limit — give it a few minutes and try again.' }); return null; }
  return u;
}

// --- plan context: model + monthly cap for this user's account (server-authoritative) ---
// If billing isn't wired (no service-role key) or the account has no live plan,
// everything returns null/undefined and callers fall back to CURRENT behavior.
async function planContext(user) {
  const out = { account: null, planKey: null, model: undefined, cap: null };
  if (!adminConfigured || !user) return out;
  try {
    const acct = await accountByOwner(user.id);
    if (!acct) return out;
    out.account = acct;
    out.planKey = statusIsLive(acct.sub_status) ? acct.plan : null;
    out.model = modelForPlan(out.planKey) || undefined;
    out.cap = scanCapForPlan(out.planKey);
  } catch (e) { console.error('[plan]', e.message); }
  return out;
}

// Enforce a monthly scan cap. Returns true to proceed. Never blocks on a billing error.
async function meterScan(account, cap, res) {
  if (!account || !cap) return true;
  try {
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const used = account.usage_period === period ? (account.usage_scans || 0) : 0;
    if (used >= cap) {
      res.status(429).json({ error: 'quota', message: `You’ve used all ${cap} scans on your plan this month. Upgrade for more.` });
      return false;
    }
    await updateAccount(account.id, { usage_period: period, usage_scans: used + 1 });
    return true;
  } catch (e) { console.error('[meter]', e.message); return true; }
}

// --- Stripe webhook: keep the account's plan/status in sync with Stripe ---
async function stripeWebhook(req, res) {
  if (!billingConfigured) return res.status(400).send('billing not configured');
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = WEBHOOK_SECRET ? stripe().webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET) : JSON.parse(req.body.toString());
  } catch (e) { console.error('[webhook] signature', e.message); return res.status(400).send('bad signature'); }
  try { await handleStripeEvent(event); } catch (e) { console.error('[webhook] handle', e.message); }
  res.json({ received: true });
}

async function handleStripeEvent(event) {
  if (!adminConfigured) return;
  const t = event.type;
  if (t === 'checkout.session.completed') {
    const s = event.data.object;
    const patch = {
      stripe_customer_id: s.customer, stripe_subscription_id: s.subscription,
      plan: (s.metadata && s.metadata.plan) || null, sub_status: 'active', plan_since: new Date().toISOString(),
    };
    const accountId = s.metadata && s.metadata.account_id;
    if (accountId) await updateAccount(accountId, patch);
    else { const acct = await accountByCustomer(s.customer); if (acct) await updateAccount(acct.id, patch); }
  } else if (t === 'customer.subscription.updated' || t === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const priceId = sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price && sub.items.data[0].price.id;
    const planKey = planForPriceId(priceId) || (sub.metadata && sub.metadata.plan) || null;
    const status = t === 'customer.subscription.deleted' ? 'canceled' : sub.status;
    const acct = await accountByCustomer(sub.customer);
    if (acct) await updateAccount(acct.id, { stripe_subscription_id: sub.id, plan: statusIsLive(status) ? planKey : acct.plan, sub_status: status });
  }
}

// --- brand profile (drives the front-end look; catalog is chosen in lib/catalog.js) ---
const PROFILE = (process.env.BD_PROFILE || 'xpi').toLowerCase();
const CONFIG = {
  xpi: {
    profile: 'xpi',
    wordmark: 'XPI<span>·</span>Intel',
    accent: '#F2A93B',
    pageTitle: 'XPI BD Intelligence',
    eyebrow: 'XPI Solutions · Product Demo',
    lede:
      'See the opportunity before you make the pitch. Capture any business, and the platform researches it, backs every finding with <b>evidence</b>, scores the opportunity, and tells your rep exactly what to do next.',
    productLabel: 'XPI match',
    showWhiteLabel: true,
  },
  core: {
    profile: 'core',
    wordmark: 'BD<span>·</span>Intel',
    accent: '#3B82F6',
    pageTitle: 'BD Intelligence',
    eyebrow: 'Business Development Intelligence',
    lede:
      'Scan any business — card, website, or name — and get an evidence-backed opportunity brief in seconds: who they are, where they’re leaking revenue, and the next best move. Your catalog, your brand.',
    productLabel: 'Solution match',
    showWhiteLabel: false,
  },
};
const BRAND = CONFIG[PROFILE] || CONFIG.xpi;

app.get('/api/config', (_req, res) => res.json(BRAND));

app.get('/api/selftest', async (_req, res) => {
  const out = {};
  const k = process.env.ANTHROPIC_API_KEY || '';
  let bad = 0;
  for (let i = 0; i < k.length; i++) { if (k.charCodeAt(i) > 126) bad++; }
  out.key = { present: !!k, clean: bad === 0 }; // no key material exposed
  try {
    const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' } });
    out.anthropic = { ok: true, status: r.status };
  } catch (e) { out.anthropic = { ok: false, code: (e.cause && e.cause.code) || e.name, msg: e.message }; }
  try {
    const r = await fetch('https://1.1.1.1', { redirect: 'manual' });
    out.internet_by_ip = { ok: true, status: r.status };
  } catch (e) { out.internet_by_ip = { ok: false, code: (e.cause && e.cause.code) || e.name, msg: e.message }; }
  res.json(out);
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    profile: PROFILE,
    anthropicKey: KEY_OK,
    searchKey: !!process.env.SERPER_API_KEY,
    model: process.env.BD_MODEL || 'claude-haiku-4-5',
    catalogSize: CATALOG.length,
    billing: billingConfigured,
    billingAdmin: adminConfigured,
  });
});

app.get('/api/catalog', (_req, res) => res.json(CATALOG));

// --- Billing (Stripe) ---
app.get('/api/billing/plans', (_req, res) => res.json({ configured: billingConfigured, plans: plansPublic() }));

app.get('/api/billing/me', async (req, res) => {
  const u = await getUser(req);
  if (!u) return res.status(401).json({ error: 'auth' });
  if (!adminConfigured) return res.json({ configured: false, plan: null, status: null, used: 0, cap: null });
  try {
    const acct = await accountByOwner(u.id);
    const livePlan = acct && statusIsLive(acct.sub_status) ? acct.plan : null;
    const period = new Date().toISOString().slice(0, 7);
    const used = acct && acct.usage_period === period ? (acct.usage_scans || 0) : 0;
    res.json({ configured: billingConfigured, plan: livePlan, status: acct ? acct.sub_status : null, used, cap: scanCapForPlan(livePlan) });
  } catch (e) { res.json({ configured: billingConfigured, plan: null, status: null, used: 0, cap: null, error: e.message }); }
});

app.post('/api/billing/checkout', async (req, res) => {
  if (!billingConfigured) return res.status(400).json({ error: 'not_configured', message: 'Billing isn’t set up yet.' });
  const u = await getUser(req);
  if (!u) return res.status(401).json({ error: 'auth', message: 'Please sign in first.' });
  const p = planByKey((req.body || {}).plan);
  if (!p) return res.status(400).json({ error: 'bad_plan', message: 'Unknown plan.' });
  const priceId = process.env[p.priceEnv];
  if (!priceId) return res.status(400).json({ error: 'no_price', message: 'This plan isn’t available yet.' });
  try {
    let acct = null, customerId = null;
    if (adminConfigured) { acct = await accountByOwner(u.id); customerId = (acct && acct.stripe_customer_id) || null; }
    const s = stripe();
    if (!customerId) {
      const c = await s.customers.create({ email: u.email, metadata: { uid: u.id, account_id: acct ? acct.id : '' } });
      customerId = c.id;
      if (adminConfigured && acct) await updateAccount(acct.id, { stripe_customer_id: customerId });
    }
    const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
    const session = await s.checkout.sessions.create({
      mode: 'subscription', customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/?billing=success`,
      cancel_url: `${origin}/?billing=cancel`,
      metadata: { uid: u.id, account_id: acct ? acct.id : '', plan: p.key },
      subscription_data: { metadata: { uid: u.id, account_id: acct ? acct.id : '', plan: p.key } },
    });
    res.json({ url: session.url });
  } catch (e) { console.error('[checkout]', e); res.status(500).json({ error: 'checkout_failed', message: e.message }); }
});

app.post('/api/billing/portal', async (req, res) => {
  if (!billingConfigured || !adminConfigured) return res.status(400).json({ error: 'not_configured', message: 'Billing management isn’t available yet.' });
  const u = await getUser(req);
  if (!u) return res.status(401).json({ error: 'auth', message: 'Please sign in first.' });
  try {
    const acct = await accountByOwner(u.id);
    if (!acct || !acct.stripe_customer_id) return res.status(400).json({ error: 'no_customer', message: 'No subscription found yet.' });
    const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
    const session = await stripe().billingPortal.sessions.create({ customer: acct.stripe_customer_id, return_url: `${origin}/?billing=portal` });
    res.json({ url: session.url });
  } catch (e) { console.error('[portal]', e); res.status(500).json({ error: 'portal_failed', message: e.message }); }
});

app.post('/api/research', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  const u = await gate(req, res, 60);
  if (!u) return;
  const { name, url, catalog } = req.body || {};
  if (!name && !url) return res.status(400).json({ error: 'bad_input', message: 'Provide a business name or website.' });
  const pc = await planContext(u);
  if (!(await meterScan(pc.account, pc.cap, res))) return;
  try {
    const intel = await runResearch({ name, url, catalog: Array.isArray(catalog) ? catalog.slice(0, 40) : null, model: pc.model });
    res.json(intel);
  } catch (e) {
    console.error('[research]', e);
    res.status(500).json({ error: 'research_failed', message: e.message });
  }
});

app.post('/api/variations', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  const u = await gate(req, res, 80);
  if (!u) return;
  const { intel } = req.body || {};
  if (!intel || !intel.name) return res.status(400).json({ error: 'bad_input', message: 'Missing prospect context. Run a scan first.' });
  try {
    const pc = await planContext(u);
    const variations = await generateVariations(intel, pc.model);
    res.json(variations);
  } catch (e) {
    console.error('[variations]', e);
    res.status(500).json({ error: 'variations_failed', message: e.message });
  }
});

app.post('/api/closer', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  const u = await gate(req, res, 80);
  if (!u) return;
  const { intel, catalog, format } = req.body || {};
  if (!intel || !intel.name) return res.status(400).json({ error: 'bad_input', message: 'Missing prospect context. Run a scan first.' });
  try {
    const pc = await planContext(u);
    const cat = Array.isArray(catalog) && catalog.length ? catalog.slice(0, 40) : CATALOG;
    const closer = await generateCloser(intel, cat, { forceKind: format, model: pc.model });
    res.json(closer);
  } catch (e) {
    console.error('[closer]', e);
    res.status(500).json({ error: 'closer_failed', message: e.message });
  }
});

app.post('/api/extract', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  if (!(await gate(req, res, 80))) return;
  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'bad_input', message: 'No image provided.' });
  try {
    const fields = await extractCard(imageBase64, mediaType || 'image/jpeg');
    res.json(fields);
  } catch (e) {
    console.error('[extract]', e);
    res.status(500).json({ error: 'extract_failed', message: e.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  ${BRAND.pageTitle}  (${PROFILE})  →  http://localhost:${PORT}`);
  console.log(`  Claude key: ${KEY_OK ? 'loaded ✓' : 'MISSING ✗  (edit .env)'}`);
  console.log(`  Search key: ${process.env.SERPER_API_KEY ? 'loaded ✓' : 'not set (website-only)'}`);
  console.log(`  Billing: ${billingConfigured ? 'Stripe ✓' : 'not set (free mode)'}${billingConfigured && !adminConfigured ? '  (⚠ add SUPABASE_SERVICE_ROLE_KEY to sync plans)' : ''}`);
  console.log(`  Catalog: ${CATALOG.length} products\n`);
});
