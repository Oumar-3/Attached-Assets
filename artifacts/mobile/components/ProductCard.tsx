import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { ProductRecord } from "@/models";

type Props = {
  product: ProductRecord;
  onPress: () => void;
};

export function ProductCard({ product, onPress }: Props) {
  const colors = useColors();
  const isLow = product.stock <= product.alertThreshold;
  const profit = product.sellPrice - product.buyPrice;
  const stockLabel = isLow ? "Stock bas" : "En stock";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {product.imageUri ? (
        <Image source={{ uri: product.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "16" }]}>
          <Feather name="package" size={22} color={colors.primary} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]} numberOfLines={1}>
          {[product.category, product.brand, product.format].filter(Boolean).join(" / ")}
        </Text>
        <View style={styles.row}>
          <Text style={[styles.price, { color: colors.primary }]}>{product.sellPrice.toLocaleString()} FCFA</Text>
          <Text style={[styles.profit, { color: profit >= 0 ? colors.success : colors.destructive }]}>
            {profit >= 0 ? "+" : ""}
            {profit.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: isLow ? colors.destructive + "18" : colors.primary + "12" }]}>
          <Text style={[styles.badgeText, { color: isLow ? colors.destructive : colors.primary }]}>{product.stock}</Text>
        </View>
        <View style={styles.stockStatus}>
          {isLow ? <Feather name="alert-triangle" size={12} color={colors.warning} /> : null}
          <Text style={[styles.stockLabel, { color: isLow ? colors.warning : colors.mutedForeground }]}>{stockLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: 50, height: 50, borderRadius: 11, backgroundColor: "#F1F5F9" },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  category: { fontSize: 12, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  profit: { fontSize: 12, fontFamily: "Inter_500Medium" },
  right: { alignItems: "flex-end", gap: 5 },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 36,
    alignItems: "center",
  },
  badgeText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stockStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  stockLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
});
