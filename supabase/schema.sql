-- Run this in the Supabase SQL editor.
-- The website uses the service role on the server. The anon key is not granted access.

create table if not exists public.profiles (
  id text primary key,
  watcher_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pay_links (
  id text primary key,
  profile_id text not null references public.profiles (id),
  title text not null,
  note text not null default '',
  amount_zatoshi text,
  active boolean not null default true,
  max_payments integer,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  profile_id text not null references public.profiles (id),
  link_id text references public.pay_links (id),
  kind text not null check (kind in ('bill', 'link')),
  title text not null,
  note text not null default '',
  amount_zatoshi text,
  address text not null default '',
  address_index integer,
  memo text not null default '',
  status text not null,
  received_zatoshi text not null default '0',
  txid text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  paid_at timestamptz
);

create index if not exists payments_profile_idx on public.payments (profile_id);
create index if not exists payments_link_idx on public.payments (link_id);
create index if not exists pay_links_profile_idx on public.pay_links (profile_id);

alter table public.profiles enable row level security;
alter table public.pay_links enable row level security;
alter table public.payments enable row level security;
