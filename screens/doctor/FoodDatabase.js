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

  const scrollY = useRef(new Animated.Value(0)).current;
  const animationsRef = useRef({});

  const headerTranslateY = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, -5], extrapolate: "clamp" });
  const headerElevation = scrollY.interpolate({ inputRange: [0, 10], outputRange: [0, 4], extrapolate: "clamp" });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // --- LOAD FOODS FUNCTION ---
  const loadFoods = useCallback(async (params = {}) => {
    try {
      // Only show full loading spinner on initial load, not on refresh
      if (!refreshing && foods.length === 0) setLoading(true);
      
      const apiParams = {};
      if (params.category) apiParams.category = params.category;

      const res = await foodsAPI.getAll(apiParams);
      let list = Array.isArray(res?.data?.data) ? res.data.data : (res?.data?.data?.data || res?.data || []);

      setFoods(list);
      setFilteredFoods(list);
      
      // Reset animations when list refreshes so new items animate
      animationsRef.current = {};
    } catch (err) {
      console.error("Error loading foods:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); // Added refreshing dependency

  useEffect(() => { loadFoods(); }, []); // Run once on mount

  // --- FILTER LOGIC ---
  useEffect(() => {
    let list = foods;
    if (activeCategory && activeCategory !== "ALL") {
      list = list.filter((f) => (f.category || "").toUpperCase() === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((food) =>
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

  // ✅ FIXED: Pass callback to refresh list after editing
  const handleEdit = () => {
    if (!selectedFood) return;
    const foodToEdit = selectedFood;
    
    // Close modal immediately
    setSelectedFood(null); 

    navigation.navigate("AddFoodScreen", { 
        isEditMode: true, 
        foodToEdit: foodToEdit,
        onRefresh: () => {
            console.log("Refreshing Food Database...");
            loadFoods(); // <--- REFRESH TRIGGER
        }
    });
  };

  // ✅ FIXED: Pass callback to refresh list after adding
  const onAdd = () => {
      navigation.navigate("AddFoodScreen", {
          onRefresh: () => {
              console.log("Refreshing Food Database after Add...");
              loadFoods(); // <--- REFRESH TRIGGER
          }
      });
  };

  // --- RENDER CARD ---
  const AnimatedCard = ({ item, index }) => {
    const id = item.id || `${index}`;
    if (!animationsRef.current[id]) {
      animationsRef.current[id] = new Animated.Value(0);
      Animated.timing(animationsRef.current[id], {
        toValue: 1, duration: 420, delay: Math.min(index * 40, 400),
        useNativeDriver: true,
      }).start();
    }
    const anim = animationsRef.current[id];
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
    
    const category = (item.category || "OTHER").toUpperCase();
    const accent = CATEGORY_COLOR[category] || colors.primary;

    return (
      <AnimatedTouchableOpacity
        onPress={() => setSelectedFood(item)}
        activeOpacity={0.9}
        style={[
          styles.foodCard,
          { transform: [{ translateY }], opacity: anim }
        ]}
      >
        <View style={[styles.leftStrip, { backgroundColor: accent }]} />
        
        {/* Image */}
        <View style={styles.imageContainer}>
           {item.imageUrl ? (
               <Image source={{ uri: item.imageUrl }} style={styles.foodImage} resizeMode="cover" />
           ) : (
               <View style={[styles.foodImage, {alignItems:'center', justifyContent:'center'}]}>
                   <Ionicons name="fast-food-outline" size={24} color="#ccc" />
               </View>
           )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.rowTop}>
            <Text style={styles.foodName} numberOfLines={1}>{item.name || "Unknown"}</Text>
            <Text style={[styles.foodCategorySmall, {color: accent}]}>
              {item.category ? item.category.toLowerCase() : "uncategorized"}
            </Text>
          </View>

          {item.description ? (
              <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                {item.description}
              </Text>
          ) : null}

          {/* MACRO GRID */}
          <View style={styles.macroRow}>
             <View style={styles.macroItem}>
                <Ionicons name="flame" size={10} color="#F59E6C" />
                <Text style={[styles.macroVal, {color: '#D35400'}]}>{Math.round(item.calories || 0)}</Text>
                <Text style={styles.macroLabel}>kcal</Text>
             </View>
             
             <View style={styles.vertLine} />
             
             <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{item.protein || 0}g</Text>
                <Text style={styles.macroLabel}>Prot</Text>
             </View>

             <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{item.carbs || 0}g</Text>
                <Text style={styles.macroLabel}>Carb</Text>
             </View>

             <View style={styles.macroItem}>
                <Text style={styles.macroVal}>{item.fat || 0}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
             </View>
          </View>

        </View>
      </AnimatedTouchableOpacity>
    );
  };

  const renderFood = ({ item, index }) => <AnimatedCard item={item} index={index} />;

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
        <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>Food Database</Text>
            <TouchableOpacity onPress={() => navigation.navigate("ChatEntry")} style={styles.chatHeaderBtn}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
        </View>

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

      {/* --- LIST --- */}
      <Animated.FlatList
        data={filteredFoods}
        renderItem={renderFood}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.listContent, { paddingTop: HEADER_HEIGHT + 10 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No foods found</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },

  /* Header */
  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: '#fff', height: HEADER_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
    justifyContent: 'flex-end',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  screenTitle: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  chatHeaderBtn: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },

  searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.foreground, height: '100%' },

  chipsWrapper: { height: 40 },
  chipsContainer: { paddingHorizontal: 16, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8, alignItems: "center", justifyContent: "center" },
  chipInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.foreground, fontSize: 13, fontWeight: "600", textTransform: "capitalize" },

  /* Cards */
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  foodCard: { flexDirection: "row", backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  leftStrip: { width: 6, height: '100%' },
  
  imageContainer: { justifyContent: 'center', paddingLeft: 12, paddingVertical: 12 },
  foodImage: { width: 65, height: 65, borderRadius: 10, backgroundColor: colors.backgroundLight },
  
  cardContent: { flex: 1, padding: 14, justifyContent: 'center' },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: 'space-between' },
  foodName: { fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 },
  foodCategorySmall: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  
  description: { marginTop: 4, color: colors.foregroundLight, fontSize: 12, marginBottom: 8 },

  /* MACRO GRID */
  macroRow: { flexDirection: "row", alignItems: "center", backgroundColor: '#F8FAFC', padding: 6, borderRadius: 8, alignSelf: 'flex-start' },
  macroItem: { alignItems: "center", flexDirection: 'row', paddingHorizontal: 6 },
  macroVal: { fontSize: 12, fontWeight: "700", color: colors.foreground, marginLeft: 4 },
  macroLabel: { fontSize: 10, color: colors.foregroundLight, marginLeft: 2 },
  vertLine: { width: 1, height: 12, backgroundColor: '#E2E8F0' },

  emptyContainer: { padding: 32, alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 16, color: colors.foregroundLight, marginBottom: 6 },
  
  addButton: { position: "absolute", bottom: 26, right: 26, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});