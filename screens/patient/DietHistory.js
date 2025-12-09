import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../colors';
// 1. IMPORT patientsAPI instead of just dietPlansAPI
import { patientsAPI } from '../../services/api'; 

export default function DietHistory({ navigation }) {
  const { user } = useAuth();
  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDietHistory();
  }, [user]);

  const loadDietHistory = async () => {
    if (!user || !user.id) return;

    try {
      setLoading(true);
      
      // 2. USE THE CORRECT API ENDPOINT
      // Instead of getAll with query params, we use the patient-specific route
      // matches backend: GET /patients/:id/diet-plans
      const response = await patientsAPI.getDietPlans(user.id);
      
      const rawData = response.data.data || response.data || [];
      
      // Sort by Created Date (Newest First)
      const sorted = Array.isArray(rawData) 
        ? rawData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

      setDietPlans(sorted);
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
    <TouchableOpacity 
      style={styles.planCard}
      activeOpacity={0.7}
      // Navigate to DietChart and pass the planId
      onPress={() => navigation.navigate('DietChart', { planId: item.id })}
    >
      <View style={styles.cardContent}>
          <View style={styles.planHeader}>
            <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{item.name || 'Diet Plan'}</Text>
                <Text style={styles.planDate}>
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status || 'ACTIVE'}
                </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
             <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.foregroundLight} />
                <Text style={styles.detailText}>{item.duration || 7} Days</Text>
             </View>
             
             <View style={styles.detailItem}>
                <Ionicons name="leaf-outline" size={14} color={colors.foregroundLight} />
                <Text style={styles.detailText}>
                    {item.doshaType ? item.doshaType.replace('_', '-') : 'Balanced'}
                </Text>
             </View>
          </View>
      </View>
      
      <View style={styles.chevronBox}>
         <Ionicons name="chevron-forward" size={20} color={colors.border} />
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return colors.primary;
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return colors.foregroundLight;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
         </TouchableOpacity>
         <Text style={styles.screenTitle}>Diet History</Text>
      </View>

      <FlatList
        data={dietPlans}
        renderItem={renderDietPlan}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
                <Ionicons name="folder-open-outline" size={40} color={colors.foregroundLight} />
            </View>
            <Text style={styles.emptyText}>No diet plans found</Text>
            <Text style={styles.emptySub}>Your past diet charts will be listed here.</Text>
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
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: { marginRight: 16, padding: 4 },
  screenTitle: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  listContent: { padding: 20 },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: { flex: 1, padding: 16 },
  chevronBox: { paddingRight: 16, justifyContent: 'center', alignItems: 'center' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  planName: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
  planDate: { fontSize: 12, color: colors.foregroundLight },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 10, opacity: 0.5 },
  detailsRow: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: colors.foregroundLight, fontWeight: '500' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16, opacity: 0.5 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.foreground },
  emptySub: { fontSize: 14, color: colors.foregroundLight, marginTop: 6, textAlign: 'center', lineHeight: 20 },
});