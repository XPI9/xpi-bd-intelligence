// ============================================================================
//  BILLING PLANS  —  BD Intelligence subscription tiers
//  Model quality rises with tier (the "best answers" upsell + margin control).
//  The dollar figures here are DISPLAY ONLY. The actual charge is the Stripe
//  Price object whose id lives in the env var named by `priceEnv`.
//  An account with NO plan keeps today's behavior (env BD_MODEL, hourly limit
//  only) — so nothing here can break the current/board demo.
// ============================================================================

export const PLANS = {
  solo: {
    key: 'solo', name: 'Solo', price: '$49', per: '/mo',
    priceEnv: 'STRIPE_PRICE_SOLO',
    model: 'claude-haiku-4-5', scans: 50, seats: 1, whitelabel: false,
    blurb: 'For a single rep getting started.',
    features: ['1 user', '~50 scans / month', 'Fast AI (Haiku)', 'Full Closer + AVO'],
  },
  team: {
    key: 'team', name: 'Team', price: '$149', per: '/mo',
    priceEnv: 'STRIPE_PRICE_TEAM',
    model: 'claude-sonnet-5', scans: 250, seats: 3, whitelabel: false,
    blurb: 'For a small sales team.',
    features: ['Up to 3 users', '~250 scans / month', 'Sharper AI (Sonnet)', 'Priority research'],
  },
  agency: {
    key: 'agency', name: 'Agency', price: '$399', per: '/mo',
    priceEnv: 'STRIPE_PRICE_AGENCY',
    model: 'claude-opus-5', scans: 1000, seats: 10, whitelabel: true,
    blurb: 'For BD agencies running it under their own brand.',
    features: ['Up to 10 users', '~1000 scans / month', 'Best AI (Opus)', 'White-label branding'],
  },
};

export const PLAN_ORDER = ['solo', 'team', 'agency'];

// Public view (no internal fields) for the front-end plans screen.
export function plansPublic() {
  return PLAN_ORDER.map((k) => {
    const p = PLANS[k];
    return { key: p.key, name: p.name, price: p.price, per: p.per, blurb: p.blurb, features: p.features, whitelabel: p.whitelabel };
  });
}

export function planByKey(k) { return PLANS[k] || null; }

// Which Claude model an account gets. Unknown/no plan -> null so the server
// falls back to env BD_MODEL (current behavior). Server-authoritative only.
export function modelForPlan(k) { const p = PLANS[k]; return p ? p.model : null; }

// Monthly scan cap. Unknown/no plan -> null (no monthly cap; hourly limit still applies).
export function scanCapForPlan(k) { const p = PLANS[k]; return p ? p.scans : null; }

// Reverse-map a Stripe Price id back to a plan key (used by the webhook).
export function planForPriceId(priceId) {
  if (!priceId) return null;
  for (const k of PLAN_ORDER) {
    if (process.env[PLANS[k].priceEnv] && process.env[PLANS[k].priceEnv] === priceId) return k;
  }
  return null;
}

// Only these subscription statuses grant the plan's model/limits.
export function statusIsLive(s) { return s === 'active' || s === 'trialing'; }
