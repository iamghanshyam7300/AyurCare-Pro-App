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

/* ---------------------------
   FloatingLabelInput Component
   - Animated label (float up on focus/value)
   - Accepts a right accessory (icon button)
   --------------------------- */
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
  }, [value, anim]);

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
          {
            top: labelTop,
            fontSize: labelFontSize,
            color: labelColor,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      <View style={rightAccessory ? styles.passwordWrapper : styles.inputWrapper}>

        <TextInput
          style={[styles.passwordInput, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholder={placeholder ? placeholder : ""}
          placeholderTextColor={colors.foregroundLight}
          onFocus={() => {
            focused.current = true;
            Animated.timing(anim, {
              toValue: 1,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }).start();
            onFocus && onFocus();
          }}
          onBlur={() => {
            focused.current = false;
            Animated.timing(anim, {
              toValue: value ? 1 : 0,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }).start();
            onBlur && onBlur();
          }}
        />

        {rightAccessory ? <View style={styles.eyeButton}>{rightAccessory}</View> : null}
      </View>
    </View>
  );
};

/* ---------------------------
   Main LoginPage Component
   --------------------------- */
export default function LoginPage({ navigation }) {
  const { login, register, clearError } = useAuth();

  // states
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState(1);

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "",
  });

  // Register state
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

  /* ---------------------------
     Animated form transition values
     - formAnim is used to slide/fade forms when switching tabs
     --------------------------- */
  const formAnim = useRef(new Animated.Value(0)).current; // 0 = login, 1 = register

  useEffect(() => {
    Animated.timing(formAnim, {
      toValue: isLogin ? 0 : 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isLogin, formAnim]);

  // Derived animated styles
  const loginOpacity = formAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const loginTranslateY = formAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

  const regOpacity = formAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const regTranslateY = formAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  /* ---------------------------
     LOGIN / REGISTER HANDLERS
     (kept logic aligned with your previous code)
     --------------------------- */
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password || !loginData.role) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      setIsLoading(true);
      clearError();
      const res = await login(loginData);
      if (res) {
        Alert.alert("Success", "Login successful!");
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Login failed");
      setIsLogin(true);
      setRegStep(1);
      setLoginData({ email: "", password: "", role: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.role) {
      Alert.alert("Error", "Please fill in all basic fields");
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setRegStep(2);
  };

  const handleRegister = async () => {
    const basePayload = {
      name: registerData.name,
      email: registerData.email,
      password: registerData.password,
      role: registerData.role,
    };

    if (registerData.role === "DOCTOR") {
      if (!registerData.specialization || !registerData.licenseNumber || !registerData.experience) {
        Alert.alert("Error", "Please fill all doctor details");
        return;
      }
      basePayload.specialization = registerData.specialization;
      basePayload.licenseNumber = registerData.licenseNumber;
      basePayload.experience = Number(registerData.experience);
      basePayload.phone = registerData.phone || undefined;
      basePayload.address = registerData.address || undefined;
    } else if (registerData.role === "PATIENT") {
      if (!registerData.age || !registerData.gender) {
        Alert.alert("Error", "Please fill all patient details");
        return;
      }
      basePayload.age = Number(registerData.age);
      basePayload.gender = registerData.gender;
      basePayload.phone = registerData.phone || undefined;
      basePayload.address = registerData.address || undefined;
    }

    try {
      setIsLoading(true);
      clearError();
      await register(basePayload);
      Alert.alert("Success", "Registration successful!");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------
     Render
     --------------------------- */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Lottie + Title */}
        <View style={styles.header}>
          {/* Lottie Animation: place your lottie JSON at ../../assets/ayur_lottie.json */}
          <View style={styles.lottieWrap}>
            <LottieView
              source={require("../../assets/lottie/ayur_lottie.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>AyurDiet Pro</Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Modern Ayurvedic Diet Management System"
              : regStep === 2
              ? `Complete your ${registerData.role.toLowerCase()} profile`
              : "Create your account"}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.tabActive]}
            onPress={() => {
              setIsLogin(true);
              setRegStep(1);
            }}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.tabActive]}
            onPress={() => {
              setIsLogin(false);
              setRegStep(1);
            }}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Animated Login Card */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: loginOpacity,
              transform: [{ translateY: loginTranslateY }],
              // Hide pointer events when invisible (to avoid accidental taps)
              display: isLogin ? "flex" : "none",
            },
          ]}
        >
          <FloatingLabelInput
            label="Email"
            value={loginData.email}
            onChangeText={(t) => setLoginData({ ...loginData, email: t })}
            keyboardType="email-address"
            autoCapitalize="none"
            
          />

          <FloatingLabelInput
            label="Password"
            value={loginData.password}
            onChangeText={(t) => setLoginData({ ...loginData, password: t })}
            secureTextEntry={!showPassword}
            
            rightAccessory={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.primary} />
              </TouchableOpacity>
            }
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[styles.roleButton, loginData.role === "DOCTOR" && styles.roleButtonActive]}
                onPress={() => setLoginData({ ...loginData, role: "DOCTOR" })}
              >
                <Text style={[styles.roleButtonText, loginData.role === "DOCTOR" && styles.roleButtonTextActive]}>
                  Doctor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, loginData.role === "PATIENT" && styles.roleButtonActive]}
                onPress={() => setLoginData({ ...loginData, role: "PATIENT" })}
              >
                <Text style={[styles.roleButtonText, loginData.role === "PATIENT" && styles.roleButtonTextActive]}>
                  Patient
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
        </Animated.View>

        {/* Animated Register Card */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: regOpacity,
              transform: [{ translateY: regTranslateY }],
              display: !isLogin ? "flex" : "none",
            },
          ]}
        >
          {regStep === 1 ? (
            <>
              <FloatingLabelInput
                label="Full Name"
                value={registerData.name}
                onChangeText={(t) => setRegisterData({ ...registerData, name: t })}
                autoCapitalize="words"
              />

              <FloatingLabelInput
                label="Email"
                value={registerData.email}
                onChangeText={(t) => setRegisterData({ ...registerData, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FloatingLabelInput
                label="Password"
                value={registerData.password}
                onChangeText={(t) => setRegisterData({ ...registerData, password: t })}
                secureTextEntry={!showRegPassword}
                rightAccessory={
                  <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)}>
                    <Ionicons name={showRegPassword ? "eye-off" : "eye"} size={22} color={colors.primary} />
                  </TouchableOpacity>
                }
              />

              <FloatingLabelInput
                label="Confirm Password"
                value={registerData.confirmPassword}
                onChangeText={(t) => setRegisterData({ ...registerData, confirmPassword: t })}
                secureTextEntry={!showRegConfirm}
                rightAccessory={
                  <TouchableOpacity onPress={() => setShowRegConfirm(!showRegConfirm)}>
                    <Ionicons name={showRegConfirm ? "eye-off" : "eye"} size={22} color={colors.primary} />
                  </TouchableOpacity>
                }
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registering As</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[styles.roleButton, registerData.role === "PATIENT" && styles.roleButtonActive]}
                    onPress={() => setRegisterData({ ...registerData, role: "PATIENT" })}
                  >
                    <Text style={[styles.roleButtonText, registerData.role === "PATIENT" && styles.roleButtonTextActive]}>
                      Patient
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, registerData.role === "DOCTOR" && styles.roleButtonActive]}
                    onPress={() => setRegisterData({ ...registerData, role: "DOCTOR" })}
                  >
                    <Text style={[styles.roleButtonText, registerData.role === "DOCTOR" && styles.roleButtonTextActive]}>
                      Doctor
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                <Text style={styles.buttonText}>Next Step</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Step 2: Doctor or Patient extra fields */}
              {registerData.role === "DOCTOR" ? (
                <>
                  <FloatingLabelInput
                    label="Specialization"
                    value={registerData.specialization}
                    onChangeText={(t) => setRegisterData({ ...registerData, specialization: t })}
                  />
                  <FloatingLabelInput
                    label="License Number"
                    value={registerData.licenseNumber}
                    onChangeText={(t) => setRegisterData({ ...registerData, licenseNumber: t })}
                  />
                  <FloatingLabelInput
                    label="Years of Experience"
                    value={registerData.experience}
                    onChangeText={(t) => setRegisterData({ ...registerData, experience: t })}
                    keyboardType="numeric"
                  />
                  <FloatingLabelInput
                    label="Phone Number"
                    value={registerData.phone}
                    onChangeText={(t) => setRegisterData({ ...registerData, phone: t })}
                    keyboardType="phone-pad"
                  />
                  <FloatingLabelInput
                    label="Clinic Address"
                    value={registerData.address}
                    onChangeText={(t) => setRegisterData({ ...registerData, address: t })}
                  />
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <View style={[styles.halfWidth, styles.floatingContainer]}>
                      {/* AGE - full width */}
                      <FloatingLabelInput
                        label="Age"
                        value={registerData.age}
                        keyboardType="numeric"
                        onChangeText={(t) => setRegisterData({ ...registerData, age: t })}
                      />

                      {/* GENDER - full width */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.roleButtons}>
                          <TouchableOpacity
                            style={[styles.roleButton, registerData.gender === "male" && styles.roleButtonActive]}
                            onPress={() => setRegisterData({ ...registerData, gender: "male" })}
                          >
                            <Text style={[styles.roleButtonText, registerData.gender === "male" && styles.roleButtonTextActive]}>
                              Male
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.roleButton, registerData.gender === "female" && styles.roleButtonActive]}
                            onPress={() => setRegisterData({ ...registerData, gender: "female" })}
                          >
                            <Text style={[styles.roleButtonText, registerData.gender === "female" && styles.roleButtonTextActive]}>
                              Female
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                    </View>
                  </View>

                  <FloatingLabelInput
                    label="Phone Number (Optional)"
                    value={registerData.phone}
                    onChangeText={(t) => setRegisterData({ ...registerData, phone: t })}
                    keyboardType="phone-pad"
                  />

                  <FloatingLabelInput
                    label="Address (Optional)"
                    value={registerData.address}
                    onChangeText={(t) => setRegisterData({ ...registerData, address: t })}
                  />
                </>
              )}

              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setRegStep(1)}>
                  <Text style={styles.buttonOutlineText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.buttonFlex]} onPress={handleRegister} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------------------
   STYLES
   (keeps your existing palette via colors)
   --------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  lottieWrap: {
    width: 110,
    height: 110,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 6,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 6,
  },

  floatingContainer: {
  width: "100%",
},

  subtitle: {
    fontSize: 13,
    color: colors.foregroundLight,
    textAlign: "center",
  },

  tabs: {
    flexDirection: "row",
    marginBottom: 18,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
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
    fontSize: 16,
    color: colors.foregroundLight,
  },
  tabTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },

  form: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
  },

  inputGroup: {
    marginBottom: 12,
  },
  floatingLabel: {
    position: "absolute",
    left: 12,
    zIndex: 2,
    backgroundColor: "transparent",
    paddingHorizontal: 2,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.backgroundLight,
    color: colors.foreground,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    paddingRight: 10,
    minHeight: 48,
  },

  inputWrapper: {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.backgroundLight,
  borderRadius: 8,
  paddingHorizontal: 12,
  minHeight: 48,
  justifyContent: "center",
},

  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.foreground,
  },
  eyeButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  roleButtons: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    color: colors.foreground,
  },
  roleButtonTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonFlex: {
    flex: 2,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  buttonOutlineText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
  },
});
