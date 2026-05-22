import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useProducts } from "@/context/ProductsContext";
import { useColors } from "@/hooks/useColors";

const FILTERS = ["Tous", "Stock faible", "Boisson", "Alimentaire", "Menager"] as const;

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { products, isLoading } = useProducts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const lowStockCount = products.filter(product => product.stock <= product.alertThreshold).length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  const filtered = useMemo(() => {
    return products.filter(product => {
      const q = search.trim().toLowerCase();
      const category = product.category?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "";
      const haystack = [product.name, product.category, category, product.brand, product.format, product.barcode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = !q || haystack.includes(q);
      const matchFilter =
        filter === "Tous" ||
        (filter === "Stock faible"
          ? product.stock <= product.alertThreshold
          : category.toLowerCase() === filter.toLowerCase());
      return matchSearch && matchFilter;
    });
  }, [filter, products, search]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: colors.text }]}>Produits</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {products.length} produit{products.length > 1 ? "s" : ""} actif{products.length > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.inventoryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/inventory")}
              activeOpacity={0.85}
            >
              <Feather name="clipboard" size={19} color={colors.info} />
              <Text style={[styles.inventoryBtnText, { color: colors.info }]}>Inventaire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/product/scan")}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={19} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={() => router.push("/product/add")}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stockSummary}>
          <View style={[styles.summaryItem, { backgroundColor: colors.primary + "12" }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalStock}</Text>
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>stock total</Text>
          </View>
          <TouchableOpacity
            style={[styles.summaryItem, { backgroundColor: lowStockCount > 0 ? colors.warning + "14" : colors.success + "12" }]}
            onPress={() => setFilter("Stock faible")}
            activeOpacity={0.8}
          >
            <Text style={[styles.summaryValue, { color: lowStockCount > 0 ? colors.warning : colors.success }]}>{lowStockCount}</Text>
            <Text style={[styles.summaryLabel, { color: lowStockCount > 0 ? colors.warning : colors.success }]}>stock faible</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Nom, marque, format ou code-barres"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.catBtn,
                { borderColor: filter === item ? colors.primary : colors.border, backgroundColor: filter === item ? colors.primary : colors.card },
              ]}
              onPress={() => setFilter(item)}
              activeOpacity={0.75}
            >
              <Text style={[styles.catBtnText, { color: filter === item ? "#fff" : colors.mutedForeground }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultRow}>
          <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
            {filtered.length} resultat{filtered.length > 1 ? "s" : ""}
          </Text>
        </View>

        {isLoading ? (
          <SkeletonCard count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="package"
            title="Aucun produit"
            subtitle={search ? "Aucun resultat pour cette recherche" : "Ajoutez votre premier produit"}
            actionLabel={search ? undefined : "Ajouter un produit"}
            onAction={search ? undefined : () => router.push("/product/add")}
          />
        ) : (
          filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerCopy: { flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  inventoryBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", fontWeight: "700" },
  stockSummary: { flexDirection: "row", gap: 10 },
  summaryItem: { flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, gap: 2 },
  summaryValue: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  catScroll: { flexGrow: 0 },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  catBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  list: { flex: 1 },
  resultRow: { marginBottom: 10 },
  resultText: { fontSize: 12, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
