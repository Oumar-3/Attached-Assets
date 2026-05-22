import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SamaStockLogo } from "@/components/SamaStockLogo";
import { useColors } from "@/hooks/useColors";

export default function IntroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const topPad = Platform.OS === "web" ? 28 : insets.top;
  const bottomPad = Platform.OS === "web" ? 28 : insets.bottom;
  const shellWidth = Platform.OS === "web" ? Math.min(Math.max(width - 32, 320), 460) : undefined;

  return (
    <LinearGradient colors={[colors.background, colors.secondary, colors.background]} style={styles.root}>
      <View style={[styles.shell, shellWidth ? { width: shellWidth } : null, { paddingTop: topPad + 18, paddingBottom: bottomPad + 18 }]}>
        <View style={styles.brandArea}>
          <View style={[styles.logoPlate, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary }]}>
            <SamaStockLogo size={96} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={[styles.appName, { color: colors.text }]}>SamaStock</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Stock, ventes et dettes de boutique au meme endroit.
            </Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.86}
          >
            <Text style={styles.primaryText}>Commencer</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.82}
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>J'ai deja un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.offlineBtn} onPress={() => router.push("/onboarding")} activeOpacity={0.75}>
            <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>Continuer hors ligne</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  shell: { flex: 1, width: "100%", paddingHorizontal: 22, justifyContent: "space-between" },
  brandArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  logoPlate: {
    width: 132,
    height: 132,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 7,
  },
  brandCopy: { alignItems: "center", gap: 9 },
  appName: { fontSize: 36, lineHeight: 42, fontFamily: "Inter_700Bold", fontWeight: "700", textAlign: "center" },
  tagline: { maxWidth: 310, fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular", textAlign: "center" },
  bottomArea: { gap: 11 },
  primaryBtn: {
    minHeight: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  secondaryBtn: { minHeight: 54, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  secondaryText: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  offlineBtn: { minHeight: 42, alignItems: "center", justifyContent: "center" },
  offlineText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
