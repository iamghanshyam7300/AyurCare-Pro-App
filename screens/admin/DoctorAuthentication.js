import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { adminAPI } from "../../services/api";

/* ------------------------------------------------------------------
   MODAL — SHOW DOCTOR DETAILS BEFORE APPROVING / REJECTING
--------------------------------------------------------------------*/
const DoctorDetailModal = ({ visible, doctor, onClose }) => {
  if (!doctor) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Doctor Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Profile Display */}
            <View style={styles.profileSection}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>
                  {doctor.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.docName}>{doctor.name}</Text>
              <Text style={styles.docSpec}>{doctor.specialization}</Text>
              <Text style={styles.docEmail}>{doctor.email}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="card-account-details"
                  size={20}
                  color={colors.primary}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.infoLabel}>License Number</Text>
                  <Text style={styles.infoValue}>
                    {doctor.licenseNumber || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="briefcase-clock"
                  size={20}
                  color={colors.primary}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.infoLabel}>Experience</Text>
                  <Text style={styles.infoValue}>
                    {doctor.experience
                      ? `${doctor.experience} Years`
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/* ------------------------------------------------------------------
   MAIN SCREEN
--------------------------------------------------------------------*/
export default function DoctorAuthentication() {
  const [activeTab, setActiveTab] = useState("pending");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      if (!refreshing) setLoading(true);
      const res = await adminAPI.getAllDoctors();

      console.log("🔥 FULL DOCTOR RESPONSE →", res.data.data);

      setDoctors(res.data.data || []);
    } catch (error) {
      console.error("Load Error:", error);
      Alert.alert("Error", "Failed to load doctors.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDoctors();
  };

  const handleAction = async (id, action) => {
    try {
      if (action === "approve") {
        await adminAPI.approveDoctor(id);
        Alert.alert("Success", "Doctor approved successfully.");
      } else {
        await adminAPI.rejectDoctor(id);
        Alert.alert("Rejected", "Doctor request rejected.");
      }

      loadDoctors();
    } catch (error) {
      Alert.alert("Error", `Failed to ${action} doctor.`);
    }
  };

  /* ------------------------------------------------------------------
     FIX: The logic below now properly separates doctors based on ENUM
     Backend gives:
       "VERIFIED", "REJECTED", null
     Null must be treated as PENDING
  --------------------------------------------------------------------*/

  const pendingList = doctors.filter(
    (d) => d.is_verified === "PENDING" || d.is_verified === null
  );

  const verifiedList = doctors.filter(
    (d) => d.is_verified === "VERIFIED"
  );

  const rejectedList = doctors.filter(
    (d) => d.is_verified === "REJECTED"
  );

  const currentList =
    activeTab === "pending"
      ? pendingList
      : activeTab === "verified"
      ? verifiedList
      : rejectedList;

  /* ------------------------------------------------------------------
     LIST ITEM
  --------------------------------------------------------------------*/
  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => setSelectedDoctor(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.spec}>
            {item.specialization || "General Physician"}
          </Text>
        </View>

        {item.is_verified === "VERIFIED" && (
          <Ionicons
            name="checkmark-circle"
            size={26}
            color={colors.primary}
          />
        )}

        {item.is_verified === "REJECTED" && (
          <Ionicons name="close-circle" size={26} color="red" />
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.metaText}>
          License: {item.licenseNumber || "N/A"}
        </Text>
        <Text style={styles.metaText}>Email: {item.email}</Text>
      </View>

      {/* Action buttons for pending ONLY */}
      {(item.is_verified === null || item.is_verified === "PENDING") && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => handleAction(item.id, "reject")}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.approveBtn]}
            onPress={() => handleAction(item.id, "approve")}
          >
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  /* ------------------------------------------------------------------
     RENDER UI
  --------------------------------------------------------------------*/
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doctor Verification</Text>
        <Text style={styles.headerSubtitle}>
          Approve or reject new doctor registrations
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.activeTabText,
            ]}
          >
            Pending ({pendingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "verified" && styles.activeTab]}
          onPress={() => setActiveTab("verified")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "verified" && styles.activeTabText,
            ]}
          >
            Verified ({verifiedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "rejected" && styles.activeTab]}
          onPress={() => setActiveTab("rejected")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rejected" && styles.activeTabText,
            ]}
          >
            Rejected ({rejectedList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctorItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="information-outline"
                size={60}
                color={colors.border}
              />
              <Text style={styles.emptyText}>No doctors found.</Text>
            </View>
          }
        />
      )}

      {/* Details modal */}
      <DoctorDetailModal
        visible={!!selectedDoctor}
        doctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />
    </View>
  );
}

/* ------------------------------------------------------------------
   STYLES (unchanged)
--------------------------------------------------------------------*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop:
      Platform.OS === "android" ? StatusBar.currentHeight + 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  headerSubtitle: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginTop: 4,
  },

  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  tab: {
    marginRight: 20,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.foregroundLight,
    fontWeight: "600",
  },
  activeTabText: { color: colors.primary },

  listContent: { padding: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary + "15",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: colors.primary },

  name: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  spec: { fontSize: 13, color: colors.foregroundLight },

  cardBody: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
  },
  metaText: { fontSize: 13, color: colors.foreground },

  actionRow: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectBtn: { backgroundColor: "#FFEBEE" },
  rejectText: { color: "#D32F2F", fontWeight: "700" },
  approveBtn: { backgroundColor: colors.primary },
  approveText: { color: "#fff", fontWeight: "700" },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { marginTop: 10, fontSize: 16, color: colors.foregroundLight },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "70%",
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalScroll: { padding: 20 },

  profileSection: { alignItems: "center", marginBottom: 24 },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarTextLarge: { fontSize: 32, fontWeight: "700", color: colors.primary },

  docName: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  docSpec: { fontSize: 16, color: colors.primary, marginTop: 4 },
  docEmail: { fontSize: 14, color: colors.foregroundLight, marginTop: 4 },

  infoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  infoLabel: {
    fontSize: 12,
    color: colors.foregroundLight,
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 16, fontWeight: "600", color: colors.foreground },

  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
    marginLeft: 32,
  },
});
