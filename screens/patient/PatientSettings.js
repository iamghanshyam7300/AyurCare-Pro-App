// PatientSettings.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Image,
  Alert,
  Keyboard,
  Modal,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";

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

// Simplified Dictionary for demonstration
const DICTIONARY = {
  en: {
    title: "Patient Settings",
    subtitle_view: "View profile",
    subtitle_edit: "Editing profile",
    section_profile: "Profile",
    section_settings: "App Settings",
    age: "Age",
    gender: "Gender",
    dosha: "Dosha",
    history: "Medical History",
    allergies: "Allergies",
    medications: "Medications",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    change_pass: "Change Password",
    logout: "Logout",
  },
  hi: {
    title: "रोगी सेटिंग्स",
    subtitle_view: "प्रोफ़ाइल देखें",
    subtitle_edit: "प्रोफ़ाइल संपादित करें",
    section_profile: "प्रोफ़ाइल",
    section_settings: "ऐप सेटिंग्स",
    age: "आयु",
    gender: "लिंग",
    dosha: "दोष",
    history: "चिकित्सा इतिहास",
    allergies: "एलर्जी",
    medications: "दवाएं",
    language: "भाषा",
    save: "सहेजें",
    cancel: "रद्द करें",
    edit: "संपादित करें",
    change_pass: "पासवर्ड बदलें",
    logout: "लॉग आउट",
  },
  // Note: For other languages, defaulting to English for this demo
  // You can populate them similarly
};

export default function PatientSettings({ navigation }) {
  const { user, refreshUser, logout } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Language State ---
  const [currentLang, setCurrentLang] = useState("en");
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

  // Helper to get text
  const t = (key) => {
    const dict = DICTIONARY[currentLang] || DICTIONARY["en"];
    return dict[key] || DICTIONARY["en"][key];
  };

  const [formData, setFormData] = useState({
    age: user?.age?.toString() || "",
    gender: user?.gender || "",
    doshaType: user?.doshaType || "",
    medicalHistory: user?.medicalHistory || "",
    allergies: user?.allergies || "",
    medications: user?.medications || "",
    avatarUrl: user?.avatar || null,
  });

  const [localAvatar, setLocalAvatar] = useState(user?.avatar || null);

  // Bottom sheet + view modal visibility
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [viewPhotoVisible, setViewPhotoVisible] = useState(false);

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

  const successRef = useRef(null);
  const pulseRef = useRef(null);

  useEffect(() => {
    setLocalAvatar(user?.avatar || null);
    setFormData({
      age: user?.age?.toString() || "",
      gender: user?.gender || "",
      doshaType: user?.doshaType || "",
      medicalHistory: user?.medicalHistory || "",
      allergies: user?.allergies || "",
      medications: user?.medications || "",
      avatarUrl: user?.avatar || null,
    });
  }, [user]);

  const pickAvatarFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Enable gallery access in settings.");
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
        setFormData((prev) => ({ ...prev, avatarUrl: uri }));
      }
    } catch (e) {
      console.warn("pickAvatarFromGallery err:", e);
    }
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
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender || null,
        doshaType: formData.doshaType || null,
        medicalHistory: formData.medicalHistory || null,
        allergies: formData.allergies || null,
        medications: formData.medications || null,
        avatar: formData.avatarUrl || null,
      };

      const cleaned = cleanPayload(payload);

      await usersAPI.update(user.id, cleaned);

      if (successRef.current) successRef.current.play();
      await refreshUser();

      setTimeout(() => {
        setEditMode(false);
        Alert.alert("Success", "Settings saved");
      }, 900);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const GenderChip = ({ value, selected, onPress, icon }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(value)}
      style={[
        styles.genderChip,
        selected && styles.genderChipActive,
        selected && { transform: [{ scale: 1.03 }] },
      ]}
    >
      <Text style={styles.genderIcon}>{icon}</Text>
      <Text style={[styles.genderText, selected && styles.genderTextActive]}>
        {value.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );

  const onPressAvatar = () => {
    setAvatarMenuVisible(true);
  };

  const removeAvatar = () => {
    setLocalAvatar(null);
    setFormData((p) => ({ ...p, avatarUrl: null }));
  };

  return (
    <View style={styles.screen}>
      {/* FLOATING HEADER FIXED */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
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
        {/* PROFILE CARD FIXED POSITION */}
        <View style={styles.headerCard}>
          <TouchableOpacity activeOpacity={0.8} onPress={onPressAvatar}>
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
            <Text style={styles.nameText}>{user?.name}</Text>
            <Text style={styles.smallText}>{user?.email}</Text>
            <View style={styles.rowMini}>
              <Text style={styles.statLabel}>
                Diet Plans: <Text style={styles.statValue}>—</Text>
              </Text>
              <Text style={[styles.statLabel, { marginLeft: 18 }]}>
                Reminders: <Text style={styles.statValue}>—</Text>
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

        {/* DETAILS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("section_profile")}</Text>

          {!editMode ? (
            <>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("age")}</Text>
                <Text style={styles.kvValue}>{user?.age ?? "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("gender")}</Text>
                <Text style={styles.kvValue}>
                  {user?.gender ? user.gender.toUpperCase() : "—"}
                </Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>{t("dosha")}</Text>
                <Text style={styles.kvValue}>{user?.doshaType ?? "—"}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t("history")}</Text>
                <Text style={styles.blockBody}>
                  {user?.medicalHistory || "No medical history provided."}
                </Text>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t("allergies")}</Text>
                <Text style={styles.blockBody}>
                  {user?.allergies || "None"}
                </Text>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>{t("medications")}</Text>
                <Text style={styles.blockBody}>
                  {user?.medications || "None"}
                </Text>
              </View>

              {/* EDIT + CHANGE PASSWORD + LOGOUT */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.smallPrimary}
                  onPress={() => setEditMode(true)}
                >
                  <Text style={styles.smallPrimaryText}>{t("edit")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallPrimary}
                  onPress={() => navigation.navigate("ChangePassword")}
                >
                  <Text style={styles.smallPrimaryText}>{t("change_pass")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallOutline, { marginLeft: 8 }]}
                  onPress={() =>
                    Alert.alert(t("logout"), "Are you sure?", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Logout", style: "destructive", onPress: logout },
                    ])
                  }
                >
                  <Text style={styles.smallOutlineText}>{t("logout")}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* EDIT MODE */}
              <Text style={styles.formLabel}>{t("age")}</Text>
              <TextInput
                placeholder={t("age")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.age}
                onChangeText={(t) => setFormData({ ...formData, age: t })}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.formLabel}>{t("gender")}</Text>
              <View style={{ flexDirection: "row", marginTop: 6 }}>
                <GenderChip
                  value="male"
                  icon="👨"
                  selected={formData.gender === "male"}
                  onPress={(v) => setFormData({ ...formData, gender: v })}
                />
                <GenderChip
                  value="female"
                  icon="👩"
                  selected={formData.gender === "female"}
                  onPress={(v) => setFormData({ ...formData, gender: v })}
                />
                <GenderChip
                  value="other"
                  icon="🧑"
                  selected={formData.gender === "other"}
                  onPress={(v) => setFormData({ ...formData, gender: v })}
                />
              </View>

              <Text style={styles.formLabel}>{t("dosha")}</Text>
              <TextInput
                placeholder="VATA / PITTA / KAPHA"
                placeholderTextColor={colors.foregroundLight}
                value={formData.doshaType}
                onChangeText={(t) =>
                  setFormData({ ...formData, doshaType: t })
                }
                style={styles.input}
              />

              <Text style={styles.formLabel}>{t("history")}</Text>
              <TextInput
                placeholder={t("history")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.medicalHistory}
                onChangeText={(t) =>
                  setFormData({ ...formData, medicalHistory: t })
                }
                style={[styles.input, { height: 90 }]}
                multiline
              />

              <Text style={styles.formLabel}>{t("allergies")}</Text>
              <TextInput
                placeholder={t("allergies")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.allergies}
                onChangeText={(t) =>
                  setFormData({ ...formData, allergies: t })
                }
                style={styles.input}
              />

              <Text style={styles.formLabel}>{t("medications")}</Text>
              <TextInput
                placeholder={t("medications")}
                placeholderTextColor={colors.foregroundLight}
                value={formData.medications}
                onChangeText={(t) =>
                  setFormData({ ...formData, medications: t })
                }
                style={[styles.input, { height: 80 }]}
                multiline
              />

              {/* SAVE + CANCEL */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.smallOutline}
                  onPress={() => {
                    setEditMode(false);
                    setFormData({
                      age: user?.age?.toString() || "",
                      gender: user?.gender || "",
                      doshaType: user?.doshaType || "",
                      medicalHistory: user?.medicalHistory || "",
                      allergies: user?.allergies || "",
                      medications: user?.medications || "",
                      avatarUrl: user?.avatar || null,
                    });
                  }}
                >
                  <Text style={styles.smallOutlineText}>{t("cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallPrimary, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.smallPrimaryText}>
                    {saving ? "Saving..." : t("save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* SUCCESS LOTTIE */}
        <View style={styles.hiddenLottie}>
          <LottieView
            ref={successRef}
            source={require("../../assets/lottie-success.json")}
            autoPlay={false}
            loop={false}
            style={{ width: 120, height: 120 }}
          />
        </View>
      </Animated.ScrollView>

      {/* ---------- View Photo Modal ---------- */}
      <Modal
        visible={viewPhotoVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setViewPhotoVisible(false)}
      >
        <Pressable
          style={styles.viewModalBackground}
          onPress={() => setViewPhotoVisible(false)}
        >
          <Image source={{ uri: localAvatar }} style={styles.viewModalImage} />
        </Pressable>
      </Modal>

      {/* ---------- Avatar Action Sheet ---------- */}
      {avatarMenuVisible && (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setAvatarMenuVisible(false)} />
          <View style={styles.menuBox}>
            {localAvatar && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setAvatarMenuVisible(false);
                  setViewPhotoVisible(true);
                }}
              >
                <Text style={styles.menuText}>View Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setAvatarMenuVisible(false);
                await pickAvatarFromGallery();
              }}
            >
              <Text style={styles.menuText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {localAvatar && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setAvatarMenuVisible(false);
                  Alert.alert(
                    "Remove Photo",
                    "Are you sure you want to remove your photo?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => removeAvatar(),
                      },
                    ]
                  );
                }}
              >
                <Text style={[styles.menuText, { color: "red" }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.menuItem, { marginBottom: 8 }]}
              onPress={() => setAvatarMenuVisible(false)}
            >
              <Text style={[styles.menuText, { fontWeight: "700" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ---------- LANGUAGE SELECTION MODAL ---------- */}
      <Modal
        visible={languageMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageMenuVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable 
            style={styles.backdrop} 
            onPress={() => setLanguageMenuVisible(false)} 
          />
          <View style={[styles.menuBox, {maxHeight: '70%'}]}>
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
              style={[styles.menuItem, { marginTop: 10, marginBottom: 8 }]}
              onPress={() => setLanguageMenuVisible(false)}
            >
              <Text style={[styles.menuText, { fontWeight: "700" }]}>{t("cancel")}</Text>
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

  /* >>> FIXED FLOATING HEADER <<< */
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
    fontSize: 18,
    fontWeight: "700",
  },
  floatingSubtitle: {
    color: colors.foregroundLight,
    fontSize: 12,
    marginTop: 2,
  },

  /* >>> HEADER CARD <<< */
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
    width: 86,
    height: 86,
    left: 0,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  headerInfo: {
    flex: 1,
  },
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

  /* SECTION */
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
    fontSize: 15,
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

  block: {
    marginBottom: 14,
  },
  blockTitle: {
    color: colors.foregroundLight,
    fontWeight: "600",
    marginBottom: 4,
  },
  blockBody: {
    color: colors.foreground,
    lineHeight: 20,
  },

  /* BUTTONS */
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
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

  genderChip: {
    flex: 1,
    marginRight: 8,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderIcon: {
    marginRight: 6,
  },
  genderText: {
    color: colors.foreground,
    fontWeight: "600",
    fontSize: 12,
  },
  genderTextActive: {
    color: "#fff",
  },

  hiddenLottie: {
    position: "absolute",
    top: 30,
    right: 20,
    width: 120,
    height: 120,
    opacity: 0,
  },

  /* ---------- Bottom Action Sheet Styles ---------- */
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  menuBox: {
    width: "100%",
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderColor: colors.border,
    borderTopWidth: 1,
  },
  menuItem: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    color: colors.foreground,
    fontSize: 16,
    textAlign: "center",
  },

  /* Language Modal Specifics */
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

  /* View modal */
  viewModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewModalImage: {
    width: "95%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 8,
  },
});