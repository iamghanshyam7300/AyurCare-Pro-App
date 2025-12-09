// /screens/doctor/AddFoodScreen.js
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
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { colors } from "../../colors";
import { foodsAPI } from "../../services/api";

const FOOD_CATEGORIES = [
  "GRAINS", "VEGETABLES", "FRUITS", "DAIRY", "SPICES",
  "HERBS", "NUTS", "LEGUMES", "MEAT", "FISH", "OTHER",
];

// --- 1. REUSABLE INPUT FIELD ---
const InputField = ({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }) => (
  <View style={styles.inputGroup}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
    </View>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      placeholder={placeholder}
      placeholderTextColor="#A0AEC0"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
    />
  </View>
);

// --- 2. CHIP SELECTOR ---
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
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

// --- 3. DOSHA ROW ---
const DoshaRow = ({ label, value, onChange, color, tintColor }) => {
  return (
    <View style={styles.doshaRow}>
      <View style={[styles.doshaLabelContainer, { backgroundColor: tintColor }]}>
        <Text style={[styles.doshaText, { color: color }]}>{label}</Text>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onChange(itemValue)}
          style={styles.picker}
          mode="dropdown"
          dropdownIconColor={colors.foreground}
        >
          <Picker.Item label="Neutral (0)" value={0} />
          <Picker.Item label="Increases (+)" value={1} />
          <Picker.Item label="Decreases (-)" value={-1} />
        </Picker>
      </View>
    </View>
  );
};

export default function AddFoodScreen({ navigation, route }) {
  const { isEditMode, foodToEdit } = route?.params || {};
  const [loading, setLoading] = useState(false);

  // DOSHA
  const [dosha, setDosha] = useState({ vata: 0, pitta: 0, kapha: 0 });

  const [form, setForm] = useState({
    name: "",
    category: "GRAINS",
    description: "",
    imageUrl: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    rasa: "",
    virya: "",
    guna: "",
    vipaka: "",
    benefits: "",
    precautions: "",
  });

  // LOAD EXISTING DATA IN EDIT MODE
  useEffect(() => {
    navigation.setOptions({ headerShown: false });

    const parseList = (val) => {
      if (!val) return "";
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.join(", ") : String(parsed);
      } catch {
        return val;
      }
    };

    if (isEditMode && foodToEdit) {
      setForm({
        name: foodToEdit.name || "",
        category: (foodToEdit.category || "OTHER").toUpperCase(),
        description: foodToEdit.description || "",
        imageUrl: foodToEdit.imageUrl || "",
        calories: foodToEdit.calories?.toString() || "",
        protein: foodToEdit.protein?.toString() || "",
        carbs: foodToEdit.carbs?.toString() || "",
        fat: foodToEdit.fat?.toString() || "",
        rasa: foodToEdit.rasa || "",
        virya: foodToEdit.virya || "",
        guna: foodToEdit.guna || "",
        vipaka: foodToEdit.vipaka || "",
        benefits: parseList(foodToEdit.benefits),
        precautions: parseList(foodToEdit.precautions),
      });

      if (foodToEdit.vata !== undefined) {
        setDosha({
          vata: foodToEdit.vata,
          pitta: foodToEdit.pitta,
          kapha: foodToEdit.kapha,
        });
      }
    }
  }, [isEditMode, foodToEdit]);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const handleDoshaChange = (type, val) => setDosha((p) => ({ ...p, [type]: val }));

  // ================================
  // ✅ FIXED SUBMIT LOGIC (NO UI changes)
  // ================================
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Food name is required.");
      return;
    }

    setLoading(true);

    try {
      const safeFloat = (v) => (v ? parseFloat(v) || 0 : 0);

      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || "",
        imageUrl: form.imageUrl || "",
        calories: safeFloat(form.calories),
        protein: safeFloat(form.protein),
        carbs: safeFloat(form.carbs),
        fat: safeFloat(form.fat),

        rasa: form.rasa,
        virya: form.virya,
        guna: form.guna,
        vipaka: form.vipaka,

        // Dosha fields as integers
        vata: dosha.vata,
        pitta: dosha.pitta,
        kapha: dosha.kapha,

        // Backend expects **string**, not JSON array
        benefits: form.benefits || "",
        precautions: form.precautions || "",
      };

      console.log("Submitting Payload:", JSON.stringify(payload));

      if (isEditMode && foodToEdit?.id) {
        await foodsAPI.update(foodToEdit.id, payload);
        Alert.alert("Success", "Food updated!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      } else {
        await foodsAPI.create(payload);
        Alert.alert("Success", "Food created!", [{ text: "OK", onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      console.log("Save Error:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to save food.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={styles.title}>{isEditMode ? "Edit Food" : "New Food Item"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* BASIC INFORMATION */}
          <View style={[styles.sectionCard, { borderTopColor: colors.primary }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "20" }]}>
                <MaterialCommunityIcons name="food-apple-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.sectionHeader}>Basic Information</Text>
            </View>

            <InputField label="Food Name *" value={form.name} onChangeText={(t) => handleChange("name", t)} />

            <ChipSelector
              label="Category *"
              selectedValue={form.category}
              onSelect={(v) => handleChange("category", v)}
              options={FOOD_CATEGORIES}
            />

            <InputField
              label="Description"
              value={form.description}
              onChangeText={(t) => handleChange("description", t)}
              multiline
            />

            <Text style={styles.label}>Image URL</Text>
            <View style={styles.imageRow}>
              {form.imageUrl ? (
                <Image source={{ uri: form.imageUrl }} style={styles.preview} />
              ) : (
                <View style={styles.previewEmpty}>
                  <Ionicons name="image-outline" size={24} color="#CBD5E0" />
                </View>
              )}

              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={form.imageUrl}
                onChangeText={(t) => handleChange("imageUrl", t)}
                placeholder="https://example.com/image.jpg"
              />
            </View>
          </View>

          {/* NUTRITION */}
          <View style={[styles.sectionCard, { borderTopColor: "#FF8A65" }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
                <MaterialCommunityIcons name="nutrition" size={20} color="#D84315" />
              </View>
              <Text style={[styles.sectionHeader, { color: "#BF360C" }]}>Nutrition (per 100g)</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <InputField label="Calories" value={form.calories} onChangeText={(t) => handleChange("calories", t)} keyboardType="numeric" />
              </View>
              <View style={styles.halfInput}>
                <InputField label="Protein (g)" value={form.protein} onChangeText={(t) => handleChange("protein", t)} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <InputField label="Carbs (g)" value={form.carbs} onChangeText={(t) => handleChange("carbs", t)} keyboardType="numeric" />
              </View>
              <View style={styles.halfInput}>
                <InputField label="Fat (g)" value={form.fat} onChangeText={(t) => handleChange("fat", t)} keyboardType="numeric" />
              </View>
            </View>
          </View>

          {/* AYURVEDIC PROFILE */}
          <View style={[styles.sectionCard, { borderTopColor: "#66BB6A" }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
                <MaterialCommunityIcons name="leaf" size={20} color="#2E7D32" />
              </View>
              <Text style={[styles.sectionHeader, { color: "#1B5E20" }]}>Ayurvedic Profile</Text>
            </View>

            <Text style={styles.label}>Dosha Balance</Text>

            <View style={styles.doshaContainer}>
              <DoshaRow label="Vata" color="#5E35B1" tintColor="#EDE7F6" value={dosha.vata} onChange={(v) => handleDoshaChange("vata", v)} />
              <View style={styles.divider} />

              <DoshaRow label="Pitta" color="#C62828" tintColor="#FFEBEE" value={dosha.pitta} onChange={(v) => handleDoshaChange("pitta", v)} />
              <View style={styles.divider} />

              <DoshaRow label="Kapha" color="#00695C" tintColor="#E0F2F1" value={dosha.kapha} onChange={(v) => handleDoshaChange("kapha", v)} />
            </View>

            <View style={[styles.row, { marginTop: 20 }]}>
              <View style={styles.halfInput}>
                <InputField label="Rasa" value={form.rasa} onChangeText={(t) => handleChange("rasa", t)} />
              </View>
              <View style={styles.halfInput}>
                <InputField label="Virya" value={form.virya} onChangeText={(t) => handleChange("virya", t)} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <InputField label="Vipaka" value={form.vipaka} onChangeText={(t) => handleChange("vipaka", t)} />
              </View>
              <View style={styles.halfInput}>
                <InputField label="Guna" value={form.guna} onChangeText={(t) => handleChange("guna", t)} />
              </View>
            </View>
          </View>

          {/* INSIGHTS */}
          <View style={[styles.sectionCard, { borderTopColor: "#42A5F5" }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                <MaterialCommunityIcons name="information-variant" size={20} color="#1565C0" />
              </View>
              <Text style={[styles.sectionHeader, { color: "#0D47A1" }]}>Insights</Text>
            </View>

            <InputField
              label="Health Benefits"
              value={form.benefits}
              onChangeText={(t) => handleChange("benefits", t)}
              multiline
            />

            <InputField
              label="Precautions"
              value={form.precautions}
              onChangeText={(t) => handleChange("precautions", t)}
              multiline
            />
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Food Item</Text>}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* -------------------------- STYLES -------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    elevation: 2,
  },

  title: { fontSize: 18, fontWeight: "700", color: "#2D3748" },
  backButton: { padding: 4 },

  scrollContent: { padding: 16 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    borderTopWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  sectionHeader: { fontSize: 16, fontWeight: "700", color: "#2D3748" },

  inputGroup: { marginBottom: 16 },
  labelRow: { marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#4A5568" },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2D3748",
  },

  textArea: { minHeight: 80, textAlignVertical: "top" },

  imageRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  preview: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  previewEmpty: { width: 56, height: 56, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#EDF2F7", justifyContent: "center", alignItems: "center", borderRadius: 8 },

  row: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },

  chipRow: { flexDirection: "row", marginBottom: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#EDF2F7",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  chipTextActive: { color: "#fff" },

  doshaContainer: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, overflow: "hidden" },
  doshaRow: { flexDirection: "row", height: 50 },
  doshaLabelContainer: { width: "30%", justifyContent: "center", paddingLeft: 12, borderRightWidth: 1, borderRightColor: "#E2E8F0" },
  doshaText: { fontSize: 14, fontWeight: "700" },

  pickerContainer: { flex: 1, justifyContent: "center" },
  picker: { width: "100%", color: "#2D3748" },

  divider: { height: 1, backgroundColor: "#E2E8F0" },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
