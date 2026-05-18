import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore } from "@/context/StoreContext";
import { useColors } from "@/hooks/useColors";

export default function ClientDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients, sales, payments, addPayment } = useStore();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const client = clients.find(c => c.id === id);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);

  if (!client) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[{ color: colors.mutedForeground, fontSize: 16 }]}>Client introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[{ color: colors.primary, fontSize: 15, marginTop: 8 }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const clientSales = sales.filter(s => s.clientId === id);
  const clientPayments = payments.filter(p => p.clientId === id);
  const totalPurchased = clientSales.reduce((s, x) => s + x.total, 0);
  const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);

  async function handlePayment() {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > client.totalDebt) {
      Alert.alert("Montant trop élevé", `La dette est de ${client.totalDebt.toLocaleString()} FCFA`);
      return;
    }
    setPaying(true);
    try {
      await addPayment(client.id, amount, payNote.trim() || undefined);
      setPayAmount("");
      setPayNote("");
      setShowPayForm(false);
    } finally {
      setPaying(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{client.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: client.totalDebt > 0 ? colors.destructive : colors.success }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>{client.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{client.name}</Text>
          {client.phone ? (
            <View style={styles.heroPhone}>
              <Feather name="phone" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroPhoneText}>{client.phone}</Text>
            </View>
          ) : null}
          <Text style={styles.heroDebtLabel}>Dette restante</Text>
          <Text style={styles.heroDebt}>{client.totalDebt.toLocaleString()} FCFA</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Achats totaux", value: `${(totalPurchased / 1000).toFixed(0)}k F`, color: colors.primary },
            { label: "Payé", value: `${(totalPaid / 1000).toFixed(0)}k F`, color: colors.success },
            { label: "Commandes", value: `${clientSales.length}`, color: colors.accent },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {client.totalDebt > 0 && (
          <View>
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: colors.success }]}
              onPress={() => setShowPayForm(s => !s)}
              activeOpacity={0.85}
            >
              <Feather name={showPayForm ? "x" : "check-circle"} size={18} color="#fff" />
              <Text style={styles.payBtnText}>{showPayForm ? "Annuler" : "Enregistrer un paiement"}</Text>
            </TouchableOpacity>
            {showPayForm && (
              <View style={[styles.payForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="dollar-sign" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Montant payé (FCFA)"
                    placeholderTextColor={colors.mutedForeground}
                    value={payAmount}
                    onChangeText={setPayAmount}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Feather name="message-circle" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Note (optionnel)"
                    placeholderTextColor={colors.mutedForeground}
                    value={payNote}
                    onChangeText={setPayNote}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.confirmPayBtn, { backgroundColor: colors.success }, paying && { opacity: 0.7 }]}
                  onPress={handlePayment}
                  disabled={paying || !payAmount}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmPayText}>Confirmer le paiement</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Historique achats</Text>
          {clientSales.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucun achat enregistré</Text>
            </View>
          ) : (
            clientSales.slice(0, 10).map(sale => (
              <View key={sale.id} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.histIcon, { backgroundColor: sale.type === "cash" ? colors.success + "18" : colors.warning + "18" }]}>
                  <Feather name={sale.type === "cash" ? "dollar-sign" : "credit-card"} size={14} color={sale.type === "cash" ? colors.success : colors.warning} />
                </View>
                <View style={styles.histInfo}>
                  <Text style={[styles.histItems, { color: colors.text }]}>{sale.items.length} article{sale.items.length > 1 ? "s" : ""}</Text>
                  <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
                    {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                <Text style={[styles.histAmount, { color: sale.type === "credit" ? colors.destructive : colors.text }]}>
                  {sale.total.toLocaleString()} F
                </Text>
              </View>
            ))
          )}
        </View>

        {clientPayments.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>Paiements reçus</Text>
            {clientPayments.slice(0, 8).map(p => (
              <View key={p.id} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.histIcon, { backgroundColor: colors.success + "18" }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                </View>
                <View style={styles.histInfo}>
                  <Text style={[styles.histItems, { color: colors.text }]}>{p.note ?? "Remboursement"}</Text>
                  <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                <Text style={[styles.histAmount, { color: colors.success }]}>+{p.amount.toLocaleString()} F</Text>
              </View>
            ))}
          </View>
        )}
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
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700", textAlign: "center" },
  body: { padding: 16, gap: 16 },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroInitials: { fontSize: 24, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroName: { fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroPhone: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroPhoneText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  heroDebtLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 8 },
  heroDebt: { fontSize: 32, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statVal: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  payForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 12,
  },
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
  confirmPayBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmPayText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  historySection: { gap: 10 },
  historyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  histIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  histInfo: { flex: 1, gap: 2 },
  histItems: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  histDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  histAmount: { fontSize: 15, fontFamily: "Inter_700Bold", fontWeight: "700" },
});
