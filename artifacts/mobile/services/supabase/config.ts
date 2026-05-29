export type SupabaseConfig = {
  url: string;
  anonKey: string;
  authStorageKey: string;
  isConfigured: boolean;
};

function getProjectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || "samastock";
  } catch {
    return "samastock";
  }
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const projectRef = getProjectRef(url);

  return {
    url,
    anonKey,
    authStorageKey: `sb-${projectRef}-auth-token`,
    isConfigured: Boolean(url && anonKey),
  };
}
