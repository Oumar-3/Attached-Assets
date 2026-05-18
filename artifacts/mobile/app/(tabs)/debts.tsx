import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClientCard } from "@/components/ClientCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

export default function DebtsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clients, isLoading, addClient } = useStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(
    () => clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [clients, search],
  );

  const totalDebt = useMemo(() => clients.reduce((s, c) => s + c.totalDebt, 0), [clients]);
  const debtors = useMemo(() => clients.filter(c => c.totalDebt > 0).length, [clients]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addClient(newName.trim(), newPhone.trim() || undefined);
      setNewName("");
      setNewPhone("");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Clients</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {clients.length} client{clients.length !== 1 ? "s" : ""}
              {debtors > 0 ? ` · ${debtors} débiteur${debtors > 1 ? "s" : ""}` : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(s => !s)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={showAdd ? ["#333", "#222"] : [colors.primary, colors.primaryDark]}
              style={styles.addBtnInner}
            >
              <Feather name={showAdd ? "x" : "plus"} size={20} color={showAdd ? "#fff" : "#000"} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {totalDebt > 0 && (
          <View style={[styles.debtBanner, { backgroundColor: "#1A0000", borderColor: colors.destructive + "25" }]}>
            <View style={[styles.debtBannerIcon, { backgroundColor: colors.destructive + "20" }]}>
              <Feather name="trending-down" size={14} color={colors.destructive} />
            </View>
            <View style={styles.debtBannerText}>
              <Text style={[styles.debtBannerLabel, { color: colors.mutedForeground }]}>Dettes totales</Text>
              <Text style={[styles.debtBannerAmount, { color: colors.destructive }]}>
                {totalDebt.toLocaleString()} FCFA
              </Text>
            </View>
          </View>
        )}

        {showAdd && (
          <View style={[styles.addForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.addFormTitle, { color: colors.text }]}>Nouveau client</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="user" size={15} color="#444" />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nom du client"
                placeholderTextColor="#444"
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="phone" size={15} color="#444" />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Téléphone (optionnel)"
                placeholderTextColor="#444"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.addFormBtnWrap, (adding || !newName.trim()) && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={adding || !newName.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addFormBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.addFormBtnText}>Ajouter le client</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={17} color="#444" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un client..."
            placeholderTextColor="#444"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <SkeletonCard count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title="Aucun client"
            subtitle="Ajoutez vos clients pour suivre leurs dettes"
            actionLabel="Ajouter un client"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          filtered.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              onPress={() => router.push({ pathname: "/client/[id]", params: { id: c.id } })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  addBtn: { borderRadius: 22 },
  addBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  debtBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  debtBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  debtBannerText: { gap: 1 },
  debtBannerLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  debtBannerAmount: { fontSize: 20, fontFamily: "Inter_700Bold", fontWeight: "700" },
  addForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  addFormTitle: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  addFormBtnWrap: {},
  addFormBtn: { paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  addFormBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#000" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  list: { flex: 1 },
});
