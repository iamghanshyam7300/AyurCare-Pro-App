// LoginPage.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../colors";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native"; // ✅ ADDED

/* ---------------- Floating Label Input ---------------- */
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  placeholder,
  rightAccessory,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
}) => {
  const focused = useRef(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value || focused.current ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });

  const labelFontSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.foreground, colors.primary],
  });

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      <Animated.Text
        style={[
          styles.floatingLabel,
          { top: labelTop, fontSize: labelFontSize, color: labelColor },
        ]}
      >
        {label}
      </Animated.Text>

      <View
        style={rightAccessory ? styles.passwordWrapper : styles.inputWrapper}
      >
        <TextInput
          style={[styles.passwordInput, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder || ""}
          placeholderTextColor={colors.foregroundLight}
          onFocus={() => {
            focused.current = true;
            Animated.timing(anim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }).start();
            onFocus && onFocus();
          }}
          onBlur={() => {
            focused.current = false;
            Animated.timing(anim, {
              toValue: value ? 1 : 0,
              duration: 150,
              useNativeDriver: false,
            }).start();
            onBlur && onBlur();
          }}
        />

        {rightAccessory ? (
          <View style={styles.eyeButton}>{rightAccessory}</View>
        ) : null}
      </View>
    </View>
  );
};

/* ---------------- Main Component ---------------- */
export default function LoginPage() {
  const navigation = useNavigation(); // ✅ FIXED
  const { login, register, clearError } = useAuth();
  const { t, i18n } = useTranslation();

  const [langOpen, setLangOpen] = useState(false);

  const LANGS = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "gu", label: "ગુજરાતી" },
    { code: "or", label: "ଓଡିଆ" },
  ];

  const currentLang = i18n.language;
  const currentLangLabel =
    LANGS.find((l) => l.code === currentLang)?.label || "English";

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setLangOpen(false);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState(1);

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    age: "",
    gender: "",
    specialization: "",
    licenseNumber: "",
    experience: "",
    phone: "",
    address: "",
  });

  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(formAnim, {
      toValue: isLogin ? 0 : 1,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [isLogin]);

  const loginOpacity = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const loginTranslateY = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const regOpacity = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const regTranslateY = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async () => {
  if (!loginData.email || !loginData.password || !loginData.role) {
    Alert.alert(t("common.error"), t("auth.fillAllFields"));
    return;
  }

  try {
    setIsLoading(true);
    clearError();

    const result = await login(loginData);

    // 🚫 Doctor blocked because not verified
    if (result?.blocked) {
      Alert.alert(
        "Verification Pending",
        "Your account is awaiting approval from admin."
      );

      navigation.navigate("WaitingVerification");
      return;
    }

    // 🎉 Normal login continues automatically by AuthContext
  } catch (error) {
    Alert.alert(
      t("common.error"),
      error.response?.data?.message || "Login failed"
    );
  } finally {
    setIsLoading(false);
  }
};


  /* ---------------- REGISTER ---------------- */
  const handleNextStep = () => {
    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.password ||
      !registerData.role
    ) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsNotMatch"));
      return;
    }
    setRegStep(2);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    clearError();

    try {
      let { confirmPassword, experience, age, ...payload } = registerData;

      if (payload.role === "DOCTOR") {
        delete payload.age;
        delete payload.gender;
        payload.experience = experience ? Number(experience) : null;
      }

      if (payload.role === "PATIENT") {
        delete payload.specialization;
        delete payload.licenseNumber;
        delete payload.experience;
        payload.age = age ? Number(age) : null;
      }

      console.log("FINAL PAYLOAD SENT TO BACKEND →", payload);

      const result = await register(payload);

if (result?.waiting) {
  return navigation.navigate("WaitingVerification");
}


      Alert.alert("Success", "Registration successful!");
    } catch (error) {
      console.log("REGISTRATION ERROR →", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {/* 🌐 LANGUAGE DROPDOWN TOP RIGHT */}
      <View style={styles.languageContainer}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLangOpen(!langOpen)}>
          <Text style={styles.langBtnText}>{currentLangLabel}</Text>
          <Ionicons
            name={langOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>

        {langOpen && (
          <View style={styles.langDropdown}>
            {LANGS.map((lng) => (
              <TouchableOpacity
                key={lng.code}
                style={styles.langItem}
                onPress={() => changeLanguage(lng.code)}
              >
                <Text
                  style={[
                    styles.langItemText,
                    lng.code === currentLang && { fontWeight: "bold", color: colors.primary },
                  ]}
                >
                  {lng.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.lottieWrap}>
            <LottieView
              source={require("../../assets/lottie/ayur_lottie.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>{t("auth.appName")}</Text>

          <Text style={styles.subtitle}>
            {isLogin
              ? t("auth.systemSubtitle")
              : regStep === 2
              ? t("auth.completeProfile", { role: registerData.role })
              : t("auth.createAccount")}
          </Text>
        </View>

        {/* ---------------- TABS ---------------- */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.tabActive]}
            onPress={() => {
              setIsLogin(true);
              setRegStep(1);
            }}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
              {t("auth.login")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.tabActive]}
            onPress={() => {
              setIsLogin(false);
              setRegStep(1);
            }}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
              {t("auth.register")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---------------- LOGIN FORM ---------------- */}
        <Animated.View
          style={[
            styles.form,
            { opacity: loginOpacity, transform: [{ translateY: loginTranslateY }] },
            { display: isLogin ? "flex" : "none" },
          ]}
        >
          <FloatingLabelInput
            label={t("auth.email")}
            value={loginData.email}
            onChangeText={(v) => setLoginData({ ...loginData, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FloatingLabelInput
            label={t("auth.password")}
            value={loginData.password}
            secureTextEntry={!showPassword}
            onChangeText={(v) => setLoginData({ ...loginData, password: v })}
            rightAccessory={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.primary} />
              </TouchableOpacity>
            }
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("auth.role")}</Text>

            {/* --- UPDATED ROLE BUTTONS FOR LOGIN --- */}
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  loginData.role === "DOCTOR" && styles.roleButtonActive,
                ]}
                onPress={() => setLoginData({ ...loginData, role: "DOCTOR" })}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    loginData.role === "DOCTOR" && styles.roleButtonTextActive,
                  ]}
                >
                  Doctor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  loginData.role === "PATIENT" && styles.roleButtonActive,
                ]}
                onPress={() => setLoginData({ ...loginData, role: "PATIENT" })}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    loginData.role === "PATIENT" && styles.roleButtonTextActive,
                  ]}
                >
                  Patient
                </Text>
              </TouchableOpacity>

              {/* ✅ NEW: SUPER ADMIN BUTTON (Matches Controller Middleware) */}
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  loginData.role === "SUPER_ADMIN" && styles.roleButtonActive,
                ]}
                onPress={() => setLoginData({ ...loginData, role: "SUPER_ADMIN" })}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    loginData.role === "SUPER_ADMIN" && styles.roleButtonTextActive,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t("auth.login")}</Text>}
          </TouchableOpacity>
        </Animated.View>

        {/* ---------------- REGISTER FORM ---------------- */}
        <Animated.View
          style={[
            styles.form,
            { opacity: regOpacity, transform: [{ translateY: regTranslateY }] },
            { display: !isLogin ? "flex" : "none" },
          ]}
        >
          {regStep === 1 ? (
            <>
              <FloatingLabelInput
                label={t("auth.fullName")}
                value={registerData.name}
                onChangeText={(v) => setRegisterData({ ...registerData, name: v })}
                autoCapitalize="words"
              />

              <FloatingLabelInput
                label={t("auth.email")}
                value={registerData.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(v) => setRegisterData({ ...registerData, email: v })}
              />

              <FloatingLabelInput
                label={t("auth.password")}
                value={registerData.password}
                secureTextEntry={!showRegPassword}
                onChangeText={(v) => setRegisterData({ ...registerData, password: v })}
                rightAccessory={
                  <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)}>
                    <Ionicons name={showRegPassword ? "eye-off" : "eye"} size={22} color={colors.primary} />
                  </TouchableOpacity>
                }
              />

              <FloatingLabelInput
                label={t("auth.confirmPassword")}
                value={registerData.confirmPassword}
                secureTextEntry={!showRegConfirm}
                onChangeText={(v) => setRegisterData({ ...registerData, confirmPassword: v })}
                rightAccessory={
                  <TouchableOpacity onPress={() => setShowRegConfirm(!showRegConfirm)}>
                    <Ionicons name={showRegConfirm ? "eye-off" : "eye"} size={22} color={colors.primary} />
                  </TouchableOpacity>
                }
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("auth.registeringAs")}</Text>

                {/* --- REGISTER ROLES (NO ADMIN HERE) --- */}
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      registerData.role === "PATIENT" && styles.roleButtonActive,
                    ]}
                    onPress={() => setRegisterData({ ...registerData, role: "PATIENT" })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        registerData.role === "PATIENT" && styles.roleButtonTextActive,
                      ]}
                    >
                      {t("auth.patient")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      registerData.role === "DOCTOR" && styles.roleButtonActive,
                    ]}
                    onPress={() => setRegisterData({ ...registerData, role: "DOCTOR" })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        registerData.role === "DOCTOR" && styles.roleButtonTextActive,
                      ]}
                    >
                      {t("auth.doctor")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                <Text style={styles.buttonText}>{t("auth.nextStep")}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* DOCTOR FIELDS */}
              {registerData.role === "DOCTOR" ? (
                <>
                  <FloatingLabelInput
                    label={t("auth.specialization")}
                    value={registerData.specialization}
                    onChangeText={(v) => setRegisterData({ ...registerData, specialization: v })}
                  />

                  <FloatingLabelInput
                    label={t("auth.licenseNumber")}
                    value={registerData.licenseNumber}
                    onChangeText={(v) => setRegisterData({ ...registerData, licenseNumber: v })}
                  />

                  <FloatingLabelInput
                    label={t("auth.experience")}
                    value={registerData.experience}
                    keyboardType="numeric"
                    onChangeText={(v) => setRegisterData({ ...registerData, experience: v })}
                  />

                  <FloatingLabelInput
                    label={t("auth.phone")}
                    value={registerData.phone}
                    keyboardType="phone-pad"
                    onChangeText={(v) => setRegisterData({ ...registerData, phone: v })}
                  />

                  <FloatingLabelInput
                    label={t("auth.address")}
                    value={registerData.address}
                    onChangeText={(v) => setRegisterData({ ...registerData, address: v })}
                  />
                </>
              ) : (
                <>
                  <FloatingLabelInput
                    label={t("auth.age")}
                    value={registerData.age}
                    keyboardType="numeric"
                    onChangeText={(v) => setRegisterData({ ...registerData, age: v })}
                  />

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t("auth.gender")}</Text>

                    <View style={styles.roleButtons}>
                      <TouchableOpacity
                        style={[
                          styles.roleButton,
                          registerData.gender === "male" && styles.roleButtonActive,
                        ]}
                        onPress={() => setRegisterData({ ...registerData, gender: "male" })}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            registerData.gender === "male" && styles.roleButtonTextActive,
                          ]}
                        >
                          {t("auth.male")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.roleButton,
                          registerData.gender === "female" && styles.roleButtonActive,
                        ]}
                        onPress={() => setRegisterData({ ...registerData, gender: "female" })}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            registerData.gender === "female" && styles.roleButtonTextActive,
                          ]}
                        >
                          {t("auth.female")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <FloatingLabelInput
                    label={t("auth.phone")}
                    value={registerData.phone}
                    keyboardType="phone-pad"
                    onChangeText={(v) => setRegisterData({ ...registerData, phone: v })}
                  />

                  <FloatingLabelInput
                    label={t("auth.address")}
                    value={registerData.address}
                    onChangeText={(v) => setRegisterData({ ...registerData, address: v })}
                  />
                </>
              )}

              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setRegStep(1)}>
                  <Text style={styles.buttonOutlineText}>{t("auth.back")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonFlex]}
                  onPress={handleRegister}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>{t("auth.completeRegistration")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* LANGUAGE TOP-RIGHT BUTTON */
  languageContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1000,
  },

  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  langBtnText: {
    color: colors.primary,
    fontSize: 14,
    marginRight: 6,
    fontWeight: "600",
  },

  langDropdown: {
    marginTop: 6,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    width: 140,
  },

  langItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  langItemText: {
    color: colors.foreground,
  },

  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  lottieWrap: {
    width: 110,
    height: 110,
    borderRadius: 100,
    overflow: "hidden",
  },

  lottie: { width: "100%", height: "100%" },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginTop: 10,
  },

  subtitle: {
    fontSize: 13,
    color: colors.foregroundLight,
    marginTop: 4,
  },

  /* TABS */
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    marginTop: 20,
    marginBottom: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.foregroundLight,
    fontSize: 16,
  },
  tabTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },

  /* FORM */
  form: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },

  inputGroup: {
    marginBottom: 16,
  },

  floatingLabel: {
    position: "absolute",
    left: 14,
    zIndex: 10,
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 12,
    justifyContent: "center",
    minHeight: 48,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.backgroundLight,
    paddingRight: 10,
    minHeight: 48,
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    padding: 12,
    color: colors.foreground,
  },

  eyeButton: {
    padding: 6,
  },

  roleButtons: {
    flexDirection: "row",
    gap: 10,
  },

  roleButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    paddingVertical: 12,
    alignItems: "center",
  },

  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  roleButtonText: { color: colors.foreground, fontSize: 13 },
  roleButtonTextActive: { color: "#FFF", fontWeight: "600" },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },

  buttonText: { color: "#FFF", fontWeight: "600", fontSize: 16 },

  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonOutlineText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },

  row: { flexDirection: "row", gap: 12 },
});