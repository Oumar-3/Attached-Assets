import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

type AlertItem = {
  id: string;
  type: "stock" | "debt" | "sale";
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getLowStockProducts, clients, getTodaySales } = useStore();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const lowStock = useMemo(() => getLowStockProducts(), [getLowStockProducts]);
  const debtClients = useMemo(() => clients.filter(c => c.totalDebt > 0), [clients]);
  const todaySales = useMemo(() => getTodaySales(), [getTodaySales]);

  const alerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = [];
    lowStock.forEach(p => {
      list.push({
        id: `stock-${p.id}`,
        type: "stock",
        icon: "alert-triangle",
        title: `Stock faible : ${p.name}`,
        subtitle: `Seulement ${p.quantity} unité${p.quantity > 1 ? "s" : ""} restante${p.quantity > 1 ? "s" : ""}`,
        color: p.quantity === 0 ? colors.destructive : colors.warning,
      });
    });
    debtClients.forEach(c => {
      list.push({
        id: `debt-${c.id}`,
        type: "debt",
        icon: "credit-card",
        title: `Dette non réglée : ${c.name}`,
        subtitle: `Montant dû : ${c.totalDebt.toLocaleString()} FCFA`,
        color: colors.destructive,
      });
    });
    if (todaySales.length > 0) {
      const total = todaySales.reduce((s, x) => s + x.total, 0);
      list.push({
        id: "sales-today",
        type: "sale",
        icon: "trending-up",
        title: `${todaySales.length} vente${todaySales.length > 1 ? "s" : ""} aujourd'hui`,
        subtitle: `Recettes : ${total.toLocaleString()} FCFA`,
        color: colors.success,
      });
    }
    return list;
  }, [lowStock, debtClients, todaySales, colors]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Alertes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.success + "15" }]}>
              <Feather name="check-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Tout va bien</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Aucune alerte pour le moment
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
            </Text>
            {alerts.map(alert => (
              <TouchableOpacity
                key={alert.id}
                style={[styles.alertCard, { backgroundColor: colors.card, borderColor: alert.color + "40", borderLeftColor: alert.color }]}
                activeOpacity={0.8}
                onPress={() => {
                  if (alert.type === "stock") router.push("/(tabs)/products");
                  else if (alert.type === "debt") router.push("/(tabs)/debts");
                  else router.back();
                }}
              >
                <View style={[styles.alertIcon, { backgroundColor: alert.color + "18" }]}>
                  <Feather name={alert.icon} size={20} color={alert.color} />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                  <Text style={[styles.alertSubtitle, { color: colors.mutedForeground }]}>{alert.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700", textAlign: "center" },
  list: { padding: 16, gap: 12 },
  count: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  alertIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  alertInfo: { flex: 1, gap: 4 },
  alertTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  alertSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
});
