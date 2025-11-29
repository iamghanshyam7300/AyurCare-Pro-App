// ====================== AddFoodScreen.js ======================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { colors } from "../colors";
import { foodsAPI } from "../services/api";

const FOOD_CATEGORIES = [
  "GRAINS",
  "VEGETABLES",
  "FRUITS",
  "DAIRY",
  "SPICES",
  "HERBS",
  "NUTS",
  "LEGUMES",
  "MEAT",
  "FISH",
  "OTHER",
];

export default function AddFoodScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
    vitamins: "",
    minerals: "",
    doshaEffects: "",
    benefits: "",
    precautions: "",
    imageUrl: "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      Alert.alert("Missing Fields", "Name and Category are required.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || null,
        calories: form.calories ? parseFloat(form.calories) : null,
        protein: form.protein ? parseFloat(form.protein) : null,
        carbs: form.carbs ? parseFloat(form.carbs) : null,
        fat: form.fat ? parseFloat(form.fat) : null,
        fiber: form.fiber ? parseFloat(form.fiber) : null,

        // JSON fields must be strings
        vitamins: form.vitamins ? JSON.stringify(form.vitamins.split(",")) : null,
        minerals: form.minerals ? JSON.stringify(form.minerals.split(",")) : null,
        doshaEffects: form.doshaEffects
          ? JSON.stringify(form.doshaEffects.split(","))
          : null,
        benefits: form.benefits
          ? JSON.stringify(form.benefits.split(","))
          : null,
        precautions: form.precautions
          ? JSON.stringify(form.precautions.split(","))
          : null,

        imageUrl: form.imageUrl || null,
      };

      console.log("📤 Creating Food:", payload);

      await foodsAPI.create(payload);

      Alert.alert("Success", "Food added successfully!");
      navigation.goBack();
    } catch (error) {
        console.log("Food create error:", error?.response?.data || error);
  Alert.alert("Error", JSON.stringify(error?.response?.data));
      Alert.alert("Error", "Could not add food.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Add New Food</Text>

      {/* NAME */}
      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter food name"
        value={form.name}
        onChangeText={(t) => handleChange("name", t)}
      />

      {/* CATEGORY */}
      <Text style={styles.label}>Category *</Text>
      <View style={styles.pillContainer}>
        {FOOD_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => handleChange("category", cat)}
            style={[
              styles.pill,
              form.category === cat && styles.pillActive,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                form.category === cat && styles.pillTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* DESCRIPTION */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={form.description}
        onChangeText={(t) => handleChange("description", t)}
      />

      {/* NUMERIC FIELDS */}
      <Text style={styles.label}>Nutritional Values</Text>

      <TextInput
        style={styles.input}
        placeholder="Calories (kcal)"
        keyboardType="numeric"
        value={form.calories}
        onChangeText={(t) => handleChange("calories", t)}
      />

      <TextInput
        style={styles.input}
        placeholder="Protein (g)"
        keyboardType="numeric"
        value={form.protein}
        onChangeText={(t) => handleChange("protein", t)}
      />

      <TextInput
        style={styles.input}
        placeholder="Carbs (g)"
        keyboardType="numeric"
        value={form.carbs}
        onChangeText={(t) => handleChange("carbs", t)}
      />

      <TextInput
        style={styles.input}
        placeholder="Fat (g)"
        keyboardType="numeric"
        value={form.fat}
        onChangeText={(t) => handleChange("fat", t)}
      />

      <TextInput
        style={styles.input}
        placeholder="Fiber (g)"
        keyboardType="numeric"
        value={form.fiber}
        onChangeText={(t) => handleChange("fiber", t)}
      />

      {/* LIST FIELDS */}
      <Text style={styles.label}>Vitamins (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="C, B6, D, E"
        value={form.vitamins}
        onChangeText={(t) => handleChange("vitamins", t)}
      />

      <Text style={styles.label}>Minerals (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="Potassium, Iron"
        value={form.minerals}
        onChangeText={(t) => handleChange("minerals", t)}
      />

      <Text style={styles.label}>Dosha Effects (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="Good for Vata, Neutral for Pitta"
        value={form.doshaEffects}
        onChangeText={(t) => handleChange("doshaEffects", t)}
      />

      <Text style={styles.label}>Benefits (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="Boosts energy, Improves digestion"
        value={form.benefits}
        onChangeText={(t) => handleChange("benefits", t)}
      />

      <Text style={styles.label}>Precautions (comma separated)</Text>
      <TextInput
        style={styles.input}
        placeholder="Avoid excessive intake"
        value={form.precautions}
        onChangeText={(t) => handleChange("precautions", t)}
      />

      {/* IMAGE URL */}
      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/image.jpg"
        value={form.imageUrl}
        onChangeText={(t) => handleChange("imageUrl", t)}
      />

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Add Food</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: colors.foreground,
  },

  input: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pillActive: {
    backgroundColor: colors.primary,
  },

  pillText: {
    fontSize: 13,
    color: colors.foreground,
  },

  pillTextActive: {
    color: "#fff",
  },

  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 28,
    marginBottom: 40,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
