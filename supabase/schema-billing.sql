-- ============================================================================
--  XPI BD Intelligence — Billing columns  (run ONCE, AFTER schema.sql)
--  Supabase → SQL Editor → New query → paste → Run.
--  Safe to re-run (all IF NOT EXISTS). Adds subscription + usage tracking to
--  accounts. The Stripe webhook writes these with the service-role key.
-- ============================================================================

alter table public.accounts add column if not exists plan text;                   -- 'solo' | 'team' | 'agency' | null
alter table public.accounts add column if not exists sub_status text;             -- 'active' | 'trialing' | 'past_due' | 'canceled' | null
alter table public.accounts add column if not exists stripe_customer_id text;
alter table public.accounts add column if not exists stripe_subscription_id text;
alter table public.accounts add column if not exists plan_since timestamptz;
alter table public.accounts add column if not exists usage_period text;           -- 'YYYY-MM'
alter table public.accounts add column if not exists usage_scans int default 0;

create index if not exists accounts_stripe_customer_idx on public.accounts(stripe_customer_id);
create index if not exists accounts_owner_idx on public.accounts(owner);

-- Note: the existing "own accounts" RLS policy already lets a signed-in user READ
-- their own plan fields. All WRITES to these columns happen server-side with the
-- service-role key (which bypasses RLS), so no extra policy is needed.
