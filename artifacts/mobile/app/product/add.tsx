import { Feather } from "@expo/vector-icons";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

import { useProducts } from "@/context/ProductsContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Boisson", "Alimentaire", "Menager", "Hygiene", "Textile", "Electronique", "Autre"];

type FormInputProps = {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric";
};

function FormInput(props: FormInputProps) {
  return (
    <View style={[styles.inputBox, { backgroundColor: props.colors.card, borderColor: props.colors.border }]}>
      <Feather name={props.icon} size={17} color={props.colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: props.colors.text }]}
        placeholder={props.placeholder}
        placeholderTextColor={props.colors.mutedForeground}
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType ?? "default"}
      />
    </View>
  );
}

export default function AddProductScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { barcode: initialBarcode } = useLocalSearchParams<{ barcode?: string }>();
  const { createProduct } = useProducts();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState("");
  const [format, setFormat] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("5");
  const [barcode, setBarcode] = useState(initialBarcode ?? "");
  const [imageUri, setImageUri] = useState("");
  const [estimatedAveragePrice, setEstimatedAveragePrice] = useState("");
  const [showDetails, setShowDetails] = useState(!!initialBarcode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof initialBarcode === "string" && initialBarcode.trim()) {
      setBarcode(initialBarcode);
      setShowDetails(true);
    }
  }, [initialBarcode]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const margin = useMemo(() => {
    const buy = parseFloat(buyPrice);
    const sell = parseFloat(sellPrice);
    if (!buy || !sell) return null;
    return (((sell - buy) / buy) * 100).toFixed(0);
  }, [buyPrice, sellPrice]);

  async function copyImageToApp(uri: string) {
    const dir = new Directory(Paths.document, "product-images");
    dir.create({ intermediates: true, idempotent: true });
    const cleanUri = uri.split("?")[0];
    const extension = cleanUri.includes(".") ? cleanUri.split(".").pop() : "jpg";
    const destination = new File(dir, `${Date.now()}.${extension || "jpg"}`);
    new File(uri).copy(destination);
    return destination.uri;
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.72,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setImageUri(await copyImageToApp(result.assets[0].uri));
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera requise", "Autorisez la camera pour prendre une photo du produit.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.72,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setImageUri(await copyImageToApp(result.assets[0].uri));
    }
  }

  async function handleSave() {
    const parsedSell = parseFloat(sellPrice);
    const parsedStock = parseInt(stock || "0", 10);

    if (!name.trim()) return setError("Nom du produit requis");
    if (!Number.isFinite(parsedSell) || parsedSell <= 0) return setError("Prix de vente invalide");
    if (!Number.isFinite(parsedStock) || parsedStock < 0) return setError("Stock invalide");

    setError("");
    setLoading(true);
    try {
      await createProduct({
        name,
        category,
        brand,
        format,
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parsedSell,
        stock: parsedStock,
        alertThreshold: parseInt(alertThreshold || "5", 10) || 0,
        barcode,
        imageUri,
        estimatedAveragePrice: parseFloat(estimatedAveragePrice) || parseFloat(buyPrice) || 0,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Nouveau produit</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, (!name.trim() || !sellPrice) && { opacity: 0.45 }]}
            onPress={handleSave}
            disabled={loading || !name.trim() || !sellPrice}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Sauver</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.assistantCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.assistantHeader}>
              <View style={[styles.assistantIcon, { backgroundColor: colors.primary + "16" }]}>
                <Feather name="zap" size={20} color={colors.primary} />
              </View>
              <View style={styles.assistantText}>
                <Text style={[styles.assistantTitle, { color: colors.text }]}>Ajout rapide</Text>
                <Text style={[styles.assistantSubtitle, { color: colors.mutedForeground }]}>
                  Remplissez juste le necessaire. Les details peuvent attendre.
                </Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]} onPress={() => router.replace("/product/scan")}>
                <Feather name="camera" size={17} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Scanner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]} onPress={() => setShowDetails(value => !value)}>
                <Feather name={showDetails ? "chevron-up" : "sliders"} size={17} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>{showDetails ? "Masquer" : "Details"}</Text>
              </TouchableOpacity>
            </View>
            {barcode ? (
              <View style={[styles.barcodeBadge, { backgroundColor: colors.primary + "12" }]}>
                <Feather name="hash" size={14} color={colors.primary} />
                <Text style={[styles.barcodeBadgeText, { color: colors.primary }]}>Code : {barcode}</Text>
              </View>
            ) : null}
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}>
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Informations</Text>
            <FormInput colors={colors} icon="package" placeholder="Nom du produit" value={name} onChangeText={setName} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Photo</Text>
            <View style={[styles.photoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              ) : (
                <View style={[styles.photoPreview, styles.photoEmpty, { backgroundColor: colors.muted }]}>
                  <Feather name="image" size={24} color={colors.mutedForeground} />
                </View>
              )}
              <View style={styles.photoActions}>
                <TouchableOpacity style={[styles.photoBtn, { borderColor: colors.border }]} onPress={takePhoto}>
                  <Feather name="camera" size={16} color={colors.primary} />
                  <Text style={[styles.photoBtnText, { color: colors.primary }]}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.photoBtn, { borderColor: colors.border }]} onPress={pickImage}>
                  <Feather name="image" size={16} color={colors.primary} />
                  <Text style={[styles.photoBtnText, { color: colors.primary }]}>Galerie</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Stock</Text>
            <FormInput colors={colors} icon="layers" placeholder="Stock initial" value={stock} onChangeText={setStock} keyboardType="numeric" />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Tarification</Text>
            <View style={styles.twoCols}>
              <FormInput colors={colors} icon="arrow-down-circle" placeholder="Prix achat" value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" />
              <FormInput colors={colors} icon="tag" placeholder="Prix vente" value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" />
            </View>
            {margin !== null && (
              <View style={[styles.marginBox, { backgroundColor: parseFloat(margin) >= 0 ? colors.success + "12" : colors.destructive + "12" }]}>
                <Feather name="trending-up" size={14} color={parseFloat(margin) >= 0 ? colors.success : colors.destructive} />
                <Text style={[styles.marginText, { color: parseFloat(margin) >= 0 ? colors.success : colors.destructive }]}>
                  Marge : {margin}% - Benefice : {(parseFloat(sellPrice || "0") - parseFloat(buyPrice || "0")).toLocaleString()} FCFA/unite
                </Text>
              </View>
            )}
          </View>

          {showDetails && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Details optionnels</Text>
              <View style={styles.twoCols}>
                <FormInput colors={colors} icon="award" placeholder="Marque" value={brand} onChangeText={setBrand} />
                <FormInput colors={colors} icon="box" placeholder="Format" value={format} onChangeText={setFormat} />
              </View>
              <View style={styles.twoCols}>
                <FormInput colors={colors} icon="alert-triangle" placeholder="Seuil alerte" value={alertThreshold} onChangeText={setAlertThreshold} keyboardType="numeric" />
                <FormInput colors={colors} icon="activity" placeholder="Prix moyen" value={estimatedAveragePrice} onChangeText={setEstimatedAveragePrice} keyboardType="numeric" />
              </View>
              <FormInput colors={colors} icon="hash" placeholder="Code-barres manuel" value={barcode} onChangeText={setBarcode} keyboardType="numeric" />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Categorie</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(item => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.catBtn,
                    { borderColor: category === item ? colors.primary : colors.border, backgroundColor: category === item ? colors.primary + "12" : colors.card },
                  ]}
                  onPress={() => setCategory(item)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catBtnText, { color: category === item ? colors.primary : colors.mutedForeground }]}>{item}</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600", color: "#fff" },
  form: { padding: 16, gap: 20 },
  assistantCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
  assistantHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  assistantIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  assistantText: { flex: 1, gap: 2 },
  assistantTitle: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  assistantSubtitle: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  actionText: { fontSize: 13, fontFamily: "Inter_700Bold", fontWeight: "700" },
  barcodeBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  barcodeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600", textTransform: "uppercase" },
  photoBox: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  photoPreview: { width: 64, height: 64, borderRadius: 12 },
  photoEmpty: { alignItems: "center", justifyContent: "center" },
  photoActions: { flex: 1, gap: 8 },
  photoBtn: { minHeight: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  photoBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", fontWeight: "700" },
  inputBox: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  twoCols: { flexDirection: "row", gap: 10 },
  marginBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10 },
  marginText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500", flex: 1 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  catBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
