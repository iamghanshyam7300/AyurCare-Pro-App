// /screens/doctor/AddPatient.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { patientsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const GENDERS = ["Male", "Female", "Other"];
const DOSHAS = ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tri-Dosha"];
const SLEEP_PATTERNS = ["4-5 hours", "5-6 hours", "6-7 hours", "7-8 hours", "8+ hours", "Irregular"];
const BOWEL_MOVEMENTS = ["Regular", "Irregular", "Constipated", "Loose"];

// --- HELPER COMPONENTS ---
const InputField = ({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      placeholder={placeholder}
      placeholderTextColor={colors.foregroundLight}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      scrollEnabled={false}
    />
  </View>
);

const ChipSelector = ({ label, selectedValue, onSelect, options }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
      {options.map((opt) => {
        const isActive = selectedValue === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

export default function AddPatient({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "Male",
    doshaType: "Vata",
    height: "",
    weight: "",
    sleepPattern: "7-8 hours",
    bowelMovement: "Regular",
    medicalHistory: "",
    allergies: "",
    medications: "",
    address: "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      Alert.alert("Validation", "Name and Email are required.");
      return;
    }

    setLoading(true);

    try {
      // 1. Auto-generate Patient Code (Hidden from UI)
      const autoPatientCode = `P-${Date.now().toString().slice(-6)}`;

      // 2. Format Dosha (Vata-Pitta -> VATA_PITTA)
      let formattedDosha = form.doshaType.toUpperCase().replace(/-/g, "_");
      if (formattedDosha === "TRI_DOSHA") formattedDosha = "TRIDOSHA";

      const payload = {
        ...form,
        doctorId: user.id,
        patientCode: autoPatientCode, // FIX 1: Required by backend
        
        // Numbers
        age: form.age ? parseInt(form.age) : null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        
        // Fix Enums
        gender: form.gender.toLowerCase(), // FIX 2: Male -> male
        doshaType: formattedDosha,         // FIX 3: Vata -> VATA
      };

      console.log("Sending Payload:", payload);
      await patientsAPI.create(payload);

      Alert.alert("Success", "Patient created successfully. Login details sent via email.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Create Error:", err.response?.data || err);
      const msg = err.response?.data?.message || "Failed to create patient.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* --- KEYBOARD AVOIDING VIEW --- */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: PERSONAL INFO */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Basic Information</Text>
            
            <InputField 
              label="Full Name *" 
              value={form.name} 
              onChangeText={(t) => handleChange("name", t)} 
              placeholder="e.g. ankush gupta" 
            />
            <InputField 
              label="Email Address *" 
              value={form.email} 
              onChangeText={(t) => handleChange("email", t)} 
              placeholder="john@example.com" 
              keyboardType="email-address" 
            />
            
            <View style={styles.row}>
              <View style={{ flex: 1.5, marginRight: 12 }}>
                <InputField 
                  label="Phone Number" 
                  value={form.phone} 
                  onChangeText={(t) => handleChange("phone", t)} 
                  placeholder="+91 234..." 
                  keyboardType="phone-pad" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Age" 
                  value={form.age} 
                  onChangeText={(t) => handleChange("age", t)} 
                  placeholder="30" 
                  keyboardType="numeric" 
                />
              </View>
            </View>

            <ChipSelector 
              label="Gender" 
              selectedValue={form.gender} 
              onSelect={(val) => handleChange("gender", val)} 
              options={GENDERS} 
            />
            
            <InputField 
              label="Address" 
              value={form.address} 
              onChangeText={(t) => handleChange("address", t)} 
              placeholder="Full address..." 
              multiline 
            />
          </View>

          {/* SECTION 2: AYURVEDA */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="leaf" size={20} color={colors.primary} />
              <Text style={styles.sectionHeader}>Ayurvedic Profile</Text>
            </View>
            <ChipSelector 
              label="Dosha Type" 
              selectedValue={form.doshaType} 
              onSelect={(val) => handleChange("doshaType", val)} 
              options={DOSHAS} 
            />
          </View>

          {/* SECTION 3: HEALTH METRICS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color="#FF6B6B" />
              <Text style={styles.sectionHeader}>Health Metrics</Text>
            </View>
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <InputField 
                  label="Height (cm)" 
                  value={form.height} 
                  onChangeText={(t) => handleChange("height", t)} 
                  placeholder="170" 
                  keyboardType="numeric" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Weight (kg)" 
                  value={form.weight} 
                  onChangeText={(t) => handleChange("weight", t)} 
                  placeholder="70" 
                  keyboardType="numeric" 
                />
              </View>
            </View>

            <ChipSelector 
              label="Sleep Pattern" 
              selectedValue={form.sleepPattern} 
              onSelect={(val) => handleChange("sleepPattern", val)} 
              options={SLEEP_PATTERNS} 
            />
            <ChipSelector 
              label="Bowel Movement" 
              selectedValue={form.bowelMovement} 
              onSelect={(val) => handleChange("bowelMovement", val)} 
              options={BOWEL_MOVEMENTS} 
            />
          </View>

          {/* SECTION 4: MEDICAL HISTORY */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="doctor" size={20} color="#4ECDC4" />
              <Text style={styles.sectionHeader}>Medical History</Text>
            </View>
            
            <InputField 
              label="Medical History" 
              value={form.medicalHistory} 
              onChangeText={(t) => handleChange("medicalHistory", t)} 
              placeholder="Past surgeries, chronic conditions..." 
              multiline 
            />
            <InputField 
              label="Allergies" 
              value={form.allergies} 
              onChangeText={(t) => handleChange("allergies", t)} 
              placeholder="Peanuts, Dust, Penicillin..." 
              multiline 
            />
            <InputField 
              label="Current Medications" 
              value={form.medications} 
              onChangeText={(t) => handleChange("medications", t)} 
              placeholder="List current medicines..." 
              multiline 
            />
          </View>

          {/* FOOTER BUTTON INSIDE SCROLLVIEW */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Patient</Text>
            )}
          </TouchableOpacity>

          {/* Extra Space at Bottom */}
          <View style={{ height: 60 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  backBtn: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 40 },

  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionHeader: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.foreground,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  row: { flexDirection: 'row', alignItems: 'center' },

  chipRow: { flexDirection: "row", marginBottom: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.foregroundLight },
  chipTextActive: { color: "#fff" },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});