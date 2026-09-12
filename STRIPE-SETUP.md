# Turning on billing (Stripe) — XPI BD Intelligence

Billing is **built and deployed but OFF** until you add the keys below. Until then
the app runs exactly as it does today (free, no plan limits) — so this is safe to
do whenever you're ready. Nothing changes for current users until you finish.

There are 4 steps. Budget ~20 minutes.

---

## 1. Create the 3 products in Stripe

In the [Stripe Dashboard](https://dashboard.stripe.com) → **Product catalog** → **Add product**.
Create three, each a **recurring / monthly** price:

| Product      | Price (monthly) |
|--------------|-----------------|
| BD Solo      | $49             |
| BD Team      | $149            |
| BD Agency    | $399            |

After saving each, click the price and copy its **Price ID** (looks like `price_1AbC...`).
You'll paste all three into `.env` in step 3.

> Tip: do this in **Test mode** first (toggle top-right). Test and live have separate keys and price IDs.

## 2. Get your keys

- **Secret key** — Stripe → Developers → API keys → **Secret key** (`sk_test_...` or `sk_live_...`).
- **Webhook secret** — Stripe → Developers → **Webhooks** → **Add endpoint**:
  - Endpoint URL: `https://bd.xpisolutions.com/api/webhooks/stripe`
  - Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Save, then copy the **Signing secret** (`whsec_...`).
- **Supabase service-role key** — Supabase → Project → Settings → **API** → **service_role** secret.
  (This lets the webhook update an account's plan. Keep it secret — it bypasses row security.)

## 3. Add them to the server `.env`

Add these lines to `/opt/xpi-bd/.env` on the VPS:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_SOLO=price_xxx
STRIPE_PRICE_TEAM=price_xxx
STRIPE_PRICE_AGENCY=price_xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   (the service_role JWT)
```

⚠️ **The Hostinger web console masks long pasted keys into bullet characters** (this bit us
before). Edit `.env` with `nano` over SSH, or paste base64 like we did for the Anthropic key.

## 4. Run the database migration + restart

In Supabase → SQL Editor, paste and run **`supabase/schema-billing.sql`** (adds the plan/usage
columns — safe to re-run). Then on the VPS:

```
sh /opt/xpi-bd/up.sh
```

Check it took: `curl https://bd.xpisolutions.com/api/health` should show `"billing":true,"billingAdmin":true`.

---

## How it behaves once on

- A user opens **Account → Plans & billing**, picks a plan → Stripe Checkout → back to the app.
- The webhook flips their account to that plan; the app then uses the plan's AI model
  (Solo=Haiku, Team=Sonnet, Agency=Opus) and enforces the monthly scan cap.
- **Manage billing** opens Stripe's portal (change plan / update card / cancel).
- Accounts with **no** plan keep working on the current model with just the hourly rate limit —
  no one gets locked out.

## Changing prices or limits

Edit `lib/plans.js` (scan caps, seats, which model each tier gets, display price) and redeploy.
The actual charge always comes from the Stripe Price IDs in `.env`, never from the app.

## Later: switch to Payroc

When you're ready to capture the processing margin, we swap the Stripe checkout/portal calls in
`lib/billing.js` + `server.js` for Payroc/NMI recurring billing. The plans, gating, model-by-tier,
and UI all stay — only the payment rails change.
