// ======================================================
// EditUserProfile.js  (Updated to use refreshUser on save)
// ======================================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { colors } from "../colors";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI } from "../services/api";

export default function EditUserProfile({ navigation }) {
  const { user, refreshUser } = useAuth();   // ⭐ refreshUser added

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    try {
      setLoading(true);

      const payload = {
        name,
        phone,
        address,
      };

      // ============================
      //  API UPDATE
      // ============================
      await usersAPI.update(user.id, payload);

      // ============================
      //  ⭐ BLOCK A: REFRESH USER IN AUTH CONTEXT
      // ============================
      await refreshUser();   // <—— THIS FIXES EVERYTHING
      // ============================

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();

    } catch (err) {
      console.error("❌ Update Error:", err);
      Alert.alert("Error", "Couldn't update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

      {/* NAME */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
        placeholderTextColor={colors.foregroundLight}
      />

      {/* PHONE */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Enter phone"
        placeholderTextColor={colors.foregroundLight}
        keyboardType="phone-pad"
      />

      {/* ADDRESS */}
      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, { height: 90 }]}
        value={address}
        onChangeText={setAddress}
        placeholder="Enter address"
        placeholderTextColor={colors.foregroundLight}
        multiline
      />

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveProfile}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* =============================
   STYLES
============================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 20,
  },
  label: {
    color: colors.foregroundLight,
    fontSize: 14,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 50,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
