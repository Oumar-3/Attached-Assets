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
  return (
    <View style={[styles.saleRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.saleIcon, { backgroundColor: sale.type === "cash" ? colors.success + "18" : colors.warning + "18" }]}>
        <Feather name={sale.type === "cash" ? "dollar-sign" : "credit-card"} size={16} color={sale.type === "cash" ? colors.success : colors.warning} />
      </View>
      <View style={styles.saleInfo}>
        <Text style={[styles.saleTitle, { color: colors.text }]}>
          {sale.items.length} article{sale.items.length > 1 ? "s" : ""}
          {sale.clientName ? ` — ${sale.clientName}` : ""}
        </Text>
        <Text style={[styles.saleTime, { color: colors.mutedForeground }]}>{time}</Text>
      </View>
      <Text style={[styles.saleTotal, { color: colors.text }]}>{fmtAmount(sale.total)} F</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getTodaySales, getLowStockProducts, clients, isLoading } = useStore();

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
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.shopName}>{user?.shopName ?? "Ma Boutique"}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push("/notifications")}
          >
            <Feather name="bell" size={22} color="#fff" />
            {lowStock.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{lowStock.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.heroBanner}>
          <Text style={styles.heroLabel}>Ventes aujourd'hui</Text>
          <Text style={styles.heroAmount}>{totalRevenue.toLocaleString()} FCFA</Text>
          <Text style={styles.heroProfitLabel}>
            Bénéfice: <Text style={styles.heroProfit}>{totalProfit.toLocaleString()} FCFA</Text>
          </Text>
        </View>
      </LinearGradient>

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
            subtitle={lowStock.length > 0 ? "Alerte stock" : "Tout va bien"}
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

        <View style={styles.quickActions}>
          {[
            { label: "Nouvelle vente", icon: "shopping-cart" as const, route: "/(tabs)/sale", color: colors.primary },
            { label: "Ajouter produit", icon: "plus-circle" as const, route: "/product/add", color: colors.accent },
            { label: "Alertes stock", icon: "alert-triangle" as const, route: "/notifications", color: colors.warning },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickBtn, { backgroundColor: a.color + "15", borderColor: a.color + "30" }]}
              onPress={() => router.push(a.route as never)}
              activeOpacity={0.75}
            >
              <Feather name={a.icon} size={20} color={a.color} />
              <Text style={[styles.quickBtnLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ventes récentes</Text>
          {todaySales.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shopping-bag" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune vente aujourd'hui</Text>
            </View>
          ) : (
            <View style={[styles.salesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {todaySales.slice(0, 6).map(sale => (
                <SaleRow key={sale.id} sale={sale} />
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
    paddingBottom: 32,
    gap: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  shopName: { fontSize: 24, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: { fontSize: 10, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroBanner: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 20,
    gap: 4,
  },
  heroLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  heroAmount: { fontSize: 32, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroProfitLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  heroProfit: { color: "#fff", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  body: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },
  statsGrid: { flexDirection: "row", gap: 12 },
  quickActions: { gap: 10 },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickBtnLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  salesCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  saleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  saleInfo: { flex: 1, gap: 2 },
  saleTitle: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  saleTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saleTotal: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
