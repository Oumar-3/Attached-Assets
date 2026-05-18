import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Client } from "@/types";

type Props = {
  client: Client;
  onPress: () => void;
};

export function ClientCard({ client, onPress }: Props) {
  const colors = useColors();
  const hasDebt = client.totalDebt > 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: hasDebt ? colors.destructive + "30" : colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>
          {client.name.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{client.name}</Text>
        {client.phone ? (
          <View style={styles.phoneRow}>
            <Feather name="phone" size={11} color={colors.mutedForeground} />
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{client.phone}</Text>
          </View>
        ) : (
          <Text style={[styles.phone, { color: colors.mutedForeground }]}>Pas de numéro</Text>
        )}
      </View>
      <View style={styles.right}>
        {hasDebt ? (
          <>
            <Text style={[styles.debtAmount, { color: colors.destructive }]}>
              -{client.totalDebt.toLocaleString()}
            </Text>
            <Text style={[styles.debtLabel, { color: colors.mutedForeground }]}>FCFA</Text>
          </>
        ) : (
          <View style={[styles.clearBadge, { backgroundColor: colors.success + "15" }]}>
            <Feather name="check" size={12} color={colors.success} />
            <Text style={[styles.clearText, { color: colors.success }]}>Soldé</Text>
          </View>
        )}
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  phone: { fontSize: 12, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 2 },
  debtAmount: { fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
  debtLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  clearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  clearText: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
