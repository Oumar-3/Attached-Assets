import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDebts } from "@/context/DebtsContext";
import { useColors } from "@/hooks/useColors";
import type { ClientRecord, DebtPaymentWithDebt, DebtWithClient } from "@/models";

function money(value: number) {
  return `${Math.round(value).toLocaleString()} FCFA`;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ClientDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getClient, listClientDebts, listClientPayments, addPayment } = useDebts();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [client, setClient] = useState<ClientRecord | null>(null);
  const [debts, setDebts] = useState<DebtWithClient[]>([]);
  const [payments, setPayments] = useState<DebtPaymentWithDebt[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<DebtWithClient | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function reload() {
    if (!id) return;
    setIsLoading(true);
    try {
      const [nextClient, nextDebts, nextPayments] = await Promise.all([
        getClient(id),
        listClientDebts(id),
        listClientPayments(id),
      ]);
      setClient(nextClient);
      setDebts(nextDebts);
      setPayments(nextPayments);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [id]);

  const openDebts = useMemo(() => debts.filter(debt => debt.status === "open"), [debts]);
  const totalDebt = useMemo(() => openDebts.reduce((sum, debt) => sum + debt.balance, 0), [openDebts]);
  const totalPurchased = useMemo(() => debts.reduce((sum, debt) => sum + debt.amount, 0), [debts]);
  const totalPaid = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments]);

  async function handlePayment() {
    if (!selectedDebt) return;
    const amount = parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Montant invalide", "Entrez un montant valide.");
      return;
    }
    if (amount > selectedDebt.balance) {
      Alert.alert("Montant trop élevé", `Le reste à payer est de ${money(selectedDebt.balance)}.`);
      return;
    }

    setPaying(true);
    try {
      await addPayment(selectedDebt.id, amount, payNote.trim() || undefined);
      setSelectedDebt(null);
      setPayAmount("");
      setPayNote("");
      await reload();
    } finally {
      setPaying(false);
    }
  }

  if (!client && !isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Client introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.primary }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const name = client?.name ?? "Client";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomPad + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: totalDebt > 0 ? colors.destructive : colors.success }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitials}>{name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{name}</Text>
          {client?.phone ? (
            <View style={styles.heroPhone}>
              <Feather name="phone" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroPhoneText}>{client.phone}</Text>
            </View>
          ) : null}
          <Text style={styles.heroDebtLabel}>Dette restante</Text>
          <Text style={styles.heroDebt}>{money(totalDebt)}</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Dettes créées", value: money(totalPurchased), color: colors.primary },
            { label: "Payé", value: money(totalPaid), color: colors.success },
            { label: "Ouvertes", value: `${openDebts.length}`, color: colors.accent },
          ].map(item => (
            <View key={item.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: item.color }]} numberOfLines={1}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {selectedDebt ? (
          <View style={[styles.payForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.payFormHeader}>
              <View>
                <Text style={[styles.payFormTitle, { color: colors.text }]}>Remboursement</Text>
                <Text style={[styles.payFormMeta, { color: colors.mutedForeground }]}>Reste: {money(selectedDebt.balance)}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDebt(null)}>
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="dollar-sign" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Montant payé"
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
                placeholder="Note optionnelle"
                placeholderTextColor={colors.mutedForeground}
                value={payNote}
                onChangeText={setPayNote}
              />
            </View>
            <TouchableOpacity style={[styles.confirmPayBtn, { backgroundColor: colors.success }, paying && { opacity: 0.7 }]} onPress={handlePayment} disabled={paying}>
              <Text style={styles.confirmPayText}>Confirmer le paiement</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Dettes du client</Text>
          {debts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune dette enregistrée</Text>
            </View>
          ) : (
            debts.map(debt => (
              <View key={debt.id} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.histIcon, { backgroundColor: debt.status === "paid" ? colors.success + "18" : colors.warning + "18" }]}>
                  <Feather name={debt.status === "paid" ? "check-circle" : "credit-card"} size={14} color={debt.status === "paid" ? colors.success : colors.warning} />
                </View>
                <View style={styles.histInfo}>
                  <Text style={[styles.histItems, { color: colors.text }]}>{debt.description ?? "Dette"}</Text>
                  <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
                    {shortDate(debt.createdAt)} • Payé {money(debt.paidAmount)}
                  </Text>
                </View>
                <View style={styles.histRight}>
                  <Text style={[styles.histAmount, { color: debt.status === "paid" ? colors.success : colors.destructive }]}>{money(debt.balance)}</Text>
                  {debt.status === "open" ? (
                    <TouchableOpacity style={[styles.smallPayBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedDebt(debt)}>
                      <Text style={styles.smallPayText}>Payer</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {payments.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historyTitle, { color: colors.text }]}>Paiements reçus</Text>
            {payments.map(payment => (
              <View key={payment.id} style={[styles.histRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.histIcon, { backgroundColor: colors.success + "18" }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                </View>
                <View style={styles.histInfo}>
                  <Text style={[styles.histItems, { color: colors.text }]}>{payment.note ?? "Remboursement"}</Text>
                  <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
                    {shortDate(payment.createdAt)} • {payment.debtDescription ?? "Dette"}
                  </Text>
                </View>
                <Text style={[styles.histAmount, { color: colors.success }]}>+{money(payment.amount)}</Text>
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
  center: { justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700", textAlign: "center" },
  body: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 20, padding: 20, alignItems: "center", gap: 6 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroInitials: { fontSize: 24, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroName: { fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  heroPhone: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroPhoneText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  heroDebtLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", marginTop: 8 },
  heroDebt: { fontSize: 32, color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  statVal: { fontSize: 13, fontFamily: "Inter_700Bold", fontWeight: "700" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  payForm: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  payFormHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  payFormTitle: { fontSize: 16, fontFamily: "Inter_700Bold", fontWeight: "700" },
  payFormMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  confirmPayBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  confirmPayText: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700", color: "#fff" },
  historySection: { gap: 10 },
  historyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  histRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12, marginBottom: 8 },
  histIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  histInfo: { flex: 1, gap: 2 },
  histItems: { fontSize: 14, fontFamily: "Inter_500Medium", fontWeight: "500" },
  histDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  histRight: { alignItems: "flex-end", gap: 6 },
  histAmount: { fontSize: 14, fontFamily: "Inter_700Bold", fontWeight: "700" },
  smallPayBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  smallPayText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", fontWeight: "700" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular", marginBottom: 12 },
  back: { fontSize: 15, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
});
