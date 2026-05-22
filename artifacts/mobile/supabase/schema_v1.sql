-- SamaStock Supabase schema V1
-- Local-first design: mobile SQLite keeps local ids, Supabase stores the same ids for deterministic sync.

create extension if not exists pgcrypto;

create type payment_type as enum ('cash', 'credit');
create type stock_movement_type as enum ('initial', 'purchase', 'sale', 'adjustment', 'archive');
create type debt_status as enum ('open', 'paid');
create type sync_status as enum ('pending', 'synced', 'conflict', 'deleted');

create table if not exists public.shop_profiles (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shop_name text not null,
  owner_name text not null,
  phone text not null default '',
  address text not null default '',
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.products (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  brand text,
  format text,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  stock integer not null default 0,
  alert_threshold integer not null default 5,
  barcode text,
  image_uri text,
  estimated_average_price numeric,
  is_archived boolean not null default false,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists products_owner_barcode_unique
  on public.products(owner_id, barcode)
  where barcode is not null and barcode <> '';
create index if not exists products_owner_idx on public.products(owner_id);
create index if not exists products_search_idx on public.products(owner_id, name, category, brand, format, barcode);

create table if not exists public.clients (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists clients_owner_idx on public.clients(owner_id);

create table if not exists public.sales (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  receipt_number text not null,
  total numeric not null default 0,
  estimated_profit numeric not null default 0,
  payment_type payment_type not null,
  client_id text references public.clients(id) on delete set null,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(owner_id, receipt_number)
);

create index if not exists sales_owner_created_idx on public.sales(owner_id, created_at desc);
create index if not exists sales_client_idx on public.sales(client_id);

create table if not exists public.sale_items (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sale_id text not null references public.sales(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  quantity integer not null,
  buy_price numeric not null default 0,
  sell_price numeric not null default 0,
  line_total numeric not null default 0,
  estimated_profit numeric not null default 0,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists sale_items_sale_idx on public.sale_items(sale_id);
create index if not exists sale_items_product_idx on public.sale_items(product_id);

create table if not exists public.stock_movements (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id),
  type stock_movement_type not null,
  quantity_delta integer not null,
  quantity_after integer not null,
  note text,
  sale_id text references public.sales(id) on delete set null,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists stock_movements_product_idx on public.stock_movements(product_id);
create index if not exists stock_movements_sale_idx on public.stock_movements(sale_id);

create table if not exists public.debts (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null references public.clients(id),
  amount numeric not null,
  paid_amount numeric not null default 0,
  status debt_status not null default 'open',
  description text,
  sale_id text references public.sales(id) on delete set null,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists debts_client_idx on public.debts(client_id);
create index if not exists debts_status_idx on public.debts(owner_id, status);

create table if not exists public.debt_payments (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  debt_id text not null references public.debts(id) on delete cascade,
  amount numeric not null,
  note text,
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists debt_payments_debt_idx on public.debt_payments(debt_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_shop_profiles_updated_at on public.shop_profiles;
create trigger set_shop_profiles_updated_at before update on public.shop_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_sales_updated_at on public.sales;
create trigger set_sales_updated_at before update on public.sales
for each row execute function public.set_updated_at();

drop trigger if exists set_sale_items_updated_at on public.sale_items;
create trigger set_sale_items_updated_at before update on public.sale_items
for each row execute function public.set_updated_at();

drop trigger if exists set_stock_movements_updated_at on public.stock_movements;
create trigger set_stock_movements_updated_at before update on public.stock_movements
for each row execute function public.set_updated_at();

drop trigger if exists set_debts_updated_at on public.debts;
create trigger set_debts_updated_at before update on public.debts
for each row execute function public.set_updated_at();

drop trigger if exists set_debt_payments_updated_at on public.debt_payments;
create trigger set_debt_payments_updated_at before update on public.debt_payments
for each row execute function public.set_updated_at();

alter table public.shop_profiles enable row level security;
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

drop policy if exists "shop_profiles_owner_all" on public.shop_profiles;
create policy "shop_profiles_owner_all" on public.shop_profiles
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "products_owner_all" on public.products;
create policy "products_owner_all" on public.products
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "clients_owner_all" on public.clients;
create policy "clients_owner_all" on public.clients
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "sales_owner_all" on public.sales;
create policy "sales_owner_all" on public.sales
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "sale_items_owner_all" on public.sale_items;
create policy "sale_items_owner_all" on public.sale_items
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "stock_movements_owner_all" on public.stock_movements;
create policy "stock_movements_owner_all" on public.stock_movements
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "debts_owner_all" on public.debts;
create policy "debts_owner_all" on public.debts
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "debt_payments_owner_all" on public.debt_payments;
create policy "debt_payments_owner_all" on public.debt_payments
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
