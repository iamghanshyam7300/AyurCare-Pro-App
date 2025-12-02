// screens/AddFoodScreen.js
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
  Platform, // Added Platform for status bar spacing
  StatusBar, // Added StatusBar
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { foodsAPI } from "../../services/api";

const FOOD_CATEGORIES = [
  "GRAINS", "VEGETABLES", "FRUITS", "DAIRY", "SPICES",
  "HERBS", "NUTS", "LEGUMES", "MEAT", "FISH", "OTHER",
];

const DOSHA_TYPES = [
  "Vata", 
  "Pitta", 
  "Kapha", 
  "Vata-Pitta", 
  "Pitta-Kapha", 
  "Vata-Kapha", 
  "Tri-Dosha"
];

export default function AddFoodScreen({ navigation, route }) {
  const { isEditMode, foodToEdit } = route?.params || {};
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "GRAINS",
    description: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    rasa: "",
    virya: "",
    guna: "",
    vipaka: "",
    dosha: "",
    imageUrl: "",
    notes: "",
  });

  useEffect(() => {
    // --- FIX: HIDE THE DUPLICATE HEADER ---
    navigation.setOptions({ 
      headerShown: false, 
    });

    // Handle Edit Mode Pre-fill
    if (isEditMode && foodToEdit) {
      setForm({
        name: foodToEdit.name || "",
        category: (foodToEdit.category || "OTHER").toUpperCase(),
        description: foodToEdit.description || "",
        calories: foodToEdit.calories ? String(foodToEdit.calories) : "",
        protein: foodToEdit.protein ? String(foodToEdit.protein) : "",
        carbs: foodToEdit.carbs ? String(foodToEdit.carbs) : "",
        fat: foodToEdit.fat ? String(foodToEdit.fat) : "",
        rasa: foodToEdit.rasa || "",
        virya: foodToEdit.virya || "",
        guna: foodToEdit.guna || "",
        vipaka: foodToEdit.vipaka || "",
        dosha: foodToEdit.dosha || "",
        imageUrl: foodToEdit.imageUrl || "",
        notes: foodToEdit.notes || "",
      });
    }
  }, [isEditMode, foodToEdit, navigation]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || null,
        calories: form.calories ? parseFloat(form.calories) : null,
        protein: form.protein ? parseFloat(form.protein) : null,
        carbs: form.carbs ? parseFloat(form.carbs) : null,
        fat: form.fat ? parseFloat(form.fat) : null,
        rasa: form.rasa || null,
        virya: form.virya || null,
        guna: form.guna || null,
        vipaka: form.vipaka || null,
        dosha: form.dosha || null,
        imageUrl: form.imageUrl || null,
        notes: form.notes || null,
      };

      if (isEditMode && foodToEdit?.id) {
        await foodsAPI.update(foodToEdit.id, payload);
        Alert.alert("Success", "Food updated successfully!", [
           { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        await foodsAPI.create(payload);
        Alert.alert("Success", "Food added successfully!", [
           { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.log("Save Error:", error?.response?.data || error);
      Alert.alert("Error", "Could not save food.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* STATUS BAR FILLER (Optional, ensures header doesn't touch top of screen) */}
      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 40 }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* HEADER ROW */}
        <View style={styles.headerRow}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
           </TouchableOpacity>
           <Text style={styles.title}>{isEditMode ? "Edit Food" : "Add New Food"}</Text>
           <View style={{width: 32}} /> 
        </View>

        {/* --- BASIC INFO --- */}
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(t) => handleChange("name", t)}
          placeholder="e.g. Basmati Rice"
          placeholderTextColor={colors.foregroundLight}
        />

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {FOOD_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleChange("category", cat)}
              style={[styles.chip, form.category === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={form.description}
          onChangeText={(t) => handleChange("description", t)}
          placeholder="Brief description..."
          placeholderTextColor={colors.foregroundLight}
        />

        {/* --- NUTRITION --- */}
        <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
        <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Calories</Text>
              <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.calories}
                  onChangeText={(t) => handleChange("calories", t)}
                  placeholder="0"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Protein (g)</Text>
              <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.protein}
                  onChangeText={(t) => handleChange("protein", t)}
                  placeholder="0"
              />
            </View>
        </View>
        <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Carbs (g)</Text>
              <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.carbs}
                  onChangeText={(t) => handleChange("carbs", t)}
                  placeholder="0"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Fat (g)</Text>
              <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.fat}
                  onChangeText={(t) => handleChange("fat", t)}
                  placeholder="0"
              />
            </View>
        </View>

        {/* --- AYURVEDIC PROPERTIES --- */}
        <View style={styles.ayurSection}>
          <View style={styles.ayurHeader}>
              <MaterialCommunityIcons name="flower-tulip" size={20} color={colors.primary} />
              <Text style={styles.ayurTitle}>Ayurvedic Properties</Text>
          </View>

          <Text style={styles.label}>Dosha Type</Text>
          <View style={styles.chipWrap}>
              {DOSHA_TYPES.map((dt) => (
              <TouchableOpacity
                  key={dt}
                  onPress={() => handleChange("dosha", dt)}
                  style={[styles.chip, styles.chipAyur, form.dosha === dt && styles.chipActive]}
              >
                  <Text style={[styles.chipText, form.dosha === dt && styles.chipTextActive]}>{dt}</Text>
              </TouchableOpacity>
              ))}
          </View>

          <View style={styles.row}>
              <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Rasa (Taste)</Text>
                  <TextInput
                      style={styles.input}
                      value={form.rasa}
                      onChangeText={(t) => handleChange("rasa", t)}
                      placeholder="Sweet, Sour..."
                  />
              </View>
              <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Virya (Potency)</Text>
                  <TextInput
                      style={styles.input}
                      value={form.virya}
                      onChangeText={(t) => handleChange("virya", t)}
                      placeholder="Hot / Cold"
                  />
              </View>
          </View>

          <View style={styles.row}>
              <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Vipaka (Post-Digest)</Text>
                  <TextInput
                      style={styles.input}
                      value={form.vipaka}
                      onChangeText={(t) => handleChange("vipaka", t)}
                      placeholder="Sweet/Pungent"
                  />
              </View>
              <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Guna (Quality)</Text>
                  <TextInput
                      style={styles.input}
                      value={form.guna}
                      onChangeText={(t) => handleChange("guna", t)}
                      placeholder="Heavy, Light..."
                  />
              </View>
          </View>
        </View>

        {/* --- EXTRAS --- */}
        <Text style={styles.label}>Image URL</Text>
        <View style={styles.imageRow}>
           {form.imageUrl ? <Image source={{uri: form.imageUrl}} style={styles.preview} /> : null}
           <TextInput
              style={[styles.input, {flex:1}]}
              value={form.imageUrl}
              onChangeText={(t) => handleChange("imageUrl", t)}
              placeholder="https://..."
           />
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, {height: 60}]}
          multiline
          value={form.notes}
          onChangeText={(t) => handleChange("notes", t)}
          placeholder="Any additional info..."
        />

        {/* --- BUTTON --- */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{isEditMode ? "Update Food" : "Add Food"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    marginTop: 10 
  },
  backButton: {
    padding: 4,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  label: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 6, color: colors.foreground },
  subLabel: { fontSize: 12, color: colors.foregroundLight, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 12, color: colors.primary, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  input: { backgroundColor: colors.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.foreground, marginBottom: 8 },
  textArea: { height: 80, textAlignVertical: "top" },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  halfInput: { flex: 1 },

  chipScroll: { flexDirection: "row", marginBottom: 12 },
  chipWrap: { flexDirection: "row", flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  
  chip: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipAyur: { marginRight: 0 }, 
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.foreground },
  chipTextActive: { color: "#fff" },

  ayurSection: { backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.primary + "40", marginTop: 20, marginBottom: 10 },
  ayurHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ayurTitle: { fontSize: 16, fontWeight: "700", color: colors.primary, marginLeft: 8, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  preview: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#eee' },

  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, marginTop: 30, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});