// ===================== EditPatient.js (FULL UPDATED FILE — PASTE ALL) =====================

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../colors";
import { patientsAPI } from "../services/api";

export default function EditPatient({ route, navigation }) {
  const { patientId } = route?.params || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sleepPattern, setSleepPattern] = useState("");
  const [bowelMovement, setBowelMovement] = useState("");
  const [doshaType, setDoshaType] = useState("");

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    try {
      const response = await patientsAPI.getById(patientId);
      const p = response.data.data;

      setPatient(p);

      setHeight(String(p.height || ""));
      setWeight(String(p.weight || ""));
      setSleepPattern(p.sleepPattern || "");
      setBowelMovement(p.bowelMovement || "");
      setDoshaType(p.user?.doshaType || "");
    } catch (error) {
      console.error("❌ Error loading patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
  
      const payload = {
        height: Number(height),
        weight: Number(weight),
        sleepPattern,
        bowelMovement
      };
  
      console.log("📤 Update Payload:", payload);
  
      await patientsAPI.update(patientId, payload);

      await loadPatient();

  
      Alert.alert("Success", "Patient updated successfully");
      navigation.goBack();
  
    } catch (error) {
      console.error("❌ Update error:", error.response?.data || error);
      Alert.alert("Error", "Failed to update patient");
    } finally {
      setSaving(false);
    }
  };
  

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Small component for each editable field
  const FieldCard = ({ label, icon, children }) => (
    <View style={styles.fieldCard}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <Text style={styles.header}>Edit Patient</Text>

      {/* 2-column layout container */}
      <View style={styles.twoColumnWrap}>

        {/* ---------------------- HEIGHT ---------------------- */}
        <FieldCard label="Height (cm)" icon="resize">
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="Enter height"
            placeholderTextColor={colors.foregroundLight}
          />
        </FieldCard>

        {/* ---------------------- WEIGHT ---------------------- */}
        <FieldCard label="Weight (kg)" icon="barbell">
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Enter weight"
            placeholderTextColor={colors.foregroundLight}
          />
        </FieldCard>

        {/* ---------------------- SLEEP PATTERN ---------------------- */}
        <FieldCard label="Sleep Pattern" icon="moon">
          <View style={styles.dropdown}>
            <Picker selectedValue={sleepPattern} onValueChange={setSleepPattern}>
              <Picker.Item label="4–5 hours" value="4–5 hours" />
              <Picker.Item label="5–6 hours" value="5–6 hours" />
              <Picker.Item label="6–7 hours" value="6–7 hours" />
              <Picker.Item label="7–8 hours" value="7–8 hours" />
              <Picker.Item label="8+ hours" value="8+ hours" />
            </Picker>
          </View>
        </FieldCard>

        {/* ---------------------- BOWEL MOVEMENT ---------------------- */}
        <FieldCard label="Bowel Movement" icon="water">
          <View style={styles.dropdown}>
            <Picker selectedValue={bowelMovement} onValueChange={setBowelMovement}>
              <Picker.Item label="Regular" value="Regular" />
              <Picker.Item label="Slightly irregular" value="Slightly irregular" />
              <Picker.Item label="Constipated" value="Constipated" />
              <Picker.Item label="Loose / Diarrhea" value="Loose / Diarrhea" />
              <Picker.Item label="Hard stools" value="Hard stools" />
            </Picker>
          </View>
        </FieldCard>

        {/* ---------------------- DOSHA TYPE ---------------------- */}
        <FieldCard label="Dosha Type" icon="leaf">
          <View style={styles.dropdown}>
            <Picker selectedValue={doshaType} onValueChange={setDoshaType}>
              <Picker.Item label="VATA" value="VATA" />
              <Picker.Item label="PITTA" value="PITTA" />
              <Picker.Item label="KAPHA" value="KAPHA" />
              <Picker.Item label="VATA-PITTA" value="VATA-PITTA" />
              <Picker.Item label="VATA-KAPHA" value="VATA-KAPHA" />
              <Picker.Item label="PITTA-KAPHA" value="PITTA-KAPHA" />
              <Picker.Item label="TRIDOSHA" value="TRIDOSHA" />
            </Picker>
          </View>
        </FieldCard>
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.button} onPress={saveChanges} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Changes"}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },

  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: colors.foreground,
  },

  twoColumnWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  fieldCard: {
    width: "48%",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  label: {
    fontSize: 12,
    color: colors.foregroundLight,
  },

  input: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },

  dropdown: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 50,
  },

  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

// ===================== END OF FILE =====================
