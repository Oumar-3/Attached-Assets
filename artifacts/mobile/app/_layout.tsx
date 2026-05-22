import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { DatabaseProvider } from "@/context/DatabaseContext";
import { DebtsProvider } from "@/context/DebtsContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { SalesProvider } from "@/context/SalesContext";
import { ShopProfileProvider } from "@/context/ShopProfileContext";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Expo Go/web can start without a registered native splash screen.
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/add" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="product/scan" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="product/edit/[id]" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="inventory" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="receipt/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="client/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Feather: require("../assets/fonts/Feather.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {
        // Ignore when there is no native splash screen attached to this view.
      });
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <DatabaseProvider>
            <ShopProfileProvider>
              <ProductsProvider>
                <DebtsProvider>
                  <SalesProvider>
                    <AuthProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <RootLayoutNav />
                      </GestureHandlerRootView>
                    </AuthProvider>
                  </SalesProvider>
                </DebtsProvider>
              </ProductsProvider>
            </ShopProfileProvider>
          </DatabaseProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
