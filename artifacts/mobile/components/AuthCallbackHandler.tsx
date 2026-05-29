import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  completeOAuthSessionFromParamsAsync,
  completeOAuthSessionFromUrlAsync,
} from "@/services/supabase/oauth";

function normalizeParams(params: Record<string, string | string[]>) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  ) as Record<string, string>;
}

export function AuthCallbackHandler() {
  const colors = useColors();
  const router = useRouter();
  const latestUrl = Linking.useURL();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    let mounted = true;
    async function completeCallback() {
      const initialUrl = latestUrl ?? await Linking.getInitialURL();
      if (initialUrl) {
        await completeOAuthSessionFromUrlAsync(initialUrl);
        return;
      }

      const normalizedParams = normalizeParams(params);
      if (normalizedParams.code || normalizedParams.access_token || normalizedParams.error_code) {
        await completeOAuthSessionFromParamsAsync(normalizedParams, normalizedParams.error_code);
      }
    }

    completeCallback()
      .catch(error => {
        console.warn("OAuth callback failed", error);
      })
      .finally(() => {
        if (mounted) {
          router.replace("/");
        }
      });

    return () => {
      mounted = false;
    };
  }, [latestUrl, params, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
