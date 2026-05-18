import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#444",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
          height: isWeb ? 80 : 76,
          paddingBottom: isWeb ? 28 : 14,
          paddingTop: 10,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused }) => (
            <Feather name={focused ? "home" : "home"} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Stock",
          tabBarIcon: ({ color }) => <Feather name="package" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sale"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.saleBtn, { backgroundColor: focused ? colors.primaryDark : colors.primary }]}>
              <Feather name="shopping-cart" size={21} color="#000" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: "Clients",
          tabBarIcon: ({ color }) => <Feather name="users" size={21} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <Feather name="user" size={21} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  saleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#00D97E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
