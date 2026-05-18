import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Product } from '@/types';

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
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
        <Feather name="package" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{product.category}</Text>
        <View style={styles.row}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {product.sellPrice.toLocaleString()} FCFA
          </Text>
          <Text style={[styles.profit, { color: colors.success }]}>
            +{profit.toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: isLow ? colors.destructive + '18' : colors.primary + '12' }]}>
          <Text style={[styles.badgeText, { color: isLow ? colors.destructive : colors.primary }]}>
            {product.quantity}
          </Text>
        </View>
        {isLow && (
          <Feather name="alert-triangle" size={14} color={colors.warning} style={styles.alert} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  category: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  price: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  profit: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  right: { alignItems: 'center', gap: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 36,
    alignItems: 'center',
  },
  badgeText: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  alert: { marginTop: 2 },
});
