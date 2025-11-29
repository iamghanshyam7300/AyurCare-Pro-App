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
import { colors } from '../colors';
import { dietPlansAPI } from '../services/api';

export default function DietPlans({ navigation }) {
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDietPlans();
  }, []);

  const loadDietPlans = async () => {
    try {
      const response = await dietPlansAPI.getAll();
      //console.log("📌 DIET PLAN RESPONSE:", JSON.stringify(response.data, null, 2));
      setDietPlans(response.data.data);
    } catch (error) {
      console.error('Error loading diet plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDietPlans();
  };

  const renderDietPlan = ({ item }) => (
    <TouchableOpacity style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item.name || 'Diet Plan'}</Text>
        <Text style={styles.planStatus}>{item.status || 'ACTIVE'}</Text>
      </View>
      <Text style={styles.planDetails}>
        Duration: {item.duration || 'N/A'} days
      </Text>
      <Text style={styles.planDetails}>
        Patient: {item.patient?.name || 'Unknown'}
      </Text>
      <Text style={styles.planDate}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
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
            <Text style={styles.emptyText}>No diet plans found</Text>
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
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  planDetails: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginBottom: 4,
  },
  planDate: {
    fontSize: 12,
    color: colors.foregroundLight,
    marginTop: 8,
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

