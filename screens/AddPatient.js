// -------------------------------------------------------
// AddPatient.js (Improved UI Only)
// -------------------------------------------------------

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors } from "../colors";
import { patientsAPI } from "../services/api";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../contexts/AuthContext";

export default function AddPatient({ navigation }) {
  const { user } = useAuth();
  const doctorId = user?.id;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    doshaType: "",
    height: "",
    weight: "",
    sleepPattern: "",
    bowelMovement: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const generatePatientCode = () => {
    return "P-" + Date.now();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      return Alert.alert("Missing Fields", "Name and Email are required.");
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      age: Number(form.age),
      gender: form.gender,
      doshaType: form.doshaType,
      height: Number(form.height),
      weight: Number(form.weight),
      sleepPattern: form.sleepPattern,
      bowelMovement: form.bowelMovement,
      doctorId: doctorId,
      patientCode: generatePatientCode(),
    };

    console.log("📤 Sending Payload:", payload);

    setLoading(true);

    try {
      await patientsAPI.create(payload);
      Alert.alert("Success", "Patient added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error creating patient:", error);
      Alert.alert("Error", "Failed to add patient. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>

      {/* ---------------- Section Card 1 ---------------- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>User Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full name"
          placeholderTextColor={colors.foregroundLight}
          value={form.name}
          onChangeText={(v) => handleChange("name", v)}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          keyboardType="email-address"
          placeholderTextColor={colors.foregroundLight}
          value={form.email}
          onChangeText={(v) => handleChange("email", v)}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          placeholderTextColor={colors.foregroundLight}
          value={form.phone}
          onChangeText={(v) => handleChange("phone", v)}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age"
          keyboardType="numeric"
          placeholderTextColor={colors.foregroundLight}
          value={form.age}
          onChangeText={(v) => handleChange("age", v)}
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.dropdown}>
          <Picker
            selectedValue={form.gender}
            onValueChange={(v) => handleChange("gender", v)}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text style={styles.label}>Dosha Type</Text>
        <View style={styles.dropdown}>
          <Picker
            selectedValue={form.doshaType}
            onValueChange={(v) => handleChange("doshaType", v)}
          >
            <Picker.Item label="Select Dosha" value="" />
            <Picker.Item label="VATA" value="VATA" />
            <Picker.Item label="PITTA" value="PITTA" />
            <Picker.Item label="KAPHA" value="KAPHA" />
            <Picker.Item label="VATA-PITTA" value="VATA-PITTA" />
            <Picker.Item label="PITTA-KAPHA" value="PITTA-KAPHA" />
            <Picker.Item label="VATA-KAPHA" value="VATA-KAPHA" />
          </Picker>
        </View>
      </View>

      {/* ---------------- Section Card 2 ---------------- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Health Information</Text>

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter height"
          keyboardType="numeric"
          placeholderTextColor={colors.foregroundLight}
          value={form.height}
          onChangeText={(v) => handleChange("height", v)}
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter weight"
          keyboardType="numeric"
          placeholderTextColor={colors.foregroundLight}
          value={form.weight}
          onChangeText={(v) => handleChange("weight", v)}
        />

        <Text style={styles.label}>Sleep Pattern</Text>
        <View style={styles.dropdown}>
          <Picker
            selectedValue={form.sleepPattern}
            onValueChange={(v) => handleChange("sleepPattern", v)}
          >
            <Picker.Item label="Select Sleep Pattern" value="" />
            <Picker.Item label="5-6" value="5-6" />
            <Picker.Item label="6-7" value="6-7" />
            <Picker.Item label="7-8" value="7-8" />
            <Picker.Item label="8-9" value="8-9" />
            <Picker.Item label="Irregular" value="Irregular" />
          </Picker>
        </View>

        <Text style={styles.label}>Bowel Movement</Text>
        <View style={styles.dropdown}>
          <Picker
            selectedValue={form.bowelMovement}
            onValueChange={(v) => handleChange("bowelMovement", v)}
          >
            <Picker.Item label="Select" value="" />
            <Picker.Item label="Regular" value="Regular" />
            <Picker.Item label="Irregular" value="Irregular" />
            <Picker.Item label="Constipation" value="Constipation" />
            <Picker.Item label="Loose Motion" value="Loose Motion" />
          </Picker>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Patient</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  card: {
    backgroundColor: colors.card,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 15,
  },

  label: {
    color: colors.foreground,
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },

  dropdown: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },

  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
