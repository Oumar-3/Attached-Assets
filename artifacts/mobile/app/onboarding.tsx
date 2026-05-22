import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SamaStockLogo } from "@/components/SamaStockLogo";
import { useAuth } from "@/context/AuthContext";
import { useShopProfile } from "@/context/ShopProfileContext";
import { useColors } from "@/hooks/useColors";
import { createLocalMainShopForCloudUserAsync, enableOfflineModeAsync } from "@/services/localAccountData";

type FieldName = "shopName" | "ownerName" | "phone" | "address";

const FIELDS: Array<{
  name: FieldName;
  label: string;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  keyboardType?: "default" | "phone-pad";
}> = [
  { name: "shopName", label: "Nom de la boutique", placeholder: "Ex: Boutique Awa", icon: "shopping-bag" },
  { name: "ownerName", label: "Proprietaire", placeholder: "Votre nom", icon: "user" },
  { name: "phone", label: "Telephone", placeholder: "77 000 00 00", icon: "phone", keyboardType: "phone-pad" },
  { name: "address", label: "Adresse ou quartier", placeholder: "Ex: Medina, Dakar", icon: "map-pin" },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { saveProfile } = useShopProfile();
  const { user } = useAuth();

  const isLoggedInWithoutProfile = !!user;

  const [form, setForm] = useState<Record<FieldName, string>>({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOfflineForm, setShowOfflineForm] = useState(false);

  // Pre-fill form if user is logged in
  React.useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        shopName: user.shopName || prev.shopName,
        ownerName: user.name || prev.ownerName,
      }));
    }
  }, [user]);

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const shellWidth = Platform.OS === "web" ? Math.min(Math.max(width - 32, 320), 760) : undefined;

  function updateField(name: FieldName, value: string) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleStart() {
    if (!form.shopName.trim()) return setError("Le nom de la boutique est requis");
    if (!form.ownerName.trim()) return setError("Le nom du proprietaire est requis");

    setError("");
    setSaving(true);
    try {
      if (user) {
        // Create local shop linked to user ID
        await createLocalMainShopForCloudUserAsync(user.id, form.shopName, form.ownerName);
      } else {
        await enableOfflineModeAsync();
      }
      await saveProfile(form);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de sauvegarder la boutique");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, shellWidth ? { width: shellWidth } : null]}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
            <View style={styles.logo}>
              <SamaStockLogo size={44} />
            </View>
            <Text style={styles.appName}>SamaStock</Text>
            <Text style={styles.heroText}>Votre boutique, vos produits et vos ventes au meme endroit.</Text>
          </LinearGradient>

          {!isLoggedInWithoutProfile && (
            <View style={[styles.cloudCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cloudText}>
                <Text style={[styles.cloudTitle, { color: colors.text }]}>Commencer</Text>
                <Text style={[styles.cloudSubtitle, { color: colors.mutedForeground }]}>
                  Creez votre compte pour retrouver vos donnees plus tard.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cloudBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(auth)/register")}
                activeOpacity={0.85}
              >
                <Feather name="user-plus" size={18} color="#fff" />
                <Text style={styles.cloudBtnText}>Creer mon compte</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginBtn, { borderColor: colors.border }]}
                onPress={() => router.push("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginBtnText, { color: colors.primary }]}>J'ai deja un compte</Text>
              </TouchableOpacity>
            </View>
          )}

          {(!isLoggedInWithoutProfile && !showOfflineForm) ? (
            <TouchableOpacity style={styles.offlineLink} onPress={() => setShowOfflineForm(true)} activeOpacity={0.75}>
              <Text style={[styles.offlineLinkText, { color: colors.mutedForeground }]}>Essayer sans compte</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.form, styles.offlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isLoggedInWithoutProfile ? "Configurer votre boutique" : "Votre boutique"}
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {isLoggedInWithoutProfile 
                    ? "Ces informations seront sauvegardées sur votre compte." 
                    : "Ces informations restent sur ce telephone."}
                </Text>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + "14" }]}>
                  <Feather name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              ) : null}

              {FIELDS.map(field => (
                <View key={field.name} style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>{field.label}</Text>
                  <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Feather name={field.icon} size={18} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={form[field.name]}
                      onChangeText={value => updateField(field.name, value)}
                      keyboardType={field.keyboardType ?? "default"}
                      autoCapitalize={field.name === "phone" ? "none" : "words"}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.75 }]}
                onPress={handleStart}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Entrer dans l'app</Text>}
                {!saving && <Feather name="arrow-right" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { alignItems: "center", paddingHorizontal: 16 },
  shell: { width: "100%", gap: 18 },
  hero: {
    borderRadius: 22,
    padding: 24,
    gap: 12,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 8,
  },
  appName: { fontSize: 32, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroText: { fontSize: 15, lineHeight: 22, color: "rgba(255,255,255,0.86)", fontFamily: "Inter_400Regular" },
  form: { gap: 16 },
  offlineCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular", marginTop: 4 },
  cloudCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  cloudText: { gap: 4 },
  cloudTitle: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" },
  cloudSubtitle: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  cloudBtn: {
    minHeight: 50,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  cloudBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  loginBtn: { minHeight: 46, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  loginBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  offlineLink: { alignItems: "center", paddingVertical: 4 },
  offlineLinkText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  field: { gap: 7 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 11,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  primaryBtn: {
    minHeight: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
