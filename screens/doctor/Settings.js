import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  Platform,
  Image,
  Alert,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../colors";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";

/**
 * Doctor Settings (matches PatientSettings UI)
 * - Floating header
 * - Header card with avatar + pulse
 * - Edit mode with fields: phone, address, specialization, experience
 * - Notification toggles
 * - Logout
 * - Uses useAuth.refreshUser() and logout()
 */

export default function Settings({ navigation }) {
  const { user, refreshUser, logout } = useAuth();

  // form + UI state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    address: user?.address || "",
    specialization: user?.specialization || "",
    experience: user?.experience?.toString() ?? "",
    avatarUrl: user?.avatar || null,
  });

  const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);

  // animated header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -36],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const pulseRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    setLocalAvatar(user?.avatar || null);
    setFormData({
      phone: user?.phone || "",
      address: user?.address || "",
      specialization: user?.specialization || "",
      experience: user?.experience?.toString() ?? "",
      avatarUrl: user?.avatar || null,
    });
  }, [user]);

  // Avatar picker
  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please enable media library access.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!res.cancelled) {
        setLocalAvatar(res.uri);
        setFormData((s) => ({ ...s, avatarUrl: res.uri }));
      }
    } catch (err) {
      console.log("Avatar pick error:", err);
    }
  };

  // remove empty values
  const cleanPayload = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

  // Save profile
  const handleSave = async () => {
    Keyboard.dismiss();
    try {
      setSaving(true);

      const payload = {
        phone: formData.phone || null,
        address: formData.address || null,
        specialization: formData.specialization || null,
        experience: formData.experience ? Number(formData.experience) : null,
        avatar: formData.avatarUrl || null,
      };

      const cleaned = cleanPayload(payload);

      await usersAPI.update(user.id, cleaned);

      if (successRef.current) successRef.current.play();
      await refreshUser();

      setTimeout(() => {
        setEditMode(false);
        Alert.alert("Success", "Profile updated successfully");
      }, 850);
    } catch (err) {
      console.log("Save error:", err.response?.data || err);
      Alert.alert("Error", err.response?.data?.message || "Unable to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      {/* Floating header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity },
        ]}
      >
        <Text style={styles.floatingTitle}>Settings</Text>
        <Text style={styles.floatingSubtitle}>
          {editMode ? "Editing profile" : "Manage your account"}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 60 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <TouchableOpacity activeOpacity={0.85} onPress={pickAvatar}>
            <View style={styles.avatarWrap}>
              {localAvatar ? (
                <Image source={{ uri: localAvatar }} style={styles.avatar} />
              ) : (
                <Image
                  source={require("../../assets/avatar-placeholder.png")}
                  style={styles.avatar}
                />
              )}

              {!editMode && (
                <View style={styles.lottieOverlay}>
                  <LottieView
                    ref={pulseRef}
                    source={require("../../assets/lottie-pulse.json")}
                    autoPlay
                    loop
                    style={{ width: 86, height: 86 }}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.nameText}>{user?.name || "Doctor"}</Text>
            <Text style={styles.smallText}>{user?.email}</Text>

            <View style={styles.rowMini}>
              <Text style={styles.statLabel}>
                Role: <Text style={styles.statValue}>{user?.role ?? "—"}</Text>
              </Text>
              <Text style={[styles.statLabel, { marginLeft: 18 }]}>
                Active: <Text style={styles.statValue}>{user?.isActive ? "Yes" : "No"}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Main sections */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>

          {!editMode ? (
            <>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Phone</Text>
                <Text style={styles.kvValue}>{user?.phone || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Address</Text>
                <Text style={styles.kvValue}>{user?.address || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Specialization</Text>
                <Text style={styles.kvValue}>{user?.specialization || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Experience</Text>
                <Text style={styles.kvValue}>
                  {user?.experience !== undefined ? `${user.experience} yrs` : "—"}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Notifications block */}
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.blockTitle}>Notifications</Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive notifications on device
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleBtn, notificationsEnabled ? styles.toggleOn : styles.toggleOff]}
                    onPress={() => setNotificationsEnabled((s) => !s)}
                  >
                    <Ionicons
                      name={notificationsEnabled ? "notifications" : "notifications-off"}
                      size={20}
                      color={notificationsEnabled ? "#fff" : colors.foreground}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Email Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Receive updates via email
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleBtn, emailNotifications ? styles.toggleOn : styles.toggleOff]}
                    onPress={() => setEmailNotifications((s) => !s)}
                  >
                    <Ionicons
                      name={emailNotifications ? "mail" : "mail-outline"}
                      size={20}
                      color={emailNotifications ? "#fff" : colors.foreground}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.smallPrimary} onPress={() => setEditMode(true)}>
                    <Text style={styles.smallPrimaryText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.smallOutline}
                    onPress={() => navigation.navigate("ChangePassword")}
                  >
                    <Text style={styles.smallOutlineText}>Change Password</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.smallOutline} onPress={handleLogout}>
                    <Text style={styles.smallOutlineText}>Logout</Text>
                  </TouchableOpacity>
                </View>
            </>
          ) : (
            <>
              {/* Edit form */}
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                placeholder="Phone"
                placeholderTextColor={colors.foregroundLight}
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                style={styles.input}
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                placeholder="Address"
                placeholderTextColor={colors.foregroundLight}
                value={formData.address}
                onChangeText={(t) => setFormData({ ...formData, address: t })}
                style={[styles.input, { height: 84 }]}
                multiline
              />

              <Text style={styles.formLabel}>Specialization</Text>
              <TextInput
                placeholder="Specialization"
                placeholderTextColor={colors.foregroundLight}
                value={formData.specialization}
                onChangeText={(t) => setFormData({ ...formData, specialization: t })}
                style={styles.input}
              />

              <Text style={styles.formLabel}>Experience (years)</Text>
              <TextInput
                placeholder="Experience"
                placeholderTextColor={colors.foregroundLight}
                value={formData.experience}
                onChangeText={(t) => setFormData({ ...formData, experience: t })}
                style={styles.input}
                keyboardType="numeric"
              />

              {/* Save / Cancel */}
              <View style={[styles.actionsRow, { marginTop: 12 }]}>
                <TouchableOpacity
                  style={styles.smallOutline}
                  onPress={() => {
                    setEditMode(false);
                    setFormData({
                      phone: user?.phone || "",
                      address: user?.address || "",
                      specialization: user?.specialization || "",
                      experience: user?.experience?.toString() ?? "",
                      avatarUrl: user?.avatar || null,
                    });
                    setLocalAvatar(user?.avatar || null);
                  }}
                >
                  <Text style={styles.smallOutlineText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallPrimary, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.smallPrimaryText}>{saving ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* hidden success lottie */}
        <View style={styles.hiddenLottie}>
          <LottieView
            ref={successRef}
            source={require("../../assets/lottie-success.json")}
            loop={false}
            autoPlay={false}
            style={{ width: 120, height: 120 }}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  floatingHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 0 : 24,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.card,
    height: 80,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
    justifyContent: "flex-end",
  },
  floatingTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: "700",
  },
  floatingSubtitle: {
    color: colors.foregroundLight,
    fontSize: 12,
    marginTop: 2,
  },

  headerCard: {
    marginTop: Platform.OS === "ios" ? 110 : 120,
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 86 / 2,
    overflow: "hidden",
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 86,
  },
  lottieOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
  },

  headerInfo: { flex: 1 },
  nameText: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "700",
  },
  smallText: {
    color: colors.foregroundLight,
    marginTop: 6,
  },
  rowMini: {
    flexDirection: "row",
    marginTop: 6,
  },
  statLabel: {
    color: colors.foregroundLight,
    fontSize: 12,
  },
  statValue: {
    color: colors.foreground,
    fontWeight: "700",
  },

  sectionCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.foregroundLight,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 10,
  },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  kvLabel: {
    color: colors.foregroundLight,
  },
  kvValue: {
    color: colors.foreground,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  blockTitle: {
    color: colors.foregroundLight,
    fontWeight: "600",
    marginBottom: 6,
  },
  blockBody: {
    color: colors.foreground,
    lineHeight: 20,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 20,
  },

  smallPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginLeft: 8,
  },
  smallPrimaryText: {
    color: "#fff",
    fontWeight: "600",
  },

  smallOutline: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: 1,
  },
  smallOutlineText: {
    color: colors.foreground,
    fontWeight: "600",
  },

  formLabel: {
    color: colors.foregroundLight,
    fontSize: 13,
    marginTop: 6,
  },
  input: {
    marginTop: 6,
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.foreground,
  },

  /* notification style for this screen (custom toggles) */
  settingItem: {
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.foregroundLight,
  },

  toggleBtn: {
    width: 44,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleOff: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },

  hiddenLottie: {
    position: "absolute",
    top: 30,
    right: 20,
    width: 120,
    height: 120,
    opacity: 0,
  },
});
