import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";
import type { CartItem, Client, Product, SaleItem } from "@/types";

function ProductButton({ product, qty, onAdd }: { product: Product; qty: number; onAdd: () => void }) {
  const colors = useColors();
  const isOut = product.quantity === 0;
  return (
    <TouchableOpacity
      style={[
        styles.productBtn,
        { backgroundColor: colors.card, borderColor: qty > 0 ? colors.primary + "60" : colors.border },
        isOut && { opacity: 0.35 },
      ]}
      onPress={isOut ? undefined : onAdd}
      activeOpacity={0.7}
      disabled={isOut}
    >
      {qty > 0 && (
        <View style={[styles.qtyOverlay, { backgroundColor: colors.primary }]}>
          <Text style={styles.qtyOverlayText}>{qty}</Text>
        </View>
      )}
      <View style={[styles.productIcon, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="package" size={18} color={colors.primary} />
      </View>
      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
      <Text style={[styles.productPrice, { color: colors.primary }]}>{product.sellPrice.toLocaleString()}</Text>
      <Text style={[styles.productUnit, { color: colors.mutedForeground }]}>FCFA</Text>
    </TouchableOpacity>
  );
}

export default function SaleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, addSale, clients, addClient } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [payType, setPayType] = useState<"cash" | "credit">("cash");
  const [search, setSearch] = useState("");
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const cartTotal = cart.reduce((s, c) => s + c.product.sellPrice * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function getCartQty(productId: string) {
    return cart.find(c => c.product.id === productId)?.quantity ?? 0;
  }

  function addToCart(product: Product) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: qty } : c));
  }

  async function confirmSale() {
    if (cart.length === 0) return;
    if (payType === "credit" && !selectedClient) {
      setShowClientPicker(true);
      return;
    }
    setConfirmLoading(true);
    try {
      const items: SaleItem[] = cart.map(c => ({
        productId: c.product.id,
        name: c.product.name,
        quantity: c.quantity,
        sellPrice: c.product.sellPrice,
        buyPrice: c.product.buyPrice,
      }));
      await addSale(items, payType, selectedClient?.id, selectedClient?.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCart([]);
      setShowCart(false);
      setSelectedClient(null);
      setPayType("cash");
      Alert.alert("✓ Vente confirmée", `${cartTotal.toLocaleString()} FCFA encaissés`, [{ text: "OK" }]);
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleAddNewClient() {
    if (!newClientName.trim()) return;
    const c = await addClient(newClientName.trim());
    setSelectedClient(c);
    setNewClientName("");
    setShowClientPicker(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Caisse</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {products.length} produit{products.length !== 1 ? "s" : ""}
            </Text>
          </View>
          {cartCount > 0 && (
            <View style={[styles.cartSummary, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Feather name="shopping-cart" size={15} color={colors.primary} />
              <Text style={[styles.cartSummaryText, { color: colors.primary }]}>{cartCount} · {cartTotal.toLocaleString()} F</Text>
            </View>
          )}
        </View>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={17} color="#444" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor="#444"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="#555" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <ProductButton product={item} qty={getCartQty(item.id)} onAdd={() => addToCart(item)} />
        )}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 110 }]}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <EmptyState icon="package" title="Aucun produit" subtitle="Ajoutez des produits pour commencer" />
        }
        showsVerticalScrollIndicator={false}
      />

      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBar, { paddingBottom: bottomPad + 10 }]}
          onPress={() => setShowCart(true)}
          activeOpacity={0.9}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.cartBarInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarLabel}>Voir le panier</Text>
            <Text style={styles.cartBarTotal}>{cartTotal.toLocaleString()} FCFA</Text>
            <Feather name="chevron-right" size={18} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCart(false)}>
        <View style={[styles.modal, { backgroundColor: "#000" }]}>
          <View style={[styles.modalHandle, { backgroundColor: "#333" }]} />
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Panier</Text>
            <TouchableOpacity onPress={() => setShowCart(false)} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
              <Feather name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cartItems} contentContainerStyle={{ padding: 16, gap: 10 }}>
            {cart.map(item => (
              <View key={item.product.id} style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cartItemLeft}>
                  <Text style={[styles.cartItemName, { color: colors.text }]}>{item.product.name}</Text>
                  <Text style={[styles.cartItemUnit, { color: colors.primary }]}>
                    {item.product.sellPrice.toLocaleString()} FCFA / unité
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                    onPress={() => updateQty(item.product.id, item.quantity - 1)}
                  >
                    <Feather name="minus" size={13} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: colors.muted }]}
                    onPress={() => updateQty(item.product.id, item.quantity + 1)}
                  >
                    <Feather name="plus" size={13} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.cartItemTotal, { color: colors.text }]}>
                  {(item.product.sellPrice * item.quantity).toLocaleString()} F
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.payTypeRow}>
              {(["cash", "credit"] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.payBtn,
                    payType === t
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                  ]}
                  onPress={() => setPayType(t)}
                >
                  <Feather name={t === "cash" ? "dollar-sign" : "credit-card"} size={15} color={payType === t ? "#000" : colors.mutedForeground} />
                  <Text style={[styles.payBtnText, { color: payType === t ? "#000" : colors.mutedForeground }]}>
                    {t === "cash" ? "Espèces" : "Crédit"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {payType === "credit" && selectedClient && (
              <View style={[styles.clientPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Feather name="user" size={13} color={colors.primary} />
                <Text style={[styles.clientPillText, { color: colors.primary }]}>{selectedClient.name}</Text>
                <TouchableOpacity onPress={() => setSelectedClient(null)}>
                  <Feather name="x" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total à payer</Text>
              <Text style={[styles.totalAmount, { color: colors.text }]}>{cartTotal.toLocaleString()} FCFA</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtnWrap, confirmLoading && { opacity: 0.7 }]}
              onPress={confirmSale}
              disabled={confirmLoading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Feather name="check-circle" size={18} color="#000" />
                <Text style={styles.confirmBtnText}>Confirmer la vente</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showClientPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowClientPicker(false)}>
        <View style={[styles.modal, { backgroundColor: "#000" }]}>
          <View style={[styles.modalHandle, { backgroundColor: "#333" }]} />
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choisir un client</Text>
            <TouchableOpacity onPress={() => setShowClientPicker(false)} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
              <Feather name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            <View style={[styles.newClientBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="user-plus" size={16} color="#444" />
              <TextInput
                style={[styles.newClientInput, { color: colors.text }]}
                placeholder="Nouveau client..."
                placeholderTextColor="#444"
                value={newClientName}
                onChangeText={setNewClientName}
              />
              <TouchableOpacity onPress={handleAddNewClient} disabled={!newClientName.trim()}>
                <Feather name="plus-circle" size={22} color={newClientName.trim() ? colors.primary : "#333"} />
              </TouchableOpacity>
            </View>
            {clients.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.clientRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setSelectedClient(c); setShowClientPicker(false); }}
                activeOpacity={0.75}
              >
                <View style={[styles.clientAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.clientInitials, { color: colors.primary }]}>{c.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={[styles.clientName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.clientDebt, { color: c.totalDebt > 0 ? colors.destructive : colors.success }]}>
                  {c.totalDebt.toLocaleString()} F
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  cartSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cartSummaryText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  grid: { padding: 12, paddingTop: 8 },
  gridRow: { gap: 10 },
  productBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    marginBottom: 10,
    minHeight: 130,
    position: "relative",
  },
  qtyOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyOverlayText: { fontSize: 12, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  productIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  productName: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500", lineHeight: 18 },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  productUnit: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: -4 },
  cartBar: {
    position: "absolute",
    bottom: 72,
    left: 12,
    right: 12,
  },
  cartBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    gap: 10,
  },
  cartBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  cartBarLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  cartBarTotal: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  modal: { flex: 1 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  cartItems: { flex: 1 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  cartItemLeft: { flex: 1, gap: 3 },
  cartItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  cartItemUnit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700", minWidth: 22, textAlign: "center" },
  cartItemTotal: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700", minWidth: 60, textAlign: "right" },
  modalFooter: { padding: 20, borderTopWidth: 1, gap: 14 },
  payTypeRow: { flexDirection: "row", gap: 10 },
  payBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  payBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  clientPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  clientPillText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  totalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  totalAmount: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700", letterSpacing: -0.5 },
  confirmBtnWrap: {},
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  newClientBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 4,
  },
  newClientInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  clientInitials: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  clientName: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" },
  clientDebt: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
