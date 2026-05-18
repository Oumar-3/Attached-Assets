import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

type RowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

function Row({ icon, label, value, onPress, danger }: RowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.destructive + "18" : colors.card }]}>
        <Feather name={icon} size={17} color={danger ? colors.destructive : colors.mutedForeground} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      {onPress ? <Feather name="chevron-right" size={14} color="#333" /> : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { products, sales, clients } = useStore();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);

  const initial = (user?.name ?? "?").slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: "#000" }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.topBg, { paddingTop: topPad + 24 }]}>
        <LinearGradient
          colors={["#001A0D", "#000"]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </LinearGradient>
        <Text style={styles.userName}>{user?.name ?? ""}</Text>
        <Text style={[styles.shopName, { color: colors.primary }]}>{user?.shopName ?? ""}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email ?? ""}</Text>
      </View>

      <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: "Produits", value: `${products.length}` },
          { label: "Ventes", value: `${sales.length}` },
          { label: "Clients", value: `${clients.length}` },
        ].map((s, i) => (
          <View key={s.label} style={[styles.statItem, i < 2 ? { borderRightWidth: 1, borderRightColor: colors.border } : {}]}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.revenueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Chiffre d'affaires</Text>
            <Text style={[styles.revenueVal, { color: colors.text }]}>{totalRevenue.toLocaleString()}</Text>
            <Text style={[styles.revenueUnit, { color: colors.mutedForeground }]}>FCFA</Text>
          </View>
          <View style={[styles.revenueDivider, { backgroundColor: colors.border }]} />
          <View style={styles.revenueItem}>
            <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>Bénéfice total</Text>
            <Text style={[styles.revenueVal, { color: colors.primary }]}>{totalProfit.toLocaleString()}</Text>
            <Text style={[styles.revenueUnit, { color: colors.mutedForeground }]}>FCFA</Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Boutique</Text>
        <Row icon="settings" label="Paramètres" onPress={() => router.push("/settings")} />
        <Row icon="bell" label="Notifications & alertes" onPress={() => router.push("/notifications")} />
        <Row icon="bar-chart-2" label="Statistiques" value="Bientôt" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Compte</Text>
        <Row icon="log-out" label="Se déconnecter" danger onPress={logout} />
      </View>

      <Text style={[styles.version, { color: "#2A2A2A" }]}>BoutiqueApp · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBg: {
    alignItems: "center",
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 8,
    overflow: "hidden",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  shopName: { fontSize: 15, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  email: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -2,
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 18, gap: 2 },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  revenueCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  revenueRow: { flexDirection: "row", gap: 0 },
  revenueItem: { flex: 1, gap: 2 },
  revenueDivider: { width: 1, marginHorizontal: 16 },
  revenueLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  revenueVal: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700", letterSpacing: -0.5 },
  revenueUnit: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -2 },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" },
  rowValue: { fontSize: 12, fontFamily: "Inter_400Regular" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 28 },
});
