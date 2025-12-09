// /screens/doctor/AddPatient.js
import React, { useState, useEffect } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { patientsAPI, diseaseAPI } from "../../services/api"; 
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

// --- NEW: DOSHA BADGE COMPONENT ---
const DoshaBadge = ({ name, value }) => {
  if (value === 0) return null; // Don't show neutral
  
  const isIncrease = value > 0;
  const bgColor = isIncrease ? "#FFEBEE" : "#E0F2F1"; // Red tint vs Teal tint
  const textColor = isIncrease ? "#D32F2F" : "#00695C";
  const icon = isIncrease ? "arrow-up" : "arrow-down";

  return (
    <View style={[styles.doshaBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.doshaBadgeText, { color: textColor }]}>
        {name}
      </Text>
      <Ionicons name={icon} size={10} color={textColor} style={{ marginLeft: 2 }} />
    </View>
  );
};

export default function AddPatient({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Disease State
  const [diseases, setDiseases] = useState([]); 
  const [diseaseModalVisible, setDiseaseModalVisible] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState(null);

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
    diseaseId: null,
  });

  // Load Diseases on Mount
  useEffect(() => {
    loadDiseases();
  }, []);

  const loadDiseases = async () => {
    try {
      const res = await diseaseAPI.getAll({ limit: 100 });
      let list = [];
      
      if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
          list = res.data.data.data;
      } else if (res.data && Array.isArray(res.data.data)) {
          list = res.data.data;
      } else if (Array.isArray(res.data)) {
          list = res.data;
      }

      setDiseases(list);
    } catch (err) {
      console.warn("Failed to load diseases:", err);
      setDiseases([]);
    }
  };

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
      const autoPatientCode = `P-${Date.now().toString().slice(-6)}`;
      
      let formattedDosha = form.doshaType.toUpperCase().replace(/-/g, "_");
      if (formattedDosha === "TRI_DOSHA") formattedDosha = "TRIDOSHA";

      const payload = {
        ...form,
        doctorId: user.id,
        patientCode: autoPatientCode,
        
        age: form.age ? parseInt(form.age) : null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        
        gender: form.gender.toLowerCase(),
        doshaType: formattedDosha,
        
        diseaseId: selectedDisease ? selectedDisease.id : null,
      };

      console.log("Sending Payload:", payload);
      await patientsAPI.create(payload);

      Alert.alert("Success", "Patient created successfully.", [
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

  const filteredDiseases = (diseases || []).filter(d => 
    (d.name || "").toLowerCase().includes(diseaseSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>

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
              placeholder="e.g. John Doe" 
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
                  placeholder="+91..." 
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

          {/* SECTION 2: DISEASE / CONDITION */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="stethoscope" size={22} color={colors.primary} />
              <Text style={styles.sectionHeader}>Disease / Condition</Text>
            </View>

            <Text style={styles.label}>Select Primary Condition</Text>
            <TouchableOpacity 
              style={[styles.dropdownBtn, selectedDisease && styles.dropdownBtnActive]} 
              onPress={() => setDiseaseModalVisible(true)}
            >
              {selectedDisease ? (
                <View style={styles.selectedDiseaseRow}>
                   <Text style={[styles.dropdownText, {fontWeight: '600', color: colors.foreground}]}>
                      {selectedDisease.name}
                   </Text>
                   {/* Mini badges inside selector */}
                   <View style={styles.miniBadgeRow}>
                      <DoshaBadge name="V" value={selectedDisease.vata} />
                      <DoshaBadge name="P" value={selectedDisease.pitta} />
                      <DoshaBadge name="K" value={selectedDisease.kapha} />
                   </View>
                </View>
              ) : (
                <Text style={[styles.dropdownText, {color: colors.foregroundLight}]}>
                  Search & Select Disease...
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={selectedDisease ? colors.primary : colors.foregroundLight} />
            </TouchableOpacity>
          </View>

          {/* SECTION 3: AYURVEDA */}
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

          {/* SECTION 4: HEALTH METRICS */}
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

          {/* SECTION 5: MEDICAL HISTORY */}
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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Patient</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- IMPROVED DISEASE SELECTION MODAL --- */}
      <Modal visible={diseaseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <TouchableOpacity onPress={() => setDiseaseModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Enhanced Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.foregroundLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search diseases..."
                value={diseaseSearch}
                onChangeText={setDiseaseSearch}
                placeholderTextColor={colors.foregroundLight}
                autoFocus
              />
              {diseaseSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDiseaseSearch("")}>
                   <Ionicons name="close-circle" size={18} color={colors.foregroundLight} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredDiseases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedDisease?.id === item.id;
                return (
                  <TouchableOpacity 
                    style={[styles.diseaseItem, isSelected && styles.diseaseItemActive]}
                    onPress={() => {
                      setSelectedDisease(item);
                      setDiseaseModalVisible(false);
                    }}
                  >
                    <View style={{flex: 1}}>
                        <Text style={[styles.diseaseName, isSelected && {color: colors.primary, fontWeight: '700'}]}>
                            {item.name}
                        </Text>
                        
                        {/* Dosha Badges Row */}
                        <View style={styles.badgeRow}>
                           <DoshaBadge name="Vata" value={item.vata} />
                           <DoshaBadge name="Pitta" value={item.pitta} />
                           <DoshaBadge name="Kapha" value={item.kapha} />
                        </View>
                    </View>

                    {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color={colors.border} />
                    <Text style={styles.emptyText}>No diseases found matching "{diseaseSearch}"</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionHeader: { fontSize: 18, fontWeight: "700", color: colors.foreground },

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

  /* DROPDOWN STYLES */
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  dropdownBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08', // very light tint
  },
  dropdownText: { fontSize: 15, color: colors.foreground },
  
  selectedDiseaseRow: {
      flex: 1,
  },
  miniBadgeRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "80%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  closeModalBtn: {
      padding: 4,
      backgroundColor: colors.card,
      borderRadius: 20,
  },
  
  /* Search */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    height: '100%',
  },

  /* List Items */
  diseaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent', // prepare for active state
  },
  diseaseItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '05',
  },
  diseaseName: {
    fontSize: 16,
    color: colors.foreground,
    fontWeight: '600',
    marginBottom: 6,
  },
  
  /* Badges */
  badgeRow: { flexDirection: 'row', gap: 8 },
  doshaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  doshaBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
  },

  emptyContainer: { alignItems: 'center', marginTop: 40, opacity: 0.6 },
  emptyText: { textAlign: 'center', marginTop: 12, fontSize: 16, color: colors.foregroundLight },

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