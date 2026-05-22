import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
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

export const supabase = config.isConfigured
  ? createClient(config.url, config.anonKey, {
      auth: {
        storage: Platform.OS === "web" ? webStorage : AsyncStorage,
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
