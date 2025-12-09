// /screens/admin/AdminDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors"; // Ensure this path matches your project
import { useAuth } from "../../contexts/AuthContext";
import { adminAPI } from "../../services/api";

// --- COMPONENTS ---

const StatCard = ({ label, value, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: color + "20" }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const DoctorCard = ({ doctor, isPending, onApprove, onReject }) => (
  <View style={styles.doctorCard}>
    <View style={styles.doctorHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{doctor.name?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.doctorSpec}>{doctor.specialization || "General Physician"}</Text>
        <Text style={styles.doctorEmail}>{doctor.email}</Text>
      </View>
      {isPending && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      )}
    </View>

    <View style={styles.divider} />

    <View style={styles.metaRow}>
      <View style={styles.metaItem}>
        <Ionicons name="card-outline" size={14} color={colors.foregroundLight} />
        <Text style={styles.metaText}>Lic: {doctor.licenseNumber || "N/A"}</Text>
      </View>
      <View style={styles.metaItem}>
        <Ionicons name="calendar-outline" size={14} color={colors.foregroundLight} />
        <Text style={styles.metaText}>Joined: {new Date(doctor.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>

    {isPending && (
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => onReject(doctor.id)}>
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => onApprove(doctor.id)}>
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);

export default function AdminDashboard({ navigation }) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'all'

  // Data State
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    activeDietPlans: 0,
    pendingApprovals: 0,
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!refreshing) setLoading(true);

      const [statsRes, pendingRes, allRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingDoctors(),
        adminAPI.getAllDoctors(),
      ]);

      setStats(statsRes.data.data);
      setPendingDoctors(pendingRes.data.data);
      setAllDoctors(allRes.data.data);

    } catch (error) {
      console.error("Dashboard Load Error:", error);
      Alert.alert("Error", "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveDoctor(id);
      Alert.alert("Success", "Doctor approved successfully.");
      loadDashboardData(); // Refresh data
    } catch (error) {
      Alert.alert("Error", "Failed to approve doctor.");
    }
  };

  const handleReject = async (id) => {
    Alert.alert("Confirm Reject", "Are you sure you want to reject this doctor?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await adminAPI.rejectDoctor(id);
            loadDashboardData();
          } catch (error) {
            Alert.alert("Error", "Failed to reject doctor.");
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Overview & Management</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* --- STATS GRID --- */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Doctors"
            value={stats.totalDoctors}
            icon="doctor"
            color="#4ECDC4"
          />
          <StatCard
            label="Total Patients"
            value={stats.totalPatients}
            icon="account-group"
            color="#FF6B6B"
          />
          <StatCard
            label="Active Plans"
            value={stats.activeDietPlans}
            icon="file-document-outline"
            color="#FFD93D"
          />
          <StatCard
            label="Pending"
            value={stats.pendingApprovals}
            icon="account-clock"
            color="#FF9F43"
          />
        </View>

        {/* --- TABS --- */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.tabActive]}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
              Pending ({pendingDoctors.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
              All Doctors
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- LIST SECTION --- */}
        <View style={styles.listSection}>
          {activeTab === "pending" ? (
            pendingDoctors.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.border} />
                <Text style={styles.emptyText}>No pending approvals</Text>
              </View>
            ) : (
              pendingDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  isPending={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )
          ) : (
            allDoctors.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No doctors registered yet</Text>
              </View>
            ) : (
              allDoctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} isPending={!doc.isActive} />
              ))
            )
          )}
        </View>
        
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  headerSubtitle: { fontSize: 14, color: colors.foregroundLight },
  logoutBtn: { padding: 8, backgroundColor: colors.card, borderRadius: 12 },

  /* Stats */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.foregroundLight },

  /* Tabs */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.foregroundLight,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },

  /* Cards */
  doctorCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doctorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: colors.primary },
  doctorName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  doctorSpec: { fontSize: 13, color: colors.primary, fontWeight: "500" },
  doctorEmail: { fontSize: 12, color: colors.foregroundLight },
  
  pendingBadge: {
    backgroundColor: "#FF9F4320",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: "absolute",
    top: 0,
    right: 0,
  },
  pendingText: { fontSize: 10, fontWeight: "700", color: "#FF9F43" },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },

  metaRow: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: colors.foregroundLight },

  /* Actions */
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  approveBtn: { backgroundColor: colors.primary },
  rejectBtn: { backgroundColor: "#FF6B6B" },
  approveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rejectText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: colors.foregroundLight, marginTop: 10, fontSize: 16 },
});