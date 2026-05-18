import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Tous", "Alimentaire", "Boisson", "Hygiène", "Textile", "Électronique", "Autre"];

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, isLoading } = useStore();

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tous");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = cat === "Tous" || p.category === cat;
      return matchSearch && matchCat;
    });
  }, [products, search, cat]);

  const lowStockCount = products.filter(p => p.quantity <= 5).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Stock</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {products.length} produit{products.length !== 1 ? "s" : ""}
              {lowStockCount > 0 ? ` · ${lowStockCount} alerte${lowStockCount > 1 ? "s" : ""}` : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/product/add")}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addBtnInner}>
              <Feather name="plus" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={17} color="#444" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher..."
            placeholderTextColor="#444"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="#555" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.catChip,
                cat === c
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setCat(c)}
              activeOpacity={0.75}
            >
              <Text style={[styles.catChipText, { color: cat === c ? "#000" : colors.mutedForeground }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <SkeletonCard count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="package"
            title="Aucun produit"
            subtitle={search ? "Aucun résultat pour cette recherche" : "Ajoutez votre premier produit"}
            actionLabel={search ? undefined : "Ajouter un produit"}
            onAction={search ? undefined : () => router.push("/product/add")}
          />
        ) : (
          filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  addBtn: { borderRadius: 22 },
  addBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  catScroll: { flexGrow: 0 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500" },
  divider: { height: 1, marginHorizontal: 0 },
  list: { flex: 1 },
});
