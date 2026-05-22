import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = { count?: number };

function ShimmerBar({ width, height = 16, colors }: { width: DimensionValue; height?: number; colors: ReturnType<typeof useColors> }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: colors.muted, opacity },
      ]}
    />
  );
}

function SkeletonItem({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ShimmerBar width={44} height={44} colors={colors} />
      <View style={styles.info}>
        <ShimmerBar width="60%" height={14} colors={colors} />
        <ShimmerBar width="40%" height={11} colors={colors} />
        <ShimmerBar width="50%" height={12} colors={colors} />
      </View>
      <ShimmerBar width={36} height={28} colors={colors} />
    </View>
  );
}

export function SkeletonCard({ count = 5 }: Props) {
  const colors = useColors();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} colors={colors} />
      ))}
    </>
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
    gap: 12,
  },
  info: { flex: 1, gap: 6 },
});
