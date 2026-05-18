import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, sales, updateProduct, deleteProduct } = useStore();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const product = products.find(p => p.id === id);
  const [editQty, setEditQty] = useState(false);
  const [qty, setQty] = useState(product ? `${product.quantity}` : "");

  if (!product) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Produit introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const productSales = sales.filter(s => s.items.some(i => i.productId === id));
  const totalSold = productSales.reduce((s, sale) => s + (sale.items.find(i => i.productId === id)?.quantity ?? 0), 0);
  const totalRevenue = productSales.reduce((s, sale) => {
    const item = sale.items.find(i => i.productId === id);
    return s + (item ? item.sellPrice * item.quantity : 0);
  }, 0);
  const totalProfit = productSales.reduce((s, sale) => {
    const item = sale.items.find(i => i.productId === id);
    return s + (item ? (item.sellPrice - item.buyPrice) * item.quantity : 0);
  }, 0);

  const isLow = product.quantity <= 5;

  function handleDelete() {
    Alert.alert("Supprimer", `Supprimer "${product.name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteProduct(product.id);
          router.back();
        },
      },
    ]);
  }

  async function handleQtySave() {
    const n = parseInt(qty);
    if (isNaN(n) || n < 0) return;
    await updateProduct(product.id, { quantity: n });
    setEditQty(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Prix de vente</Text>
              <Text style={styles.heroPrice}>{product.sellPrice.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{product.category}</Text>
            </View>
          </View>
          <View style={styles.heroRow}>
            <Text style={styles.heroCost}>Achat: {product.buyPrice.toLocaleString()} FCFA</Text>
            <Text style={styles.heroMargin}>
              Marge: {product.buyPrice > 0
                ? `${(((product.sellPrice - product.buyPrice) / product.buyPrice) * 100).toFixed(0)}%`
                : "—"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Vendus", value: `${totalSold}`, icon: "shopping-bag" as const, color: colors.primary },
            { label: "Recettes", value: `${(totalRevenue / 1000).toFixed(0)}k`, icon: "dollar-sign" as const, color: colors.success },
            { label: "Bénéfice", value: `${(totalProfit / 1000).toFixed(0)}k`, icon: "trending-up" as const, color: colors.accent },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon} size={18} color={s.color} />
              <Text style={[styles.statVal, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.stockCard, { backgroundColor: colors.card, borderColor: isLow ? colors.warning : colors.border }]}>
          <View style={styles.stockRow}>
            <View>
              <Text style={[styles.stockLabel, { color: colors.mutedForeground }]}>Stock actuel</Text>
              <View style={styles.stockValueRow}>
                {editQty ? (
                  <TextInput
                    style={[styles.stockInput, { color: colors.text, borderColor: colors.primary }]}
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.stockValue, { color: isLow ? colors.warning : colors.text }]}>{product.quantity}</Text>
                )}
                <Text style={[styles.stockUnit, { color: colors.mutedForeground }]}>unités</Text>
              </View>
            </View>
            {editQty ? (
              <View style={styles.stockActions}>
                <TouchableOpacity style={[styles.stockBtn, { backgroundColor: colors.primary }]} onPress={handleQtySave}>
                  <Feather name="check" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.stockBtn, { backgroundColor: colors.muted }]} onPress={() => { setEditQty(false); setQty(`${product.quantity}`); }}>
                  <Feather name="x" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]} onPress={() => setEditQty(true)}>
                <Feather name="edit-2" size={16} color={colors.primary} />
                <Text style={[styles.editBtnText, { color: colors.primary }]}>Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
          {isLow && (
            <View style={[styles.alertBox, { backgroundColor: colors.warning + "15" }]}>
              <Feather name="alert-triangle" size={14} color={colors.warning} />
              <Text style={[styles.alertText, { color: colors.warning }]}>Stock faible — pensez à réapprovisionner</Text>
            </View>
          )}
        </View>

        <View style={styles.salesSection}>
          <Text style={[styles.salesTitle, { color: colors.text }]}>Historique des ventes</Text>
          {productSales.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune vente pour ce produit</Text>
            </View>
          ) : (
            productSales.slice(0, 10).map(sale => {
              const item = sale.items.find(i => i.productId === id)!;
              return (
                <View key={sale.id} style={[styles.saleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.saleIcon, { backgroundColor: sale.type === "cash" ? colors.success + "18" : colors.warning + "18" }]}>
                    <Feather name={sale.type === "cash" ? "dollar-sign" : "credit-card"} size={14} color={sale.type === "cash" ? colors.success : colors.warning} />
                  </View>
                  <View style={styles.saleInfo}>
                    <Text style={[styles.saleQty, { color: colors.text }]}>{item.quantity} unité{item.quantity > 1 ? "s" : ""}</Text>
                    <Text style={[styles.saleDate, { color: colors.mutedForeground }]}>
                      {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                  <Text style={[styles.saleAmount, { color: colors.primary }]}>{(item.sellPrice * item.quantity).toLocaleString()} F</Text>
                </View>
              );
            })
          )}
        </View>
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
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  body: { padding: 16, gap: 16 },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  heroPrice: { fontSize: 28, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 13, color: "#fff", fontFamily: "Inter_500Medium", fontWeight: "500" },
  heroCost: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" },
  heroMargin: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_500Medium", fontWeight: "500" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  stockCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  stockRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stockLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  stockValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  stockValue: { fontSize: 36, fontFamily: "Inter_700Bold", fontWeight: "700" },
  stockInput: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    borderBottomWidth: 2,
    minWidth: 60,
    textAlign: "center",
  },
  stockUnit: { fontSize: 14, fontFamily: "Inter_400Regular" },
  stockActions: { flexDirection: "row", gap: 8 },
  stockBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  alertText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  salesSection: { gap: 12 },
  salesTitle: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  saleIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  saleInfo: { flex: 1, gap: 2 },
  saleQty: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  saleDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  saleAmount: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular", marginBottom: 12 },
  back: { fontSize: 15, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
