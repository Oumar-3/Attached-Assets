import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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

function ProductButton({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const colors = useColors();
  const isOut = product.quantity === 0;
  return (
    <TouchableOpacity
      style={[
        styles.productBtn,
        { backgroundColor: colors.card, borderColor: isOut ? colors.border : colors.border },
        isOut && { opacity: 0.5 },
      ]}
      onPress={isOut ? undefined : onAdd}
      activeOpacity={0.75}
      disabled={isOut}
    >
      <View style={[styles.productIconBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="package" size={20} color={colors.primary} />
      </View>
      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
      <Text style={[styles.productPrice, { color: colors.primary }]}>{product.sellPrice.toLocaleString()} F</Text>
      <Text style={[styles.productStock, { color: isOut ? colors.destructive : colors.mutedForeground }]}>
        Stock: {product.quantity}
      </Text>
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
      Alert.alert("Vente confirmée", `Total: ${cartTotal.toLocaleString()} FCFA`, [{ text: "OK" }]);
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
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Caisse</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={p => p.id}
        renderItem={({ item }) => <ProductButton product={item} onAdd={() => addToCart(item)} />}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 120 }]}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <EmptyState icon="package" title="Aucun produit" subtitle="Ajoutez des produits pour commencer" />
        }
        showsVerticalScrollIndicator={false}
      />

      {cartCount > 0 && (
        <View style={[styles.cartBar, { backgroundColor: colors.primary, paddingBottom: bottomPad + 8 }]}>
          <TouchableOpacity style={styles.cartBarContent} onPress={() => setShowCart(true)} activeOpacity={0.9}>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>Voir le panier</Text>
            <Text style={styles.cartBarTotal}>{cartTotal.toLocaleString()} FCFA</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCart(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Panier</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cartItems} contentContainerStyle={{ padding: 16, gap: 10 }}>
            {cart.map(item => (
              <View key={item.product.id} style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cartItemInfo}>
                  <Text style={[styles.cartItemName, { color: colors.text }]}>{item.product.name}</Text>
                  <Text style={[styles.cartItemPrice, { color: colors.primary }]}>
                    {item.product.sellPrice.toLocaleString()} FCFA × {item.quantity}
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.muted }]} onPress={() => updateQty(item.product.id, item.quantity - 1)}>
                    <Feather name="minus" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.muted }]} onPress={() => updateQty(item.product.id, item.quantity + 1)}>
                    <Feather name="plus" size={14} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.payTypeRow}>
              {(["cash", "credit"] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.payTypeBtn, { borderColor: colors.border, backgroundColor: payType === t ? colors.primary : colors.card }]}
                  onPress={() => setPayType(t)}
                >
                  <Feather name={t === "cash" ? "dollar-sign" : "credit-card"} size={16} color={payType === t ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.payTypeBtnText, { color: payType === t ? "#fff" : colors.mutedForeground }]}>
                    {t === "cash" ? "Espèces" : "Crédit"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {payType === "credit" && selectedClient && (
              <View style={[styles.clientBadge, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="user" size={14} color={colors.primary} />
                <Text style={[styles.clientBadgeText, { color: colors.primary }]}>{selectedClient.name}</Text>
                <TouchableOpacity onPress={() => setSelectedClient(null)}>
                  <Feather name="x" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
              <Text style={[styles.totalAmount, { color: colors.text }]}>{cartTotal.toLocaleString()} FCFA</Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }, confirmLoading && { opacity: 0.7 }]}
              onPress={confirmSale}
              disabled={confirmLoading}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirmer la vente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showClientPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowClientPicker(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sélectionner un client</Text>
            <TouchableOpacity onPress={() => setShowClientPicker(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="user-plus" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nom du nouveau client"
                placeholderTextColor={colors.mutedForeground}
                value={newClientName}
                onChangeText={setNewClientName}
              />
              <TouchableOpacity onPress={handleAddNewClient} disabled={!newClientName.trim()}>
                <Feather name="plus-circle" size={22} color={newClientName.trim() ? colors.primary : colors.border} />
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  grid: { padding: 12 },
  row: { gap: 12 },
  productBtn: {
    flex: 1,
    margin: 0,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  productName: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  productPrice: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  productStock: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cartBar: {
    position: "absolute",
    bottom: 72,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cartBarContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cartCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartCountText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  cartBarText: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", fontWeight: "600", color: "#fff" },
  cartBarTotal: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  cartItems: { flex: 1 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  cartItemInfo: { flex: 1, gap: 4 },
  cartItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  cartItemPrice: { fontSize: 13, fontFamily: "Inter_400Regular" },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700", minWidth: 20, textAlign: "center" },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  payTypeRow: { flexDirection: "row", gap: 12 },
  payTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  payTypeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  clientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  clientBadgeText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { fontSize: 16, fontFamily: "Inter_400Regular" },
  totalAmount: { fontSize: 24, fontFamily: "Inter_700Bold", fontWeight: "700" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  clientInitials: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  clientName: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" },
  clientDebt: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
