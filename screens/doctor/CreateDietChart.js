// /screens/doctor/CreateDietChart.js
import React, { useState, useEffect, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { dietPlansAPI, patientsAPI, diseaseAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

import EditDietDay from "./EditDietDay";

const DOSHA_TYPES = [
  "VATA",
  "PITTA",
  "KAPHA",
  "VATA_PITTA",
  "PITTA_KAPHA",
  "VATA_KAPHA",
  "TRIDOSHA",
];

// ----------------- Helpers -----------------
const safeNum = (v) => (v === undefined || v === null ? 0 : Number(v));
const cloneDays = (days) =>
  days.map((d) => ({
    breakfast: [...(d.breakfast || [])],
    lunch: [...(d.lunch || [])],
    snack: [...(d.snack || [])],
    dinner: [...(d.dinner || [])],
  }));

const flattenDaysToItems = (days) => {
  const out = [];
  days.forEach((day, idx) => {
    const dayNumber = idx + 1;
    const push = (arr, mealType, defaultTime) =>
      (arr || []).forEach((f) => {
        out.push({
          itemId: f.itemId ?? null,
          foodId: f.foodId ?? f.id ?? null,
          name: f.name,
          calories: f.calories,
          quantity: f.quantity ?? 1,
          unit: f.unit ?? "serving",
          notes: f.notes ?? "",
          time: f.time ?? defaultTime,
          dayNumber,
          mealType,
        });
      });
    push(day.breakfast, "BREAKFAST", "08:00");
    push(day.lunch, "LUNCH", "13:00");
    push(day.snack, "SNACK", "16:00");
    push(day.dinner, "DINNER", "19:00");
  });
  return out;
};

const itemChanged = (backendItem, localItem) => {
  if (!backendItem || !localItem) return true;
  return (
    (backendItem.foodId || "") !== (localItem.foodId || "") ||
    safeNum(backendItem.quantity) !== safeNum(localItem.quantity) ||
    (backendItem.unit || "") !== (localItem.unit || "") ||
    (backendItem.time || "") !== (localItem.time || "") ||
    (backendItem.notes || "") !== (localItem.notes || "") ||
    safeNum(backendItem.dayNumber) !== safeNum(localItem.dayNumber) ||
    (backendItem.mealType || "") !== (localItem.mealType || "")
  );
};

// ----------------- Header Component -----------------
const PlanHeader = ({
  isEditMode,
  chartName,
  setChartName,
  description,
  setDescription,
  selectedPatient,
  onOpenPatientModal,
  doshaType,
  setDoshaType,
  daysCount,
  getDiseaseName,
}) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.screenTitle}>
        {isEditMode ? "Edit Plan" : "Create New Plan"}
      </Text>

      <Text style={styles.label}>Assign To *</Text>
      <TouchableOpacity
        style={[
          styles.selectBtn,
          selectedPatient && {
            borderColor: colors.primary,
            backgroundColor: colors.primary + "10",
          },
        ]}
        onPress={onOpenPatientModal}
      >
        <Text
          style={[
            styles.selectBtnText,
            !selectedPatient
              ? { color: colors.foregroundLight }
              : { color: colors.primary, fontWeight: "700" },
          ]}
        >
          {selectedPatient ? selectedPatient.name : "Select Patient..."}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={
            selectedPatient ? colors.primary : colors.foregroundLight
          }
        />
      </TouchableOpacity>

      {/* --- Patient Detail Box --- */}
      {selectedPatient && (
        <View style={styles.patientDetailBox}>
          <Text style={styles.patientDetailTitle}>Patient Details</Text>

          <View style={styles.patientDetailRow}>
            <Text style={styles.patientDetailLabel}>Disease:</Text>
            <Text style={styles.patientDetailValue}>
              {selectedPatient.diseaseName || "Not Provided"}
            </Text>
          </View>

          <View style={styles.patientDetailRow}>
            <Text style={styles.patientDetailLabel}>Medical History:</Text>
            <Text style={styles.patientDetailValue}>
              {selectedPatient.medicalHistory || "None"}
            </Text>
          </View>

          <View style={styles.patientDetailRow}>
            <Text style={styles.patientDetailLabel}>Allergies:</Text>
            <Text style={styles.patientDetailValue}>
              {selectedPatient.allergies || "None"}
            </Text>
          </View>

          <View style={styles.patientDetailRow}>
            <Text style={styles.patientDetailLabel}>Medications:</Text>
            <Text style={styles.patientDetailValue}>
              {selectedPatient.medications || "None"}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.label}>Plan Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 7-Day Weight Balance"
        placeholderTextColor={colors.foregroundLight}
        value={chartName}
        onChangeText={setChartName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Brief goal of this plan..."
        placeholderTextColor={colors.foregroundLight}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Dosha Focus</Text>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
      >
        {DOSHA_TYPES.map((type) => {
          const isActive = doshaType === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setDoshaType(type)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}
              >
                {type.replace("_", "-")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>
        Daily Schedule ({daysCount} days)
      </Text>
    </View>
  );
};

// ----------------- Main Component -----------------
export default function CreateDietChart({ navigation, route }) {
  const { user } = useAuth();
  const chartId = route?.params?.chartId;
const preselectedPatientId = route?.params?.patientId || null;

  const isEditMode = !!chartId;

  const [loadingChart, setLoadingChart] = useState(false);
  const [saving, setSaving] = useState(false);

  // Metadata
  const [chartName, setChartName] = useState("");
  const [description, setDescription] = useState("");
  const [doshaType, setDoshaType] = useState("VATA");

  // Patients
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Diseases
  const [diseases, setDiseases] = useState([]);

  // Days
  const [days, setDays] = useState([
    { breakfast: [], lunch: [], snack: [], dinner: [] },
  ]);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editorVisible, setEditorVisible] = useState(false);

  useEffect(() => {
    loadPatients();
    loadDiseases();
    if (isEditMode) loadChart();
  }, []);

  const loadDiseases = async () => {
  try {
    const res = await diseaseAPI.getAll();
    const list = res.data?.data || [];  // <-- ONLY the array
    
    setDiseases(list);
  } catch (err) {
    console.warn("Disease load failed:", err);
  }
};


 const getDiseaseName = (id) => {
  if (!id || !Array.isArray(diseases)) return "Not Provided";

  const found = diseases.find((d) => d.id === id);

  return found?.name || "Unknown Disease";
};


  const loadPatients = async () => {
  try {
    setLoadingPatients(true);
    const res = await patientsAPI.getMine();

    const list = res.data?.data || res.data || [];

    const normalized = list.map((p) => ({
  ...p,

  // disease props
  diseaseId: p.disease?.id ?? null,
  diseaseName: p.disease?.name ?? null,

  // correct unique patient identifier
  id: p.patientId,      

  // user properties
  name: p.name || p.user?.name,
  email: p.email || p.user?.email,
  userId: p.userId,
}));


    setPatients(normalized);

    // ✅ AUTO SELECT PATIENT COMING FROM PatientProfile
    if (preselectedPatientId) {
      const found = normalized.find((x) => x.id === preselectedPatientId);

      console.log("Auto-selected patient:", found);

      if (found) {
        setSelectedPatient(found);
      }
    }

  } catch (err) {
    console.warn("Load patients error:", err);
  } finally {
    setLoadingPatients(false);
  }
};

  const loadChart = async () => {
    try {
      setLoadingChart(true);
      const res = await dietPlansAPI.getById(chartId);
      const chart = res.data?.data || res.data;

      setChartName(chart.name || "");
      setDescription(chart.description || "");
      setDoshaType(chart.doshaType || "VATA");

      // Patient assignment
      if (chart.patient) {
        setSelectedPatient(chart.patient);
      } else if (chart.patientId) {
        setSelectedPatient({
          id: chart.patientId,
          name: "Assigned Patient",
        });
      }

      // Load items into days
      if (Array.isArray(chart.items) && chart.items.length > 0) {
        const maxDay = Math.max(...chart.items.map((i) => i.dayNumber || 1));
        const newDays = Array.from({ length: maxDay }, () => ({
          breakfast: [],
          lunch: [],
          snack: [],
          dinner: [],
        }));

        chart.items.forEach((it) => {
          const dayIdx = (it.dayNumber || 1) - 1;
          const mealKey = (it.mealType || "BREAKFAST").toLowerCase();
          newDays[dayIdx][mealKey].push({
            itemId: it.id,
            foodId: it.foodId,
            name: it.food?.name || it.name,
            calories: it.food?.calories || 0,
            quantity: it.quantity ?? 1,
            unit: it.unit ?? "serving",
            notes: it.notes ?? "",
            time: it.time,
          });
        });

        setDays(newDays);
      }
    } catch (err) {
      console.error("Load chart error:", err);
      Alert.alert("Error", "Could not load plan.");
      navigation.goBack();
    } finally {
      setLoadingChart(false);
    }
  };

  const openEditor = (index) => {
    setEditingIndex(index);
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditingIndex(null);
    setEditorVisible(false);
  };

  const addDay = () =>
    setDays((prev) => [
      ...cloneDays(prev),
      { breakfast: [], lunch: [], snack: [], dinner: [] },
    ]);

  const deleteDay = (index) => {
    Alert.alert("Delete Day", `Remove Day ${index + 1}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setDays((prev) => {
            const copy = cloneDays(prev);
            copy.splice(index, 1);
            return copy;
          });
        },
      },
    ]);
  };

  const onSaveDay = (index, meals) => {
    setDays((prev) => {
      const copy = cloneDays(prev);
      copy[index] = meals;
      return copy;
    });
    closeEditor();
  };

  // ---------------- SAVE ALL ----------------
  const saveAll = async () => {
    if (!selectedPatient)
      return Alert.alert("Missing Field", "Please assign a patient.");

    if (!chartName.trim())
      return Alert.alert("Missing Field", "Plan name is required.");

    const actionText = isEditMode ? "Update" : "Save";

    Alert.alert(
      `${actionText} Plan`,
      `Assign to ${selectedPatient.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          onPress: async () => {
            try {
              setSaving(true);

              const baseMetadata = {
  name: chartName,
  description: description || "",
  doshaType,
  duration: days.length,
  patientId: selectedPatient.userId,   // <-- FIXED
};

              // CREATE MODE
              if (!isEditMode) {
                const items = flattenDaysToItems(days).map((it) => ({
                  dayNumber: it.dayNumber,
                  mealType: it.mealType,
                  foodId: it.foodId,
                  quantity: it.quantity,
                  unit: it.unit,
                  time: it.time,
                  notes: it.notes,
                }));

                await dietPlansAPI.create({
                  ...baseMetadata,
                  doctorId: user.id,
                  items,
                });

                Alert.alert("Success", "Diet chart saved!");
                navigation.goBack();
                return;
              }

              // EDIT MODE
              await dietPlansAPI.update(chartId, baseMetadata);

              const existingRes = await dietPlansAPI.getItems(chartId);
              const existingItems = existingRes.data?.data || [];

              const existingById = {};
              existingItems.forEach((it) => (existingById[it.id] = it));

              const currentFlat = flattenDaysToItems(days);

              const currentIds = new Set();
              const updates = [];
              const creates = [];

              currentFlat.forEach((it) => {
                if (it.itemId) {
                  currentIds.add(it.itemId);
                  const prev = existingById[it.itemId];
                  if (itemChanged(prev, it)) {
                    updates.push({
                      itemId: it.itemId,
                      payload: {
                        foodId: it.foodId,
                        quantity: it.quantity,
                        unit: it.unit,
                        time: it.time,
                        notes: it.notes,
                        dayNumber: it.dayNumber,
                        mealType: it.mealType,
                      },
                    });
                  }
                } else {
                  creates.push({
                    payload: {
                      foodId: it.foodId,
                      quantity: it.quantity,
                      unit: it.unit,
                      time: it.time,
                      notes: it.notes,
                      dayNumber: it.dayNumber,
                      mealType: it.mealType,
                    },
                  });
                }
              });

              const deletes = existingItems.filter(
                (it) => !currentIds.has(it.id)
              );

              const promises = [];
              deletes.forEach((d) =>
                promises.push(dietPlansAPI.deleteItem(d.id))
              );
              updates.forEach((u) =>
                promises.push(
                  dietPlansAPI.updateItem(u.itemId, u.payload)
                )
              );
              creates.forEach((c) =>
                promises.push(dietPlansAPI.addItem(chartId, c.payload))
              );

              await Promise.all(promises);

              Alert.alert("Success", "Diet plan updated!");
              navigation.goBack();
            } catch (err) {
              console.error("Save error:", err);
              Alert.alert("Error", "Could not save plan.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderDayItem = useCallback(({ item, index }) => {
    let total = 0;
    let hasNotes = false;

    ["breakfast", "lunch", "snack", "dinner"].forEach((m) =>
      (item[m] || []).forEach((f) => {
        total += (f.calories || 0) * (f.quantity || 100) / 100;
        if (f.notes?.trim()) hasNotes = true;
      })
    );

    return (
      <View style={styles.dayWrapper}>
        <View style={styles.timelineLine} />
        <View style={styles.timelineDot} />

        <TouchableOpacity
          style={styles.dayCard}
          onPress={() => openEditor(index)}
        >
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>Day {index + 1}</Text>

            <View style={styles.dayActions}>
              <View style={styles.dayStat}>
                <Ionicons
                  name="flame-outline"
                  size={16}
                  color={colors.foregroundLight}
                />
                <Text style={styles.dayStatText}>
                  {Math.round(total)} kcal
                </Text>
              </View>

              {hasNotes && (
                <View style={styles.notesIndicator}>
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                </View>
              )}

              <TouchableOpacity
                onPress={() => openEditor(index)}
                style={styles.iconBtn}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteDay(index)}
                style={[styles.iconBtn, styles.deleteBtn]}
              >
                <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.mealSummary}>
            <View style={styles.mealRow}>
              <Ionicons name="sunny-outline" size={14} color="#F59E6C" />
              <Text style={styles.mealText} numberOfLines={1}>
                <Text style={{ fontWeight: "600" }}>B: </Text>
                {(item.breakfast || [])
                  .map((f) => `${f.name} (${f.quantity}${(f.unit || "").charAt(0)})`)
                  .join(", ") || "—"}
              </Text>
            </View>

            <View style={styles.mealRow}>
              <Ionicons name="partly-sunny-outline" size={14} color="#D9A84C" />
              <Text style={styles.mealText} numberOfLines={1}>
                <Text style={{ fontWeight: "600" }}>L: </Text>
                {(item.lunch || [])
                  .map((f) => `${f.name} (${f.quantity}${(f.unit || "").charAt(0)})`)
                  .join(", ") || "—"}
              </Text>
            </View>

            <View style={styles.mealRow}>
              <Ionicons name="cafe-outline" size={14} color="#E67E22" />
              <Text style={styles.mealText} numberOfLines={1}>
                <Text style={{ fontWeight: "600" }}>S: </Text>
                {(item.snack || [])
                  .map((f) => `${f.name} (${f.quantity}${(f.unit || "").charAt(0)})`)
                  .join(", ") || "—"}
              </Text>
            </View>

            <View style={styles.mealRow}>
              <Ionicons name="moon-outline" size={14} color="#6C5CE7" />
              <Text style={styles.mealText} numberOfLines={1}>
                <Text style={{ fontWeight: "600" }}>D: </Text>
                {(item.dinner || [])
                  .map((f) => `${f.name} (${f.quantity}${(f.unit || "").charAt(0)})`)
                  .join(", ") || "—"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, []);

  if (isEditMode && loadingChart) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.foregroundLight }}>
          Loading plan...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <FlatList
          data={days}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderDayItem}
          extraData={selectedPatient}
          ListHeaderComponent={
            <PlanHeader
              isEditMode={isEditMode}
              chartName={chartName}
              setChartName={setChartName}
              description={description}
              setDescription={setDescription}
              selectedPatient={selectedPatient}
              onOpenPatientModal={() => setPatientModalVisible(true)}
              doshaType={doshaType}
              setDoshaType={setDoshaType}
              daysCount={days.length}
              getDiseaseName={getDiseaseName}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addDayText}>Add Day</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={saveAll}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEditMode ? "Update Plan" : "Save Plan"}
              </Text>
            )}
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Day Editor */}
        {editorVisible && editingIndex !== null && (
          <EditDietDay
            visible={editorVisible}
            dayIndex={editingIndex}
            initialMeals={days[editingIndex]}
            onClose={closeEditor}
            onSave={(m) => onSaveDay(editingIndex, m)}
          />
        )}

        {/* Patient Modal */}
        <Modal visible={patientModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Patient</Text>
                <TouchableOpacity
                  onPress={() => setPatientModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {loadingPatients ? (
                <View style={styles.centerLoader}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : patients.length === 0 ? (
                <Text style={styles.emptyPatientsText}>No patients found.</Text>
              ) : (
                <FlatList
                  data={patients}
                  keyExtractor={(item) => item.id?.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.patientItem}
                     onPress={() => {
                        const p = patients.find(x => x.id === item.id); // always pick normalized version
                        console.log("Selected patient object:", p);
                        setSelectedPatient(p);
                        setPatientModalVisible(false);
                      }}

                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.name?.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{item.name}</Text>
                        {item.email && (
                          <Text style={styles.patientEmail}>{item.email}</Text>
                        )}
                      </View>

                      {selectedPatient?.id === item.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------------- STYLES ---------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 20 },

  headerContainer: { marginBottom: 10 },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 15,
    color: colors.foreground,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },

  selectBtnText: { fontSize: 15, fontWeight: "500" },

  chipScroll: { flexDirection: "row", marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.foregroundLight },
  chipTextActive: { color: "#fff" },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 12,
  },

  /* Patient Detail Box */
  patientDetailBox: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  patientDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 10,
  },
  patientDetailRow: { marginBottom: 8 },
  patientDetailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foregroundLight,
  },
  patientDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    marginTop: 2,
  },

  /* Day List */
  dayWrapper: { flexDirection: "row", marginBottom: 16 },
  timelineLine: {
    width: 2,
    backgroundColor: colors.border,
    position: "absolute",
    left: 9,
    top: 0,
    bottom: -16,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    position: "absolute",
    left: 0,
    top: 14,
    borderWidth: 4,
    borderColor: "#fff",
  },

  dayCard: {
    flex: 1,
    marginLeft: 30,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },

  dayActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 4, marginLeft: 8 },

  dayStat: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  dayStatText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foregroundLight,
    marginLeft: 4,
  },

  notesIndicator: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: colors.primary + "10",
    borderRadius: 6,
  },

  mealSummary: { gap: 6 },
  mealRow: { flexDirection: "row", alignItems: "center" },
  mealText: { fontSize: 13, color: colors.foreground, marginLeft: 8, flex: 1 },

  deleteBtn: {},

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },

  addDayBtn: { flexDirection: "row", alignItems: "center" },
  addDayText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },

  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", marginRight: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "70%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },

  centerLoader: { marginTop: 40, alignItems: "center" },

  patientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: colors.primary },
  patientName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  patientEmail: { fontSize: 12, color: colors.foregroundLight },

  emptyPatientsText: {
    textAlign: "center",
    marginTop: 20,
    color: colors.foregroundLight,
  },
});

