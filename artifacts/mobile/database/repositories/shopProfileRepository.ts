import { getDatabaseAsync } from "@/database/client";
import type { ShopProfile, ShopProfileInput } from "@/models";
import { requireActiveShopIdAsync } from "./shopRepository";

const SHOP_PROFILE_ID = "main";

type ShopProfileRow = {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
};

function mapShopProfile(row: ShopProfileRow): ShopProfile {
  return {
    id: row.id,
    shopName: row.shop_name,
    ownerName: row.owner_name,
    phone: row.phone,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getShopProfileAsync() {
  const db = await getDatabaseAsync();
  const row = await db.getFirstAsync<ShopProfileRow>(
    `SELECT id, shop_name, owner_name, phone, address, created_at, updated_at
     FROM shop_profile
     WHERE deleted_at IS NULL
     ORDER BY updated_at DESC
     LIMIT 1`,
  );

  return row ? mapShopProfile(row) : null;
}

export async function isShopConfiguredAsync() {
  const profile = await getShopProfileAsync();
  return !!profile?.shopName.trim();
}

export async function saveShopProfileAsync(input: ShopProfileInput) {
  const db = await getDatabaseAsync();
  const now = new Date().toISOString();
  const existingProfile = await getShopProfileAsync();
  const shopId = await requireActiveShopIdAsync();
  const profileId = existingProfile?.id ?? SHOP_PROFILE_ID;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE shops
       SET name = ?, owner_name = ?, phone = ?, address = ?,
           updated_at = ?, sync_status = 'pending', last_synced_at = NULL
       WHERE id = ?`,
      input.shopName.trim(),
      input.ownerName.trim(),
      input.phone.trim(),
      input.address.trim(),
      now,
      shopId,
    );

    await db.runAsync(
      `INSERT INTO shop_profile (
         id, shop_id, shop_name, owner_name, phone, address, created_at, updated_at,
         sync_status, last_synced_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)
       ON CONFLICT(id) DO UPDATE SET
         shop_id = excluded.shop_id,
         shop_name = excluded.shop_name,
         owner_name = excluded.owner_name,
         phone = excluded.phone,
         address = excluded.address,
         updated_at = excluded.updated_at,
         sync_status = 'pending',
         last_synced_at = NULL`,
      profileId,
      shopId,
      input.shopName.trim(),
      input.ownerName.trim(),
      input.phone.trim(),
      input.address.trim(),
      now,
      now,
    );
  });

  const profile = await getShopProfileAsync();
  if (!profile) {
    throw new Error("Shop profile was not saved");
  }

  return profile;
}
