// /screens/doctor/PatientManagement.js
import React, { useEffect, useState, useCallback, useLayoutEffect, useRef } from "react";
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
  Animated,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { colors } from "../../colors";
import { patientsAPI } from "../../services/api";

// --- DYNAMIC HEADER CONSTANTS ---
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;
const HEADER_CONTENT_HEIGHT = 80; 
const TOTAL_HEADER_HEIGHT = STATUSBAR_HEIGHT + HEADER_CONTENT_HEIGHT;

export default function PatientManagement({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Header Animation
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempGender, setTempGender] = useState("");
  const [tempDosha, setTempDosha] = useState("");
  const [tempSleep, setTempSleep] = useState("");
  const [tempBowel, setTempBowel] = useState("");

  const [filterGender, setFilterGender] = useState("");
  const [filterDosha, setFilterDosha] = useState("");
  const [filterSleep, setFilterSleep] = useState("");
  const [filterBowel, setFilterBowel] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadPatients();
  }, []);

  useFocusEffect(
    useCallback(() => {
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

  const onRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  useEffect(() => {
    let list = [...patients];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const name = p.user?.name?.toLowerCase() || "";
        const email = p.user?.email?.toLowerCase() || "";
        const phone = p.user?.phone?.toLowerCase?.() || "";
        const dosha = p.user?.doshaType || "";
        return name.includes(q) || email.includes(q) || phone.includes(q) || dosha.toLowerCase().includes(q);
      });
    }
    if (filterGender) list = list.filter((p) => (p.user?.gender || "").toLowerCase() === filterGender.toLowerCase());
    if (filterDosha) list = list.filter((p) => (p.user?.doshaType || "") === filterDosha);
    if (filterSleep) list = list.filter((p) => (p.sleepPattern || "") === filterSleep);
    if (filterBowel) list = list.filter((p) => (p.bowelMovement || "") === filterBowel);
    setFilteredPatients(list);
  }, [searchQuery, filterGender, filterDosha, filterSleep, filterBowel, patients]);

  const openFilterModal = () => {
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

  const getDoshaColor = (type) => {
    if (!type) return colors.primary;
    if (type.includes("VATA")) return "#A29BFE"; 
    if (type.includes("PITTA")) return "#FF7675"; 
    if (type.includes("KAPHA")) return "#55EFC4"; 
    return colors.primary;
  };

  const renderPatient = ({ item }) => {
    const name = item?.user?.name || "Unknown";
    const email = item?.user?.email || "—";
    const gender = item?.user?.gender || "—";
    const age = item?.user?.age || "—";
    const dosha = item?.user?.doshaType || null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("PatientProfile", { patientId: item.id })}
        activeOpacity={0.9}
      >
        <View style={[styles.leftStrip, dosha ? { backgroundColor: getDoshaColor(dosha) } : null]} />
        <View style={styles.cardContent}>
            <View style={styles.rowTop}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.email}>{email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </View>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.foregroundLight} />
                    <Text style={styles.metaText}>{age} yrs</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color={colors.foregroundLight} />
                    <Text style={styles.metaText}>{gender}</Text>
                </View>
                {dosha && (
                    <View style={[styles.doshaTag, { backgroundColor: getDoshaColor(dosha) + '20' }]}>
                        <Text style={[styles.doshaText, { color: getDoshaColor(dosha) }]}>{dosha}</Text>
                    </View>
                )}
            </View>
        </View>
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
      
      {/* --- FLOATING HEADER (White Background) --- */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity },
        ]}
      >
        <View style={styles.headerContent}>
            <View>
                <Text style={styles.floatingTitle}>Patients</Text>
                <Text style={styles.floatingSubtitle}>Manage your patient list</Text>
            </View>
            <TouchableOpacity 
                onPress={() => navigation.navigate("ChatEntry")} 
                style={styles.chatHeaderBtn}
            >
                {/* White icon on primary button */}
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
      </Animated.View>

      {/* --- LIST --- */}
      <Animated.FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={renderPatient}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        
        ListHeaderComponent={
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={colors.foregroundLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patients..."
                placeholderTextColor={colors.foregroundLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
              <Ionicons name="options-outline" size={24} color={filterModalVisible ? colors.primary : colors.foreground} />
            </TouchableOpacity>
          </View>
        }

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("AddPatient")}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter Patients</Text>
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
              </Picker>
            </View>
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
            <View style={styles.modalActions}>
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear All</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* --- FLOATING HEADER STYLES --- */
  floatingHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 20,
    backgroundColor: '#fff', // <--- CHANGED TO WHITE
    height: TOTAL_HEADER_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT,
    paddingHorizontal: 20,
    justifyContent: "flex-end", 
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Lighter border for white header
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  floatingTitle: { color: colors.foreground, fontSize: 24, fontWeight: "800" },
  floatingSubtitle: { color: colors.foregroundLight, fontSize: 14, marginTop: 4 },
  
  // Updated Chat Button to pop against white background
  chatHeaderBtn: {
    backgroundColor: colors.primary, // Solid primary color
    width: 44, height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  /* --- SEARCH BOX FIXED --- */
  searchRow: { 
    flexDirection: "row", 
    marginBottom: 16, 
    alignItems: "center", 
    gap: 12, 
    paddingTop: 8 
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#fff', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
    paddingHorizontal: 14,
  },
  searchInput: { 
    flex: 1, 
    color: colors.foreground, 
    fontSize: 16, 
    marginLeft: 10,
    height: '100%',
  },
  filterButton: {
    height: 50,
    width: 50,
    backgroundColor: '#fff', 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* List Content */
  listContent: { 
    paddingTop: TOTAL_HEADER_HEIGHT + 10, 
    paddingHorizontal: 16, 
    paddingBottom: 100 
  },

  /* Card */
  card: {
    backgroundColor: '#fff', 
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
  },
  leftStrip: { width: 6, height: '100%' },
  cardContent: { flex: 1, padding: 16 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  name: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  email: { fontSize: 13, color: colors.foregroundLight, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: colors.foregroundLight },
  doshaTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  doshaText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  fab: { position: "absolute", bottom: 26, right: 20, width: 60, height: 60, backgroundColor: colors.primary, borderRadius: 30, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyContainer: { marginTop: 60, alignItems: "center" },
  emptyText: { color: colors.foregroundLight },

  modalBackdrop: { flex: 1, backgroundColor: "#00000066", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 340, backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 16 },
  modalLabel: { color: colors.foregroundLight, fontSize: 14, marginBottom: 6, marginTop: 10, fontWeight: '600' },
  pickerWrap: { backgroundColor: "#f9f9f9", borderRadius: 8, borderWidth: 1, borderColor: "#ddd", overflow: "hidden" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, gap: 12 },
  clearBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  clearText: { color: colors.foregroundLight, fontWeight: "600" },
  applyBtn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  applyText: { color: "#fff", fontWeight: "700" },
});