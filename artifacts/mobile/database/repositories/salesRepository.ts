import { getDatabaseAsync } from "@/database/client";
import type { SaleItemRecord, SaleRecord } from "@/models";
import { createId } from "@/utils/id";
import type { ClientInput } from "./debtRepository";
import { requireActiveShopIdAsync } from "./shopRepository";

export type CartSaleItemInput = {
  productId: string;
  quantity: number;
};

export type CreditSaleInput = {
  items: CartSaleItemInput[];
  client: ClientInput;
  description?: string;
};

export type SalesPageOptions = {
  limit?: number;
  offset?: number;
  search?: string;
};

export type SalesSummary = {
  totalRevenue: number;
  totalProfit: number;
  todayCount: number;
  creditCount: number;
  visibleCount: number;
};

type ProductSaleRow = {
  id: string;
  name: string;
  buy_price: number;
  sell_price: number;
  stock: number;
};

type ClientSaleRow = {
  id: string;
  name: string;
  phone: string | null;
};

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function createSaleAsync(
  items: CartSaleItemInput[],
  paymentType: "cash" | "credit",
  options?: { client?: ClientInput; description?: string },
) {
  if (items.length === 0) {
    throw new Error("Le panier est vide.");
  }

  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const saleId = createId("sale");
  const now = new Date().toISOString();
  const receiptNumber = `V-${Date.now().toString(36).toUpperCase()}`;

  let saleTotal = 0;
  let saleProfit = 0;
  let clientId: string | null = null;

  await db.withTransactionAsync(async () => {
    const hydratedItems: Array<ProductSaleRow & { quantity: number }> = [];

    if (paymentType === "credit") {
      const clientName = options?.client?.name.trim();
      if (!clientName) throw new Error("Client requis pour une vente a credit");
      const clientPhone = nullableText(options?.client?.phone);
      const existingClient = await db.getFirstAsync<ClientSaleRow>(
        `SELECT id, name, phone
         FROM clients
         WHERE lower(name) = lower(?)
           AND (phone IS ? OR phone = ?)
           AND shop_id = ?
         LIMIT 1`,
        clientName,
        clientPhone,
        clientPhone,
        shopId,
      );

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        clientId = createId("client");
        await db.runAsync(
          `INSERT INTO clients (id, shop_id, name, phone, created_at, updated_at, sync_status, last_synced_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL)`,
          clientId,
          shopId,
          clientName,
          clientPhone,
          now,
          now,
        );
      }
    }

    for (const item of items) {
      const quantity = Math.trunc(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Quantite invalide");
      }

      const product = await db.getFirstAsync<ProductSaleRow>(
        "SELECT id, name, buy_price, sell_price, stock FROM products WHERE id = ? AND shop_id = ? AND is_archived = 0",
        item.productId,
        shopId,
      );
      if (!product) throw new Error("Produit introuvable");
      const existingItem = hydratedItems.find((hydratedItem) => hydratedItem.id === product.id);
      const requestedQuantity = quantity + (existingItem?.quantity ?? 0);
      if (product.stock < requestedQuantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      if (existingItem) {
        existingItem.quantity = requestedQuantity;
      } else {
        hydratedItems.push({ ...product, quantity });
      }
    }

    saleTotal = hydratedItems.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);
    saleProfit = hydratedItems.reduce((sum, item) => sum + (item.sell_price - item.buy_price) * item.quantity, 0);

    await db.runAsync(
      `INSERT INTO sales (
        id, shop_id, receipt_number, total, estimated_profit, payment_type, client_id,
        created_at, sync_status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
      saleId,
      shopId,
      receiptNumber,
      saleTotal,
      saleProfit,
      paymentType,
      clientId,
      now,
    );

    for (const item of hydratedItems) {
      const lineTotal = item.sell_price * item.quantity;
      const lineProfit = (item.sell_price - item.buy_price) * item.quantity;
      const quantityAfter = item.stock - item.quantity;

      await db.runAsync(
        `INSERT INTO sale_items (
          id, shop_id, sale_id, product_id, product_name, quantity, buy_price,
          sell_price, line_total, estimated_profit, sync_status, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
        createId("item"),
        shopId,
        saleId,
        item.id,
        item.name,
        item.quantity,
        item.buy_price,
        item.sell_price,
        lineTotal,
        lineProfit,
      );

      await db.runAsync(
        "UPDATE products SET stock = ?, updated_at = ?, sync_status = 'pending', last_synced_at = NULL WHERE id = ? AND shop_id = ?",
        quantityAfter,
        now,
        item.id,
        shopId,
      );

      await db.runAsync(
        `INSERT INTO stock_movements (
          id, shop_id, product_id, type, quantity_delta, quantity_after, note, sale_id,
          created_at, sync_status, last_synced_at
        ) VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?, 'pending', NULL)`,
        createId("move"),
        shopId,
        item.id,
        -item.quantity,
        quantityAfter,
        `Vente ${receiptNumber}`,
        saleId,
        now,
      );
    }

    if (paymentType === "credit") {
      if (!clientId) throw new Error("Client non enregistre");
      await db.runAsync(
        `INSERT INTO debts (
          id, shop_id, client_id, amount, paid_amount, status, description, sale_id,
          created_at, updated_at, sync_status, last_synced_at
        ) VALUES (?, ?, ?, ?, 0, 'open', ?, ?, ?, ?, 'pending', NULL)`,
        createId("debt"),
        shopId,
        clientId,
        saleTotal,
        nullableText(options?.description) || `Vente a credit ${receiptNumber}`,
        saleId,
        now,
        now,
      );
    }
  });

  const sale = await getSaleByIdAsync(saleId);
  if (!sale) throw new Error("Vente non enregistrée");
  return sale;
}

export async function createCashSaleAsync(items: CartSaleItemInput[]) {
  return createSaleAsync(items, "cash");
}

export async function createCreditSaleAsync(input: CreditSaleInput) {
  return createSaleAsync(input.items, "credit", {
    client: input.client,
    description: input.description,
  });
}

export async function listRecentSalesAsync(limit = 50) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  return db.getAllAsync<SaleRecord>(
    `SELECT id, receipt_number as receiptNumber, total, estimated_profit as estimatedProfit,
      payment_type as paymentType, client_id as clientId, created_at as createdAt
     FROM sales
     WHERE shop_id = ?
       AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    shopId,
    limit,
  );
}

function buildSalesSearchClause(search?: string) {
  const q = search?.trim().toLowerCase();
  if (!q) {
    return { clause: "", params: [] as string[] };
  }

  const like = `%${q}%`;
  return {
    clause: `
      AND (
        lower(receipt_number) LIKE ?
        OR lower(payment_type) LIKE ?
        OR date(created_at) LIKE ?
        OR strftime('%d/%m/%Y', created_at) LIKE ?
        OR strftime('%m/%Y', created_at) LIKE ?
      )`,
    params: [like, like, like, like, like],
  };
}

export async function listSalesPageAsync(options: SalesPageOptions = {}) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const limit = Math.max(1, Math.min(options.limit ?? 10, 50));
  const offset = Math.max(0, options.offset ?? 0);
  const search = buildSalesSearchClause(options.search);

  return db.getAllAsync<SaleRecord>(
    `SELECT id, receipt_number as receiptNumber, total, estimated_profit as estimatedProfit,
      payment_type as paymentType, client_id as clientId, created_at as createdAt
     FROM sales
     WHERE shop_id = ?
       AND deleted_at IS NULL
       ${search.clause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    shopId,
    ...search.params,
    limit,
    offset,
  );
}

export async function countSalesPageAsync(searchText?: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const search = buildSalesSearchClause(searchText);
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM sales
     WHERE shop_id = ?
       AND deleted_at IS NULL
       ${search.clause}`,
    shopId,
    ...search.params,
  );
  return row?.count ?? 0;
}

export async function getSalesSummaryAsync(): Promise<SalesSummary> {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const today = localDateKey(new Date());
  const row = await db.getFirstAsync<{
    totalRevenue: number | null;
    totalProfit: number | null;
    todayCount: number | null;
    creditCount: number | null;
    visibleCount: number | null;
  }>(
    `SELECT
       COALESCE(SUM(total), 0) as totalRevenue,
       COALESCE(SUM(estimated_profit), 0) as totalProfit,
       COALESCE(SUM(CASE WHEN date(created_at) = ? THEN 1 ELSE 0 END), 0) as todayCount,
       COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN 1 ELSE 0 END), 0) as creditCount,
       COUNT(*) as visibleCount
     FROM sales
     WHERE shop_id = ?
       AND deleted_at IS NULL`,
    today,
    shopId,
  );

  return {
    totalRevenue: row?.totalRevenue ?? 0,
    totalProfit: row?.totalProfit ?? 0,
    todayCount: row?.todayCount ?? 0,
    creditCount: row?.creditCount ?? 0,
    visibleCount: row?.visibleCount ?? 0,
  };
}

export async function getSaleByIdAsync(id: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  return db.getFirstAsync<SaleRecord>(
    `SELECT id, receipt_number as receiptNumber, total, estimated_profit as estimatedProfit,
      payment_type as paymentType, client_id as clientId, created_at as createdAt
     FROM sales
     WHERE id = ? AND shop_id = ?`,
    id,
    shopId,
  );
}

export async function hideSaleFromHistoryAsync(id: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const now = new Date().toISOString();

  await db.runAsync(
    "UPDATE sales SET deleted_at = ?, sync_status = 'pending', last_synced_at = NULL WHERE id = ? AND shop_id = ?",
    now,
    id,
    shopId,
  );
}

export async function listSaleItemsAsync(saleId: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  return db.getAllAsync<SaleItemRecord>(
    `SELECT id, sale_id as saleId, product_id as productId, product_name as productName,
      quantity, buy_price as buyPrice, sell_price as sellPrice,
      line_total as lineTotal, estimated_profit as estimatedProfit
     FROM sale_items
     WHERE sale_id = ? AND shop_id = ?`,
    saleId,
    shopId,
  );
}
