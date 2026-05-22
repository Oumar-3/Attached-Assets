import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  addDebtPaymentAsync,
  createClientAsync,
  createDebtAsync,
  createDebtForClientAsync,
  getClientByIdAsync,
  getDebtPaymentStatsBetweenAsync,
  getTotalOpenDebtAsync,
  listDebtsForClientAsync,
  listClientsAsync,
  listOpenDebtsAsync,
  listPaidDebtsAsync,
  listPaymentsForClientAsync,
  listPaymentsForDebtAsync,
  type ClientInput,
  type DebtPaymentStats,
  type DebtInput,
} from "@/database";
import { useDatabase } from "@/context/DatabaseContext";
import type { ClientRecord, DebtPaymentRecord, DebtPaymentWithDebt, DebtWithClient } from "@/models";
import { scheduleCloudBackup } from "@/services/sync/autoBackup";

type DebtsContextType = {
  clients: ClientRecord[];
  openDebts: DebtWithClient[];
  paidDebts: DebtWithClient[];
  totalOpenDebt: number;
  todayPaymentStats: DebtPaymentStats;
  isLoading: boolean;
  refreshDebts: () => Promise<void>;
  getClient: (id: string) => Promise<ClientRecord | null>;
  listClientDebts: (clientId: string) => Promise<DebtWithClient[]>;
  listClientPayments: (clientId: string) => Promise<DebtPaymentWithDebt[]>;
  createClient: (input: ClientInput) => Promise<ClientRecord>;
  createDebt: (input: DebtInput) => Promise<DebtWithClient>;
  createDebtForClient: (client: ClientInput, amount: number, description?: string, saleId?: string) => Promise<DebtWithClient>;
  addPayment: (debtId: string, amount: number, note?: string) => Promise<DebtWithClient>;
  listPayments: (debtId: string) => Promise<DebtPaymentRecord[]>;
};

const DebtsContext = createContext<DebtsContextType | null>(null);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabase();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [openDebts, setOpenDebts] = useState<DebtWithClient[]>([]);
  const [paidDebts, setPaidDebts] = useState<DebtWithClient[]>([]);
  const [totalOpenDebt, setTotalOpenDebt] = useState(0);
  const [todayPaymentStats, setTodayPaymentStats] = useState<DebtPaymentStats>({ totalPaid: 0, estimatedProfit: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refreshDebts = useCallback(async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      const [nextClients, nextDebts, nextPaidDebts, nextPaymentStats, nextTotal] = await Promise.all([
        listClientsAsync(),
        listOpenDebtsAsync(),
        listPaidDebtsAsync(),
        getDebtPaymentStatsBetweenAsync(startOfToday.toISOString(), startOfTomorrow.toISOString()),
        getTotalOpenDebtAsync(),
      ]);
      setClients(nextClients);
      setOpenDebts(nextDebts);
      setPaidDebts(nextPaidDebts);
      setTodayPaymentStats(nextPaymentStats);
      setTotalOpenDebt(nextTotal);
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      refreshDebts();
    }
  }, [isReady, refreshDebts]);

  const createClient = useCallback(async (input: ClientInput) => {
    const client = await createClientAsync(input);
    await refreshDebts();
    scheduleCloudBackup();
    return client;
  }, [refreshDebts]);

  const createDebt = useCallback(async (input: DebtInput) => {
    const debt = await createDebtAsync(input);
    await refreshDebts();
    scheduleCloudBackup();
    return debt;
  }, [refreshDebts]);

  const createDebtForClient = useCallback(async (client: ClientInput, amount: number, description?: string, saleId?: string) => {
    const debt = await createDebtForClientAsync(client, amount, description, saleId);
    await refreshDebts();
    scheduleCloudBackup();
    return debt;
  }, [refreshDebts]);

  const addPayment = useCallback(async (debtId: string, amount: number, note?: string) => {
    const debt = await addDebtPaymentAsync(debtId, amount, note);
    await refreshDebts();
    scheduleCloudBackup();
    return debt;
  }, [refreshDebts]);

  const value = useMemo(
    () => ({
      clients,
      openDebts,
      paidDebts,
      totalOpenDebt,
      todayPaymentStats,
      isLoading: !isReady || isLoading,
      refreshDebts,
      getClient: getClientByIdAsync,
      listClientDebts: listDebtsForClientAsync,
      listClientPayments: listPaymentsForClientAsync,
      createClient,
      createDebt,
      createDebtForClient,
      addPayment,
      listPayments: listPaymentsForDebtAsync,
    }),
    [addPayment, clients, createClient, createDebt, createDebtForClient, isLoading, isReady, openDebts, paidDebts, refreshDebts, todayPaymentStats, totalOpenDebt],
  );

  return <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>;
}

export function useDebts() {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error("useDebts must be used within DebtsProvider");
  return ctx;
}
