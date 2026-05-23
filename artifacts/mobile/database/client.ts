import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { runMigrationsAsync } from "./migrations";

const DATABASE_NAME = "samastock.db";

let databasePromise: Promise<SQLiteDatabase> | null = null;
let clearLocalDataPromise: Promise<void> | null = null;

export function getDatabaseAsync() {
  databasePromise ??= openDatabaseAsync(DATABASE_NAME);
  return databasePromise;
}

export async function initializeDatabaseAsync() {
  const db = await getDatabaseAsync();
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrationsAsync(db);
  return db;
}

export async function clearAllLocalDataAsync() {
  if (clearLocalDataPromise) {
    await clearLocalDataPromise;
    return;
  }

  clearLocalDataPromise = (async () => {
    const db = await getDatabaseAsync();
    await db.execAsync(`
      PRAGMA foreign_keys = OFF;
      DELETE FROM debt_payments;
      DELETE FROM debts;
      DELETE FROM sale_items;
      DELETE FROM stock_movements;
      DELETE FROM sales;
      DELETE FROM clients;
      DELETE FROM products;
      DELETE FROM shop_profile;
      DELETE FROM shops;
      DELETE FROM sync_state;
      PRAGMA foreign_keys = ON;
    `);
  })();

  try {
    await clearLocalDataPromise;
  } finally {
    clearLocalDataPromise = null;
  }
}
