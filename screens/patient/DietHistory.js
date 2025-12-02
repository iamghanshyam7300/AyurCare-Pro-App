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
import { dietPlansAPI } from '../../services/api';

export default function DietHistory({ navigation }) {
  const { user } = useAuth();
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDietHistory();
  }, []);

  const loadDietHistory = async () => {
    try {
      const response = await dietPlansAPI.getAll({ patientId: user?.id });
      setDietPlans(response.data.data);
    } catch (error) {
      console.error('Error loading diet history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDietHistory();
  };

  const renderDietPlan = ({ item }) => (
    <TouchableOpacity style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item.name || 'Diet Plan'}</Text>
        <Text style={[styles.planStatus, { color: getStatusColor(item.status) }]}>
          {item.status || 'ACTIVE'}
        </Text>
      </View>
      <Text style={styles.planDetails}>
        Duration: {item.duration || 'N/A'} days
      </Text>
      {item.description && (
        <Text style={styles.planDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <Text style={styles.planDate}>
        Started: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return colors.primary;
      case 'COMPLETED':
        return colors.success;
      case 'CANCELLED':
        return colors.destructive;
      default:
        return colors.foregroundLight;
    }
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
        data={dietPlans}
        renderItem={renderDietPlan}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No diet history found</Text>
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
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  planStatus: {
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  planDetails: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginBottom: 8,
  },
  planDate: {
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

