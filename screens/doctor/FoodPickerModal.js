// /screens/doctor/FoodPickerModal.js
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Animated,
  ActivityIndicator,
  Easing,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { foodsAPI } from "../../services/api";

/**
 * ---------------- CONFIGURATION ----------------
 */
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

export default function FoodPickerModal({ visible, onClose, onSelect }) {
  const [foods, setFoods] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Multi-selection State: Stores Set of IDs
  const [selectedIds, setSelectedIds] = useState(new Set()); 
  // Stores actual objects to return
  const [selectedItems, setSelectedItems] = useState([]); 

  const animRef = useRef({});

  // --- 1. Load & Reset ---
  useEffect(() => {
    if (visible) {
      setSearch("");
      setCategory("ALL");
      setSelectedIds(new Set());
      setSelectedItems([]);
      loadFoods();
    }
  }, [visible]);

  const loadFoods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await foodsAPI.getAll({ limit: 100 });
      let data = [];
      
      // Resilient parsing
      if (Array.isArray(res?.data?.data)) data = res.data.data;
      else if (Array.isArray(res?.data?.data?.data)) data = res.data.data.data;
      else if (Array.isArray(res?.data)) data = res.data;

      setFoods(data || []);
      setFiltered(data || []);
      animRef.current = {};
    } catch (e) {
      console.log("Food load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. Filter Logic ---
  useEffect(() => {
    let list = foods;

    if (category !== "ALL") {
      list = list.filter((f) => (f.category || "").toUpperCase() === category);
    }

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          (f.name || "").toLowerCase().includes(q) ||
          (f.description || "").toLowerCase().includes(q) ||
          (f.ayurvedic?.dosha || "").toLowerCase().includes(q) // Search by dosha too
      );
    }
    setFiltered(list);
  }, [category, search, foods]);

  // --- 3. Selection Handler ---
  const toggleSelection = (item) => {
    const newIds = new Set(selectedIds);
    let newItems = [...selectedItems];

    if (newIds.has(item.id)) {
      newIds.delete(item.id);
      newItems = newItems.filter((i) => i.id !== item.id);
    } else {
      newIds.add(item.id);
      newItems.push(item);
    }

    setSelectedIds(newIds);
    setSelectedItems(newItems);
  };

  const handleConfirm = () => {
    onSelect(selectedItems); // Return array of selected food objects
    onClose();
  };

  // --- 4. Render Item ---
  const AnimatedCard = ({ item, index }) => {
    const id = item.id || index;
    const isSelected = selectedIds.has(item.id);

    // Animation Init
    if (!animRef.current[id]) {
      animRef.current[id] = new Animated.Value(0);
      Animated.timing(animRef.current[id], {
        toValue: 1,
        duration: 350,
        delay: Math.min(index * 40, 400),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    const translateY = animRef.current[id].interpolate({
      inputRange: [0, 1],
      outputRange: [12, 0],
    });

    const categoryKey = (item.category || "OTHER").toUpperCase();
    const stripColor = CATEGORY_COLOR[categoryKey] || colors.primary;

    // Helper to render Ayurvedic Tags if data exists
    const renderAyurvedicInfo = () => {
      // Mocking structure check: item.ayurvedic = { dosha: 'Vata', virya: 'Hot', guna: 'Heavy' }
      if (!item.ayurvedic && !item.dosha) return null;

      const dosha = item.ayurvedic?.dosha || item.dosha; 
      const virya = item.ayurvedic?.virya || item.virya; // Potency (Hot/Cold)

      return (
        <View style={styles.ayurvedicRow}>
          {dosha && (
            <View style={styles.tagContainer}>
              <MaterialCommunityIcons name="leaf" size={10} color={colors.primary} />
              <Text style={styles.tagText}>{dosha}</Text>
            </View>
          )}
          {virya && (
            <View style={styles.tagContainer}>
              <MaterialCommunityIcons 
                name={virya.toLowerCase().includes('hot') ? "fire" : "snowflake"} 
                size={10} 
                color={virya.toLowerCase().includes('hot') ? "#FF6B6B" : "#4ECDC4"} 
              />
              <Text style={styles.tagText}>{virya}</Text>
            </View>
          )}
        </View>
      );
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => toggleSelection(item)}
      >
        <Animated.View
          style={[
            styles.card,
            isSelected && styles.cardSelected, // Highlight border
            {
              opacity: animRef.current[id],
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Left Color Strip */}
          <View style={[styles.leftStrip, { backgroundColor: stripColor }]} />

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUrl || "https://via.placeholder.com/60" }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
             {/* Selection Overlay Checkmark */}
             {isSelected && (
                <View style={styles.selectedOverlay}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
             )}
          </View>

          {/* Info Column */}
          <View style={styles.cardContent}>
            <View style={styles.textRow}>
              <Text style={[styles.foodName, isSelected && {color: colors.primary}]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.categorySmall, { color: stripColor }]}>
                {item.category?.toLowerCase()}
              </Text>
            </View>

            {/* Ayurvedic Info Row (Conditional) */}
            {renderAyurvedicInfo()}

            <Text style={styles.foodDesc} numberOfLines={1}>
              {item.description || "No description available"}
            </Text>

            <View style={styles.metaRow}>
              <Ionicons name="flame-outline" size={12} color={colors.foregroundLight} />
              <Text style={styles.metaText}>{item.calories || 0} kcal</Text>
              <View style={styles.dotSeparator} />
              <Ionicons name="nutrition-outline" size={12} color={colors.foregroundLight} />
              <Text style={styles.metaText}>{item.protein || 0}g prot</Text>
            </View>
          </View>

          {/* Right Selection Icon */}
          <View style={styles.radioContainer}>
            {isSelected ? (
               <Ionicons name="checkbox" size={24} color={colors.primary} />
            ) : (
               <Ionicons name="square-outline" size={24} color={colors.border} />
            )}
          </View>

        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          
          {/* --- Header --- */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Foods</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* --- Search --- */}
          <View style={styles.searchContainer}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search foods, ingredients, dosha..."
              placeholderTextColor={colors.foregroundLight}
              style={styles.searchInput}
            />
          </View>

          {/* --- Categories Chips --- */}
          <View style={styles.chipsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {CATEGORIES.map((cat) => {
                const isActive = cat === category;
                const activeColor = CATEGORY_COLOR[cat] || colors.primary;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.chip,
                      isActive
                        ? { backgroundColor: activeColor, borderColor: activeColor }
                        : styles.chipInactive,
                    ]}
                  >
                    <Text style={[styles.chipText, isActive ? { color: "#fff" } : { color: colors.foreground }]}>
                      {cat.toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* --- List --- */}
          {loading ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item, index }) => <AnimatedCard item={item} index={index} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No foods found.</Text>
                </View>
              }
            />
          )}

          {/* --- Bottom Confirmation Bar --- */}
          {selectedIds.size > 0 && (
            <View style={styles.bottomBar}>
              <View>
                 <Text style={styles.selectedCountText}>{selectedIds.size} selected</Text>
                 <Text style={styles.selectedSubText}>Tap to review</Text>
              </View>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                 <Text style={styles.confirmButtonText}>Add Foods</Text>
                 <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 4}}/>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popup: {
    width: "100%",
    height: "85%",
    backgroundColor: colors.background,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  closeBtn: {
    padding: 4,
  },
  /* Search */
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  searchInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  /* Chips */
  chipsWrapper: {
    backgroundColor: colors.card,
    paddingBottom: 12,
  },
  chipsContainer: {
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipInactive: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  /* List */
  listContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom bar
  },
  centerLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: colors.foregroundLight,
    fontSize: 14,
  },

  /* CARD STYLES */
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 0, // content handles padding
    height: 94, // Increased height for Ayurveda tags
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent", // Default
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    alignItems: "center",
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  leftStrip: {
    width: 6,
    height: "100%",
  },
  imageContainer: {
    marginLeft: 10,
    marginRight: 10,
    position: 'relative',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  selectedOverlay: {
    position: 'absolute',
    top: -6, right: -6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff'
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
    marginRight: 4,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    marginRight: 8,
    maxWidth: "80%",
  },
  categorySmall: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  /* Ayurveda Row */
  ayurvedicRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 10,
    color: colors.foreground,
    marginLeft: 3,
    fontWeight: '600',
  },
  foodDesc: {
    fontSize: 12,
    color: colors.foregroundLight,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    color: colors.foregroundLight,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.foregroundLight,
    marginHorizontal: 6,
  },
  radioContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 20,
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  selectedSubText: {
    fontSize: 12,
    color: colors.foregroundLight,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  }
});