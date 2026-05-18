import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";
import type { Sale } from "@/types";

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n.toLocaleString()}`;
}

function SaleRow({ sale }: { sale: Sale }) {
  const colors = useColors();
  const time = new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const isCash = sale.type === "cash";
  return (
    <View style={[styles.saleRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.saleIcon, { backgroundColor: isCash ? colors.success + "18" : colors.warning + "15" }]}>
        <Feather name={isCash ? "arrow-up-right" : "credit-card"} size={14} color={isCash ? colors.success : colors.warning} />
      </View>
      <View style={styles.saleInfo}>
        <Text style={[styles.saleTitle, { color: colors.text }]}>
          {sale.items.length} article{sale.items.length > 1 ? "s" : ""}
          {sale.clientName ? ` · ${sale.clientName}` : ""}
        </Text>
        <Text style={[styles.saleTime, { color: colors.mutedForeground }]}>{time}</Text>
      </View>
      <Text style={[styles.saleTotal, { color: isCash ? colors.text : colors.warning }]}>
        {fmtAmount(sale.total)} F
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getTodaySales, getLowStockProducts, clients } = useStore();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const todaySales = useMemo(() => getTodaySales(), [getTodaySales]);
  const lowStock = useMemo(() => getLowStockProducts(), [getLowStockProducts]);
  const totalRevenue = useMemo(() => todaySales.reduce((s, x) => s + x.total, 0), [todaySales]);
  const totalProfit = useMemo(() => todaySales.reduce((s, x) => s + x.profit, 0), [todaySales]);
  const totalDebt = useMemo(() => clients.reduce((s, c) => s + c.totalDebt, 0), [clients]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const [refreshing, setRefreshing] = React.useState(false);
  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting},</Text>
            <Text style={[styles.shopName, { color: colors.text }]}>{user?.shopName ?? "Ma Boutique"}</Text>
          </View>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/notifications")}
          >
            <Feather name="bell" size={20} color={colors.text} />
            {lowStock.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{lowStock.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.heroBanner}>
          <LinearGradient
            colors={["#001A0D", "#000E07"]}
            style={StyleSheet.absoluteFill}
            borderRadius={20}
          />
          <View style={styles.heroGlowDot} />
          <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Ventes aujourd'hui</Text>
          <Text style={styles.heroAmount}>{totalRevenue.toLocaleString()}</Text>
          <Text style={[styles.heroUnit, { color: colors.mutedForeground }]}>FCFA</Text>
          <View style={[styles.profitPill, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="trending-up" size={12} color={colors.primary} />
            <Text style={[styles.profitPillText, { color: colors.primary }]}>
              Bénéfice +{totalProfit.toLocaleString()} FCFA
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Ventes du jour"
            value={`${todaySales.length}`}
            icon="bar-chart-2"
            color={colors.primary}
            subtitle={`${fmtAmount(totalRevenue)} FCFA`}
          />
          <StatCard
            title="Stock faible"
            value={`${lowStock.length}`}
            icon="alert-triangle"
            color={lowStock.length > 0 ? colors.warning : colors.success}
            subtitle={lowStock.length > 0 ? "Réappro requis" : "Tout va bien"}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="Bénéfice du jour"
            value={`${fmtAmount(totalProfit)}`}
            icon="trending-up"
            color={colors.success}
            subtitle="FCFA"
          />
          <StatCard
            title="Dettes clients"
            value={`${fmtAmount(totalDebt)}`}
            icon="credit-card"
            color={colors.destructive}
            subtitle="FCFA"
          />
        </View>

        <View style={styles.quickRow}>
          {[
            { label: "Nouvelle vente", icon: "shopping-cart" as const, route: "/(tabs)/sale", color: colors.primary },
            { label: "Ajouter produit", icon: "plus-circle" as const, route: "/product/add", color: colors.accent },
            { label: "Alertes", icon: "bell" as const, route: "/notifications", color: colors.warning },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(a.route as never)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: a.color + "18" }]}>
                <Feather name={a.icon} size={18} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]} numberOfLines={2}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ventes récentes</Text>
            <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{todaySales.length} aujourd'hui</Text>
          </View>
          {todaySales.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shopping-bag" size={26} color="#333" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune vente aujourd'hui</Text>
              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: colors.primary + "15" }]}
                onPress={() => router.push("/(tabs)/sale")}
              >
                <Text style={[styles.emptyActionText, { color: colors.primary }]}>Faire une vente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.salesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {todaySales.slice(0, 8).map((sale, i) => (
                <View key={sale.id} style={i === todaySales.slice(0, 8).length - 1 ? { borderBottomWidth: 0 } : {}}>
                  <SaleRow sale={sale} />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  shopName: { fontSize: 24, fontFamily: "Inter_700Bold", fontWeight: "700", marginTop: 2 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF4D4D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  notifBadgeText: { fontSize: 9, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroBanner: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#00D97E20",
    overflow: "hidden",
    minHeight: 140,
    gap: 4,
  },
  heroGlowDot: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#00D97E",
    opacity: 0.06,
    top: -60,
    right: -60,
  },
  heroLabel: { fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 0.3 },
  heroAmount: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -1,
  },
  heroUnit: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -4, marginBottom: 8 },
  profitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profitPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  body: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  statsGrid: { flexDirection: "row", gap: 12 },
  quickRow: { flexDirection: "row", gap: 10 },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    alignItems: "flex-start",
  },
  quickIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontFamily: "Inter_500Medium", fontWeight: "500", lineHeight: 15 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  sectionCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  salesCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  saleIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  saleInfo: { flex: 1, gap: 2 },
  saleTitle: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  saleTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  saleTotal: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyAction: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  emptyActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
