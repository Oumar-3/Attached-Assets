-- SamaStock Supabase schema V4
-- Indexes used by strict incremental sync queries.
-- Safe to run more than once.

create index if not exists shop_profiles_owner_updated_idx
  on public.shop_profiles(owner_id, updated_at asc);

create index if not exists products_owner_updated_idx
  on public.products(owner_id, updated_at asc);

create index if not exists clients_owner_updated_idx
  on public.clients(owner_id, updated_at asc);

create index if not exists sales_owner_updated_idx
  on public.sales(owner_id, updated_at asc);

create index if not exists sale_items_owner_updated_idx
  on public.sale_items(owner_id, updated_at asc);

create index if not exists stock_movements_owner_updated_idx
  on public.stock_movements(owner_id, updated_at asc);

create index if not exists debts_owner_updated_idx
  on public.debts(owner_id, updated_at asc);

create index if not exists debt_payments_owner_updated_idx
  on public.debt_payments(owner_id, updated_at asc);
