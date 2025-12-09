import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../colors";

export default function WaitingVerification() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Under Review</Text>
      <Text style={styles.subtitle}>
        Your account has been submitted for verification.
        You will be able to log in once the admin approves your profile.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.foregroundLight,
    textAlign: "center",
    lineHeight: 22,
  },
});
