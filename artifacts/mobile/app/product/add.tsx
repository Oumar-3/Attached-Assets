import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Alimentaire", "Boisson", "Hygiène", "Textile", "Électronique", "Autre"];

export default function AddProductScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addProduct } = useStore();

  const [name, setName] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const margin = sellPrice && buyPrice
    ? (((parseFloat(sellPrice) - parseFloat(buyPrice)) / parseFloat(buyPrice)) * 100).toFixed(0)
    : null;

  async function handleSave() {
    if (!name.trim()) return setError("Nom du produit requis");
    if (!sellPrice || parseFloat(sellPrice) <= 0) return setError("Prix de vente invalide");
    if (!quantity || parseFloat(quantity) < 0) return setError("Quantité invalide");
    setError("");
    setLoading(true);
    try {
      await addProduct({
        name: name.trim(),
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parseFloat(sellPrice),
        quantity: parseInt(quantity),
        category,
      });
      router.back();
    } catch {
      setError("Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Nouveau produit</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, (!name.trim() || !sellPrice) && { opacity: 0.4 }]}
            onPress={handleSave}
            disabled={loading || !name.trim() || !sellPrice}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Sauver</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.form, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}>
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Informations produit</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="package" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nom du produit"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Quantité en stock"
                placeholderTextColor={colors.mutedForeground}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Tarification</Text>
            <View style={styles.priceRow}>
              <View style={[styles.inputBox, styles.halfInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="arrow-down-circle" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Prix achat"
                  placeholderTextColor={colors.mutedForeground}
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputBox, styles.halfInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="tag" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Prix vente"
                  placeholderTextColor={colors.mutedForeground}
                  value={sellPrice}
                  onChangeText={setSellPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {margin !== null && (
              <View style={[styles.marginBox, { backgroundColor: parseFloat(margin) > 0 ? colors.success + "12" : colors.destructive + "12" }]}>
                <Feather name="trending-up" size={14} color={parseFloat(margin) > 0 ? colors.success : colors.destructive} />
                <Text style={[styles.marginText, { color: parseFloat(margin) > 0 ? colors.success : colors.destructive }]}>
                  Marge : {margin}% — Bénéfice : {(parseFloat(sellPrice || "0") - parseFloat(buyPrice || "0")).toLocaleString()} FCFA/unité
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Catégorie</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.catBtn,
                    { borderColor: category === c ? colors.primary : colors.border, backgroundColor: category === c ? colors.primary + "12" : colors.card },
                  ]}
                  onPress={() => setCategory(c)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catBtnText, { color: category === c ? colors.primary : colors.mutedForeground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600", color: "#fff" },
  form: { padding: 16, gap: 24 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  section: { gap: 12 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
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
  priceRow: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  marginBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  marginText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500", flex: 1 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  catBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
});
