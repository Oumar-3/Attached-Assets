import { getDatabaseAsync } from "@/database/client";

const BACKUP_TABLES = [
  "shops",
  "shop_profile",
  "clients",
  "products",
  "sales",
  "sale_items",
  "stock_movements",
  "debts",
  "debt_payments",
] as const;

type BackupTable = (typeof BACKUP_TABLES)[number];

export type BackupOverview = {
  pendingCount: number;
  lastBackupAt: string | null;
};

async function getPendingCountForTable(table: BackupTable) {
  const db = await getDatabaseAsync();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM ${table}
     WHERE sync_status IN ('pending', 'deleted') OR remote_id IS NULL`,
  );
  return row?.count ?? 0;
}

async function getLastSyncedForTable(table: BackupTable) {
  const db = await getDatabaseAsync();
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT MAX(last_synced_at) as value FROM ${table}`,
  );
  return row?.value ?? null;
}

async function getLastPulledAt() {
  const db = await getDatabaseAsync();
  try {
    const row = await db.getFirstAsync<{ value: string | null }>(
      "SELECT MAX(last_pulled_at) as value FROM sync_state",
    );
    return row?.value ?? null;
  } catch {
    return null;
  }
}

function newestDate(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .sort()
    .at(-1) ?? null;
}

export async function getBackupOverviewAsync(): Promise<BackupOverview> {
  const pendingCounts = await Promise.all(
    BACKUP_TABLES.map(async table => {
      try {
        return await getPendingCountForTable(table);
      } catch {
        return 0;
      }
    }),
  );
  const lastSyncedValues = await Promise.all(
    BACKUP_TABLES.map(async table => {
      try {
        return await getLastSyncedForTable(table);
      } catch {
        return null;
      }
    }),
  );

  return {
    pendingCount: pendingCounts.reduce((total, count) => total + count, 0),
    lastBackupAt: newestDate([await getLastPulledAt(), ...lastSyncedValues]),
  };
}
