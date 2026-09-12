-- ============================================================================
--  XPI BD Intelligence — Supabase schema
--  Run ONCE in your Supabase project: SQL Editor → New query → paste → Run.
--  Creates the secure multi-tenant tables with Row-Level Security so every
--  account only ever sees its own data.
-- ============================================================================

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  type text not null default 'company',
  name text,
  company text,
  brand text default '#F2A93B',
  catalog_choice text default 'own',
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  pkey text not null,
  name text not null,
  solves text,
  price text,
  verticals text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text,
  loc text,
  score int,
  intel jsonb,
  created_at timestamptz default now()
);

create index if not exists products_account_idx on public.products(account_id);
create index if not exists prospects_account_idx on public.prospects(account_id);

-- Row-Level Security: users can only touch rows that belong to their account.
alter table public.accounts enable row level security;
alter table public.products enable row level security;
alter table public.prospects enable row level security;

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts for all
  using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "own products" on public.products;
create policy "own products" on public.products for all
  using (account_id in (select id from public.accounts where owner = auth.uid()))
  with check (account_id in (select id from public.accounts where owner = auth.uid()));

drop policy if exists "own prospects" on public.prospects;
create policy "own prospects" on public.prospects for all
  using (account_id in (select id from public.accounts where owner = auth.uid()))
  with check (account_id in (select id from public.accounts where owner = auth.uid()));
