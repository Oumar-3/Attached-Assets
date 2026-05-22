import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  subtitle?: string;
};

export function StatCard({ title, value, icon, color, subtitle }: Props) {
  const colors = useColors();
  const accent = color ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.mutedForeground }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.iconBox, { backgroundColor: accent + '16' }]}>
          <Feather name={icon} size={17} color={accent} />
        </View>
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 7,
    flex: 1,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 23,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  title: {
    fontSize: 12,
    flex: 1,
    fontFamily: 'Inter_400Regular',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
