import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatCard } from "@/components/StatCard";
import { useDebts } from "@/context/DebtsContext";
import { useProducts } from "@/context/ProductsContext";
import { useSales } from "@/context/SalesContext";
import { useShopProfile } from "@/context/ShopProfileContext";
import { useColors } from "@/hooks/useColors";
import type { SaleRecord } from "@/models";
import { buildStockAlertId, getStockAlertStateAsync } from "@/services/alerts/stockAlertState";

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n.toLocaleString()}`;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function SaleRow({ sale }: { sale: SaleRecord }) {
  const colors = useColors();
  const time = new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.saleRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.saleIcon, { backgroundColor: colors.success + "18" }]}>
        <Feather name="dollar-sign" size={16} color={colors.success} />
      </View>
      <View style={styles.saleInfo}>
        <Text style={[styles.saleTitle, { color: colors.text }]}>Reçu {sale.receiptNumber}</Text>
        <Text style={[styles.saleTime, { color: colors.mutedForeground }]}>{time}</Text>
      </View>
      <Text style={[styles.saleTotal, { color: colors.text }]}>{fmtAmount(sale.total)} F</Text>
    </View>
  );
}

type QuickAction = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  color: string;
};

function QuickActionButton({ action }: { action: QuickAction }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.quickBtn, { backgroundColor: action.color + "13", borderColor: action.color + "28" }]}
      onPress={() => router.push(action.route as never)}
      activeOpacity={0.78}
    >
      <View style={[styles.quickIcon, { backgroundColor: action.color + "18" }]}>
        <Feather name={action.icon} size={19} color={action.color} />
      </View>
      <Text style={[styles.quickBtnLabel, { color: action.color }]} numberOfLines={2}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useShopProfile();
  const { lowStockSuggestions, refreshProducts } = useProducts();
  const { sales, refreshSales } = useSales();
  const { totalOpenDebt, todayPaymentStats, refreshDebts } = useDebts();
  const [refreshing, setRefreshing] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [hiddenAlertIds, setHiddenAlertIds] = useState<string[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const todaySales = useMemo(() => sales.filter(sale => isToday(sale.createdAt)), [sales]);
  const cashSales = useMemo(() => todaySales.filter(sale => sale.paymentType === "cash"), [todaySales]);
  const creditSales = useMemo(() => todaySales.filter(sale => sale.paymentType === "credit"), [todaySales]);
  const cashRevenue = useMemo(() => cashSales.reduce((sum, sale) => sum + sale.total, 0), [cashSales]);
  const cashProfit = useMemo(() => cashSales.reduce((sum, sale) => sum + sale.estimatedProfit, 0), [cashSales]);
  const countedRevenue = cashRevenue + todayPaymentStats.totalPaid;
  const countedProfit = cashProfit + todayPaymentStats.estimatedProfit;
  const bestLowStock = lowStockSuggestions.slice(0, 5);
  const unreadAlertCount = useMemo(() => {
    return lowStockSuggestions.filter(suggestion => {
      const id = buildStockAlertId(suggestion.product);
      return !readAlertIds.includes(id) && !hiddenAlertIds.includes(id);
    }).length;
  }, [hiddenAlertIds, lowStockSuggestions, readAlertIds]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const quickActions: QuickAction[] = [
    { label: "Vente rapide", icon: "shopping-cart", route: "/(tabs)/sale", color: colors.primary },
    { label: "Scanner stock", icon: "camera", route: "/product/scan", color: colors.accent },
    { label: "Inventaire", icon: "clipboard", route: "/inventory", color: colors.info },
    { label: "Alertes stock", icon: "alert-triangle", route: "/notifications", color: colors.warning },
  ];

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getStockAlertStateAsync().then(state => {
        if (!active) return;
        setReadAlertIds(state.readIds);
        setHiddenAlertIds(state.hiddenIds);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshProducts(), refreshSales(), refreshDebts()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[colors.primaryDark, colors.primary]} style={[styles.header, { paddingTop: topPad + 22 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.shopName} numberOfLines={1}>{profile?.shopName ?? "SamaStock"}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/settings")}>
              <Feather name="settings" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/notifications")}>
              <Feather name="bell" size={21} color="#fff" />
              {unreadAlertCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadAlertCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Argent recu aujourd'hui</Text>
          <Text style={styles.heroAmount}>{Math.round(countedRevenue).toLocaleString()} FCFA</Text>
          <Text style={styles.heroHint}>Cash + remboursements. Le credit non paye reste dans les dettes.</Text>
          <View style={styles.heroPills}>
            <View style={styles.heroPill}>
              <Feather name="trending-up" size={14} color="#fff" />
              <Text style={styles.heroPillText}>Benefice {Math.round(countedProfit).toLocaleString()} F</Text>
            </View>
            <View style={styles.heroPill}>
              <Feather name="credit-card" size={14} color="#fff" />
              <Text style={styles.heroPillText}>{fmtAmount(totalOpenDebt)} F a recuperer</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.statsGrid}>
          <StatCard title="Ventes" value={`${todaySales.length}`} icon="shopping-bag" color={colors.primary} subtitle={`${cashSales.length} cash, ${creditSales.length} credit`} />
          <StatCard title="Benefice" value={`${fmtAmount(countedProfit)}`} icon="trending-up" color={colors.success} subtitle="du jour" />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="Stock faible"
            value={`${lowStockSuggestions.length}`}
            icon="alert-triangle"
            color={lowStockSuggestions.length > 0 ? colors.warning : colors.success}
            subtitle={lowStockSuggestions.length > 0 ? "A racheter" : "Tout va bien"}
          />
          <StatCard title="Dettes" value={`${fmtAmount(totalOpenDebt)}`} icon="credit-card" color={colors.destructive} subtitle="a recuperer" />
        </View>

        <View style={styles.quickPanel}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions rapides</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickActions.map(action => <QuickActionButton key={action.label} action={action} />)}
          </View>
        </View>

        {bestLowStock.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>A racheter bientôt</Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{lowStockSuggestions.length} alertes</Text>
            </View>
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {bestLowStock.map(suggestion => (
                <TouchableOpacity
                  key={suggestion.product.id}
                  style={[styles.saleRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/product/[id]", params: { id: suggestion.product.id } })}
                >
                  <View style={[styles.saleIcon, { backgroundColor: colors.warning + "18" }]}>
                    <Feather name="alert-triangle" size={16} color={colors.warning} />
                  </View>
                  <View style={styles.saleInfo}>
                    <Text style={[styles.saleTitle, { color: colors.text }]} numberOfLines={1}>{suggestion.product.name}</Text>
                    <Text style={[styles.saleTime, { color: colors.mutedForeground }]}>
                      Stock {suggestion.product.stock}, racheter {suggestion.suggestedReorderQuantity}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ventes récentes</Text>
            {todaySales.length > 0 ? (
              <TouchableOpacity onPress={() => router.push("/(tabs)/history" as never)}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>Voir tout</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {todaySales.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shopping-bag" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune vente aujourd'hui</Text>
            </View>
          ) : (
            <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {todaySales.slice(0, 6).map(sale => <SaleRow key={sale.id} sale={sale} />)}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 30, gap: 22 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14 },
  headerCopy: { flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.78)", fontFamily: "Inter_400Regular" },
  shopName: { fontSize: 25, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#D94A4A",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: { fontSize: 10, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  hero: { gap: 7 },
  heroLabel: { fontSize: 13, color: "rgba(255,255,255,0.76)", fontFamily: "Inter_500Medium" },
  heroAmount: { fontSize: 34, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroHint: { fontSize: 12, color: "rgba(255,255,255,0.72)", fontFamily: "Inter_400Regular", lineHeight: 17 },
  heroPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 5 },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroPillText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  body: { paddingHorizontal: 16, paddingTop: 18, gap: 20 },
  statsGrid: { flexDirection: "row", gap: 10 },
  quickPanel: { gap: 11 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    width: "48.5%",
    minHeight: 76,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  quickIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  quickBtnLabel: { fontSize: 13, fontFamily: "Inter_700Bold", fontWeight: "700", lineHeight: 17 },
  section: { gap: 11 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", fontWeight: "700" },
  sectionHint: { fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionLink: { fontSize: 12, fontFamily: "Inter_700Bold", fontWeight: "700" },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  saleRow: { flexDirection: "row", alignItems: "center", padding: 13, borderBottomWidth: 1, gap: 12 },
  saleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  saleInfo: { flex: 1, gap: 2 },
  saleTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  saleTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saleTotal: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptyCard: { borderRadius: 12, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
