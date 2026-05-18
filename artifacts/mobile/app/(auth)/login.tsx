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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin() {
    if (!email.trim() || !password) return setError("Remplissez tous les champs");
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.root, { backgroundColor: "#000" }]}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.top, { paddingTop: topPad + 48 }]}>
          <LinearGradient
            colors={[colors.primary + "30", "transparent"]}
            style={styles.topGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.logoBox}
          >
            <Feather name="shopping-bag" size={28} color="#000" />
          </LinearGradient>
          <Text style={styles.appName}>BoutiqueApp</Text>
          <Text style={styles.tagline}>Gérez votre boutique</Text>
        </View>

        <View style={[styles.form, { paddingBottom: bottomPad + 32 }]}>
          <Text style={styles.welcomeTitle}>Bon retour 👋</Text>
          <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
            Connectez-vous pour continuer
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="votre@email.com"
                  placeholderTextColor="#444"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Mot de passe</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#444"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={18} color="#555" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnWrap, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.btn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.btnText}>Se connecter</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.divider, { borderColor: colors.border }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.75}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    alignItems: "center",
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 10,
    position: "relative",
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#555",
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 18,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  welcomeSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  fields: { gap: 14 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  btnWrap: { marginTop: 4 },
  btn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  secondaryBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
