// ======================= PatientManagement.js (Filters with Picker + Center Modal) =======================

import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { colors } from "../colors";
import { patientsAPI } from "../services/api";

export default function PatientManagement({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // modal visibility
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // filter working copy (modal)
  const [tempGender, setTempGender] = useState("");
  const [tempDosha, setTempDosha] = useState("");
  const [tempSleep, setTempSleep] = useState("");
  const [tempBowel, setTempBowel] = useState("");

  // applied filters
  const [filterGender, setFilterGender] = useState("");
  const [filterDosha, setFilterDosha] = useState("");
  const [filterSleep, setFilterSleep] = useState("");
  const [filterBowel, setFilterBowel] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPatients();
    }, [])
  );

  const loadPatients = async () => {
    try {
      const res = await patientsAPI.getAll();
      const list = res.data.data.patients || [];
      setPatients(list);
      setFilteredPatients(list);
    } catch (err) {
      console.error("Patient load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // onRefresh (fixed)
  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  /* ---------------- APPLY FILTERS & SEARCH ---------------- */
  useEffect(() => {
    let list = [...patients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const name = p.user?.name?.toLowerCase() || "";
        const email = p.user?.email?.toLowerCase() || "";
        const phone = p.user?.phone?.toLowerCase?.() || "";
        const age = String(p.user?.age || "");
        const dosha = p.user?.doshaType || "";
        const sleep = p.sleepPattern || "";
        const bowel = p.bowelMovement || "";

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          age.includes(q) ||
          dosha.toLowerCase().includes(q) ||
          sleep.toLowerCase().includes(q) ||
          bowel.toLowerCase().includes(q)
        );
      });
    }

    if (filterGender) {
      list = list.filter(
        (p) => (p.user?.gender || "").toLowerCase() === filterGender.toLowerCase()
      );
    }

    if (filterDosha) {
      list = list.filter((p) => (p.user?.doshaType || "") === filterDosha);
    }

    if (filterSleep) {
      list = list.filter((p) => (p.sleepPattern || "") === filterSleep);
    }

    if (filterBowel) {
      list = list.filter((p) => (p.bowelMovement || "") === filterBowel);
    }

    setFilteredPatients(list);
  }, [searchQuery, filterGender, filterDosha, filterSleep, filterBowel, patients]);

  /* ---------------- FILTER MODAL ACTIONS ---------------- */
  const openFilterModal = () => {
    // copy current applied filters into temp (so user can change then apply)
    setTempGender(filterGender);
    setTempDosha(filterDosha);
    setTempSleep(filterSleep);
    setTempBowel(filterBowel);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setFilterGender(tempGender);
    setFilterDosha(tempDosha);
    setFilterSleep(tempSleep);
    setFilterBowel(tempBowel);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    setTempGender("");
    setTempDosha("");
    setTempSleep("");
    setTempBowel("");
    setFilterGender("");
    setFilterDosha("");
    setFilterSleep("");
    setFilterBowel("");
    setFilterModalVisible(false);
  };

  /* ---------------- RENDER ITEM ---------------- */
  const renderPatient = ({ item }) => {
    const name = item?.user?.name || "Unknown";
    const email = item?.user?.email || "—";
    const gender = item?.user?.gender || "—";
    const age = item?.user?.age || "—";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("PatientProfile", { patientId: item.id })}
      >
        {/* avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>

        {/* info */}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.meta}>
            Age {age} • {gender}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SEARCH + FILTER ROW */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.foregroundLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, age..."
            placeholderTextColor={colors.foregroundLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
          <Ionicons name="options-outline" size={22} color={filterModalVisible ? colors.primary : colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* FILTER MODAL (CENTER POPUP) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filters</Text>

            {/* Gender Picker */}
            <Text style={styles.modalLabel}>Gender</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={tempGender}
                onValueChange={(v) => setTempGender(v)}
                mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
              >
                <Picker.Item label="Any" value="" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>

            {/* Dosha Picker */}
            <Text style={styles.modalLabel}>Dosha</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={tempDosha}
                onValueChange={(v) => setTempDosha(v)}
                mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
              >
                <Picker.Item label="Any" value="" />
                <Picker.Item label="VATA" value="VATA" />
                <Picker.Item label="PITTA" value="PITTA" />
                <Picker.Item label="KAPHA" value="KAPHA" />
                <Picker.Item label="VATA-PITTA" value="VATA-PITTA" />
                <Picker.Item label="VATA-KAPHA" value="VATA-KAPHA" />
                <Picker.Item label="PITTA-KAPHA" value="PITTA-KAPHA" />
                <Picker.Item label="TRIDOSHA" value="TRIDOSHA" />
              </Picker>
            </View>

            {/* Sleep Pattern Picker */}
            <Text style={styles.modalLabel}>Sleep Pattern</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={tempSleep}
                onValueChange={(v) => setTempSleep(v)}
                mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
              >
                <Picker.Item label="Any" value="" />
                <Picker.Item label="4–5 hours" value="4–5 hours" />
                <Picker.Item label="5–6 hours" value="5–6 hours" />
                <Picker.Item label="6–7 hours" value="6–7 hours" />
                <Picker.Item label="7–8 hours" value="7–8 hours" />
                <Picker.Item label="8+ hours" value="8+ hours" />
                <Picker.Item label="Irregular" value="Irregular" />
              </Picker>
            </View>

            {/* Bowel Movement Picker */}
            <Text style={styles.modalLabel}>Bowel Movement</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={tempBowel}
                onValueChange={(v) => setTempBowel(v)}
                mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
              >
                <Picker.Item label="Any" value="" />
                <Picker.Item label="Regular" value="Regular" />
                <Picker.Item label="Slightly irregular" value="Slightly irregular" />
                <Picker.Item label="Constipated" value="Constipated" />
                <Picker.Item label="Loose / Diarrhea" value="Loose / Diarrhea" />
                <Picker.Item label="Hard stools" value="Hard stools" />
              </Picker>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>

              <Pressable style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PATIENT LIST */}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderPatient}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddPatient")}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Search Row */
  searchRow: { flexDirection: "row", padding: 8, alignItems: "center", gap: 10 },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },

  searchInput: { flex: 1, color: colors.foreground, fontSize: 15 },

  filterButton: {
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* Modal backdrop + card (center popup) */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 },

  modalLabel: { color: colors.foregroundLight, marginTop: 8, marginBottom: 6 },

  pickerWrap: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 8,
  },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 10 },

  clearBtn: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  clearText: { color: colors.foreground, fontWeight: "600" },

  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  applyText: { color: "#fff", fontWeight: "700" },

  /* List cards */
  listContent: { padding: 16, paddingBottom: 120 },

  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 18,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: "#f1f1f1",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}22`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: { fontSize: 20, fontWeight: "700", color: colors.primary },

  name: { fontSize: 17, fontWeight: "700", color: colors.foreground },

  email: { fontSize: 14, color: colors.foregroundLight, marginTop: 4 },

  meta: { fontSize: 12, color: colors.foregroundLight, marginTop: 4 },

  emptyContainer: { marginTop: 60, alignItems: "center" },

  emptyText: { color: colors.foregroundLight },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 26,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
});

