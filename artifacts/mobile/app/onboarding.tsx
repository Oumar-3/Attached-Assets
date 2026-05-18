import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const ONBOARDING_KEY = "@boutique_onboarding_seen";
const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "package" as const,
    title: "Gérez votre stock",
    subtitle: "Suivez tous vos produits, prix et quantités. Recevez des alertes avant d'être en rupture.",
    color: "#00A86B",
  },
  {
    id: "2",
    icon: "shopping-cart" as const,
    title: "Ventes ultra rapides",
    subtitle: "Interface caisse pensée pour aller vite. Ajoutez des articles, calculez le total, encaissez.",
    color: "#F59E0B",
  },
  {
    id: "3",
    icon: "users" as const,
    title: "Suivez vos clients",
    subtitle: "Enregistrez les dettes, suivez les remboursements et gardez le contrôle de votre argent.",
    color: "#3B82F6",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/(auth)/login");
  }

  function next() {
    if (current < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(c => c + 1);
    } else {
      finish();
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[SLIDES[current].color + "20", colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, paddingTop: topPad + 60 }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + "20", borderColor: item.color + "30" }]}>
              <View style={[styles.iconInner, { backgroundColor: item.color }]}>
                <Feather name={item.icon} size={40} color="#fff" />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
          </View>
        )}
        keyExtractor={i => i.id}
      />

      <View style={[styles.footer, { paddingBottom: bottomPad + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === current ? SLIDES[current].color : colors.border },
                i === current ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: SLIDES[current].color }]}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {current === SLIDES.length - 1 ? "Commencer" : "Suivant"}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>

        {current < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} style={styles.skip}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    gap: 20,
    alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  skip: { paddingVertical: 4 },
  skipText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
