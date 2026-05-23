import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProducts } from "@/context/ProductsContext";
import { useColors } from "@/hooks/useColors";
import type { ProductRecord } from "@/models";
import { BARCODE_TYPES } from "@/utils/barcode";
import { playScanFeedback } from "@/utils/scanFeedback";

type ScanInputProps = {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
};

function ScanInput(props: ScanInputProps) {
  return (
    <View style={[styles.inputBox, { borderColor: props.colors.border, backgroundColor: props.colors.background }]}>
      <Feather name={props.icon} size={18} color={props.colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: props.colors.text }]}
        placeholder={props.placeholder}
        placeholderTextColor={props.colors.mutedForeground}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType="numeric"
      />
    </View>
  );
}

export default function ProductScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { findByBarcode, receiveStock } = useProducts();
  const [permission, requestPermission] = useCameraPermissions();

  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("");
  const [foundProduct, setFoundProduct] = useState<ProductRecord | null>(null);
  const [unknownCode, setUnknownCode] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleCode(rawCode: string) {
    const code = rawCode.trim();
    if (!code || busy) return;

    setBusy(true);
    setLocked(true);
    setMessage(`Code detecte : ${code}`);
    try {
      const product = await findByBarcode(code);
      if (product) {
        setFoundProduct(product);
        setUnknownCode("");
        setAddQuantity("1");
        setUnitCost(product.buyPrice > 0 ? `${product.buyPrice}` : "");
        setMessage("Produit trouve. Ajoutez rapidement le stock recu.");
      } else {
        setFoundProduct(null);
        setUnknownCode(code);
        setMessage("Produit inconnu. Vous pouvez l'ajouter a la boutique.");
      }
    } finally {
      setBusy(false);
      setTimeout(() => setLocked(false), 900);
    }
  }

  function handleScanned(result: BarcodeScanningResult) {
    if (!locked && !foundProduct && !unknownCode) {
      playScanFeedback();
      handleCode(result.data);
    }
  }

  async function handleAddStock() {
    if (!foundProduct) return;
    const quantity = parseInt(addQuantity, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Entrez une quantite valide.");
      return;
    }

    setBusy(true);
    try {
      const parsedUnitCost = parseFloat(unitCost);
      const updated = await receiveStock(
        foundProduct.id,
        quantity,
        Number.isFinite(parsedUnitCost) && parsedUnitCost > 0 ? parsedUnitCost : undefined,
      );
      setFoundProduct(updated);
      setAddQuantity("1");
      setMessage(`Stock mis a jour : ${updated.stock} unites`);
    } finally {
      setBusy(false);
    }
  }

  const hasPermission = permission?.granted;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.muted }]}>
          <Feather name="x" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Scanner produit</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={topPad + 64}>
        <ScrollView
          contentContainerStyle={[styles.bodyContent, { paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.scanCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!permission ? (
              <ActivityIndicator color={colors.primary} />
            ) : !hasPermission ? (
              <View style={styles.permissionBox}>
                <Feather name="camera" size={40} color={colors.primary} />
                <Text style={[styles.permissionTitle, { color: colors.text }]}>Autoriser la camera</Text>
                <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>
                  Le scan permet d'ajouter du stock ou de creer un produit plus vite.
                </Text>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                  <Text style={styles.primaryBtnText}>Autoriser</Text>
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
                  <Text style={styles.scanHintText}>Cadrez le code-barres</Text>
                </View>
              </View>
            )}
          </View>

        {foundProduct ? (
          <View style={[styles.foundCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.foundHeader}>
              <View style={[styles.foundIcon, { backgroundColor: colors.success + "18" }]}>
                <Feather name="check-circle" size={22} color={colors.success} />
              </View>
              <View style={styles.foundInfo}>
                <Text style={[styles.foundName, { color: colors.text }]} numberOfLines={1}>{foundProduct.name}</Text>
                <Text style={[styles.foundMeta, { color: colors.mutedForeground }]}>
                  Stock actuel : {foundProduct.stock} / Prix : {foundProduct.sellPrice.toLocaleString()} FCFA
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push({ pathname: "/product/[id]", params: { id: foundProduct.id } })}>
                <Feather name="external-link" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickQtyRow}>
              {[1, 5, 10, 24].map(qty => (
                <TouchableOpacity
                  key={qty}
                  style={[styles.quickQtyBtn, { borderColor: colors.border, backgroundColor: addQuantity === `${qty}` ? colors.primary : colors.background }]}
                  onPress={() => setAddQuantity(`${qty}`)}
                >
                  <Text style={[styles.quickQtyText, { color: addQuantity === `${qty}` ? "#fff" : colors.text }]}>+{qty}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScanInput colors={colors} icon="plus" placeholder="Quantite a ajouter" value={addQuantity} onChangeText={setAddQuantity} />
            <ScanInput colors={colors} icon="arrow-down-circle" placeholder="Prix d'achat unitaire" value={unitCost} onChangeText={setUnitCost} />
            {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}

            <View style={styles.foundActions}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => {
                  setFoundProduct(null);
                  setUnknownCode("");
                  setManualCode("");
                  setUnitCost("");
                  setLocked(false);
                  setMessage("");
                }}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Scanner autre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.flexBtn, { backgroundColor: colors.primary }, busy && { opacity: 0.6 }]}
                onPress={handleAddStock}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Ajouter stock</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : unknownCode ? (
          <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.foundHeader}>
              <View style={[styles.foundIcon, { backgroundColor: colors.warning + "18" }]}>
                <Feather name="alert-triangle" size={22} color={colors.warning} />
              </View>
              <View style={styles.foundInfo}>
                <Text style={[styles.manualTitle, { color: colors.text }]}>Produit introuvable</Text>
                <Text style={[styles.manualText, { color: colors.mutedForeground }]}>Code scanne : {unknownCode}</Text>
              </View>
            </View>
            {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
            <View style={styles.foundActions}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => {
                  setUnknownCode("");
                  setManualCode("");
                  setLocked(false);
                  setMessage("");
                }}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Scanner encore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.flexBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.replace({ pathname: "/product/add", params: { barcode: unknownCode } })}
              >
                <Text style={styles.primaryBtnText}>Ajouter produit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.manualCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.manualTitle, { color: colors.text }]}>Saisie manuelle</Text>
            <Text style={[styles.manualText, { color: colors.mutedForeground }]}>Utile si la camera ne lit pas bien le code.</Text>
            <ScanInput colors={colors} icon="hash" placeholder="Ex: 6181000000000" value={manualCode} onChangeText={setManualCode} />
            {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }, (!manualCode.trim() || busy) && { opacity: 0.5 }]}
              onPress={() => handleCode(manualCode)}
              disabled={!manualCode.trim() || busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Continuer</Text>}
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ height: bottomPad }} />
    </View>
  );

}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14, flexGrow: 1 },
  scanCard: { height: 320, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  permissionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  permissionText: { fontSize: 14, textAlign: "center", lineHeight: 20, fontFamily: "Inter_400Regular" },
  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  scanFrame: { position: "absolute", left: 52, right: 52, top: 62, bottom: 62, borderWidth: 3, borderColor: "#fff", borderRadius: 16 },
  torchBtn: { position: "absolute", top: 14, right: 14, minHeight: 38, borderRadius: 999, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, backgroundColor: "rgba(0,0,0,0.45)" },
  torchBtnActive: { backgroundColor: "rgba(5,150,105,0.85)" },
  torchText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold", fontWeight: "700" },
  scanHint: { position: "absolute", left: 16, right: 16, bottom: 18, alignItems: "center" },
  scanHintText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  manualCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  manualTitle: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  manualText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  foundCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  foundHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  foundIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  foundInfo: { flex: 1, gap: 2 },
  foundName: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  foundMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  quickQtyRow: { flexDirection: "row", gap: 8 },
  quickQtyBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  quickQtyText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  foundActions: { flexDirection: "row", gap: 10 },
  flexBtn: { flex: 1 },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  message: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "500" },
  primaryBtn: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  secondaryBtn: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
