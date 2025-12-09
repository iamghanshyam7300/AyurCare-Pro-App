// /screens/doctor/Settings.js
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
  Modal,
  ScrollView,
  Pressable
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../colors";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";

// --- 1. LANGUAGE CONFIGURATION ---
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
];

const DICTIONARY = {
  en: {
    title: "Settings",
    subtitle_view: "Manage your account",
    subtitle_edit: "Editing profile",
    section_account: "Account",
    section_settings: "App Settings",
    phone: "Phone",
    address: "Address",
    specialization: "Specialization",
    experience: "Experience",
    experience_unit: "yrs",
    notifications: "Notifications",
    push_notif: "Push Notifications",
    push_desc: "Receive notifications on device",
    email_notif: "Email Notifications",
    email_desc: "Receive updates via email",
    language: "Language",
    edit: "Edit",
    change_pass: "Change Password",
    logout: "Logout",
    save: "Save",
    cancel: "Cancel",
    role: "Role",
    active: "Active",
    yes: "Yes",
    no: "No",
    years: "years"
  },
  hi: {
    title: "सेटिंग्स",
    subtitle_view: "अपना खाता प्रबंधित करें",
    subtitle_edit: "प्रोफ़ाइल संपादित करें",
    section_account: "खाता",
    section_settings: "ऐप सेटिंग्स",
    phone: "फ़ोन",
    address: "पता",
    specialization: "विशेषज्ञता",
    experience: "अनुभव",
    experience_unit: "वर्ष",
    notifications: "सूचनाएं",
    push_notif: "पुश सूचनाएं",
    push_desc: "डिवाइस पर सूचनाएं प्राप्त करें",
    email_notif: "ईमेल सूचनाएं",
    email_desc: "ईमेल के माध्यम से अपडेट प्राप्त करें",
    language: "भाषा",
    edit: "संपादित करें",
    change_pass: "पासवर्ड बदलें",
    logout: "लॉग आउट",
    save: "सहेजें",
    cancel: "रद्द करें",
    role: "भूमिका",
    active: "सक्रिय",
    yes: "हाँ",
    no: "नहीं",
    years: "वर्ष"
  },
  // Defaulting others to English for brevity in this snippet
};

export default function Settings({ navigation }) {
  const { user, refreshUser, logout } = useAuth();

  // form + UI state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // --- Language State ---
  const [currentLang, setCurrentLang] = useState("en");
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

  // Helper to get text
  const t = (key) => {
    const dict = DICTIONARY[currentLang] || DICTIONARY["en"];
    return dict[key] || DICTIONARY["en"][key];
  };

  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    address: user?.address || "",
    specialization: user?.specialization || "",
    experience: user?.experience?.toString() ?? "",
    avatarUrl: user?.avatar || null,
  });

  const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);

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

  // ---------------- Avatar logic ----------------
  const pickAvatarFromGallery = async () => {
    try {
      setAvatarSheetVisible(false);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please enable gallery access in settings.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!res.canceled && res.assets?.length > 0) {
        const uri = res.assets[0].uri;
        setLocalAvatar(uri);
        setFormData((s) => ({ ...s, avatarUrl: uri }));
      }
    } catch (err) {
      console.log("pickAvatarFromGallery err:", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const removeAvatar = () => {
    setAvatarSheetVisible(false);
    setLocalAvatar(null);
    setFormData((s) => ({ ...s, avatarUrl: null }));
  };

  const cleanPayload = (obj) =>
    Object.fromEntries(
      Object.entries(obj).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

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
    Alert.alert(t("logout"), "Are you sure you want to logout?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
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
        <Text style={styles.floatingTitle}>{t("title")}</Text>
        <Text style={styles.floatingSubtitle}>
          {editMode ? t("subtitle_edit") : t("subtitle_view")}
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
          <TouchableOpacity activeOpacity={0.85} onPress={() => setAvatarSheetVisible(true)}>
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
                {t("role")}: <Text style={styles.statValue}>{user?.role ?? "—"}</Text>
              </Text>
              <Text style={[styles.statLabel, { marginLeft: 18 }]}>
                {t("active")}: <Text style={styles.statValue}>{user?.isActive ? t("yes") : t("no")}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* --- APP SETTINGS CARD (LANGUAGE) --- */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("section_settings")}</Text>
          
          <TouchableOpacity 
            style={styles.kvRow} 
            onPress={() => setLanguageMenuVisible(true)}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{fontSize: 16, marginRight: 8}}>🌐</Text>
                <Text style={styles.kvLabel}>{t("language")}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.kvValue}>
                    {LANGUAGES.find(l => l.code === currentLang)?.native}
                </Text>
                <Text style={[styles.kvValue, {marginLeft: 6, fontSize: 12}]}>▼</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Details Sections */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("section_account")}</Text>

          {!editMode ? (
            <>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("phone")}</Text>
                <Text style={styles.kvValue}>{user?.phone || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("address")}</Text>
                <Text style={styles.kvValue}>{user?.address || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("specialization")}</Text>
                <Text style={styles.kvValue}>{user?.specialization || "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("experience")}</Text>
                <Text style={styles.kvValue}>
                  {user?.experience !== undefined ? `${user.experience} ${t("experience_unit")}` : "—"}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Notifications block */}
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.blockTitle}>{t("notifications")}</Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>{t("push_notif")}</Text>
                    <Text style={styles.settingDescription}>{t("push_desc")}</Text>
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
                    <Text style={styles.settingLabel}>{t("email_notif")}</Text>
                    <Text style={styles.settingDescription}>{t("email_desc")}</Text>
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
                  <Text style={styles.smallPrimaryText}>{t("edit")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallOutline}
                  onPress={() => navigation.navigate("ChangePassword")}
                >
                  <Text style={styles.smallOutlineText}>{t("change_pass")}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallOutline} onPress={handleLogout}>
                  <Text style={styles.smallOutlineText}>{t("logout")}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Edit form */}
              <Text style={styles.formLabel}>{t("phone")}</Text>
              <TextInput
                placeholder={t("phone")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                style={styles.input}
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>{t("address")}</Text>
              <TextInput
                placeholder={t("address")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.address}
                onChangeText={(t) => setFormData({ ...formData, address: t })}
                style={[styles.input, { height: 84 }]}
                multiline
              />

              <Text style={styles.formLabel}>{t("specialization")}</Text>
              <TextInput
                placeholder={t("specialization")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.specialization}
                onChangeText={(t) => setFormData({ ...formData, specialization: t })}
                style={styles.input}
              />

              <Text style={styles.formLabel}>{t("experience")} ({t("years")})</Text>
              <TextInput
                placeholder={t("experience")}
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
                  <Text style={styles.smallOutlineText}>{t("cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallPrimary, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.smallPrimaryText}>{saving ? "Saving..." : t("save")}</Text>
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

      {/* Avatar action sheet (bottom modal) */}
      <Modal visible={avatarSheetVisible} animationType="slide" transparent>
        <View style={sheetStyles.overlay}>
          <View style={sheetStyles.sheet}>
            <TouchableOpacity
              style={sheetStyles.row}
              onPress={pickAvatarFromGallery}
              activeOpacity={0.8}
            >
              <Text style={sheetStyles.rowText}>Change Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={sheetStyles.row}
              onPress={() =>
                Alert.alert("Remove Photo", "Remove profile photo?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: removeAvatar,
                  },
                ])
              }
              activeOpacity={0.8}
            >
              <Text style={[sheetStyles.rowText, { color: "#FF4D4F" }]}>Remove Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[sheetStyles.row, { marginTop: 8 }]}
              onPress={() => setAvatarSheetVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[sheetStyles.rowText, { fontWeight: "700" }]}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------- LANGUAGE SELECTION MODAL ---------- */}
      <Modal
        visible={languageMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageMenuVisible(false)}
      >
        <View style={sheetStyles.overlay}>
          <Pressable 
            style={sheetStyles.backdrop} 
            onPress={() => setLanguageMenuVisible(false)} 
          />
          <View style={[sheetStyles.sheet, {maxHeight: '70%'}]}>
            <Text style={styles.languageHeader}>Select Language</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={styles.languageItem}
                  onPress={() => {
                    setCurrentLang(lang.code);
                    setLanguageMenuVisible(false);
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {/* Radio Button Circle */}
                    <View style={[
                        styles.radioCircle, 
                        currentLang === lang.code && styles.radioCircleSelected
                    ]}>
                        {currentLang === lang.code && <View style={styles.radioDot} />}
                    </View>
                    
                    <View style={{marginLeft: 12}}>
                        <Text style={[
                            styles.languageNative, 
                            currentLang === lang.code && {color: colors.primary, fontWeight: '700'}
                        ]}>
                            {lang.native}
                        </Text>
                        <Text style={styles.languageLabel}>{lang.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[sheetStyles.row, { marginTop: 10, marginBottom: 8 }]}
              onPress={() => setLanguageMenuVisible(false)}
            >
              <Text style={[sheetStyles.rowText, { fontWeight: "700" }]}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    alignItems: 'center',
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
    gap: 12,
    flexWrap: 'wrap'
  },

  smallPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
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

  // Language specific
  languageHeader: {
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.foreground, 
    textAlign: 'center', 
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  languageItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundLight,
  },
  languageNative: {
    fontSize: 16,
    color: colors.foreground,
  },
  languageLabel: {
    fontSize: 12,
    color: colors.foregroundLight
  },
  radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center'
  },
  radioCircleSelected: {
      borderColor: colors.primary
  },
  radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary
  },
});

/* ---------------- Avatar sheet styles ---------------- */
const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: colors.background,
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { paddingVertical: 16, alignItems: "center" },
  rowText: { fontSize: 16, fontWeight: "600", color: colors.foreground },
});