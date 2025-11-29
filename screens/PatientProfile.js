// ================== PatientProfile.js (FULL FILE — PASTE THIS) ==================

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../colors";
import { patientsAPI } from "../services/api";

const { width } = Dimensions.get("window");
const isTablet = width > 800;  // dynamic grid

export default function PatientProfile({ route, navigation }) {
  const { patientId } = route?.params || {};
  const [patient, setPatient] = useState(null);
  const [dietPlans, setDietPlans] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const headerHeight = useRef(new Animated.Value(120)).current;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const [patientRes, dietPlansRes, healthRecordsRes] = await Promise.all([
        patientsAPI.getById(patientId),
        patientsAPI.getDietPlans(patientId),
        patientsAPI.getHealthRecords(patientId),
      ]);

      setPatient(patientRes.data.data);
      setDietPlans(dietPlansRes.data.data);
      setHealthRecords(healthRecordsRes.data.data);
    } catch (error) {
      console.error("❌ Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Delete Function ----
  const handleDelete = () => {
    Alert.alert(
      "Delete Patient?",
      "This action cannot be undone.",
      [
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
              console.error("❌ Delete Error:", error);
              Alert.alert("Error", "Failed to delete patient");
            }
          },
        },
      ]
    );
  };

  const toggleHeader = () => {
    Animated.timing(headerHeight, {
      toValue: collapsed ? 120 : 60,
      duration: 250,
      useNativeDriver: false,
    }).start();
    setCollapsed(!collapsed);
  };

  if (!patient || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const user = patient.user;

  // ========= Helper Renderer for info blocks ==========
  const renderInfo = (label, value, icon) => (
    <View style={[styles.infoCard, { width: isTablet ? "31%" : "48%" }]}>
      <View style={styles.infoTopRow}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || "N/A"}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      

      {/* ========== Collapsible Header ========== */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <TouchableOpacity onPress={toggleHeader}>
          <Ionicons
            name={collapsed ? "chevron-down" : "chevron-up"}
            size={22}
            color={colors.primary}
            style={{ alignSelf: "flex-end" }}
          />
        </TouchableOpacity>

        {!collapsed && (
          <View>
            <Text style={styles.name}>{user?.name || "Unknown"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        )}
      </Animated.View>

      {/* =================== Tabs =================== */}
      <View style={styles.tabs}>
        {["profile", "diet", "health"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "profile" ? "Profile" : t === "diet" ? "Diet Plans" : "Health"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* =================== PROFILE TAB =================== */}
      {activeTab === "profile" && (
        <View style={styles.section}>

          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.twoColumnWrap}>
            {renderInfo("Age", user?.age, "person")}
            {renderInfo("Gender", user?.gender, "male")}
            {renderInfo("Phone", user?.phone, "call")}
            {renderInfo("Address", user?.address, "location")}
            {renderInfo("Dosha Type", user?.doshaType, "leaf")}
          </View>

          <Text style={styles.sectionTitle}>Health Details</Text>
          <View style={styles.twoColumnWrap}>
            {renderInfo("Height", `${patient.height} cm`, "trending-up")}
            {renderInfo("Weight", `${patient.weight} kg`, "barbell")}
            {renderInfo("Sleep", patient.sleepPattern, "moon")}
            {renderInfo("Bowel Movement", patient.bowelMovement, "water")}
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("EditPatient", { patientId })}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =================== DIET TAB =================== */}
      {activeTab === "diet" && (
        <View style={styles.section}>
          {dietPlans.length === 0 ? (
            <Text style={styles.emptyText}>No diet plans found</Text>
          ) : (
            dietPlans.map((plan) => (
              <View key={plan.id} style={styles.card}>
                <Text style={styles.cardTitle}>{plan.name}</Text>
                <Text style={styles.cardText}>Duration: {plan.duration} days</Text>
                <Text style={styles.cardText}>
                  Created: {new Date(plan.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* =================== HEALTH TAB =================== */}
      {activeTab === "health" && (
        <View style={styles.section}>
          {healthRecords.length === 0 ? (
            <Text style={styles.emptyText}>No health records found</Text>
          ) : (
            healthRecords.map((rec) => (
              <View key={rec.id} style={styles.card}>
                <Text style={styles.cardTitle}>{new Date(rec.date).toLocaleDateString()}</Text>
                <Text style={styles.cardText}>Type: {rec.recordType}</Text>
                {rec.notes && <Text style={styles.cardText}>Notes: {rec.notes}</Text>}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ======================= Styles =======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: colors.card,
    padding: 20,
    overflow: "hidden",
    marginBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
  },

  email: {
    color: colors.foregroundLight,
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.card,
  },

  tabActive: {
    backgroundColor: colors.primary,
  },

  tabText: {
    color: colors.foreground,
    fontSize: 14,
  },

  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  section: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 12,
  },

  twoColumnWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },

  infoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  infoLabel: {
    fontSize: 12,
    color: colors.foregroundLight,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },

  card: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  cardText: {
    color: colors.foregroundLight,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: colors.foregroundLight,
  },

  bottomButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  editText: {
    color: "#fff",
    fontWeight: "600",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#ff4d4d",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteText: {
    color: "#fff",
    fontWeight: "600",
  },
});


// ================== END OF FULL FILE ==================
