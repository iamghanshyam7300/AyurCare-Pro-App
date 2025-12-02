import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../colors';
import { remindersAPI } from '../../services/api';

export default function Reminders({ navigation }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const response = await remindersAPI.getAll({ patientId: user?.id });
      setReminders(response.data.data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders();
  };

  const renderReminder = ({ item }) => {
    const reminderDate = new Date(item.reminderTime);
    const isPast = reminderDate < new Date();
    
    return (
      <View style={[styles.reminderCard, isPast && styles.reminderCardPast]}>
        <View style={styles.reminderHeader}>
          <Text style={styles.reminderTitle}>{item.title || 'Reminder'}</Text>
          <Text style={[styles.reminderStatus, isPast && styles.reminderStatusPast]}>
            {isPast ? 'Past' : 'Upcoming'}
          </Text>
        </View>
        {item.description && (
          <Text style={styles.reminderDescription}>{item.description}</Text>
        )}
        <Text style={styles.reminderTime}>
          ⏰ {reminderDate.toLocaleString()}
        </Text>
        {item.type && (
          <Text style={styles.reminderType}>Type: {item.type}</Text>
        )}
      </View>
    );
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
      <FlatList
        data={reminders}
        renderItem={renderReminder}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reminders found</Text>
          </View>
        }
      />
    </View>
  );
}

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
  listContent: {
    padding: 16,
  },
  reminderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderCardPast: {
    opacity: 0.6,
    borderLeftColor: colors.foregroundLight,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  reminderStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reminderStatusPast: {
    color: colors.foregroundLight,
    backgroundColor: colors.muted,
  },
  reminderDescription: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginBottom: 8,
  },
  reminderTime: {
    fontSize: 12,
    color: colors.foregroundLight,
    marginBottom: 4,
  },
  reminderType: {
    fontSize: 12,
    color: colors.foregroundLight,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.foregroundLight,
  },
});

