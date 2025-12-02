// /screens/doctor/CreateDietChart.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { dietPlansAPI, patientsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

import EditDietDay from "./EditDietDay";

const DOSHA_TYPES = ["VATA", "PITTA", "KAPHA", "VATA_PITTA", "PITTA_KAPHA", "VATA_KAPHA", "TRIDOSHA"];

// --- HELPER FUNCTION (DEFINED OUTSIDE FOR STABILITY AND ACCESS) ---
const calculateDaySummary = (day) => {
    let totalCals = 0;
    let hasNotes = false;

    if (!day || !day.meals) return { totalCals: 0, hasNotes: false };

    Object.keys(day.meals).forEach(meal => {
        // Ensure meal array exists before mapping
        (day.meals[meal] || []).forEach(food => { 
            // Calculate total calories adjusted by quantity
            totalCals += (food.calories || 0) * (food.quantity || 100) / 100;
            if (food.notes && food.notes.trim()) {
                hasNotes = true;
            }
        });
    });

    return { totalCals: Math.round(totalCals), hasNotes };
};
// --- END HELPER ---


export default function CreateDietChart({ navigation, route }) {
  const { user } = useAuth();
  
  const chartId = route?.params?.chartId; 
  const isEditMode = !!chartId;
  const [loadingChart, setLoadingChart] = useState(false);

  // Metadata
  const [chartName, setChartName] = useState("");
  const [description, setDescription] = useState("");
  const [doshaType, setDoshaType] = useState("VATA");
  
  // Patient Selection
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Days Data
  const [days, setDays] = useState([{ breakfast: [], lunch: [], dinner: [] }]);

  // Editor Modal
  const [editingIndex, setEditingIndex] = useState(null); 
  const [editorVisible, setEditorVisible] = useState(false);

  // --- COMPLEX ANALYSIS (useMemo is fine here) ---
  const planSummary = useMemo(() => {
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;
    let vataScore = 0, pittaScore = 0, kaphaScore = 0;
    let heatingScore = 0, coolingScore = 0;

    days.forEach(day => {
      ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        (day[meal] || []).forEach(food => {
          const qtyRatio = (food.quantity || 100) / 100;
          totalCals += (food.calories || 0) * qtyRatio;
          totalProt += (food.protein || 0) * qtyRatio;
          totalCarbs += (food.carbs || 0) * qtyRatio;
          totalFats += (food.fat || 0) * qtyRatio;
          const d = (food.dosha || "").toLowerCase();
          if (d.includes('vata')) vataScore++;
          if (d.includes('pitta')) pittaScore++;
          if (d.includes('kapha')) kaphaScore++;
          const v = (food.virya || "").toLowerCase();
          if (v.includes('hot')) heatingScore++;
          if (v.includes('cold')) coolingScore++;
        });
      });
    });

    const numDays = Math.max(days.length, 1);
    let dominantDosha = "Balanced";
    if (vataScore > pittaScore && vataScore > kaphaScore) dominantDosha = "Vata Aggravating";
    else if (pittaScore > vataScore && pittaScore > kaphaScore) dominantDosha = "Pitta Aggravating";
    else if (kaphaScore > vataScore && kaphaScore > pittaScore) dominantDosha = "Kapha Aggravating";
    let nature = "Neutral";
    if (heatingScore > coolingScore) nature = "Heating (Ushna)";
    if (coolingScore > heatingScore) nature = "Cooling (Sheeta)";

    return {
      avgCal: Math.round(totalCals / numDays),
      avgProt: Math.round(totalProt / numDays),
      avgCarb: Math.round(totalCarbs / numDays),
      avgFat: Math.round(totalFats / numDays),
      dominantDosha,
      nature,
    };
  }, [days]);

  // --- LOAD DATA ---
  useEffect(() => {
    loadPatients();
    if (isEditMode) loadChartDetails();
  }, []);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      const res = await patientsAPI.getMine(); 
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setPatients(list);
    } catch (err) {
      console.log("Error loading patients:", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadChartDetails = async () => {
    // ... loading chart details logic (unchanged)
    try {
      setLoadingChart(true);
      const res = await dietPlansAPI.getById(chartId);
      const chart = res.data.data || res.data;

      setChartName(chart.name);
      setDescription(chart.description);
      setDoshaType(chart.doshaType);
      
      if (chart.patient) setSelectedPatient(chart.patient);
      else if (chart.patientId) setSelectedPatient({ id: chart.patientId, name: "Loading..." }); 

      if (chart.items && chart.items.length > 0) {
        const maxDay = Math.max(...chart.items.map(i => i.dayNumber));
        const newDays = Array.from({ length: maxDay }, () => ({ breakfast: [], lunch: [], dinner: [] }));

        chart.items.forEach(item => {
          const dayIdx = item.dayNumber - 1;
          const mealKey = item.mealType.toLowerCase(); 
          if (newDays[dayIdx] && newDays[dayIdx][mealKey]) {
            newDays[dayIdx][mealKey].push({
              id: item.foodId,
              name: item.food?.name || "Food Item",
              calories: item.food?.calories || 0,
              quantity: item.quantity,
              unit: item.unit,
              notes: item.notes,
              time: item.time
            });
          }
        });
        setDays(newDays);
      }
    } catch (err) {
      console.log("Error loading chart:", err);
      Alert.alert("Error", "Could not load details.");
      navigation.goBack();
    } finally {
      setLoadingChart(false);
    }
  };

  const openEditor = (index) => { setEditingIndex(index); setEditorVisible(true); };
  const closeEditor = () => { setEditingIndex(null); setEditorVisible(false); };
  
  const addDay = () => setDays((prev) => [...prev, { breakfast: [], lunch: [], dinner: [] }]);
  
  const deleteDay = (index) => {
    Alert.alert("Delete Day", `Remove Day ${index + 1}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          setDays((prev) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
          });
      }},
    ]);
  };

  const onSaveDay = (index, newMeals) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[index] = newMeals;
      return copy;
    });
    closeEditor();
  };

  const saveAll = async () => {
    if (!user?.id) return Alert.alert("Error", "User not logged in.");
    if (!selectedPatient) return Alert.alert("Missing Field", "Please assign a patient."); 

    const patientId = selectedPatient?.id || selectedPatient?._id || selectedPatient?.userId; 
    
    if (!patientId) return Alert.alert("Error", "Selected patient has no valid ID.");

    if (!chartName.trim()) return Alert.alert("Missing Field", "Please give the plan a name.");
    if (days.length === 0) return Alert.alert("Empty Plan", "Please add at least one day.");

    const items = [];
    days.forEach((d, idx) => {
      const dayNumber = idx + 1;
      const mapFood = (food, mealType, defaultTime) => ({
        dayNumber, mealType, foodId: food.id,
        quantity: food.quantity || 1, unit: food.unit || "serving", time: food.time || defaultTime, notes: food.notes || ""
      });
      (d.breakfast || []).forEach((f) => items.push(mapFood(f, "BREAKFAST", "08:00")));
      (d.lunch || []).forEach((f) => items.push(mapFood(f, "LUNCH", "13:00")));
      (d.dinner || []).forEach((f) => items.push(mapFood(f, "DINNER", "19:00")));
    });

    if (items.length === 0) return Alert.alert("Empty Days", "Add food items.");

    const actionText = isEditMode ? "Update" : "Save";
    Alert.alert(`${actionText} Plan`, `Assign to ${selectedPatient.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: actionText, onPress: async () => {
          try {
            const basePayload = {
              name: chartName,
              description: description || `Diet plan for ${selectedPatient.name}`,
              doshaType: doshaType,
              duration: days.length,
              items: items, 
            };

            if (isEditMode) {
                const { items, ...metadataToUpdate } = basePayload; 
                await dietPlansAPI.update(chartId, metadataToUpdate);
            } else {
                await dietPlansAPI.create({
                    ...basePayload,
                    doctorId: user.id,
                    patientId: patientId, 
                });
            }
            
            Alert.alert("Success", "Diet chart saved!");
            navigation.goBack();
          } catch (err) {
            console.error("Save error:", err.response?.data || err);
            Alert.alert("Error", "Failed to save.");
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>{isEditMode ? "Edit Plan" : "Create New Plan"}</Text>
      
      {/* Patient Selector */}
      <Text style={styles.label}>Assign To *</Text>
      <TouchableOpacity 
        style={[styles.selectBtn, selectedPatient && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} 
        onPress={() => setPatientModalVisible(true)}
      >
        <Text style={[styles.selectBtnText, !selectedPatient ? {color: colors.foregroundLight} : {color: colors.primary, fontWeight: '700'}]}>
          {selectedPatient ? selectedPatient.name : "Select Patient..."}
        </Text>
        <Ionicons 
            name="chevron-down" 
            size={20} 
            color={selectedPatient ? colors.primary : colors.foregroundLight} 
        />
      </TouchableOpacity>

      {/* Name Input */}
      <Text style={styles.label}>Plan Name *</Text>
      <TextInput 
        style={styles.input}
        placeholder="e.g. 7-Day Weight Balance"
        placeholderTextColor={colors.foregroundLight}
        value={chartName}
        onChangeText={setChartName}
      />

      {/* Description Input */}
      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]}
        placeholder="Brief goal of this plan..."
        placeholderTextColor={colors.foregroundLight}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      {/* Dosha Selector */}
      <Text style={styles.label}>Dosha Focus</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {DOSHA_TYPES.map(type => {
          const isActive = doshaType === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setDoshaType(type)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {type.replace("_", "-")}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Daily Schedule ({days.length} days)</Text>
      
      {/* ANALYSIS CARD - Added for completeness, but may need stabilization */}
      {/* <View style={styles.analysisCard}> ... </View> */}
    </View>
  );

  const renderDayItem = ({ item, index }) => {
    const summary = calculateDaySummary(item);
    
    return (
      <View style={styles.dayWrapper}>
        <View style={styles.timelineLine} />
        <View style={styles.timelineDot} />
        
        <TouchableOpacity
          style={styles.dayCard}
          onPress={() => openEditor(index)}
          activeOpacity={0.9}
        >
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>Day {index + 1}</Text>
            <View style={styles.dayActions}>
                
                {/* Calories Display */}
                <View style={styles.dayStat}>
                    <Ionicons name="flame-outline" size={16} color={colors.foregroundLight} />
                    {/* FIX: Ensure Text is wrapped */}
                    <Text style={styles.dayStatText}>{summary.totalCals} kcal</Text>
                </View>

                {/* Notes Indicator */}
                {summary.hasNotes && (
                   <View style={styles.notesIndicator}>
                       <Ionicons name="pencil" size={14} color={colors.primary} />
                   </View>
                )}

                {/* Edit Button */}
                <TouchableOpacity onPress={() => openEditor(index)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity onPress={() => deleteDay(index)} style={[styles.iconBtn, styles.deleteBtn]}>
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mealSummary}>
             <View style={styles.mealRow}>
               <Ionicons name="sunny-outline" size={14} color="#F59E6C" style={{marginTop:2}} />
               <Text style={styles.mealText} numberOfLines={1}>
                 <Text style={{fontWeight:'600'}}> B: </Text>
                 {(item.breakfast || []).map(f => `${f.name} (${f.quantity}${f.unit.charAt(0)})`).join(", ") || "—"}
               </Text>
             </View>
             <View style={styles.mealRow}>
               <Ionicons name="partly-sunny-outline" size={14} color="#D9A84C" style={{marginTop:2}} />
               <Text style={styles.mealText} numberOfLines={1}>
                 <Text style={{fontWeight:'600'}}> L: </Text>
                 {(item.lunch || []).map(f => `${f.name} (${f.quantity}${f.unit.charAt(0)})`).join(", ") || "—"}
               </Text>
             </View>
             <View style={styles.mealRow}>
               <Ionicons name="moon-outline" size={14} color="#6C5CE7" style={{marginTop:2}} />
               <Text style={styles.mealText} numberOfLines={1}>
                 <Text style={{fontWeight:'600'}}> D: </Text>
                 {(item.dinner || []).map(f => `${f.name} (${f.quantity}${f.unit.charAt(0)})`).join(", ") || "—"}
               </Text>
             </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loadingChart) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.background}}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop:10, color: colors.foregroundLight}}>Loading Plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={days}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderDayItem}
        ListHeaderComponent={renderHeader} 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* --- BOTTOM ACTIONS --- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.addDayText}>Add Day</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={saveAll}>
          <Text style={styles.saveBtnText}>{isEditMode ? "Update" : "Save"} Plan</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}
      {editorVisible && typeof editingIndex === "number" && (
        <EditDietDay
          visible={editorVisible}
          dayIndex={editingIndex}
          initialMeals={days[editingIndex]}
          onClose={closeEditor}
          onSave={(updatedMeals) => onSaveDay(editingIndex, updatedMeals)}
        />
      )}

      {/* --- PATIENT PICKER MODAL --- */}
      <Modal visible={patientModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Patient</Text>
              <TouchableOpacity onPress={() => setPatientModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            
            {loadingPatients ? (
              <View style={styles.centerLoader}> <ActivityIndicator color={colors.primary} /> </View>
            ) : patients.length === 0 ? (
              <Text style={styles.emptyPatientsText}>No patients found.</Text>
            ) : (
              <FlatList 
                data={patients}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.patientItem}
                    onPress={() => { setSelectedPatient(item); setPatientModalVisible(false); }}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || "U"}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.patientName}>{item.name}</Text>
                      {item.email && <Text style={styles.patientEmail}>{item.email}</Text>}
                    </View>
                    {selectedPatient && (selectedPatient.id === item.id || selectedPatient._id === item._id) && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: { marginBottom: 10 },
  screenTitle: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8, marginTop: 12 },
  
  input: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 15, color: colors.foreground },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  
  selectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
  selectBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  selectBtnText: { fontSize: 15, color: colors.foreground, fontWeight: '500' },

  chipScroll: { flexDirection: "row", marginTop: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.foregroundLight },
  chipTextActive: { color: "#fff" },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 },

  dayWrapper: { flexDirection: 'row', marginBottom: 16 },
  timelineLine: { width: 2, backgroundColor: colors.border, position: 'absolute', left: 9, top: 0, bottom: -16 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, position: 'absolute', left: 0, top: 14, borderWidth: 4, borderColor: '#fff', zIndex: 1 },
  
  dayCard: { flex: 1, marginLeft: 30, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  dayActions: { flexDirection: 'row' },
  iconBtn: { padding: 4, marginLeft: 8 },
  
  mealSummary: { gap: 6 },
  mealRow: { flexDirection: 'row', alignItems: 'center' },
  mealText: { fontSize: 13, color: colors.foreground, marginLeft: 8, flex: 1 },

  dayStat: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  dayStatText: { fontSize: 13, fontWeight: '600', color: colors.foregroundLight, marginLeft: 4 },
  notesIndicator: { marginLeft: 8, padding: 4, backgroundColor: colors.primary + '10', borderRadius: 6 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  addDayText: { marginLeft: 8, fontSize: 15, fontWeight: "600", color: colors.primary },
  
  saveBtn: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: "#fff", fontWeight: "700", marginRight: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  
  centerLoader: { marginTop: 40, alignItems: 'center' },
  emptyPatientsText: { textAlign: 'center', marginTop: 20, color: colors.foregroundLight },

  patientItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  patientName: { fontSize: 16, fontWeight: '600', color: colors.foreground },
});