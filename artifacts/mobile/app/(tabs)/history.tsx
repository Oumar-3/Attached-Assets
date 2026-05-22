import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useSales } from "@/context/SalesContext";
import { useColors } from "@/hooks/useColors";
import type { SaleRecord } from "@/models";

function money(value: number) {
  return `${Math.round(value).toLocaleString()} FCFA`;
}

function saleDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function searchableDate(value: string) {
  const date = new Date(value);
  return [
    date.toLocaleDateString("fr-FR"),
    date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    date.toISOString().slice(0, 10),
  ].join(" ").toLowerCase();
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function SaleCard({ sale, onDelete }: { sale: SaleRecord; onDelete: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const isCredit = sale.paymentType === "credit";

  return (
    <TouchableOpacity
      style={[styles.saleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/receipt/[id]", params: { id: sale.id } })}
      activeOpacity={0.78}
    >
      <View style={[styles.saleIcon, { backgroundColor: isCredit ? colors.warning + "16" : colors.primary + "16" }]}>
        <Feather name={isCredit ? "credit-card" : "file-text"} size={19} color={isCredit ? colors.warning : colors.primary} />
      </View>
      <View style={styles.saleInfo}>
        <View style={styles.saleTitleRow}>
          <Text style={[styles.saleTitle, { color: colors.text }]} numberOfLines={1}>Recu {sale.receiptNumber}</Text>
          <View style={[styles.badge, { backgroundColor: isCredit ? colors.warning + "14" : colors.success + "14" }]}>
            <Text style={[styles.badgeText, { color: isCredit ? colors.warning : colors.success }]}>{isCredit ? "Credit" : "Cash"}</Text>
          </View>
        </View>
        <Text style={[styles.saleDate, { color: colors.mutedForeground }]}>{saleDate(sale.createdAt)}</Text>
        <Text style={[styles.saleProfit, { color: sale.estimatedProfit >= 0 ? colors.success : colors.destructive }]}>
          Benefice estime: {money(sale.estimatedProfit)}
        </Text>
      </View>
      <View style={styles.saleRight}>
        <Text style={[styles.saleTotal, { color: colors.text }]}>{money(sale.total)}</Text>
        <View style={styles.saleRightActions}>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.destructive + "12" }]}
            onPress={onDelete}
            activeOpacity={0.75}
          >
            <Feather name="trash-2" size={15} color={colors.destructive} />
          </TouchableOpacity>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sales, isLoading, refreshSales, hideSaleFromHistory } = useSales();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales.slice(0, 10);
    return sales.filter(sale => {
      return [
        sale.receiptNumber.toLowerCase(),
        sale.paymentType,
        searchableDate(sale.createdAt),
      ].join(" ").includes(q);
    });
  }, [sales, search]);

  const totalRevenue = useMemo(() => sales.reduce((sum, sale) => sum + sale.total, 0), [sales]);
  const totalProfit = useMemo(() => sales.reduce((sum, sale) => sum + sale.estimatedProfit, 0), [sales]);
  const todayCount = useMemo(() => sales.filter(sale => isToday(sale.createdAt)).length, [sales]);
  const creditCount = useMemo(() => sales.filter(sale => sale.paymentType === "credit").length, [sales]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await refreshSales();
    } finally {
      setRefreshing(false);
    }
  }

  function confirmHideReceipt(sale: SaleRecord) {
    Alert.alert(
      "Supprimer ce recu ?",
      "Il sera masque de l'historique, mais la vente reste conservee pour garder le stock et les dettes coherents.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await hideSaleFromHistory(sale.id);
            } catch (err) {
              Alert.alert("Suppression impossible", err instanceof Error ? err.message : "Une erreur est survenue.");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Historique</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            10 derniers recus affiches par defaut
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>Ventes</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{money(totalRevenue)}</Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: colors.success + "12" }]}>
            <Text style={[styles.summaryLabel, { color: colors.success }]}>Benefice</Text>
            <Text style={[styles.summaryValue, { color: totalProfit >= 0 ? colors.success : colors.destructive }]}>{money(totalProfit)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: colors.info + "12" }]}>
            <Feather name="calendar" size={14} color={colors.info} />
            <Text style={[styles.statPillText, { color: colors.info }]}>{todayCount} aujourd'hui</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.warning + "12" }]}>
            <Feather name="credit-card" size={14} color={colors.warning} />
            <Text style={[styles.statPillText, { color: colors.warning }]}>{creditCount} credit</Text>
          </View>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher par date ou numero"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultRow}>
          <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
            {filteredSales.length} vente{filteredSales.length > 1 ? "s" : ""}
            {!search.trim() && sales.length > 10 ? ` sur ${sales.length} recentes` : ""}
          </Text>
        </View>

        {isLoading ? (
          <SkeletonCard count={5} />
        ) : filteredSales.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="Aucune vente"
            subtitle={search ? "Aucun recu ne correspond a cette date ou ce numero" : "Les ventes validees apparaitront ici"}
          />
        ) : (
          filteredSales.map(sale => <SaleCard key={sale.id} sale={sale} onDelete={() => confirmHideReceipt(sale)} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryBox: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, gap: 2 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  summaryValue: { fontSize: 17, fontFamily: "Inter_700Bold", fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  statPillText: { fontSize: 12, fontFamily: "Inter_700Bold", fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  list: { flex: 1 },
  resultRow: { marginBottom: 10 },
  resultText: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  saleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  saleIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saleInfo: { flex: 1, gap: 3 },
  saleTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  saleTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", fontWeight: "700" },
  saleDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saleProfit: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  saleRight: { alignItems: "flex-end", gap: 6 },
  saleRightActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  deleteBtn: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  saleTotal: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
