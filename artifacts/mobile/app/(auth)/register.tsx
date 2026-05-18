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

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleRegister() {
    if (!name.trim() || !shopName.trim() || !email.trim() || !password)
      return setError("Remplissez tous les champs");
    if (password.length < 6) return setError("Mot de passe trop court (min 6 caractères)");
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, shopName);
      router.replace("/(tabs)/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  }

  const FIELDS = [
    { label: "Votre nom", placeholder: "Amadou Diallo", value: name, set: setName, icon: "user" as const, kb: "default" as const, auto: "words" as const },
    { label: "Nom de la boutique", placeholder: "Boutique Diallo", value: shopName, set: setShopName, icon: "shopping-bag" as const, kb: "default" as const, auto: "words" as const },
    { label: "Email", placeholder: "votre@email.com", value: email, set: setEmail, icon: "mail" as const, kb: "email-address" as const, auto: "none" as const },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.root, { backgroundColor: "#000" }]}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.topBar, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.form, { paddingBottom: bottomPad + 24 }]}>
          <View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Gérez votre boutique dès maintenant
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fields}>
            {FIELDS.map(f => (
              <View key={f.label}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name={f.icon} size={16} color="#444" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder={f.placeholder}
                    placeholderTextColor="#444"
                    value={f.value}
                    onChangeText={f.set}
                    keyboardType={f.kb}
                    autoCapitalize={f.auto}
                  />
                </View>
              </View>
            ))}
            <View>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Mot de passe</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={16} color="#444" />
                <TextInput
                  style={[styles.input, { color: colors.text, flex: 1 }]}
                  placeholder="Min. 6 caractères"
                  placeholderTextColor="#444"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
                <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={16} color="#555" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnWrap, (loading || !name.trim() || !shopName.trim() || !email.trim() || !password) && { opacity: 0.5 }]}
            onPress={handleRegister}
            disabled={loading || !name.trim() || !shopName.trim() || !email.trim() || !password}
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
                <Text style={styles.btnText}>Créer mon compte</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  form: { paddingHorizontal: 24, paddingTop: 12, gap: 20 },
  title: { fontSize: 30, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#fff" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6 },
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
    gap: 12,
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
  btnText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#000" },
});
