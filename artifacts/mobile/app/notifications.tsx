import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProducts } from "@/context/ProductsContext";
import { useSales } from "@/context/SalesContext";
import { useColors } from "@/hooks/useColors";
import {
  buildStockAlertId,
  getStockAlertStateAsync,
  hideStockAlertAsync,
  markStockAlertsReadAsync,
} from "@/services/alerts/stockAlertState";

type AlertItem = {
  id: string;
  type: "stock" | "sale";
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  productId?: string;
};

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lowStockSuggestions } = useProducts();
  const { sales } = useSales();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const todaySales = useMemo(() => sales.filter(sale => isToday(sale.createdAt)), [sales]);

  useEffect(() => {
    let mounted = true;
    getStockAlertStateAsync().then(state => {
      if (!mounted) return;
      setHiddenIds(state.hiddenIds);
      setReadIds(state.readIds);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const alerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = lowStockSuggestions.map(suggestion => {
      const product = suggestion.product;
      const isOut = suggestion.urgency === "out";
      return {
        id: buildStockAlertId(product),
        type: "stock",
        icon: isOut ? "x-circle" : "alert-triangle",
        title: isOut ? `Rupture : ${product.name}` : `Stock faible : ${product.name}`,
        subtitle: `Il reste ${product.stock}. Racheter environ ${suggestion.suggestedReorderQuantity} unité${suggestion.suggestedReorderQuantity > 1 ? "s" : ""}.`,
        color: isOut ? colors.destructive : colors.warning,
        productId: product.id,
      };
    });

    if (todaySales.length > 0) {
      const total = todaySales.reduce((sum, sale) => sum + sale.total, 0);
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
  }, [colors, lowStockSuggestions, todaySales]);

  const visibleAlerts = useMemo(() => alerts.filter(alert => !hiddenIds.includes(alert.id)), [alerts, hiddenIds]);

  useEffect(() => {
    const stockAlertIds = visibleAlerts.filter(alert => alert.type === "stock").map(alert => alert.id);
    if (stockAlertIds.length === 0) return;
    markStockAlertsReadAsync(stockAlertIds).then(() => {
      setReadIds(prev => Array.from(new Set([...prev, ...stockAlertIds])));
    });
  }, [visibleAlerts]);

  function openAlert(alert: AlertItem) {
    if (alert.type === "stock" && alert.productId) {
      router.push({ pathname: "/product/[id]", params: { id: alert.productId } });
    } else {
      router.back();
    }
  }

  function confirmDeleteAlert(alert: AlertItem) {
    if (alert.type !== "stock") return;
    Alert.alert(
      "Supprimer cette alerte ?",
      "Elle sera masquee jusqu'a ce que le stock de ce produit change.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await hideStockAlertAsync(alert.id);
            setHiddenIds(prev => Array.from(new Set([...prev, alert.id])));
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Alertes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        {visibleAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.success + "15" }]}>
              <Feather name="check-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Tout va bien</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Aucun produit à racheter pour le moment</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {visibleAlerts.length} alerte{visibleAlerts.length > 1 ? "s" : ""}
            </Text>
            {visibleAlerts.map(alert => {
              const isUnread = alert.type === "stock" && !readIds.includes(alert.id);
              return (
              <View
                key={alert.id}
                style={[styles.alertCard, { backgroundColor: colors.card, borderColor: alert.color + "40", borderLeftColor: alert.color }]}
              >
                <TouchableOpacity style={styles.alertMain} activeOpacity={0.8} onPress={() => openAlert(alert)}>
                  <View style={[styles.alertIcon, { backgroundColor: alert.color + "18" }]}>
                    <Feather name={alert.icon} size={20} color={alert.color} />
                  </View>
                  <View style={styles.alertInfo}>
                    <View style={styles.alertTitleRow}>
                      {isUnread ? <View style={[styles.unreadDot, { backgroundColor: alert.color }]} /> : null}
                      <Text style={[styles.alertTitle, { color: colors.text }]}>{alert.title}</Text>
                    </View>
                    <Text style={[styles.alertSubtitle, { color: colors.mutedForeground }]}>{alert.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                {alert.type === "stock" ? (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: colors.destructive + "12" }]}
                    onPress={() => confirmDeleteAlert(alert)}
                    activeOpacity={0.75}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )})}
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
    padding: 12,
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
  alertMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  alertIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  alertInfo: { flex: 1, gap: 4 },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  alertTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  alertSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  deleteBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
});
