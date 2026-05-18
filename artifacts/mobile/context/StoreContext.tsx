import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Client, DebtPayment, Product, Sale, SaleItem } from '@/types';

type StoreContextType = {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  payments: DebtPayment[];
  isLoading: boolean;
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (items: SaleItem[], type: 'cash' | 'credit', clientId?: string, clientName?: string) => Promise<void>;
  addClient: (name: string, phone?: string) => Promise<Client>;
  addDebt: (clientId: string, amount: number, saleId?: string) => Promise<void>;
  addPayment: (clientId: string, amount: number, note?: string) => Promise<void>;
  getTodaySales: () => Sale[];
  getLowStockProducts: () => Product[];
};

const StoreContext = createContext<StoreContextType | null>(null);

const KEYS = {
  products: '@boutique_products',
  sales: '@boutique_sales',
  clients: '@boutique_clients',
  payments: '@boutique_payments',
};

function genId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [p, s, c, pay] = await AsyncStorage.multiGet([
        KEYS.products, KEYS.sales, KEYS.clients, KEYS.payments,
      ]);
      if (p[1]) setProducts(JSON.parse(p[1]) as Product[]);
      if (s[1]) setSales(JSON.parse(s[1]) as Sale[]);
      if (c[1]) setClients(JSON.parse(c[1]) as Client[]);
      if (pay[1]) setPayments(JSON.parse(pay[1]) as DebtPayment[]);
    } finally {
      setIsLoading(false);
    }
  }

  async function save<T>(key: string, data: T[]) {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'createdAt'>) => {
    const np: Product = { ...p, id: genId(), createdAt: new Date().toISOString() };
    const updated = [...products, np];
    setProducts(updated);
    await save(KEYS.products, updated);
  }, [products]);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const updated = products.map(x => x.id === id ? { ...x, ...p } : x);
    setProducts(updated);
    await save(KEYS.products, updated);
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    const updated = products.filter(x => x.id !== id);
    setProducts(updated);
    await save(KEYS.products, updated);
  }, [products]);

  const addSale = useCallback(async (
    items: SaleItem[],
    type: 'cash' | 'credit',
    clientId?: string,
    clientName?: string,
  ) => {
    const total = items.reduce((s, i) => s + i.sellPrice * i.quantity, 0);
    const profit = items.reduce((s, i) => s + (i.sellPrice - i.buyPrice) * i.quantity, 0);
    const sale: Sale = { id: genId(), items, total, profit, type, clientId, clientName, createdAt: new Date().toISOString() };
    const updSales = [sale, ...sales];
    setSales(updSales);
    await save(KEYS.sales, updSales);

    const updProducts = products.map(p => {
      const item = items.find(i => i.productId === p.id);
      return item ? { ...p, quantity: Math.max(0, p.quantity - item.quantity) } : p;
    });
    setProducts(updProducts);
    await save(KEYS.products, updProducts);

    if (type === 'credit' && clientId) {
      await addDebt(clientId, total, sale.id);
    }
  }, [sales, products, clients]);

  const addClient = useCallback(async (name: string, phone?: string): Promise<Client> => {
    const nc: Client = { id: genId(), name, phone, totalDebt: 0, createdAt: new Date().toISOString() };
    const updated = [...clients, nc];
    setClients(updated);
    await save(KEYS.clients, updated);
    return nc;
  }, [clients]);

  const addDebt = useCallback(async (clientId: string, amount: number, saleId?: string) => {
    const updClients = clients.map(c =>
      c.id === clientId ? { ...c, totalDebt: c.totalDebt + amount } : c,
    );
    setClients(updClients);
    await save(KEYS.clients, updClients);
  }, [clients]);

  const addPayment = useCallback(async (clientId: string, amount: number, note?: string) => {
    const pay: DebtPayment = { id: genId(), clientId, amount, note, createdAt: new Date().toISOString() };
    const updPays = [pay, ...payments];
    setPayments(updPays);
    await save(KEYS.payments, updPays);
    const updClients = clients.map(c =>
      c.id === clientId ? { ...c, totalDebt: Math.max(0, c.totalDebt - amount) } : c,
    );
    setClients(updClients);
    await save(KEYS.clients, updClients);
  }, [payments, clients]);

  const getTodaySales = useCallback(() => sales.filter(s => isToday(s.createdAt)), [sales]);

  const getLowStockProducts = useCallback(() => products.filter(p => p.quantity <= 5), [products]);

  return (
    <StoreContext.Provider value={{
      products, sales, clients, payments, isLoading,
      addProduct, updateProduct, deleteProduct,
      addSale, addClient, addDebt, addPayment,
      getTodaySales, getLowStockProducts,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
