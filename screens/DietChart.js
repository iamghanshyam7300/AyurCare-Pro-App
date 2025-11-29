import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../colors';
import { dietPlansAPI } from '../services/api';

export default function DietChart({ navigation }) {
  const [dietPlans, setDietPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDietPlans();
  }, []);

  const loadDietPlans = async () => {
    try {
      const response = await dietPlansAPI.getAll();
      setDietPlans(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedPlan(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error loading diet plans:', error);
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Diet Chart</Text>
        <Text style={styles.subtitle}>View and manage diet plans</Text>
      </View>

      {dietPlans.length > 0 && (
        <View style={styles.planSelector}>
          <Text style={styles.selectorLabel}>Select Diet Plan:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dietPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planButton,
                  selectedPlan?.id === plan.id && styles.planButtonActive,
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    selectedPlan?.id === plan.id && styles.planButtonTextActive,
                  ]}
                >
                  {plan.name || 'Diet Plan'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedPlan ? (
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{selectedPlan.name}</Text>
            <Text style={styles.chartText}>
              Duration: {selectedPlan.duration || 'N/A'} days
            </Text>
            <Text style={styles.chartText}>
              Status: {selectedPlan.status || 'ACTIVE'}
            </Text>
            <Text style={styles.chartText}>
              Created: {new Date(selectedPlan.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No diet plans available</Text>
        </View>
      )}
    </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.foregroundLight,
  },
  planSelector: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 12,
  },
  planButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planButtonText: {
    fontSize: 14,
    color: colors.foreground,
  },
  planButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartContainer: {
    padding: 16,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  chartText: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginBottom: 8,
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

