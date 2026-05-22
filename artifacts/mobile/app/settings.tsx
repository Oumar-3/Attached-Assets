import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { SamaStockLogo } from "@/components/SamaStockLogo";
import { useAuth } from "@/context/AuthContext";
import { useDebts } from "@/context/DebtsContext";
import { useProducts } from "@/context/ProductsContext";
import { useSales } from "@/context/SalesContext";
import { useShopProfile } from "@/context/ShopProfileContext";
import { useColors } from "@/hooks/useColors";

type FieldName = "shopName" | "ownerName" | "phone" | "address";

const FIELDS: Array<{
  name: FieldName;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: "default" | "phone-pad";
}> = [
  { name: "shopName", label: "Nom de la boutique", icon: "shopping-bag" },
  { name: "ownerName", label: "Proprietaire", icon: "user" },
  { name: "phone", label: "Telephone", icon: "phone", keyboardType: "phone-pad" },
  { name: "address", label: "Adresse / quartier", icon: "map-pin" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isLoading, saveProfile, refreshProfile } = useShopProfile();
  const { user, isConfigured, logout } = useAuth();
  const { refreshProducts } = useProducts();
  const { refreshSales } = useSales();
  const { refreshDebts } = useDebts();

  const [form, setForm] = useState<Record<FieldName, string>>({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (profile) {
      setForm({
        shopName: profile.shopName,
        ownerName: profile.ownerName,
        phone: profile.phone,
        address: profile.address,
      });
    }
  }, [profile]);

  function updateField(name: FieldName, value: string) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    if (!form.shopName.trim()) {
      Alert.alert("Champ requis", "Le nom de la boutique est obligatoire.");
      return;
    }
    if (!form.ownerName.trim()) {
      Alert.alert("Champ requis", "Le nom du proprietaire est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      await saveProfile(form);
      Alert.alert("Profil enregistre", "Les informations de la boutique ont ete mises a jour.");
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Impossible de se deconnecter.");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.muted }]}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Parametres</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.brandCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary + "18" }]}>
              <SamaStockLogo size={36} />
            </View>
            <View style={styles.brandText}>
              <Text style={[styles.brandName, { color: colors.text }]}>SamaStock</Text>
              <Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>
                {user ? "Compte connecte et sauvegarde automatique" : "Mode local sur ce telephone"}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Profil boutique</Text>
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                FIELDS.map(field => (
                  <View key={field.name} style={styles.field}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>{field.label}</Text>
                    <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Feather name={field.icon} size={17} color={colors.mutedForeground} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={form[field.name]}
                        onChangeText={value => updateField(field.name, value)}
                        placeholder={field.label}
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType={field.keyboardType ?? "default"}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.75 }]}
            onPress={handleSave}
            disabled={saving || isLoading}
            activeOpacity={0.85}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Feather name="save" size={18} color="#fff" />}
            {!saving && <Text style={styles.saveBtnText}>Enregistrer</Text>}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Compte</Text>
            <View style={[styles.cloudCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cloudHeader}>
                <View style={[styles.cloudIcon, { backgroundColor: colors.primary + "16" }]}>
                  <Feather name={user ? "cloud" : "log-in"} size={20} color={colors.primary} />
                </View>
                <View style={styles.cloudText}>
                  <Text style={[styles.cloudTitle, { color: colors.text }]}>
                    {user ? "Compte connecte" : "Compte non connecte"}
                  </Text>
                  <Text style={[styles.cloudSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {user?.email ?? "Connectez-vous pour retrouver vos donnees sur un autre telephone."}
                  </Text>
                </View>
              </View>

              {user ? (
                <View style={[styles.notice, { backgroundColor: colors.success + "12", borderColor: colors.success + "25" }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.noticeText, { color: colors.success }]}>Sauvegarde automatique active.</Text>
                </View>
              ) : null}

              {user ? (
                <TouchableOpacity
                  style={[styles.logoutBtn, { borderColor: colors.destructive + "45", backgroundColor: colors.destructive + "10" }]}
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <Feather name="log-out" size={18} color={colors.destructive} />
                  <Text style={[styles.logoutBtnText, { color: colors.destructive }]}>Deconnexion</Text>
                </TouchableOpacity>
              ) : null}

              {!isConfigured ? (
                <View style={[styles.notice, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "25" }]}>
                  <Feather name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={[styles.noticeText, { color: colors.destructive }]}>La sauvegarde en ligne n'est pas disponible sur cette installation.</Text>
                </View>
              ) : null}

              {!user ? (
                <>
                  <TouchableOpacity
                    style={[styles.cloudBtn, { backgroundColor: colors.primary }, !isConfigured && { opacity: 0.55 }]}
                    onPress={() => router.push("/(auth)/login")}
                    disabled={!isConfigured}
                    activeOpacity={0.85}
                  >
                    <Feather name="log-in" size={18} color="#fff" />
                    <Text style={styles.cloudBtnText}>Se connecter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.border }]}
                    onPress={() => router.push("/(auth)/register")}
                    disabled={!isConfigured}
                  >
                    <Feather name="user-plus" size={18} color={colors.primary} />
                    <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Creer un compte</Text>
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Application</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <InfoRow label="Devise" value="FCFA" />
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <InfoRow label="Stockage" value={user ? "Local + sauvegarde compte" : "Local"} />
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <InfoRow label="Version" value="1.0.0" />
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );

  function InfoRow({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700", textAlign: "center" },
  body: { padding: 16, gap: 18 },
  brandCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  brandIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  brandText: { flex: 1, gap: 2 },
  brandName: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  brandSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { gap: 9 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600", textTransform: "uppercase", marginLeft: 4 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  field: { gap: 7 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  loadingBox: { padding: 24 },
  saveBtn: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  cloudCard: { borderRadius: 14, borderWidth: 1, padding: 15, gap: 12 },
  cloudHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cloudIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cloudText: { flex: 1, gap: 2 },
  cloudTitle: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  cloudSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: 12, padding: 11 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17, fontFamily: "Inter_500Medium", fontWeight: "500" },
  cloudBtn: { minHeight: 48, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  cloudBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  secondaryBtn: { minHeight: 46, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  secondaryBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  logoutBtn: { minHeight: 48, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9 },
  logoutBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  infoCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 14, gap: 12 },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { flexShrink: 1, textAlign: "right", fontSize: 14, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  infoDivider: { height: 1 },
});
