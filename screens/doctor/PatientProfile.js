// /screens/doctor/PatientProfile.js
import React, { useState, useCallback } from "react"; // Changed Imports
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // ✅ IMPORT THIS
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { patientsAPI } from "../../services/api";
import { diseaseAPI } from "../../services/api";


// ... (DietPlanDetailModal remains unchanged) ...
const DietPlanDetailModal = ({ visible, plan, onClose }) => {
  if (!plan) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{plan.name}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.modalDesc}>{plan.description}</Text>
          
          <View style={styles.modalMetaRow}>
            <View style={styles.modalBadge}>
               <Ionicons name="leaf" size={14} color={colors.primary} />
               <Text style={styles.modalBadgeText}>{plan.doshaType ? plan.doshaType.replace('_', '-') : "Tri-Dosha"}</Text>
            </View>
            <View style={styles.modalBadge}>
               <Ionicons name="calendar" size={14} color={colors.foregroundLight} />
               <Text style={[styles.modalBadgeText, {color: colors.foreground}]}>{plan.duration} Days</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <Text style={styles.sectionHeader}>Schedule</Text>

          {Array.from({ length: plan.duration }).map((_, i) => {
             const dayNum = i + 1;
             const dayItems = plan.items?.filter(item => item.dayNumber === dayNum) || [];
             if(dayItems.length === 0) return null;

             return (
               <View key={dayNum} style={styles.dayBlock}>
                  <Text style={styles.dayTitle}>Day {dayNum}</Text>
                  {dayItems.map((item, idx) => (
                    <View key={idx} style={styles.foodItem}>
                        <View style={{width: 60}}>
                            <Text style={styles.mealType}>{item.mealType}</Text>
                            <Text style={styles.mealTime}>{item.time}</Text>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.foodName}>{item.food?.name || "Food Item"}</Text>
                            {item.notes ? <Text style={styles.foodNotes}>{item.notes}</Text> : null}
                        </View>
                        <Text style={styles.foodQty}>{item.quantity} {item.unit}</Text>
                    </View>
                  ))}
               </View>
             )
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

// --- COMPONENT: Condition Card ---
const ConditionCard = ({ diseaseName }) => {
  const hasDisease = diseaseName && diseaseName !== "None recorded";
  return (
    <View style={[styles.conditionCard, !hasDisease && { backgroundColor: '#f9f9f9', borderColor: '#eee' }]}>
      <View style={[styles.conditionIconBox, !hasDisease && { backgroundColor: '#eee' }]}>
        <MaterialCommunityIcons name="stethoscope" size={24} color={hasDisease ? "#E67E22" : colors.foregroundLight} />
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.conditionLabel, !hasDisease && { color: colors.foregroundLight }]}>Primary Condition</Text>
        <Text style={[styles.conditionValue, !hasDisease && { color: colors.foregroundLight, fontWeight: '400', fontStyle: 'italic' }]}>
            {diseaseName || "None recorded"}
        </Text>
      </View>
    </View>
  );
};

export default function PatientProfile({ route, navigation }) {
  const { patientId } = route?.params || {};
  
  const [patient, setPatient] = useState(null);
  const [dietPlans, setDietPlans] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ✅ FIX: Use useFocusEffect instead of useEffect
  // This runs every time the screen comes into focus (e.g., returning from Edit)
  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [patientId])
  );

  const loadPatientData = async () => {
  try {
    if (!patient) setLoading(true);

    const [patientRes, dietPlansRes] = await Promise.all([
      patientsAPI.getById(patientId),
      patientsAPI.getDietPlans(patientId),
    ]);

    const p = patientRes.data.data;

    // 🔥 FIX: If user has diseaseId but no disease object → fetch disease details
    if (p.user?.diseaseId && !p.user.disease) {
      try {
        const diseaseRes = await diseaseAPI.getById(p.user.diseaseId);
        p.user.disease = diseaseRes.data.data;
      } catch (e) {
        console.warn("Could not fetch disease details:", e);
      }
    }

    setPatient(p);
    setDietPlans(dietPlansRes.data.data);

  } catch (error) {
    console.error("Error loading patient data:", error);
  } finally {
    setLoading(false);
  }
};


  const handleDelete = () => {
    Alert.alert("Delete Patient?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await patientsAPI.delete(patientId);
            Alert.alert("Deleted", "Patient removed successfully");
            navigation.goBack();
          } catch (error) {
            Alert.alert("Error", "Failed to delete patient");
          }
        },
      },
    ]);
  };

  if (loading || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const user = patient.user || {};
  // ✅ Get disease name safely
  const diseaseName = user.disease?.name || "None recorded";

  // --- INFO CARD COMPONENT ---
  const InfoCard = ({ label, value, icon, fullWidth = false }) => (
    <View style={[styles.infoCard, fullWidth && { width: '100%' }]}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );

  // --- LONG TEXT BLOCK COMPONENT ---
  const TextBlock = ({ label, value, icon, color = colors.foreground }) => (
    <View style={styles.textBlock}>
        <View style={styles.textBlockHeader}>
            <MaterialCommunityIcons name={icon} size={18} color={color} />
            <Text style={[styles.textBlockLabel, { color: color }]}>{label}</Text>
        </View>
        <Text style={styles.textBlockValue}>{value || "None recorded"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.headerTextContainer}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
            </View>
        </View>
      </View>

      {/* --- TABS --- */}
      <View style={styles.tabContainer}>
        {["profile", "diet"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "profile" ? "Profile" : "Diet Plans"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ================= PROFILE TAB ================= */}
        {activeTab === "profile" && (
          <>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.grid}>
                <InfoCard label="Age" value={`${user.age || patient.age} yrs`} icon="calendar-outline" />
                <InfoCard label="Gender" value={user.gender || patient.gender} icon="person-outline" />
                <InfoCard label="Phone" value={user.phone} icon="call-outline" />
                <InfoCard label="Dosha" value={user.doshaType ? user.doshaType.replace('_', '-') : '-'} icon="leaf-outline" />
                
                <InfoCard label="Address" value={user.address} icon="location-outline" fullWidth />
            </View>

            <Text style={styles.sectionTitle}>Health Metrics</Text>
            <View style={styles.grid}>
                <InfoCard label="Height" value={`${patient.height} cm`} icon="resize-outline" />
                <InfoCard label="Weight" value={`${patient.weight} kg`} icon="scale-outline" />
                <InfoCard label="Sleep" value={patient.sleepPattern} icon="moon-outline" />
                <InfoCard label="Digestion" value={patient.bowelMovement} icon="water-outline" />
            </View>

            <Text style={styles.sectionTitle}>Medical Profile</Text>

            {/* ✅ CONDITION CARD */}
            <ConditionCard diseaseName={diseaseName} />

            <View style={styles.medicalCard}>
                <TextBlock label="Medical History" value={user.medicalHistory} icon="clipboard-text-outline" color="#4ECDC4" />
                <View style={styles.divider} />
                <TextBlock label="Allergies" value={user.allergies} icon="alert-circle-outline" color="#FF6B6B" />
                <View style={styles.divider} />
                <TextBlock label="Current Medications" value={user.medications} icon="pill" color={colors.primary} />
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditPatient", { patientId })}>
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
          </>
        )}

        {/* ================= DIET PLANS TAB ================= */}
        {activeTab === "diet" && (
          <View>
            {dietPlans.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="food-apple-outline" size={48} color={colors.border} />
                    <Text style={styles.emptyText}>No diet plans assigned.</Text>
                </View>
            ) : (
                dietPlans.map((plan) => (
                    <TouchableOpacity 
                        key={plan.id} 
                        style={styles.planCard}
                        onPress={() => setSelectedPlan(plan)}
                    >
                        <View style={[styles.leftStrip, {backgroundColor: '#A29BFE'}]} />
                        <View style={styles.planContent}>
                            <Text style={styles.planTitle}>{plan.name}</Text>
                            <Text style={styles.planDesc}>{plan.description}</Text>
                            <View style={styles.planMeta}>
                                <Text style={styles.metaText}>{plan.duration} Days</Text>
                                <Text style={styles.metaText}>•</Text>
                                <Text style={styles.metaText}>
                                  {new Date(plan.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.border} style={{marginRight: 16}} />
                    </TouchableOpacity>
                ))
            )}

            <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => navigation.navigate("CreateDietChart", { patientId })}

            >
                <Text style={styles.addBtnText}>+ Assign New Plan</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* --- DIET PLAN DETAIL MODAL --- */}
      <DietPlanDetailModal 
         visible={!!selectedPlan} 
         plan={selectedPlan} 
         onClose={() => setSelectedPlan(null)} 
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 50 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.border, 
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  headerTextContainer: { flex: 1, justifyContent: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.primary },
  name: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  email: { fontSize: 13, color: colors.foregroundLight, marginTop: 2 },
  backBtn: { padding: 4 },

  /* Tabs */
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingVertical: 12, marginRight: 24 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 15, color: colors.foregroundLight, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  /* Profile Grid */
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground, marginTop: 10, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  infoCard: { width: '48%', backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  iconBox: { marginBottom: 8 },
  infoLabel: { fontSize: 12, color: colors.foregroundLight, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.foreground },

  /* Condition Card */
  conditionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF3E0', // Light Orange bg
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#FFE0B2',
  },
  conditionIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  conditionLabel: { fontSize: 12, color: '#E67E22', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  conditionValue: { fontSize: 18, fontWeight: '700', color: '#D35400' },

  /* Medical Card */
  medicalCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
  textBlock: { marginBottom: 4 },
  textBlockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  textBlockLabel: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  textBlockValue: { fontSize: 15, color: colors.foreground, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  /* Action Row */
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  editBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteBtn: { backgroundColor: '#FF6B6B', paddingHorizontal: 18, justifyContent: 'center', borderRadius: 12 },

  /* Diet Plan Card */
  planCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', alignItems: 'center' },
  leftStrip: { width: 5, height: '100%' },
  planContent: { flex: 1, padding: 14 },
  planTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  planDesc: { fontSize: 13, color: colors.foregroundLight, marginTop: 2, marginBottom: 6 },
  planMeta: { flexDirection: 'row', gap: 6 },
  metaText: { fontSize: 12, color: colors.foregroundLight },
  addBtn: { marginTop: 10, alignSelf: 'center', padding: 10 },
  addBtnText: { color: colors.primary, fontWeight: '600' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: colors.foregroundLight, marginTop: 10 },

  /* Modal Styles */
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalDesc: { fontSize: 15, color: colors.foregroundLight, marginBottom: 16, lineHeight: 22 },
  modalMetaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 },
  modalBadgeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginTop: 10 },
  dayBlock: { marginBottom: 24 },
  dayTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 10, backgroundColor: colors.background, padding: 8, borderRadius: 8 },
  foodItem: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  mealType: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  mealTime: { fontSize: 11, color: colors.foregroundLight },
  foodName: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  foodNotes: { fontSize: 12, color: colors.foregroundLight, fontStyle: 'italic' },
  foodQty: { fontSize: 13, fontWeight: '600', color: colors.foreground },
});