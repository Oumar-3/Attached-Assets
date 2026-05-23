import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useProducts } from "@/context/ProductsContext";
import { useColors } from "@/hooks/useColors";
import type { ProductRecord } from "@/models";
import { BARCODE_TYPES } from "@/utils/barcode";
import { playScanFeedback } from "@/utils/scanFeedback";

type InventoryInputProps = {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType: "default" | "numeric";
};

function InventoryInput(props: InventoryInputProps) {
  return (
    <View style={[styles.inputBox, { borderColor: props.colors.border, backgroundColor: props.colors.background }]}>
      <Feather name={props.icon} size={18} color={props.colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: props.colors.text }]}
        placeholder={props.placeholder}
        placeholderTextColor={props.colors.mutedForeground}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
      />
    </View>
  );
}

function productMatches(product: ProductRecord, query: string) {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize([product.name, product.category, product.brand, product.format, product.barcode]
    .filter(Boolean)
    .join(" "))
    .includes(q);
}

function money(value: number) {
  return `${Math.round(value).toLocaleString()} FCFA`;
}

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, findByBarcode, adjustStock } = useProducts();
  const [permission, requestPermission] = useCameraPermissions();

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [realStock, setRealStock] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    return products.filter(product => productMatches(product, search)).slice(0, 20);
  }, [products, search]);

  function selectProduct(product: ProductRecord) {
    setSelectedProduct(product);
    setRealStock(`${product.stock}`);
    setSearch("");
    setManualCode("");
    setMessage("");
  }

  function clearSelectedProduct() {
    setSelectedProduct(null);
    setRealStock("");
    setMessage("");
  }

  async function handleCode(rawCode: string) {
    const code = rawCode.trim();
    if (!code || busy) return;

    setBusy(true);
    setLocked(true);
    try {
      const product = await findByBarcode(code);
      if (product) {
        selectProduct(product);
        setMessage("Produit trouve. Entrez le stock reellement compte.");
      } else {
        setMessage("Code inconnu. Ajoutez d'abord ce produit.");
      }
    } catch (err) {
      setMessage("Impossible de lire ce code pour le moment.");
      Alert.alert("Recherche impossible", err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
      setTimeout(() => setLocked(false), 900);
    }
  }

  function handleScanned(result: BarcodeScanningResult) {
    if (!locked) {
      playScanFeedback();
      handleCode(result.data);
    }
  }

  async function handleValidate() {
    if (!selectedProduct) return;
    const nextStock = parseInt(realStock, 10);
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setMessage("Entrez un stock reel valide.");
      return;
    }

    setBusy(true);
    try {
      const updated = await adjustStock(selectedProduct.id, nextStock, `Inventaire rapide: ${selectedProduct.stock} -> ${nextStock}`);
      setSelectedProduct(updated);
      setRealStock(`${updated.stock}`);
      setMessage("Inventaire enregistre. Le stock est a jour.");
    } catch (err) {
      setMessage("Inventaire non enregistre.");
      Alert.alert("Inventaire impossible", err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  const difference = selectedProduct && realStock.trim() ? parseInt(realStock, 10) - selectedProduct.stock : 0;
  const hasPermission = permission?.granted;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.muted }]}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Inventaire rapide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 24, gap: 14 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.scanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {!hasPermission ? (
            <View style={styles.permissionBox}>
              <Feather name="camera" size={36} color={colors.primary} />
              <Text style={[styles.permissionTitle, { color: colors.text }]}>Scanner le code-barres</Text>
              <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
                Vous pouvez aussi rechercher le produit plus bas sans utiliser la camera.
              </Text>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                <Text style={styles.primaryBtnText}>{permission ? "Autoriser la camera" : "Activer le scanner"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                zoom={0.08}
                enableTorch={torchEnabled}
                barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                onBarcodeScanned={handleScanned}
              />
              <View style={styles.scanFrame} />
              <TouchableOpacity
                style={[styles.torchBtn, torchEnabled && styles.torchBtnActive]}
                onPress={() => setTorchEnabled(value => !value)}
                activeOpacity={0.85}
              >
                <Feather name={torchEnabled ? "zap-off" : "zap"} size={18} color="#fff" />
                <Text style={styles.torchText}>{torchEnabled ? "Lampe active" : "Lampe"}</Text>
              </TouchableOpacity>
              <View style={styles.scanHint}>
                <Text style={styles.scanHintText}>Scannez puis comptez le stock reel</Text>
              </View>
            </View>
          )}
        </View>

        {!selectedProduct ? (
          <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trouver un produit</Text>
            <InventoryInput colors={colors} icon="search" placeholder="Nom, marque, categorie ou code" value={search} onChangeText={setSearch} keyboardType="default" />
            <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="hash" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Saisie code-barres"
                placeholderTextColor={colors.mutedForeground}
                value={manualCode}
                onChangeText={setManualCode}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.primary }, (!manualCode.trim() || busy) && { opacity: 0.45 }]}
                onPress={() => handleCode(manualCode)}
                disabled={!manualCode.trim() || busy}
              >
                <Feather name="arrow-right" size={17} color="#fff" />
              </TouchableOpacity>
            </View>

            {!search.trim() ? (
              <EmptyState icon="search" title="Recherchez un produit" subtitle="Tapez un nom, une marque ou scannez un code-barres." />
            ) : filteredProducts.length === 0 ? (
              <EmptyState icon="package" title="Aucun produit" subtitle="Essayez une autre recherche ou scannez le code-barres." />
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.productRow} onPress={() => selectProduct(item)} activeOpacity={0.75}>
                    {item.imageUri ? (
                      <Image source={{ uri: item.imageUri }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productImage, styles.productImageEmpty, { backgroundColor: colors.muted }]}>
                        <Feather name="package" size={18} color={colors.mutedForeground} />
                      </View>
                    )}
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>Stock app: {item.stock} / Seuil: {item.alertThreshold}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        ) : null}

        {selectedProduct ? (
          <View style={[styles.adjustCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.productSheet}>
              {selectedProduct.imageUri ? (
                <Image source={{ uri: selectedProduct.imageUri }} style={styles.sheetImage} />
              ) : (
                <View style={[styles.sheetImage, styles.productImageEmpty, { backgroundColor: colors.muted }]}>
                  <Feather name="package" size={28} color={colors.mutedForeground} />
                </View>
              )}
              <View style={styles.sheetInfo}>
                <View style={styles.sheetTitleRow}>
                  <Text style={[styles.adjustTitle, { color: colors.text }]} numberOfLines={2}>{selectedProduct.name}</Text>
                  <View
                    style={[
                      styles.stockStatus,
                      {
                        backgroundColor:
                          selectedProduct.stock === 0
                            ? colors.destructive + "14"
                            : selectedProduct.stock <= selectedProduct.alertThreshold
                              ? colors.warning + "14"
                              : colors.success + "14",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockStatusText,
                        {
                          color:
                            selectedProduct.stock === 0
                              ? colors.destructive
                              : selectedProduct.stock <= selectedProduct.alertThreshold
                                ? colors.warning
                                : colors.success,
                        },
                      ]}
                    >
                      {selectedProduct.stock === 0 ? "Rupture" : selectedProduct.stock <= selectedProduct.alertThreshold ? "Stock faible" : "OK"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.productMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {[selectedProduct.category, selectedProduct.brand, selectedProduct.format].filter(Boolean).join(" - ") || "Produit boutique"}
                </Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Stock app</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{selectedProduct.stock}</Text>
              </View>
              <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Seuil</Text>
                <Text style={[styles.infoValue, { color: colors.warning }]}>{selectedProduct.alertThreshold}</Text>
              </View>
              <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Prix vente</Text>
                <Text style={[styles.infoValueSmall, { color: colors.primary }]}>{money(selectedProduct.sellPrice)}</Text>
              </View>
              <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Prix achat</Text>
                <Text style={[styles.infoValueSmall, { color: colors.text }]}>{money(selectedProduct.buyPrice)}</Text>
              </View>
            </View>

            <View style={[styles.barcodeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="hash" size={16} color={colors.mutedForeground} />
              <View style={styles.productInfo}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Code-barres</Text>
                <Text style={[styles.barcodeText, { color: colors.text }]}>{selectedProduct.barcode || "Non renseigne"}</Text>
              </View>
            </View>

            <View style={styles.adjustHeader}>
              <View style={[styles.adjustIcon, { backgroundColor: colors.accent + "18" }]}>
                <Feather name="clipboard" size={22} color={colors.accent} />
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.countTitle, { color: colors.text }]}>Stock reel compte</Text>
                <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>Entrez la quantite trouvee en rayon ou reserve.</Text>
              </View>
            </View>

            <InventoryInput colors={colors} icon="edit-3" placeholder="Stock reel compte" value={realStock} onChangeText={setRealStock} keyboardType="numeric" />

            <View style={[styles.diffBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.diffLabel, { color: colors.mutedForeground }]}>Difference</Text>
              <Text style={[styles.diffValue, { color: difference > 0 ? colors.success : difference < 0 ? colors.destructive : colors.text }]}>
                {difference > 0 ? `+${difference}` : difference}
              </Text>
            </View>

            {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]} onPress={handleValidate} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Enregistrer l'inventaire</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={clearSelectedProduct} disabled={busy}>
              <Feather name="search" size={17} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Chercher un autre produit</Text>
            </TouchableOpacity>
          </View>
        ) : message ? (
          <Text style={[styles.message, { color: colors.primary }]}>{message}</Text>
        ) : null}
      </ScrollView>
    </View>
  );

}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  body: { flex: 1 },
  scanCard: { height: 250, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  permissionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", fontWeight: "700" },
  permissionText: { maxWidth: 260, textAlign: "center", fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  scanFrame: { position: "absolute", left: 54, right: 54, top: 64, bottom: 64, borderWidth: 3, borderColor: "#fff", borderRadius: 16 },
  torchBtn: { position: "absolute", top: 14, right: 14, minHeight: 38, borderRadius: 999, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, backgroundColor: "rgba(0,0,0,0.45)" },
  torchBtnActive: { backgroundColor: "rgba(5,150,105,0.85)" },
  torchText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold", fontWeight: "700" },
  scanHint: { position: "absolute", left: 16, right: 16, bottom: 18, alignItems: "center" },
  scanHintText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  manualCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  adjustCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  smallBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  separator: { height: 1 },
  productRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  productImage: { width: 44, height: 44, borderRadius: 12 },
  productImageEmpty: { alignItems: "center", justifyContent: "center" },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  adjustHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  adjustIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  productSheet: { flexDirection: "row", alignItems: "center", gap: 13 },
  sheetImage: { width: 74, height: 74, borderRadius: 16 },
  sheetInfo: { flex: 1, gap: 5 },
  sheetTitleRow: { gap: 7 },
  adjustTitle: { fontSize: 18, lineHeight: 23, fontFamily: "Inter_700Bold", fontWeight: "700" },
  countTitle: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  stockStatus: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  stockStatusText: { fontSize: 11, fontFamily: "Inter_700Bold", fontWeight: "700" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoBox: { width: "47.8%", borderWidth: 1, borderRadius: 13, padding: 12, gap: 4 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600", textTransform: "uppercase" },
  infoValue: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" },
  infoValueSmall: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  barcodeBox: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  barcodeText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  diffBox: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  diffLabel: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  diffValue: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" },
  message: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  primaryBtn: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  secondaryBtn: { minHeight: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
