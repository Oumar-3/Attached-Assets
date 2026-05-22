export type SupabaseConfig = {
  url: string;
  anonKey: string;
  isConfigured: boolean;
};

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}
