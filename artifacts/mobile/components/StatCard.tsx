import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

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
      <View style={[styles.iconBox, { backgroundColor: accent + "20" }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 5,
    flex: 1,
    minWidth: 140,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  title: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    marginTop: 1,
  },
});
