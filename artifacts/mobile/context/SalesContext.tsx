import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  createCashSaleAsync,
  createCreditSaleAsync,
  getSaleByIdAsync,
  hideSaleFromHistoryAsync,
  listRecentSalesAsync,
  listSaleItemsAsync,
  type CartSaleItemInput,
  type CreditSaleInput,
} from "@/database";
import { useDebts } from "@/context/DebtsContext";
import type { SaleItemRecord, SaleRecord } from "@/models";
import { useDatabase } from "@/context/DatabaseContext";
import { useProducts } from "@/context/ProductsContext";
import { scheduleCloudBackup } from "@/services/sync/autoBackup";

type SalesContextType = {
  sales: SaleRecord[];
  isLoading: boolean;
  refreshSales: () => Promise<void>;
  getSale: (id: string) => Promise<SaleRecord | null>;
  listSaleItems: (saleId: string) => Promise<SaleItemRecord[]>;
  createCashSale: (items: CartSaleItemInput[]) => Promise<SaleRecord>;
  createCreditSale: (input: CreditSaleInput) => Promise<SaleRecord>;
  hideSaleFromHistory: (id: string) => Promise<void>;
};

const SalesContext = createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabase();
  const { refreshProducts } = useProducts();
  const { refreshDebts } = useDebts();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSales = useCallback(async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      setSales(await listRecentSalesAsync(500));
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      refreshSales();
    }
  }, [isReady, refreshSales]);

  const createCashSale = useCallback(async (items: CartSaleItemInput[]) => {
    const sale = await createCashSaleAsync(items);
    await Promise.all([refreshSales(), refreshProducts()]);
    scheduleCloudBackup();
    return sale;
  }, [refreshProducts, refreshSales]);

  const createCreditSale = useCallback(async (input: CreditSaleInput) => {
    const sale = await createCreditSaleAsync(input);
    await Promise.all([refreshSales(), refreshProducts(), refreshDebts()]);
    scheduleCloudBackup();
    return sale;
  }, [refreshDebts, refreshProducts, refreshSales]);

  const hideSaleFromHistory = useCallback(async (id: string) => {
    await hideSaleFromHistoryAsync(id);
    await refreshSales();
    scheduleCloudBackup();
  }, [refreshSales]);

  const value = useMemo(
    () => ({
      sales,
      isLoading: !isReady || isLoading,
      refreshSales,
      getSale: getSaleByIdAsync,
      listSaleItems: listSaleItemsAsync,
      createCashSale,
      createCreditSale,
      hideSaleFromHistory,
    }),
    [createCashSale, createCreditSale, hideSaleFromHistory, isLoading, isReady, refreshSales, sales],
  );

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error("useSales must be used within SalesProvider");
  return ctx;
}
