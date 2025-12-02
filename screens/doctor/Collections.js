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
import { colors } from '../../colors';
import { recipesAPI, foodsAPI } from '../../services/api';

export default function Collections({ navigation }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('recipes');

  useEffect(() => {
    loadCollections();
  }, [activeTab]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      let response;
      if (activeTab === 'recipes') {
        response = await recipesAPI.getAll();
      } else {
        response = await foodsAPI.getAll();
      }
      setCollections(response.data.data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollections();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemCard}>
      <Text style={styles.itemName}>{item.name || 'Item'}</Text>
      {item.description && (
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      {activeTab === 'recipes' && item.cookingTime && (
        <Text style={styles.itemDetails}>⏱️ {item.cookingTime} min</Text>
      )}
      {activeTab === 'foods' && item.calories && (
        <Text style={styles.itemDetails}>🔥 {item.calories} kcal</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
          onPress={() => setActiveTab('recipes')}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>
            Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'foods' && styles.tabActive]}
          onPress={() => setActiveTab('foods')}
        >
          <Text style={[styles.tabText, activeTab === 'foods' && styles.tabTextActive]}>
            Foods
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={collections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab} found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.foreground,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
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
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginBottom: 8,
  },
  itemDetails: {
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

