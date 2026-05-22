export type SyncStatus = "pending" | "synced" | "conflict" | "deleted";

export type SyncableTable =
  | "shops"
  | "shop_profile"
  | "products"
  | "clients"
  | "sales"
  | "sale_items"
  | "stock_movements"
  | "debts"
  | "debt_payments";

export type SyncDirection = "push" | "pull";

export type SyncResult = {
  table: SyncableTable;
  direction: SyncDirection;
  pushed: number;
  pulled: number;
  conflicts: number;
  failed: number;
};

export type SyncCheckpoint = {
  table: SyncableTable;
  lastPulledAt: string | null;
};
