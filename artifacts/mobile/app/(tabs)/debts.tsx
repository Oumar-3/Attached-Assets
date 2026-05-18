import { Feather } from "@expo/vector-icons";
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
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Clients</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowAdd(s => !s)}
            activeOpacity={0.85}
          >
            <Feather name={showAdd ? "x" : "plus"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {totalDebt > 0 && (
          <View style={[styles.debtBanner, { backgroundColor: colors.destructive + "12", borderColor: colors.destructive + "25" }]}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.debtBannerText, { color: colors.destructive }]}>
              Total des dettes : <Text style={{ fontFamily: "Inter_700Bold", fontWeight: "700" }}>{totalDebt.toLocaleString()} FCFA</Text>
            </Text>
          </View>
        )}

        {showAdd && (
          <View style={[styles.addForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.addFormTitle, { color: colors.text }]}>Nouveau client</Text>
            <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Nom du client"
                placeholderTextColor={colors.mutedForeground}
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Téléphone (optionnel)"
                placeholderTextColor={colors.mutedForeground}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.addFormBtn, { backgroundColor: colors.primary }, adding && { opacity: 0.7 }]}
              onPress={handleAdd}
              disabled={adding || !newName.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.addFormBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un client..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", fontWeight: "700" },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  debtBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  debtBannerText: { fontSize: 13, fontFamily: "Inter_500Medium", fontWeight: "500", flex: 1 },
  addForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  addFormTitle: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  addFormBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addFormBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  list: { flex: 1 },
});
