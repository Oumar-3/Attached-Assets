import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type SamaStockLogoProps = {
  size?: number;
  showWordmark?: boolean;
};

const logoSource = require("@/assets/images/logo1.png");

function Mark({ size }: { size: number }) {
  return (
    <Image
      source={logoSource}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Logo SamaStock"
    />
  );
}

export function SamaStockLogo({ size = 64, showWordmark = false }: SamaStockLogoProps) {
  if (!showWordmark) return <Mark size={size} />;

  return (
    <View style={styles.wordmark}>
      <Mark size={size} />
      <Text style={[styles.name, { fontSize: Math.max(22, size * 0.42) }]}>SamaStock</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmark: { alignItems: "center", justifyContent: "center", gap: 8 },
  name: {
    color: "#064E45",
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 0,
  },
});
