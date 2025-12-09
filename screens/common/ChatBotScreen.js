import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../colors";

export default function ChatBotScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AyurBot Assistant</Text>
      <Text style={styles.subtitle}>
        Ask anything about Ayurveda, diets, doshas, remedies & more 🌿
      </Text>

      <TouchableOpacity
        style={styles.openBtn}
        onPress={() => navigation.navigate("BotpressChat")}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
        <Text style={styles.openText}>Open AyurBot Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  openText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
