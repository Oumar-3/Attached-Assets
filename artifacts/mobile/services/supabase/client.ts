import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { getSupabaseConfig } from "./config";

const config = getSupabaseConfig();

const webStorage = {
  getItem: (key: string) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Ignore unavailable browser storage.
    }
  },
  removeItem: (key: string) => {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Ignore unavailable browser storage.
    }
  },
};

const secureMobileStorage = {
  getItem: async (key: string) => {
    try {
      const secureValue = await SecureStore.getItemAsync(key);
      if (secureValue) return secureValue;

      const legacyValue = await AsyncStorage.getItem(key);
      if (legacyValue) {
        await SecureStore.setItemAsync(key, legacyValue);
        await AsyncStorage.removeItem(key);
      }
      return legacyValue;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
    await AsyncStorage.removeItem(key).catch(() => {});
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
    await AsyncStorage.removeItem(key).catch(() => {});
  },
};

export const supabase = config.isConfigured
  ? createClient(config.url, config.anonKey, {
      auth: {
        storageKey: config.authStorageKey,
        storage: Platform.OS === "web" ? webStorage : secureMobileStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré. Renseignez EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export function isSupabaseConfigured() {
  return config.isConfigured;
}

export function getSupabaseAuthStorageKey() {
  return config.authStorageKey;
}
