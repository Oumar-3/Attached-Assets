import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ProductRecord } from "@/models";

const STORAGE_KEY = "samastock.stockAlertState.v1";

type StockAlertState = {
  readIds: string[];
  hiddenIds: string[];
};

const EMPTY_STATE: StockAlertState = {
  readIds: [],
  hiddenIds: [],
};

export function buildStockAlertId(product: Pick<ProductRecord, "id" | "stock" | "alertThreshold">) {
  return `stock-${product.id}-${product.stock}-${product.alertThreshold}`;
}

export async function getStockAlertStateAsync(): Promise<StockAlertState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<StockAlertState>;
    return {
      readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

async function saveStockAlertStateAsync(nextState: StockAlertState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export async function markStockAlertsReadAsync(ids: string[]) {
  if (ids.length === 0) return;
  const state = await getStockAlertStateAsync();
  await saveStockAlertStateAsync({
    ...state,
    readIds: unique([...state.readIds, ...ids]),
  });
}

export async function hideStockAlertAsync(id: string) {
  const state = await getStockAlertStateAsync();
  await saveStockAlertStateAsync({
    readIds: unique([...state.readIds, id]),
    hiddenIds: unique([...state.hiddenIds, id]),
  });
}
