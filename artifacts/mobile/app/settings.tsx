import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isDark = colorScheme === "dark";

  type SettingSection = {
    title: string;
    items: Array<{ icon: keyof typeof Feather.glyphMap; label: string; value?: string; toggle?: boolean; toggled?: boolean }>;
  };

  const sections: SettingSection[] = [
    {
      title: "Apparence",
      items: [
        { icon: "moon", label: "Mode sombre", toggle: true, toggled: isDark },
        { icon: "globe", label: "Langue", value: "Français" },
        { icon: "dollar-sign", label: "Devise", value: "FCFA" },
      ],
    },
    {
      title: "Stock",
      items: [
        { icon: "alert-triangle", label: "Seuil d'alerte stock", value: "5 unités" },
        { icon: "bell", label: "Alertes actives", toggle: true, toggled: true },
      ],
    },
    {
      title: "Données",
      items: [
        { icon: "download", label: "Exporter les données", value: "CSV" },
        { icon: "refresh-cw", label: "Sauvegarder", value: "Local" },
      ],
    },
    {
      title: "À propos",
      items: [
        { icon: "info", label: "Version", value: "1.0.0" },
        { icon: "shield", label: "Politique de confidentialité" },
        { icon: "help-circle", label: "Support" },
      ],
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {section.items.map((item, idx) => (
                <View
                  key={item.label}
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                    idx === section.items.length - 1 ? styles.lastRow : null,
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors.primary + "12" }]}>
                    <Feather name={item.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                  {item.toggle ? (
                    <Switch
                      value={!!item.toggled}
                      thumbColor="#fff"
                      trackColor={{ false: colors.border, true: colors.primary }}
                      onValueChange={() => {}}
                    />
                  ) : item.value ? (
                    <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{item.value}</Text>
                  ) : (
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700", textAlign: "center" },
  body: { padding: 16, gap: 20 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  lastRow: { borderBottomWidth: 0 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", fontWeight: "500" },
  rowValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
