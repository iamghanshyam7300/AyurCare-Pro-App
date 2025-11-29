import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../colors';

export default function LoginPage({ navigation }) {
  const { login, register, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [regStep, setRegStep] = useState(1);

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    role: '',
  });

  // Register state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    age: '',
    gender: '',
    specialization: '',
    licenseNumber: '',
    experience: '',
    phone: '',
    address: '',
  });

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password || !loginData.role) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      setIsLoading(true);
      clearError();
      await login(loginData);
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.role) {
      Alert.alert('Error', 'Please fill in all basic fields');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
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

    if (registerData.role === 'DOCTOR') {
      if (!registerData.specialization || !registerData.licenseNumber || !registerData.experience) {
        Alert.alert('Error', 'Please fill all doctor details');
        return;
      }
      basePayload.specialization = registerData.specialization;
      basePayload.licenseNumber = registerData.licenseNumber;
      basePayload.experience = Number(registerData.experience);
      if (registerData.phone) basePayload.phone = registerData.phone;
      if (registerData.address) basePayload.address = registerData.address;
    } else if (registerData.role === 'PATIENT') {
      if (!registerData.age || !registerData.gender) {
        Alert.alert('Error', 'Please fill all patient details');
        return;
      }
      basePayload.age = Number(registerData.age);
      basePayload.gender = registerData.gender;
      if (registerData.phone) basePayload.phone = registerData.phone;
      if (registerData.address) basePayload.address = registerData.address;
    }

    try {
      setIsLoading(true);
      clearError();
      await register(basePayload);
      Alert.alert('Success', 'Registration successful!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>AyurDiet Pro</Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Modern Ayurvedic Diet Management System'
              : regStep === 2
              ? `Complete your ${registerData.role.toLowerCase()} profile`
              : 'Create your account'}
          </Text>
        </View>

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

        {isLogin ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={loginData.email}
                onChangeText={(text) => setLoginData({ ...loginData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={loginData.password}
                onChangeText={(text) => setLoginData({ ...loginData, password: text })}
                secureTextEntry
                placeholder="Enter your password"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    loginData.role === 'DOCTOR' && styles.roleButtonActive,
                  ]}
                  onPress={() => setLoginData({ ...loginData, role: 'DOCTOR' })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      loginData.role === 'DOCTOR' && styles.roleButtonTextActive,
                    ]}
                  >
                    Doctor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    loginData.role === 'PATIENT' && styles.roleButtonActive,
                  ]}
                  onPress={() => setLoginData({ ...loginData, role: 'PATIENT' })}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      loginData.role === 'PATIENT' && styles.roleButtonTextActive,
                    ]}
                  >
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
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            {regStep === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={registerData.name}
                    onChangeText={(text) => setRegisterData({ ...registerData, name: text })}
                    placeholder="Enter your name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={registerData.email}
                    onChangeText={(text) => setRegisterData({ ...registerData, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Enter your email"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={registerData.password}
                      onChangeText={(text) => setRegisterData({ ...registerData, password: text })}
                      secureTextEntry
                      placeholder="Password"
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Confirm</Text>
                    <TextInput
                      style={styles.input}
                      value={registerData.confirmPassword}
                      onChangeText={(text) =>
                        setRegisterData({ ...registerData, confirmPassword: text })
                      }
                      secureTextEntry
                      placeholder="Confirm"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Registering As</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        registerData.role === 'PATIENT' && styles.roleButtonActive,
                      ]}
                      onPress={() => setRegisterData({ ...registerData, role: 'PATIENT' })}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          registerData.role === 'PATIENT' && styles.roleButtonTextActive,
                        ]}
                      >
                        Patient
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        registerData.role === 'DOCTOR' && styles.roleButtonActive,
                      ]}
                      onPress={() => setRegisterData({ ...registerData, role: 'DOCTOR' })}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          registerData.role === 'DOCTOR' && styles.roleButtonTextActive,
                        ]}
                      >
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
                {registerData.role === 'DOCTOR' ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Specialization</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.specialization}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, specialization: text })
                        }
                        placeholder="e.g. Ayurvedic Medicine"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>License Number</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.licenseNumber}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, licenseNumber: text })
                        }
                        placeholder="Medical License ID"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Years of Experience</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.experience}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, experience: text })
                        }
                        keyboardType="numeric"
                        placeholder="Years"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.phone}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, phone: text })
                        }
                        keyboardType="phone-pad"
                        placeholder="Phone number"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Clinic Address</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.address}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, address: text })
                        }
                        placeholder="Address"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.row}>
                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Age</Text>
                        <TextInput
                          style={styles.input}
                          value={registerData.age}
                          onChangeText={(text) => setRegisterData({ ...registerData, age: text })}
                          keyboardType="numeric"
                          placeholder="Age"
                        />
                      </View>
                      <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.roleButtons}>
                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              registerData.gender === 'male' && styles.roleButtonActive,
                            ]}
                            onPress={() => setRegisterData({ ...registerData, gender: 'male' })}
                          >
                            <Text
                              style={[
                                styles.roleButtonText,
                                registerData.gender === 'male' && styles.roleButtonTextActive,
                              ]}
                            >
                              Male
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.roleButton,
                              registerData.gender === 'female' && styles.roleButtonActive,
                            ]}
                            onPress={() => setRegisterData({ ...registerData, gender: 'female' })}
                          >
                            <Text
                              style={[
                                styles.roleButtonText,
                                registerData.gender === 'female' && styles.roleButtonTextActive,
                              ]}
                            >
                              Female
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Phone Number (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.phone}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, phone: text })
                        }
                        keyboardType="phone-pad"
                        placeholder="Phone number"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Address (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={registerData.address}
                        onChangeText={(text) =>
                          setRegisterData({ ...registerData, address: text })
                        }
                        placeholder="Address"
                      />
                    </View>
                  </>
                )}

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonOutline]}
                    onPress={() => setRegStep(1)}
                  >
                    <Text style={styles.buttonOutlineText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonFlex]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Complete Registration</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.foregroundLight,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    flex: 1,
  },
  buttonFlex: {
    flex: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

