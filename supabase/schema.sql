-- Esegui in Supabase > SQL Editor
create table if not exists products (
  id text primary key,
  source text not null,
  url text,
  title text,
  currency text default 'EUR',
  last_price numeric,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);

create table if not exists price_history (
  id bigserial primary key,
  product_id text references products(id) on delete cascade,
  series text not null,
  price numeric not null,
  seen_at timestamptz default now()
);
create index if not exists price_history_series_idx on price_history (series, seen_at desc);

create table if not exists alerts (
  id bigserial primary key,
  product_id text references products(id) on delete cascade,
  title text,
  url text,
  price numeric,
  ref_price numeric,
  reasons text,
  created_at timestamptz default now()
);
create index if not exists alerts_product_idx on alerts (product_id, created_at desc);

alter table products enable row level security;
alter table price_history enable row level security;
alter table alerts enable row level security;
