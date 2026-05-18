import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const ONBOARDING_KEY = "@boutique_onboarding_seen";
const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "package" as const,
    title: "Gérez votre\nstock",
    subtitle: "Suivez tous vos produits et recevez des alertes avant d'être en rupture de stock.",
    gradient: ["#00D97E", "#00A86B"] as [string, string],
    bg: "#000E07",
  },
  {
    id: "2",
    icon: "shopping-cart" as const,
    title: "Ventes ultra\nrapides",
    subtitle: "Interface caisse pensée pour aller vite. Ajoutez, calculez, encaissez en 3 secondes.",
    gradient: ["#F59E0B", "#D97706"] as [string, string],
    bg: "#0D0900",
  },
  {
    id: "3",
    icon: "users" as const,
    title: "Suivez vos\nclients",
    subtitle: "Enregistrez les dettes, suivez les remboursements. Gardez le contrôle de votre argent.",
    gradient: ["#60A5FA", "#3B82F6"] as [string, string],
    bg: "#00050F",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const slide = SLIDES[current];

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/(auth)/login");
  }

  function next() {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    if (current < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(c => c + 1);
    } else {
      finish();
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient
              colors={[item.bg, "#000000"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.iconArea, { paddingTop: topPad + 60 }]}>
              <View style={styles.iconRing}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name={item.icon} size={44} color="#000" />
                </LinearGradient>
              </View>
              <View style={[styles.glowDot, { backgroundColor: item.gradient[0] }]} />
            </View>
          </View>
        )}
        keyExtractor={i => i.id}
      />

      <View style={[styles.content, { paddingBottom: bottomPad + 40, backgroundColor: "transparent" }]}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.label}>0{current + 1} / 0{SLIDES.length}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === current ? s.gradient[0] : "#333",
                    width: i === current ? 28 : 8,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.footerRow}>
            {current < SLIDES.length - 1 && (
              <TouchableOpacity onPress={finish} style={styles.skipBtn}>
                <Text style={styles.skipText}>Passer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={next}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={slide.gradient}
                style={styles.nextGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {current === SLIDES.length - 1 ? (
                  <Text style={styles.nextText}>Commencer</Text>
                ) : (
                  <Feather name="arrow-right" size={22} color="#000" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: { flex: 1, alignItems: "center" },
  iconArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  glowDot: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.08,
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    gap: 28,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    color: "#555",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 46,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#666",
    lineHeight: 24,
  },
  footer: { gap: 20 },
  dots: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 4 },
  skipText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#555" },
  nextBtn: {
    marginLeft: "auto",
    borderRadius: 50,
    overflow: "hidden",
  },
  nextGradient: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  nextText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: "#000",
  },
});
