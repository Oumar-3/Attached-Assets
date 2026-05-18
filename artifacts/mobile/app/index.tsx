import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const ONBOARDING_KEY = "@boutique_onboarding_seen";

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    async function check() {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!seen) {
          router.replace("/onboarding");
        } else if (!user) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/(tabs)/");
        }
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [user, isLoading]);

  if (isLoading || checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}
