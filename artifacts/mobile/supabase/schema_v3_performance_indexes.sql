-- SamaStock Supabase schema V3
-- Performance indexes for multi-shop data and paginated history.
-- Safe to run more than once.

create index if not exists shops_owner_updated_idx
  on public.shops(owner_id, updated_at desc);

create index if not exists shop_profiles_owner_shop_idx
  on public.shop_profiles(owner_id, shop_id);

create index if not exists products_shop_updated_idx
  on public.products(shop_id, updated_at desc);

create index if not exists products_shop_archived_name_idx
  on public.products(shop_id, is_archived, name);

create index if not exists products_shop_barcode_idx
  on public.products(shop_id, barcode)
  where barcode is not null and barcode <> '';

create index if not exists clients_shop_name_phone_idx
  on public.clients(shop_id, name, phone);

create index if not exists sales_shop_deleted_created_idx
  on public.sales(shop_id, deleted_at, created_at desc);

create index if not exists sales_shop_receipt_idx
  on public.sales(shop_id, receipt_number);

create index if not exists sales_shop_payment_created_idx
  on public.sales(shop_id, payment_type, created_at desc);

create index if not exists sale_items_shop_sale_idx
  on public.sale_items(shop_id, sale_id);

create index if not exists sale_items_shop_product_idx
  on public.sale_items(shop_id, product_id);

create index if not exists stock_movements_shop_created_idx
  on public.stock_movements(shop_id, created_at desc);

create index if not exists stock_movements_shop_product_created_idx
  on public.stock_movements(shop_id, product_id, created_at desc);

create index if not exists debts_shop_status_updated_idx
  on public.debts(shop_id, status, updated_at desc);

create index if not exists debts_shop_client_idx
  on public.debts(shop_id, client_id);

create index if not exists debt_payments_shop_created_idx
  on public.debt_payments(shop_id, created_at desc);

create index if not exists debt_payments_shop_debt_created_idx
  on public.debt_payments(shop_id, debt_id, created_at desc);
