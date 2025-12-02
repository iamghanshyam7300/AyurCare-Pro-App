import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../colors";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI } from "../../services/api";   // ✅ FIXED IMPORT

export default function ChangePassword({ navigation }) {
  const { user } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Simple fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleUpdate = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
  
    try {
      const payload = {
        currentPassword: oldPassword,   // ✅ backend field name
        newPassword: newPassword,       // unchanged
      };
  
      await authAPI.changePassword(payload);
  
      Alert.alert("Success", "Password changed successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
  
    } catch (err) {
      console.log("Change pass error:", err.response?.data || err);
  
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to change password"
      );
    }
  };
  

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
        
        {/* OLD PASSWORD */}
        <Text style={styles.label}>Old Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Enter old password"
            placeholderTextColor={colors.foregroundLight}
            secureTextEntry={!showOld}
            value={oldPassword}
            onChangeText={setOldPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowOld(!showOld)}>
            <Ionicons
              name={showOld ? "eye" : "eye-off"}
              size={22}
              color={colors.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* NEW PASSWORD */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Enter new password"
            placeholderTextColor={colors.foregroundLight}
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons
              name={showNew ? "eye" : "eye-off"}
              size={22}
              color={colors.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Re-enter new password"
            placeholderTextColor={colors.foregroundLight}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? "eye" : "eye-off"}
              size={22}
              color={colors.foreground}
            />
          </TouchableOpacity>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
          <Text style={styles.updateBtnText}>Update Password</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/* --------------------- STYLES --------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,

    // 🟢 FIX: Keeps the card near the top below header
    paddingTop: Platform.OS === "ios" ? 25 : 20,
  },

  formCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  label: {
    color: colors.primary,          // 🟢 highlighted
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    marginBottom: 14,
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.foreground,
  },

  updateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  updateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
