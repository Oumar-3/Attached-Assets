import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Product } from "@/types";

type Props = {
  product: Product;
  onPress: () => void;
};

export function ProductCard({ product, onPress }: Props) {
  const colors = useColors();
  const isLow = product.quantity <= 5;
  const profit = product.sellPrice - product.buyPrice;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: isLow ? colors.warning + "40" : colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
        <Feather name="package" size={20} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{product.category}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>{product.sellPrice.toLocaleString()} F</Text>
          {profit > 0 && (
            <View style={[styles.profitBadge, { backgroundColor: colors.success + "15" }]}>
              <Text style={[styles.profitText, { color: colors.success }]}>+{profit.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <View style={[
          styles.stockBadge,
          { backgroundColor: isLow ? colors.warning + "20" : colors.muted },
        ]}>
          <Text style={[styles.stockNum, { color: isLow ? colors.warning : colors.mutedForeground }]}>
            {product.quantity}
          </Text>
          <Text style={[styles.stockLabel, { color: isLow ? colors.warning : colors.mutedForeground }]}>unités</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  category: { fontSize: 12, fontFamily: "Inter_400Regular" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  profitBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  profitText: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
  right: { alignItems: "center" },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 48,
  },
  stockNum: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stockLabel: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 1 },
});
