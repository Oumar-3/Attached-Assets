import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

type RowProps = { icon: keyof typeof Feather.glyphMap; label: string; value?: string; onPress?: () => void; danger?: boolean };
function Row({ icon, label, value, onPress, danger }: RowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.destructive + "15" : colors.primary + "12" }]}>
        <Feather name={icon} size={18} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
      {onPress ? <Feather name="chevron-right" size={16} color={colors.mutedForeground} /> : null}
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

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: topPad + 24 }]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name ?? "?").slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? ""}</Text>
        <Text style={styles.shopName}>{user?.shopName ?? ""}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
      </LinearGradient>

      <View style={styles.statsBar}>
        {[
          { label: "Produits", value: `${products.length}`, icon: "package" as const },
          { label: "Ventes", value: `${sales.length}`, icon: "bar-chart-2" as const },
          { label: "Clients", value: `${clients.length}`, icon: "users" as const },
        ].map(s => (
          <View key={s.label} style={[styles.statItem, { borderRightColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Ma boutique</Text>
        <Row icon="shopping-bag" label="Chiffre d'affaires" value={`${totalRevenue.toLocaleString()} FCFA`} />
        <Row icon="settings" label="Paramètres" onPress={() => router.push("/settings")} />
        <Row icon="bell" label="Notifications" onPress={() => router.push("/notifications")} />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Compte</Text>
        <Row icon="log-out" label="Se déconnecter" danger onPress={logout} />
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>BoutiqueApp v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: "center",
    paddingBottom: 32,
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  shopName: { fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500", color: "rgba(255,255,255,0.85)" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    borderRightWidth: 1,
    gap: 2,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" },
  rowValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 32 },
});
