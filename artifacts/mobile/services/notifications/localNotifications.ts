import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ENABLED_KEY = "samastock.localNotifications.enabled";
const STOCK_ALERT_SIGNATURE_KEY = "samastock.localNotifications.stockAlertSignature";
const DEBT_ALERT_SIGNATURE_KEY = "samastock.localNotifications.debtAlertSignature";
const CHANNEL_ID = "samastock-alerts";

type ReminderInput = {
  lowStockCount: number;
  totalOpenDebt: number;
};

function isAvailable() {
  return Platform.OS !== "web";
}

function money(value: number) {
  return `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
}

export function configureLocalNotifications() {
  if (!isAvailable()) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Alertes SamaStock",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }).catch(() => {});
  }
}

export async function getLocalNotificationsEnabledAsync() {
  if (!isAvailable()) return false;
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "true";
}

export async function requestAndEnableLocalNotificationsAsync() {
  if (!isAvailable()) return false;

  const current = await Notifications.getPermissionsAsync();
  const finalStatus = current.granted ? current : await Notifications.requestPermissionsAsync();
  const enabled = finalStatus.granted;
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
  return enabled;
}

export async function disableLocalNotificationsAsync() {
  await AsyncStorage.setItem(ENABLED_KEY, "false");
}

async function showLocalNotificationAsync(title: string, body: string) {
  if (!isAvailable()) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: { source: "samastock" },
    },
    trigger: null,
  });
}

export async function sendTestLocalNotificationAsync() {
  if (!(await requestAndEnableLocalNotificationsAsync())) return false;
  await showLocalNotificationAsync("SamaStock", "Les notifications sont activees.");
  return true;
}

export async function refreshBusinessRemindersAsync(input: ReminderInput) {
  if (!(await getLocalNotificationsEnabledAsync())) return;

  if (input.lowStockCount > 0) {
    const signature = `low-stock:${input.lowStockCount}`;
    const lastSignature = await AsyncStorage.getItem(STOCK_ALERT_SIGNATURE_KEY);
    if (lastSignature !== signature) {
      await showLocalNotificationAsync(
        "Stock a surveiller",
        `${input.lowStockCount} produit${input.lowStockCount > 1 ? "s" : ""} en stock faible.`,
      );
      await AsyncStorage.setItem(STOCK_ALERT_SIGNATURE_KEY, signature);
    }
  } else {
    await AsyncStorage.removeItem(STOCK_ALERT_SIGNATURE_KEY);
  }

  if (input.totalOpenDebt > 0) {
    const signature = `debt:${Math.round(input.totalOpenDebt)}`;
    const lastSignature = await AsyncStorage.getItem(DEBT_ALERT_SIGNATURE_KEY);
    if (lastSignature !== signature) {
      await showLocalNotificationAsync("Dettes clients", `${money(input.totalOpenDebt)} encore a recuperer.`);
      await AsyncStorage.setItem(DEBT_ALERT_SIGNATURE_KEY, signature);
    }
  } else {
    await AsyncStorage.removeItem(DEBT_ALERT_SIGNATURE_KEY);
  }
}
