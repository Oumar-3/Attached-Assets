-- SamaStock Supabase schema V2
-- Adds multi-shop support while keeping V1 owner_id columns for compatibility.
-- Run this after schema_v1.sql.

create table if not exists public.shops (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  owner_name text not null default '',
  phone text not null default '',
  address text not null default '',
  sync_status sync_status not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.shop_members (
  shop_id text not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'seller')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create index if not exists shops_owner_idx on public.shops(owner_id);
create index if not exists shop_members_user_idx on public.shop_members(user_id);

drop trigger if exists set_shops_updated_at on public.shops;
create trigger set_shops_updated_at before update on public.shops
for each row execute function public.set_updated_at();

create or replace function public.add_shop_owner_member()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.shop_members (shop_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (shop_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists add_shop_owner_member on public.shops;
create trigger add_shop_owner_member after insert on public.shops
for each row execute function public.add_shop_owner_member();

alter table public.shop_profiles add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.products add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.clients add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.sales add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.sale_items add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.stock_movements add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.debts add column if not exists shop_id text references public.shops(id) on delete cascade;
alter table public.debt_payments add column if not exists shop_id text references public.shops(id) on delete cascade;

insert into public.shops (
  id, owner_id, name, owner_name, phone, address, sync_status, created_at, updated_at, deleted_at
)
select
  coalesce(nullif(shop_id, ''), id),
  owner_id,
  shop_name,
  owner_name,
  phone,
  address,
  sync_status,
  created_at,
  updated_at,
  deleted_at
from public.shop_profiles
on conflict (id) do update set
  name = excluded.name,
  owner_name = excluded.owner_name,
  phone = excluded.phone,
  address = excluded.address,
  updated_at = excluded.updated_at,
  deleted_at = excluded.deleted_at;

insert into public.shop_members (shop_id, user_id, role)
select id, owner_id, 'owner'
from public.shops
on conflict (shop_id, user_id) do nothing;

update public.shop_profiles set shop_id = coalesce(shop_id, id);
update public.products p
set shop_id = coalesce(p.shop_id, sp.id)
from public.shop_profiles sp
where p.owner_id = sp.owner_id and p.shop_id is null;
update public.clients c
set shop_id = coalesce(c.shop_id, sp.id)
from public.shop_profiles sp
where c.owner_id = sp.owner_id and c.shop_id is null;
update public.sales s
set shop_id = coalesce(s.shop_id, sp.id)
from public.shop_profiles sp
where s.owner_id = sp.owner_id and s.shop_id is null;
update public.sale_items si
set shop_id = coalesce(si.shop_id, s.shop_id)
from public.sales s
where si.sale_id = s.id and si.shop_id is null;
update public.stock_movements sm
set shop_id = coalesce(sm.shop_id, p.shop_id)
from public.products p
where sm.product_id = p.id and sm.shop_id is null;
update public.debts d
set shop_id = coalesce(d.shop_id, c.shop_id)
from public.clients c
where d.client_id = c.id and d.shop_id is null;
update public.debt_payments dp
set shop_id = coalesce(dp.shop_id, d.shop_id)
from public.debts d
where dp.debt_id = d.id and dp.shop_id is null;

create index if not exists shop_profiles_shop_idx on public.shop_profiles(shop_id);
create index if not exists products_shop_idx on public.products(shop_id);
create index if not exists clients_shop_idx on public.clients(shop_id);
create index if not exists sales_shop_created_idx on public.sales(shop_id, created_at desc);
create index if not exists sale_items_shop_idx on public.sale_items(shop_id);
create index if not exists stock_movements_shop_idx on public.stock_movements(shop_id);
create index if not exists debts_shop_status_idx on public.debts(shop_id, status);
create index if not exists debt_payments_shop_idx on public.debt_payments(shop_id);

drop index if exists products_owner_barcode_unique;
create unique index if not exists products_shop_barcode_unique
  on public.products(shop_id, barcode)
  where barcode is not null and barcode <> '' and shop_id is not null;

create or replace function public.is_shop_member(target_shop_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.shop_members sm
    where sm.shop_id = target_shop_id
      and sm.user_id = auth.uid()
  );
$$;

alter table public.shops enable row level security;
alter table public.shop_members enable row level security;

drop policy if exists "shops_member_all" on public.shops;
create policy "shops_member_all" on public.shops
for all
using (owner_id = auth.uid() or public.is_shop_member(id))
with check (owner_id = auth.uid());

drop policy if exists "shop_members_owner_select" on public.shop_members;
create policy "shop_members_owner_select" on public.shop_members
for select using (public.is_shop_member(shop_id));

drop policy if exists "shop_members_owner_write" on public.shop_members;
create policy "shop_members_owner_write" on public.shop_members
for all
using (
  exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = auth.uid()
  )
);

drop policy if exists "shop_profiles_owner_all" on public.shop_profiles;
create policy "shop_profiles_shop_member_all" on public.shop_profiles
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "products_owner_all" on public.products;
create policy "products_shop_member_all" on public.products
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "clients_owner_all" on public.clients;
create policy "clients_shop_member_all" on public.clients
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "sales_owner_all" on public.sales;
create policy "sales_shop_member_all" on public.sales
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "sale_items_owner_all" on public.sale_items;
create policy "sale_items_shop_member_all" on public.sale_items
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "stock_movements_owner_all" on public.stock_movements;
create policy "stock_movements_shop_member_all" on public.stock_movements
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "debts_owner_all" on public.debts;
create policy "debts_shop_member_all" on public.debts
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));

drop policy if exists "debt_payments_owner_all" on public.debt_payments;
create policy "debt_payments_shop_member_all" on public.debt_payments
for all
using (auth.uid() = owner_id or public.is_shop_member(shop_id))
with check (auth.uid() = owner_id or public.is_shop_member(shop_id));
