import { isSupabaseConfigured } from "@/services/supabase/client";

export type SyncReadiness = {
  canSync: boolean;
  reason: string | null;
};

export function getSyncReadiness(): SyncReadiness {
  if (!isSupabaseConfigured()) {
    return {
      canSync: false,
      reason: "Supabase n'est pas encore configuré dans les variables d'environnement.",
    };
  }

  return {
    canSync: true,
    reason: null,
  };
}
