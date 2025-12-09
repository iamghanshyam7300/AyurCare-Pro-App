import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../colors";
import FoodPickerModal from "./FoodPickerModal";

export default function EditDietDay({
  visible,
  dayIndex,
  initialMeals,
  onClose,
  onSave,
}) {
  const [breakfast, setBreakfast] = useState([]);
  const [lunch, setLunch] = useState([]);
  const [snack, setSnack] = useState([]);
  const [dinner, setDinner] = useState([]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMealType, setPickerMealType] = useState(null);

  // Load initial meals when modal opens
  useEffect(() => {
    if (visible) {
      setBreakfast(initialMeals?.breakfast || []);
      setLunch(initialMeals?.lunch || []);
      setSnack(initialMeals?.snack || []);
      setDinner(initialMeals?.dinner || []);
    }
  }, [visible]);

  const openPicker = (mealType) => {
    setPickerMealType(mealType);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerMealType(null);
  };

  /** HOW FOODS ARE ADDED */
  const addFoodsToMeal = (selected) => {
    const arr = Array.isArray(selected) ? selected : [selected];

    const mapped = arr.map((food) => ({
      ...food,
      id: food.id,               // required for saving
      quantity: food.quantity || 100,
      unit: food.unit || "gram",
      notes: food.notes || "",
    }));

    if (pickerMealType === "BREAKFAST")
      setBreakfast((p) => [...p, ...mapped]);
    else if (pickerMealType === "LUNCH")
      setLunch((p) => [...p, ...mapped]);
    else if (pickerMealType === "SNACK")
      setSnack((p) => [...p, ...mapped]);
    else if (pickerMealType === "DINNER")
      setDinner((p) => [...p, ...mapped]);

    closePicker();
  };

  const removeItem = (setter, list, index) => {
    const copy = [...list];
    copy.splice(index, 1);
    setter(copy);
  };

  const updateQuantity = (qty, index, list, setList) => {
    const copy = [...list];
    copy[index] = {
      ...copy[index],
      quantity: Math.max(50, qty), // minimum 50g
    };
    setList(copy);
  };

  const incQty = (index, list, setList) =>
    updateQuantity((list[index].quantity || 0) + 50, index, list, setList);

  const decQty = (index, list, setList) =>
    updateQuantity((list[index].quantity || 0) - 50, index, list, setList);

  const updateNote = (text, index, list, setList) => {
    const copy = [...list];
    copy[index] = { ...copy[index], notes: text };
    setList(copy);
  };

  /** CALORIE CALCULATION */
  const calculateTotal = () => {
    const sum = (list) =>
      list.reduce(
        (acc, f) => acc + (((f.calories || 0) * (f.quantity || 100)) / 100),
        0
      );
    return Math.round(
      sum(breakfast) + sum(lunch) + sum(snack) + sum(dinner)
    );
  };

  const saveDay = () => {
    onSave({
      breakfast,
      lunch,
      snack,
      dinner,
    });
  };

  const renderFoodItem = (food, index, list, setList) => (
    <View key={index} style={styles.foodRow}>
      <View style={styles.left}>
        <Text style={styles.foodName}>{food.name}</Text>

        <Text style={styles.foodMeta}>
          {Math.round(food.calories || 0)} kcal / 100g
        </Text>

        <View style={styles.noteBox}>
          <Ionicons
            name="create-outline"
            size={14}
            color={colors.primary}
            style={{ marginTop: 3, marginRight: 6 }}
          />
          <TextInput
            style={styles.noteInput}
            placeholder="Add notes..."
            placeholderTextColor={colors.foregroundLight}
            multiline
            value={food.notes}
            onChangeText={(t) => updateNote(t, index, list, setList)}
          />
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.qtyControl}>
          <TouchableOpacity onPress={() => decQty(index, list, setList)}>
            <Ionicons
              name="remove-circle-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text style={styles.qtyValue}>{food.quantity}g</Text>

          <TouchableOpacity onPress={() => incQty(index, list, setList)}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => removeItem(setList, list, index)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit Day {dayIndex + 1}</Text>
              <Text style={styles.subtitle}>{calculateTotal()} kcal total</Text>
            </View>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

            {/* BREAKFAST */}
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>Breakfast (08:00)</Text>
                <TouchableOpacity onPress={() => openPicker("BREAKFAST")}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {breakfast.map((f, i) => renderFoodItem(f, i, breakfast, setBreakfast))}
              {breakfast.length === 0 && <Text style={styles.empty}>No items</Text>}
            </View>

            {/* LUNCH */}
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>Lunch (13:00)</Text>
                <TouchableOpacity onPress={() => openPicker("LUNCH")}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {lunch.map((f, i) => renderFoodItem(f, i, lunch, setLunch))}
              {lunch.length === 0 && <Text style={styles.empty}>No items</Text>}
            </View>

            {/* SNACK */}
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>Snack (16:00)</Text>
                <TouchableOpacity onPress={() => openPicker("SNACK")}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {snack.map((f, i) => renderFoodItem(f, i, snack, setSnack))}
              {snack.length === 0 && <Text style={styles.empty}>No items</Text>}
            </View>

            {/* DINNER */}
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>Dinner (19:00)</Text>
                <TouchableOpacity onPress={() => openPicker("DINNER")}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {dinner.map((f, i) => renderFoodItem(f, i, dinner, setDinner))}
              {dinner.length === 0 && <Text style={styles.empty}>No items</Text>}
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={saveDay} style={styles.saveBtn}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FoodPickerModal
        visible={pickerVisible}
        onClose={closePicker}
        onSelect={addFoodsToMeal}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.background,
    borderRadius: 20,
    height: "90%",
    overflow: "hidden",
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 12, color: colors.foregroundLight, marginTop: 2 },

  mealCard: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    margin: 12,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mealTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },

  empty: { color: colors.foregroundLight, fontStyle: "italic" },

  foodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  left: { flex: 1, marginRight: 10 },
  foodName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  foodMeta: { fontSize: 12, color: colors.foregroundLight },

  noteBox: {
    marginTop: 6,
    backgroundColor: colors.background,
    padding: 6,
    borderRadius: 8,
    flexDirection: "row",
  },
  noteInput: { flex: 1, fontSize: 12 },

  right: { alignItems: "center" },
  qtyControl: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  qtyValue: { marginHorizontal: 8, fontSize: 14, fontWeight: "700" },
  deleteBtn: {
    padding: 6,
    backgroundColor: "#FF6B6B20",
    borderRadius: 8,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cancelBtn: { padding: 10 },
  cancelText: { color: colors.foregroundLight, fontSize: 15 },

  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  saveText: { color: "#fff", marginLeft: 6, fontWeight: "700" },
});
