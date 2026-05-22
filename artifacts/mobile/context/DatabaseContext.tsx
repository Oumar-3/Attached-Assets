import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { initializeDatabaseAsync } from "@/database";

type DatabaseContextType = {
  isReady: boolean;
  error: Error | null;
};

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    initializeDatabaseAsync()
      .then(() => {
        if (mounted) {
          setIsReady(true);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Database initialization failed"));
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({ isReady, error }), [isReady, error]);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDatabase must be used within DatabaseProvider");
  return ctx;
}
