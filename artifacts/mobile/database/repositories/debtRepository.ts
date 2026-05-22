import { getDatabaseAsync } from "@/database/client";
import type { ClientRecord, DebtPaymentRecord, DebtPaymentWithDebt, DebtRecord, DebtWithClient } from "@/models";
import { createId } from "@/utils/id";
import { requireActiveShopIdAsync } from "./shopRepository";

export type ClientInput = {
  name: string;
  phone?: string;
};

export type DebtInput = {
  clientId: string;
  amount: number;
  description?: string;
  saleId?: string;
};

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

type DebtRow = {
  id: string;
  client_id: string;
  amount: number;
  paid_amount: number;
  status: "open" | "paid";
  description: string | null;
  sale_id: string | null;
  created_at: string;
  updated_at: string;
};

type DebtWithClientRow = DebtRow & {
  client_name: string;
  client_phone: string | null;
  balance: number;
};

type PaymentRow = {
  id: string;
  debt_id: string;
  amount: number;
  note: string | null;
  created_at: string;
};

type PaymentWithDebtRow = PaymentRow & {
  debt_description: string | null;
  client_id: string;
};

export type DebtPaymentStats = {
  totalPaid: number;
  estimatedProfit: number;
};

function nullableText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function mapClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDebt(row: DebtRow): DebtRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    amount: row.amount,
    paidAmount: row.paid_amount,
    status: row.status,
    description: row.description,
    saleId: row.sale_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDebtWithClient(row: DebtWithClientRow): DebtWithClient {
  return {
    ...mapDebt(row),
    clientName: row.client_name,
    clientPhone: row.client_phone,
    balance: row.balance,
  };
}

function mapPayment(row: PaymentRow): DebtPaymentRecord {
  return {
    id: row.id,
    debtId: row.debt_id,
    amount: row.amount,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapPaymentWithDebt(row: PaymentWithDebtRow): DebtPaymentWithDebt {
  return {
    ...mapPayment(row),
    debtDescription: row.debt_description,
    clientId: row.client_id,
  };
}

export async function listClientsAsync() {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const rows = await db.getAllAsync<ClientRow>(
    `SELECT * FROM clients WHERE shop_id = ? ORDER BY name COLLATE NOCASE ASC`,
    shopId,
  );
  return rows.map(mapClient);
}

export async function createClientAsync(input: ClientInput) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const now = new Date().toISOString();
  const id = createId("client");
  await db.runAsync(
    `INSERT INTO clients (id, shop_id, name, phone, created_at, updated_at, sync_status, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL)`,
    id,
    shopId,
    input.name.trim(),
    nullableText(input.phone),
    now,
    now,
  );
  const row = await db.getFirstAsync<ClientRow>("SELECT * FROM clients WHERE id = ? AND shop_id = ?", id, shopId);
  if (!row) throw new Error("Client non enregistré");
  return mapClient(row);
}

export async function getClientByIdAsync(id: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const row = await db.getFirstAsync<ClientRow>("SELECT * FROM clients WHERE id = ? AND shop_id = ?", id, shopId);
  return row ? mapClient(row) : null;
}

export async function findOrCreateClientAsync(input: ClientInput) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const name = input.name.trim();
  const phone = nullableText(input.phone);

  const existing = await db.getFirstAsync<ClientRow>(
    `SELECT * FROM clients
     WHERE lower(name) = lower(?) AND (phone IS ? OR phone = ?)
       AND shop_id = ?
     LIMIT 1`,
    name,
    phone,
    phone,
    shopId,
  );
  if (existing) return mapClient(existing);
  return createClientAsync({ name, phone: phone ?? undefined });
}

export async function listOpenDebtsAsync() {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const rows = await db.getAllAsync<DebtWithClientRow>(
    `SELECT d.*, c.name as client_name, c.phone as client_phone,
       (d.amount - d.paid_amount) as balance
     FROM debts d
     JOIN clients c ON c.id = d.client_id AND c.shop_id = d.shop_id
     WHERE d.status = 'open'
       AND d.shop_id = ?
     ORDER BY d.created_at DESC`,
    shopId,
  );
  return rows.map(mapDebtWithClient);
}

export async function listPaidDebtsAsync(limit = 50) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const rows = await db.getAllAsync<DebtWithClientRow>(
    `SELECT d.*, c.name as client_name, c.phone as client_phone,
       (d.amount - d.paid_amount) as balance
     FROM debts d
     JOIN clients c ON c.id = d.client_id AND c.shop_id = d.shop_id
     WHERE d.status = 'paid'
       AND d.shop_id = ?
     ORDER BY d.updated_at DESC
     LIMIT ?`,
    shopId,
    limit,
  );
  return rows.map(mapDebtWithClient);
}

export async function listDebtsForClientAsync(clientId: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const rows = await db.getAllAsync<DebtWithClientRow>(
    `SELECT d.*, c.name as client_name, c.phone as client_phone,
       (d.amount - d.paid_amount) as balance
     FROM debts d
     JOIN clients c ON c.id = d.client_id AND c.shop_id = d.shop_id
     WHERE d.client_id = ?
       AND d.shop_id = ?
     ORDER BY d.created_at DESC`,
    clientId,
    shopId,
  );
  return rows.map(mapDebtWithClient);
}

export async function getDebtByIdAsync(id: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const row = await db.getFirstAsync<DebtWithClientRow>(
    `SELECT d.*, c.name as client_name, c.phone as client_phone,
       (d.amount - d.paid_amount) as balance
     FROM debts d
     JOIN clients c ON c.id = d.client_id AND c.shop_id = d.shop_id
     WHERE d.id = ?
       AND d.shop_id = ?`,
    id,
    shopId,
  );
  return row ? mapDebtWithClient(row) : null;
}

export async function createDebtAsync(input: DebtInput) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const amount = Math.max(0, input.amount);
  if (amount <= 0) throw new Error("Montant invalide");
  const now = new Date().toISOString();
  const id = createId("debt");
  await db.runAsync(
    `INSERT INTO debts (
      id, shop_id, client_id, amount, paid_amount, status, description, sale_id,
      created_at, updated_at, sync_status, last_synced_at
    ) VALUES (?, ?, ?, ?, 0, 'open', ?, ?, ?, ?, 'pending', NULL)`,
    id,
    shopId,
    input.clientId,
    amount,
    nullableText(input.description),
    input.saleId ?? null,
    now,
    now,
  );
  const debt = await getDebtByIdAsync(id);
  if (!debt) throw new Error("Dette non enregistrée");
  return debt;
}

export async function createDebtForClientAsync(client: ClientInput, amount: number, description?: string, saleId?: string) {
  const savedClient = await findOrCreateClientAsync(client);
  return createDebtAsync({ clientId: savedClient.id, amount, description, saleId });
}

export async function addDebtPaymentAsync(debtId: string, amount: number, note?: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const debt = await getDebtByIdAsync(debtId);
  if (!debt) throw new Error("Dette introuvable");
  const paymentAmount = Math.max(0, amount);
  if (paymentAmount <= 0) throw new Error("Montant invalide");
  if (paymentAmount > debt.balance) throw new Error("Le paiement dépasse le reste à payer");

  const now = new Date().toISOString();
  const nextPaid = debt.paidAmount + paymentAmount;
  const nextStatus = nextPaid >= debt.amount ? "paid" : "open";

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO debt_payments (
        id, shop_id, debt_id, amount, note, created_at, sync_status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL)`,
      createId("pay"),
      shopId,
      debtId,
      paymentAmount,
      nullableText(note),
      now,
    );

    await db.runAsync(
      `UPDATE debts
       SET paid_amount = ?, status = ?, updated_at = ?, sync_status = 'pending', last_synced_at = NULL
       WHERE id = ? AND shop_id = ?`,
      nextPaid,
      nextStatus,
      now,
      debtId,
      shopId,
    );
  });

  const updated = await getDebtByIdAsync(debtId);
  if (!updated) throw new Error("Dette introuvable");
  return updated;
}

export async function listPaymentsForDebtAsync(debtId: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const rows = await db.getAllAsync<PaymentRow>(
    `SELECT * FROM debt_payments WHERE debt_id = ? AND shop_id = ? ORDER BY created_at DESC`,
    debtId,
    shopId,
  );
  return rows.map(mapPayment);
}

export async function listPaymentsForClientAsync(clientId: string) {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const rows = await db.getAllAsync<PaymentWithDebtRow>(
    `SELECT p.*, d.description as debt_description, d.client_id
     FROM debt_payments p
     JOIN debts d ON d.id = p.debt_id AND d.shop_id = p.shop_id
     WHERE d.client_id = ?
       AND d.shop_id = ?
     ORDER BY p.created_at DESC`,
    clientId,
    shopId,
  );
  return rows.map(mapPaymentWithDebt);
}

export async function getDebtPaymentStatsBetweenAsync(startIso: string, endIso: string): Promise<DebtPaymentStats> {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const row = await db.getFirstAsync<{ total_paid: number | null; estimated_profit: number | null }>(
    `SELECT
       COALESCE(SUM(p.amount), 0) as total_paid,
       COALESCE(SUM(
         CASE
           WHEN d.amount > 0 AND s.estimated_profit IS NOT NULL
           THEN (p.amount / d.amount) * s.estimated_profit
           ELSE 0
         END
       ), 0) as estimated_profit
     FROM debt_payments p
     JOIN debts d ON d.id = p.debt_id AND d.shop_id = p.shop_id
     LEFT JOIN sales s ON s.id = d.sale_id AND s.shop_id = d.shop_id
     WHERE p.shop_id = ?
       AND p.created_at >= ?
       AND p.created_at < ?`,
    shopId,
    startIso,
    endIso,
  );
  return {
    totalPaid: row?.total_paid ?? 0,
    estimatedProfit: row?.estimated_profit ?? 0,
  };
}

export async function getTotalOpenDebtAsync() {
  const db = await getDatabaseAsync();
  const shopId = await requireActiveShopIdAsync();
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount - paid_amount), 0) as total
     FROM debts
     WHERE status = 'open'
       AND shop_id = ?`,
    shopId,
  );
  return row?.total ?? 0;
}
