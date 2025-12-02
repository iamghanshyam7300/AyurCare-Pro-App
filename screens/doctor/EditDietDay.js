// /screens/doctor/EditDietDay.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
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
  const [breakfast, setBreakfast] = useState(initialMeals?.breakfast || []);
  const [lunch, setLunch] = useState(initialMeals?.lunch || []);
  const [dinner, setDinner] = useState(initialMeals?.dinner || []);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMealType, setPickerMealType] = useState(null);

  const openPicker = (type) => {
    setPickerMealType(type);
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerMealType(null);
  };

  const addFoodsToMeal = (selectedItems) => {
    const itemsArray = Array.isArray(selectedItems) ? selectedItems : [selectedItems];

    const newFoods = itemsArray.map((food) => ({
      ...food,
      quantity: 100, // Default for new item
      unit: "gram",
      notes: "", 
      id: food.id, 
    }));

    if (pickerMealType === "BREAKFAST") setBreakfast((prev) => [...prev, ...newFoods]);
    else if (pickerMealType === "LUNCH") setLunch((prev) => [...prev, ...newFoods]);
    else if (pickerMealType === "DINNER") setDinner((prev) => [...prev, ...newFoods]);

    closePicker();
  };

  const removeItem = (setter, arr, i) => {
    const copy = [...arr];
    copy.splice(i, 1);
    setter(copy);
  };

  // --- QUANTITY LOGIC ---
  const updateQuantity = (newQty, index, list, setList) => {
    const qty = newQty < 50 ? 50 : newQty; // Ensure minimum 50g
    const copy = [...list];
    copy[index] = { ...copy[index], quantity: qty };
    setList(copy);
  };
  
  const handleIncreaseQty = (index, list, setList) => {
    const currentQty = list[index].quantity || 0;
    updateQuantity(currentQty + 50, index, list, setList);
  };

  const handleDecreaseQty = (index, list, setList) => {
    const currentQty = list[index].quantity || 0;
    const newQty = Math.max(50, currentQty - 50); 
    updateQuantity(newQty, index, list, setList);
  };
  // -----------------------

  const updateNote = (text, index, list, setList) => {
    const copy = [...list];
    copy[index] = { ...copy[index], notes: text };
    setList(copy);
  };

  const handleSave = () => {
    // Filter out items that might have been zeroed out
    const finalBreakfast = breakfast.filter(f => f.quantity > 0);
    const finalLunch = lunch.filter(f => f.quantity > 0);
    const finalDinner = dinner.filter(f => f.quantity > 0);

    onSave({
      breakfast: finalBreakfast,
      lunch: finalLunch,
      dinner: finalDinner
    });
  };

  const calculateTotal = () => {
    // Calculates total estimated calories based on quantity
    const sum = (list) => list.reduce((acc, item) => acc + ((item.calories || 0) * (item.quantity || 100) / 100), 0);
    return Math.round(sum(breakfast) + sum(lunch) + sum(dinner));
  };

  // --- RENDER FOOD ITEM WITH STEPPER ---
  const renderFoodItem = (food, index, list, setList) => (
    <View key={index} style={styles.foodRow}>
      
      {/* LEFT COLUMN: Details + Notes */}
      <View style={styles.foodDetails}>
        <View style={styles.foodTopRow}>
            <Text style={styles.foodName}>{food.name}</Text>
        </View>

        <View style={styles.metaContainer}>
          <Text style={styles.foodMeta}>
            {Math.round(food.calories || 0)} kcal per 100g
          </Text>
        </View>
        
        {/* Note Input */}
        <View style={styles.noteContainer}>
            <Ionicons name="create-outline" size={14} color={colors.primary} style={{marginTop: 3, marginRight: 6}} />
            <TextInput 
                style={styles.noteInput}
                placeholder="Add instructions (e.g. Serve hot)..."
                placeholderTextColor={colors.foregroundLight}
                value={food.notes}
                onChangeText={(text) => updateNote(text, index, list, setList)}
                multiline={true}
            />
        </View>
      </View>
      
      {/* RIGHT COLUMN: Stepper + Remove (Better Placement) */}
      <View style={styles.controlsContainer}>
        
        {/* Stepper Group */}
        <View style={styles.stepperGroup}>
            <TouchableOpacity 
                style={styles.stepperBtn} 
                onPress={() => handleDecreaseQty(index, list, setList)}
                disabled={food.quantity <= 50}
            >
                <Ionicons name="remove" size={18} color={food.quantity <= 50 ? colors.border : colors.foreground} />
            </TouchableOpacity>

            <View style={styles.qtyDisplay}>
                <Text style={styles.qtyValue}>{food.quantity}</Text>
                <Text style={styles.qtyUnit}>{food.unit || 'g'}</Text>
            </View>

            <TouchableOpacity 
                style={styles.stepperBtn} 
                onPress={() => handleIncreaseQty(index, list, setList)}
            >
                <Ionicons name="add" size={18} color={colors.foreground} />
            </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => removeItem(setList, list, index)} style={styles.trashBtn}>
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>

          {/* HEADER */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Edit Day {dayIndex + 1}</Text>
              <Text style={styles.headerSubtitle}>{calculateTotal()} estimated kcal total</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* SCROLL CONTENT */}
          <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            
            {/* BREAKFAST */}
            <View style={styles.mealCard}>
              <View style={[styles.mealHeader, { borderLeftColor: '#F59E6C' }]}>
                <View style={styles.mealTitleRow}>
                  <Ionicons name="sunny-outline" size={18} color="#F59E6C" />
                  <Text style={styles.mealTitle}>Breakfast</Text>
                  <Text style={styles.timeLabel}>08:00</Text>
                </View>
                <TouchableOpacity onPress={() => openPicker("BREAKFAST")} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {breakfast.length === 0 ? <Text style={styles.emptyText}>No items added</Text> : breakfast.map((f, i) => renderFoodItem(f, i, breakfast, setBreakfast))}
            </View>

            {/* LUNCH */}
            <View style={styles.mealCard}>
              <View style={[styles.mealHeader, { borderLeftColor: '#D9A84C' }]}>
                <View style={styles.mealTitleRow}>
                  <Ionicons name="partly-sunny-outline" size={18} color="#D9A84C" />
                  <Text style={styles.mealTitle}>Lunch</Text>
                  <Text style={styles.timeLabel}>13:00</Text>
                </View>
                <TouchableOpacity onPress={() => openPicker("LUNCH")} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {lunch.length === 0 ? <Text style={styles.emptyText}>No items added</Text> : lunch.map((f, i) => renderFoodItem(f, i, lunch, setLunch))}
            </View>

            {/* DINNER */}
            <View style={styles.mealCard}>
              <View style={[styles.mealHeader, { borderLeftColor: '#6C5CE7' }]}>
                <View style={styles.mealTitleRow}>
                  <Ionicons name="moon-outline" size={18} color="#6C5CE7" />
                  <Text style={styles.mealTitle}>Dinner</Text>
                  <Text style={styles.timeLabel}>19:00</Text>
                </View>
                <TouchableOpacity onPress={() => openPicker("DINNER")} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              {dinner.length === 0 ? <Text style={styles.emptyText}>No items added</Text> : dinner.map((f, i) => renderFoodItem(f, i, dinner, setDinner))}
            </View>

          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveText}>Save Changes</Text>
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: colors.background, borderRadius: 20, height: "90%", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  headerSubtitle: { fontSize: 13, color: colors.foregroundLight, marginTop: 2 },
  closeBtn: { padding: 4 },

  scrollContainer: { flex: 1, padding: 16 },

  mealCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderLeftWidth: 4, paddingLeft: 10, height: 24 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  timeLabel: { fontSize: 12, color: colors.foregroundLight, backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  addBtnText: { fontSize: 12, fontWeight: "600", color: colors.primary, marginLeft: 2 },

  emptyText: { color: colors.foregroundLight, fontSize: 13, fontStyle: 'italic', marginLeft: 14 },

  /* --- FOOD ROW STYLES (New Layout) --- */
  foodRow: { 
      flexDirection: "row", 
      justifyContent: "space-between", 
      alignItems: "flex-start",
      paddingVertical: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border + '40', 
  },
  foodDetails: { 
      flex: 1, 
      marginRight: 10,
      alignItems: 'flex-start' 
  },
  foodTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  foodName: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 },
  
  metaContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 6 },
  foodMeta: { fontSize: 12, color: colors.foregroundLight, fontWeight: '500' },
  dot: { fontSize: 10, color: colors.foregroundLight, marginHorizontal: 6 },
  
  /* Note Input Styles */
  noteContainer: { 
      flexDirection: 'row', 
      alignItems: 'flex-start', 
      backgroundColor: colors.background, 
      padding: 8, 
      borderRadius: 8 
  },
  noteInput: { flex: 1, fontSize: 12, color: colors.foreground, padding: 0, minHeight: 18, maxHeight: 40 },

  /* --- QUANTITY/CONTROL STYLES --- */
  controlsContainer: { 
      flexDirection: 'column', 
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 90, // Match height of details block
  },
  stepperGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
  },
  stepperBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
  },
  qtyDisplay: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      paddingHorizontal: 4,
      width: 50,
  },
  qtyValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.foreground,
  },
  qtyUnit: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.foregroundLight,
      marginLeft: 2,
  },
  trashBtn: { 
      padding: 6,
      backgroundColor: '#FF6B6B15',
      borderRadius: 8,
  },

  /* FOOTER */
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  cancelButton: { padding: 12 },
  cancelText: { color: colors.foregroundLight, fontSize: 15, fontWeight: "600" },
  saveButton: { flexDirection: "row", backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, alignItems: "center", shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveText: { color: "#fff", marginLeft: 6, fontWeight: "700", fontSize: 15 },
});