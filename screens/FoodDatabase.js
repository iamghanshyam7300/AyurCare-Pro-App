// screens/FoodDatabase.js
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Easing,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../colors";
import { foodsAPI } from "../services/api";

/**
 * FoodDatabase (Style D — Premium Dashboard Look)
 *
 * Features:
 * - Left color strip on cards
 * - Category filter chips
 * - Smooth fade+slide animation per item
 * - Handles different API response structures
 * - Floating Add button
 */

const CATEGORIES = [
  "ALL",
  "GRAINS",
  "VEGETABLES",
  "FRUITS",
  "DAIRY",
  "SPICES",
  "HERBS",
  "NUTS",
  "LEGUMES",
  "MEAT",
  "FISH",
  "OTHER",
];

// map category -> accent color (keeps your app colour palette)
const CATEGORY_COLOR = {
  GRAINS: "#D9A84C",
  VEGETABLES: "#6FBF73",
  FRUITS: "#F59E6C",
  DAIRY: "#7FB5FF",
  SPICES: "#D96C6C",
  HERBS: "#6CCDB2",
  NUTS: "#C8A08A",
  LEGUMES: "#8FCBDF",
  MEAT: "#D36B6B",
  FISH: "#5AA6D8",
  OTHER: colors.primary,
  ALL: colors.primary,
};

export default function FoodDatabase({ navigation }) {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  // used for item animations
  const animationsRef = useRef({}); // id -> Animated.Value

  // load foods
  const loadFoods = useCallback(async (params = {}) => {
    try {
      if (!refreshing) setLoading(true);

      // pass category param only when not ALL
      const apiParams = {};
      if (params.category) apiParams.category = params.category;

      const res = await foodsAPI.getAll(apiParams);

      // backend sometimes nests results in two ways:
      // 1) res.data.data -> array
      // 2) res.data.data.data -> { data: [...], pagination: ... }
      let list = [];
      if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      } else if (res?.data?.data?.data && Array.isArray(res.data.data.data)) {
        list = res.data.data.data;
      } else if (Array.isArray(res?.data)) {
        // fallback
        list = res.data;
      }

      setFoods(list || []);
      setFilteredFoods(list || []);

      // reset animations
      animationsRef.current = {};
    } catch (err) {
      console.error("Error loading foods:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  // search & category filter
  useEffect(() => {
    let list = foods;

    if (activeCategory && activeCategory !== "ALL") {
      list = list.filter((f) => (f.category || "").toUpperCase() === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (food) =>
          (food.name || "").toLowerCase().includes(q) ||
          (food.description || "").toLowerCase().includes(q) ||
          (food.category || "").toLowerCase().includes(q)
      );
    }

    setFilteredFoods(list);
  }, [searchQuery, activeCategory, foods]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFoods({ category: activeCategory !== "ALL" ? activeCategory : undefined });
  };

  // Animated card item
  const AnimatedCard = ({ item, index }) => {
    // attach Animated.Value per item id
    const id = item.id || `${index}`;
    if (!animationsRef.current[id]) {
      animationsRef.current[id] = new Animated.Value(0);
      // start animation with slight stagger
      Animated.timing(animationsRef.current[id], {
        toValue: 1,
        duration: 420,
        delay: Math.min(index * 40, 400),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    const anim = animationsRef.current[id];

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 0],
    });
    const opacity = anim;

    const category = (item.category || "OTHER").toUpperCase();
    const accent = CATEGORY_COLOR[category] || colors.primary;

    return (
      <Animated.View
        style={[
          styles.foodCard,
          {
            transform: [{ translateY }],
            opacity,
            shadowColor: "#000",
          },
        ]}
      >
        {/* left accent strip */}
        <View style={[styles.leftStrip, { backgroundColor: accent }]} />

        <View style={styles.cardContent}>
          <View style={styles.rowTop}>
            <Text style={styles.foodName}>{item.name || "Unknown"}</Text>

            <Text style={styles.foodCategorySmall}>
              {item.category ? item.category.toLowerCase() : "uncategorized"}
            </Text>
          </View>

          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description || "No description available."}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={14} color={colors.foregroundLight} />
              <Text style={styles.metaText}>
                {item.calories != null ? `${Math.round(item.calories)} kcal` : "—"}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="nutrition-outline" size={14} color={colors.foregroundLight} />
              <Text style={styles.metaText}>
                {item.protein != null ? `${item.protein} g` : "—"}
              </Text>
            </View>

            {/* small right aligned timestamp or status */}
            <View style={{ marginLeft: "auto" }}>
              <Text style={styles.createdAt}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : ""}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderFood = ({ item, index }) => <AnimatedCard item={item} index={index} />;

  const onCategoryPress = (cat) => {
    setActiveCategory(cat);
    // refetch server-side filtered list optionally
    // loadFoods({ category: cat !== "ALL" ? cat : undefined });
  };

  // smooth add button press
  const onAdd = () => navigation.navigate("AddFoodScreen");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header area: search + categories */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods, categories or ingredients..."
          placeholderTextColor={colors.foregroundLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* category chips */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
          renderItem={({ item }) => {
            const isActive = item === activeCategory;
            const chipColor = CATEGORY_COLOR[item] || colors.primary;
            return (
              <TouchableOpacity
                onPress={() => onCategoryPress(item)}
                style={[
                  styles.chip,
                  isActive ? { backgroundColor: chipColor } : styles.chipInactive,
                ]}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, isActive && { color: "#fff" }]}>
                  {item.toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredFoods}
        renderItem={renderFood}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No foods found</Text>
            <Text style={styles.emptySub}>
              Try a different category or add a new food.
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* --------------------- STYLES --------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  searchInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chipsContainer: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingLeft: 2,
    flexGrow: 0,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  chipInactive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  chipText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  listContent: {
    padding: 16,
    paddingBottom: 120,
  },

  foodCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  leftStrip: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },

  cardContent: {
    flex: 1,
    padding: 14,
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  foodName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
  },

  foodCategorySmall: {
    marginLeft: 12,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  description: {
    marginTop: 8,
    color: colors.foregroundLight,
    fontSize: 13,
  },

  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },

  metaText: {
    marginLeft: 6,
    color: colors.foregroundLight,
    fontWeight: "600",
    fontSize: 13,
  },

  createdAt: {
    color: colors.foregroundLight,
    fontSize: 12,
    textAlign: "right",
  },

  /* Empty */
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.foregroundLight,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.foregroundLight,
    textAlign: "center",
  },

  /* Floating button */
  addButton: {
    position: "absolute",
    bottom: 26,
    right: 26,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
