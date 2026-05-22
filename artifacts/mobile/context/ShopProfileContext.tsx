import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getShopProfileAsync, saveShopProfileAsync } from "@/database";
import type { ShopProfile, ShopProfileInput } from "@/models";
import { useDatabase } from "@/context/DatabaseContext";
import { scheduleCloudBackup } from "@/services/sync/autoBackup";

type ShopProfileContextType = {
  profile: ShopProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (input: ShopProfileInput) => Promise<ShopProfile>;
};

const ShopProfileContext = createContext<ShopProfileContextType | null>(null);

export function ShopProfileProvider({ children }: { children: React.ReactNode }) {
  const { isReady } = useDatabase();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      setProfile(await getShopProfileAsync());
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady) {
      refreshProfile();
    }
  }, [isReady, refreshProfile]);

  const saveProfile = useCallback(async (input: ShopProfileInput) => {
    const saved = await saveShopProfileAsync(input);
    setProfile(saved);
    scheduleCloudBackup();
    return saved;
  }, []);

  const value = useMemo(
    () => ({ profile, isLoading: !isReady || isLoading, refreshProfile, saveProfile }),
    [isReady, isLoading, profile, refreshProfile, saveProfile],
  );

  return <ShopProfileContext.Provider value={value}>{children}</ShopProfileContext.Provider>;
}

export function useShopProfile() {
  const ctx = useContext(ShopProfileContext);
  if (!ctx) throw new Error("useShopProfile must be used within ShopProfileProvider");
  return ctx;
}
