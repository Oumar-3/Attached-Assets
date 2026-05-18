import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { Client } from '@/types';

type Props = {
  client: Client;
  onPress: () => void;
};

export function ClientCard({ client, onPress }: Props) {
  const colors = useColors();
  const hasDebt = client.totalDebt > 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>
          {client.name.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{client.name}</Text>
        {client.phone ? (
          <View style={styles.row}>
            <Feather name="phone" size={12} color={colors.mutedForeground} />
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{client.phone}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.debtAmount, { color: hasDebt ? colors.destructive : colors.success }]}>
          {hasDebt ? '-' : ''}{client.totalDebt.toLocaleString()}
        </Text>
        <Text style={[styles.debtLabel, { color: colors.mutedForeground }]}>FCFA</Text>
        {hasDebt && (
          <View style={[styles.debtBadge, { backgroundColor: colors.destructive + '15' }]}>
            <Text style={[styles.debtBadgeText, { color: colors.destructive }]}>Doit</Text>
          </View>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  right: { alignItems: 'flex-end', gap: 2 },
  debtAmount: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  debtLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  debtBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 2 },
  debtBadgeText: { fontSize: 10, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
