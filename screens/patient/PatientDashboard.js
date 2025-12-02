import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../colors';
import { dietPlansAPI, remindersAPI } from '../../services/api';

export default function PatientDashboard({ navigation }) {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    activeDietPlans: 0,
    upcomingReminders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // ⚠ Backend expects USER ID, not patientId
      const [dietPlansRes, remindersRes] = await Promise.all([
        dietPlansAPI.getAll(),
        remindersAPI.getAll(),
      ]);

      // FIX: Use actual reminder "date" field
      const now = new Date();
      const upcoming = remindersRes.data.data.filter((rem) => {
        const reminderDate = new Date(rem.date);
        return reminderDate > now;
      });

      setStats({
        activeDietPlans: dietPlansRes.data.data.length,
        upcomingReminders: upcoming.length,
      });
    } catch (error) {
      console.error(
        "Error loading stats:",
        error?.response?.data || error?.message || error
      );
      
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statContent}>
        <Text style={styles.statIcon}>{icon}</Text>

        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.name}>{user?.name || 'Patient'}</Text>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Active Diet Plans"
          value={stats.activeDietPlans}
          icon="📋"
          color={colors.primary}
          onPress={() => navigation.navigate('DietHistory')}
        />

        <StatCard
          title="Upcoming Reminders"
          value={stats.upcomingReminders}
          icon="⏰"
          color={colors.accent}
          onPress={() => navigation.navigate('Reminders')}
        />
      </View>

      {/* QUICK ACCESS */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('DietHistory')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Diet History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Chat with Doctor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Reminders')}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionText}>Reminders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  header: {
    padding: 20,
    backgroundColor: colors.card,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  greeting: {
    fontSize: 16,
    color: colors.foregroundLight,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 4,
  },

  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  statCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    borderLeftWidth: 4,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  statIcon: {
    fontSize: 34,
  },

  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.foreground,
  },

  statTitle: {
    fontSize: 14,
    marginTop: 2,
    color: colors.foregroundLight,
  },

  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },

  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  actionIcon: {
    fontSize: 26,
    marginRight: 16,
  },

  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
});
