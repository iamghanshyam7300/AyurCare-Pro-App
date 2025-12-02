// /screens/doctor/FoodDatabase.js
import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
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
  Platform,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { foodsAPI } from "../../services/api";
import FoodDetailModal from "./FoodDetailModal";

const CATEGORIES = [
  "ALL", "GRAINS", "VEGETABLES", "FRUITS", "DAIRY", 
  "SPICES", "HERBS", "NUTS", "LEGUMES", "MEAT", "FISH", "OTHER"
];

const CATEGORY_COLOR = {
  GRAINS: "#D9A84C", VEGETABLES: "#6FBF73", FRUITS: "#F59E6C",
  DAIRY: "#7FB5FF", SPICES: "#D96C6C", HERBS: "#6CCDB2",
  NUTS: "#C8A08A", LEGUMES: "#8FCBDF", MEAT: "#D36B6B",
  FISH: "#5AA6D8", OTHER: colors.primary, ALL: colors.primary,
};

// --- DYNAMIC HEADER HEIGHT CALCULATION ---
// Status Bar + Title Row (50) + Search (50) + Chips (50) + Padding (~20)
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;
const HEADER_HEIGHT = STATUSBAR_HEIGHT + 170; 

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function FoodDatabase({ navigation }) {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedFood, setSelectedFood] = useState(null);

  // Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const animationsRef = useRef({});

  // Header Animation: Slide up slightly and cast shadow on scroll
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });
  const headerElevation = scrollY.interpolate({
    inputRange: [0, 10],
    outputRange: [0, 4],
    extrapolate: "clamp",
  });

  // 1. HIDE DEFAULT HEADER
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // 2. LOAD DATA
  const loadFoods = useCallback(async (params = {}) => {
    try {
      if (!refreshing) setLoading(true);
      const apiParams = {};
      if (params.category) apiParams.category = params.category;

      const res = await foodsAPI.getAll(apiParams);
      let list = [];
      if (Array.isArray(res?.data?.data)) list = res.data.data;
      else if (res?.data?.data?.data && Array.isArray(res.data.data.data)) list = res.data.data.data;
      else if (Array.isArray(res?.data)) list = res.data;

      setFoods(list || []);
      setFilteredFoods(list || []);
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

  // 3. SEARCH & FILTER
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

  const handleEdit = () => {
    if (!selectedFood) return;
    const foodToEdit = selectedFood;
    setSelectedFood(null);
    navigation.navigate("AddFoodScreen", { isEditMode: true, foodToEdit: foodToEdit });
  };

  // 4. RENDER CARD
  const AnimatedCard = ({ item, index }) => {
    const id = item.id || `${index}`;
    if (!animationsRef.current[id]) {
      animationsRef.current[id] = new Animated.Value(0);
      Animated.timing(animationsRef.current[id], {
        toValue: 1,
        duration: 420,
        delay: Math.min(index * 40, 400),
        easing: Platform.OS === 'ios' ? undefined : undefined,
        useNativeDriver: true,
      }).start();
    }
    const anim = animationsRef.current[id];
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
    
    const category = (item.category || "OTHER").toUpperCase();
    const accent = CATEGORY_COLOR[category] || colors.primary;
    const hasAyurveda = item.ayurvedic || item.dosha;

    return (
      <AnimatedTouchableOpacity
        onPress={() => setSelectedFood(item)}
        activeOpacity={0.9}
        style={[
          styles.foodCard,
          {
            transform: [{ translateY }],
            opacity: anim,
            shadowColor: "#000",
          },
        ]}
      >
        <View style={[styles.leftStrip, { backgroundColor: accent }]} />
        <View style={styles.imageContainer}>
          <Image 
            source={{ 
              uri: item.imageUrl || "https://via.placeholder.com/100/cccccc/ffffff?text=Food" 
            }} 
            style={styles.foodImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.rowTop}>
            <Text style={styles.foodName} numberOfLines={1}>{item.name || "Unknown"}</Text>
            <Text style={styles.foodCategorySmall}>
              {item.category ? item.category.toLowerCase() : "uncategorized"}
            </Text>
            {hasAyurveda && (
               <MaterialCommunityIcons name="leaf" size={14} color={colors.primary} style={{marginLeft: 6}} />
            )}
          </View>

          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {item.description || "No description available."}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={14} color={colors.foregroundLight} />
              <Text style={styles.metaText}>
                {item.calories != null ? `${Math.round(item.calories)}` : "—"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="nutrition-outline" size={14} color={colors.foregroundLight} />
              <Text style={styles.metaText}>
                {item.protein != null ? `${item.protein}g` : "—"}
              </Text>
            </View>
            <View style={{ marginLeft: "auto" }}>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </View>
          </View>
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  const renderFood = ({ item, index }) => <AnimatedCard item={item} index={index} />;
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
      
      {/* --- FLOATING HEADER --- */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { 
            transform: [{ translateY: headerTranslateY }],
            elevation: headerElevation,
            zIndex: 100,
          },
        ]}
      >
        {/* 1. Title Row */}
        <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>FoodDatabase</Text>
            <TouchableOpacity 
                onPress={() => navigation.navigate("ChatEntry")} 
                style={styles.chatHeaderBtn}
            >
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={colors.foregroundLight} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search foods, ingredients..."
                    placeholderTextColor={colors.foregroundLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </View>

        {/* 3. Categories Chips */}
        <View style={styles.chipsWrapper}>
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
                        onPress={() => setActiveCategory(item)}
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
      </Animated.View>

      {/* --- SCROLLABLE LIST --- */}
      <Animated.FlatList
        data={filteredFoods}
        renderItem={renderFood}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        
        // Padding matches the Header Height to avoid overlap
        contentContainerStyle={[styles.listContent, { paddingTop: HEADER_HEIGHT + 10 }]}
        
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No foods found</Text>
            <Text style={styles.emptySub}>Try a different category or add a new food.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <FoodDetailModal
        visible={!!selectedFood}
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onEdit={handleEdit} 
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  /* --- FLOATING HEADER --- */
  floatingHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    height: HEADER_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT, // Ensure content starts below status bar
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    justifyContent: 'flex-end', // Stack from bottom up
  },
  
  /* Title Row */
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8, // Small gap before search
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    // Serif font to match the image style
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', 
  },
  chatHeaderBtn: {
    backgroundColor: colors.primary,
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  /* Search */
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9', 
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.foreground,
    height: '100%',
  },

  /* Chips */
  chipsWrapper: {
    height: 40, // Compact height for chips
  },
  chipsContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipInactive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  /* --- LIST --- */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, 
  },
  foodCard: {
    flexDirection: "row",
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  leftStrip: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  imageContainer: {
    justifyContent: 'center',
    paddingLeft: 12,
    paddingVertical: 12,
  },
  foodImage: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: colors.backgroundLight,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Match title font
  },
  foodCategorySmall: {
    marginLeft: 12,
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  description: {
    marginTop: 6,
    color: colors.foregroundLight,
    fontSize: 13,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    color: colors.foregroundLight,
    fontWeight: "600",
    fontSize: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    marginTop: 40,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});