import { getDatabaseAsync } from "@/database/client";

export type LocalShopRecord = {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type LocalShopRow = {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  address: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function mapShop(row: LocalShopRow): LocalShopRecord {
  return {
    id: row.id,
    name: row.name,
    ownerName: row.owner_name,
    phone: row.phone,
    address: row.address,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveShopAsync() {
  const db = await getDatabaseAsync();
  const row = await db.getFirstAsync<LocalShopRow>(
    `SELECT id, name, owner_name, phone, address, is_active, created_at, updated_at
     FROM shops
     WHERE deleted_at IS NULL
     ORDER BY is_active DESC, updated_at DESC
     LIMIT 1`,
  );
  return row ? mapShop(row) : null;
}

export async function requireActiveShopIdAsync() {
  const activeShop = await getActiveShopAsync();
  if (activeShop) return activeShop.id;

  const db = await getDatabaseAsync();
  const now = new Date().toISOString();
  const fallbackId = "local-main";
  await db.runAsync(
    `INSERT OR IGNORE INTO shops (
      id, name, owner_name, phone, address, is_active, created_at, updated_at
    ) VALUES (?, 'Ma boutique', '', '', '', 1, ?, ?)`,
    fallbackId,
    now,
    now,
  );
  return fallbackId;
}

export async function setActiveShopAsync(shopId: string) {
  const db = await getDatabaseAsync();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE shops SET is_active = 0");
    await db.runAsync("UPDATE shops SET is_active = 1 WHERE id = ?", shopId);
  });
}
