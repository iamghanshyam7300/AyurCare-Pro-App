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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";

import { colors } from "../../colors";
import { useAuth } from "../../contexts/AuthContext";
import { usersAPI } from "../../services/api";

export default function PatientSettings({ navigation }) {
  const { user, refreshUser, logout } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const pickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Enable gallery access.");
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
        setFormData({ ...formData, avatarUrl: res.uri });
      }
    } catch (e) {}
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
        <Text style={styles.floatingTitle}>Patient Settings</Text>
        <Text style={styles.floatingSubtitle}>
          {editMode ? "Editing profile" : "View profile"}
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
          <TouchableOpacity activeOpacity={0.8} onPress={pickAvatar}>
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

        {/* DETAILS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profile</Text>

          {!editMode ? (
            <>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Age</Text>
                <Text style={styles.kvValue}>{user?.age ?? "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Gender</Text>
                <Text style={styles.kvValue}>{user?.gender ?? "—"}</Text>
              </View>

              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Dosha</Text>
                <Text style={styles.kvValue}>{user?.doshaType ?? "—"}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.block}>
                <Text style={styles.blockTitle}>Medical History</Text>
                <Text style={styles.blockBody}>
                  {user?.medicalHistory || "No medical history provided."}
                </Text>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>Allergies</Text>
                <Text style={styles.blockBody}>
                  {user?.allergies || "None"}
                </Text>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockTitle}>Medications</Text>
                <Text style={styles.blockBody}>
                  {user?.medications || "None"}
                </Text>
              </View>

              {/* EDIT + CHANGE PASSWORD + LOGOUT */}
                <View style={styles.actionsRow}>

                  {/* EDIT BUTTON */}
                  <TouchableOpacity
                    style={styles.smallPrimary}
                    onPress={() => setEditMode(true)}
                  >
                    <Text style={styles.smallPrimaryText}>Edit</Text>
                  </TouchableOpacity>

                  {/* CHANGE PASSWORD */}
                  <TouchableOpacity
                    style={styles.smallPrimary}
                    onPress={() => navigation.navigate("ChangePassword")}
                  >
                    <Text style={styles.smallPrimaryText}>Change Password</Text>
                  </TouchableOpacity>

                  {/* LOGOUT BUTTON */}
                  <TouchableOpacity
                    style={[styles.smallOutline, { marginLeft: 8 }]}
                    onPress={() =>
                      Alert.alert("Logout", "Are you sure?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Logout", style: "destructive", onPress: logout },
                      ])
                    }
                  >
                    <Text style={styles.smallOutlineText}>Logout</Text>
                  </TouchableOpacity>

                </View>

            </>
          ) : (
            <>
              {/* EDIT MODE */}
              <Text style={styles.formLabel}>Age</Text>
              <TextInput
                placeholder="Age"
                placeholderTextColor={colors.foregroundLight}
                value={formData.age}
                onChangeText={(t) => setFormData({ ...formData, age: t })}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.formLabel}>Gender</Text>
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

              <Text style={styles.formLabel}>Dosha</Text>
              <TextInput
                placeholder="VATA / PITTA / KAPHA"
                placeholderTextColor={colors.foregroundLight}
                value={formData.doshaType}
                onChangeText={(t) =>
                  setFormData({ ...formData, doshaType: t })
                }
                style={styles.input}
              />

              <Text style={styles.formLabel}>Medical History</Text>
              <TextInput
                placeholder="Medical history"
                placeholderTextColor={colors.foregroundLight}
                value={formData.medicalHistory}
                onChangeText={(t) =>
                  setFormData({ ...formData, medicalHistory: t })
                }
                style={[styles.input, { height: 90 }]}
                multiline
              />

              <Text style={styles.formLabel}>Allergies</Text>
              <TextInput
                placeholder="Allergies"
                placeholderTextColor={colors.foregroundLight}
                value={formData.allergies}
                onChangeText={(t) =>
                  setFormData({ ...formData, allergies: t })
                }
                style={styles.input}
              />

              <Text style={styles.formLabel}>Medications</Text>
              <TextInput
                placeholder="Medications"
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
                  <Text style={styles.smallOutlineText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallPrimary, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.smallPrimaryText}>
                    {saving ? "Saving..." : "Save"}
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
    top: Platform.OS === "ios" ? 0 : 24,     // FIX
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.card,

    height: 80,                              // FIX
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
    marginTop: Platform.OS === "ios" ? 110 : 120,   // FIX
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
});
