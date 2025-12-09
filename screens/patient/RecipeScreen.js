import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard
} from "react-native";
import { colors } from "../../colors"; 
import recipesData from "../../assets/ayurvedic_recipes.json"; 

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Sub-Component for Individual Recipe Cards ---
const RecipeCard = ({ food, getPrakritiColor }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.foodCard}>
      {/* HEADER: Always Visible */}
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={toggleExpand} 
        style={styles.cardHeader}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.foodName}>{food.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.badge}>{food.type}</Text>
            <Text style={styles.timeText}>
              ⏱ {food.preparation_time_min + food.cooking_time_min} min total
            </Text>
          </View>
        </View>
        
        <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {/* BODY: Hidden until expanded */}
      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.divider} />

          {/* Ingredients */}
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>🛒 Ingredients</Text>
            <Text style={styles.paragraphText}>
              {food.ingredients.join(", ")}
            </Text>
          </View>

          {/* Instructions */}
          <View style={[styles.contentBox, styles.instructionBox]}>
            <Text style={styles.sectionTitle}>🔥 Instructions</Text>
            <Text style={[styles.paragraphText, { lineHeight: 22 }]}>
              {food.instructions}
            </Text>
          </View>

          {/* Time Details */}
          <Text style={styles.detailText}>
             Prep: {food.preparation_time_min}m • Cook: {food.cooking_time_min}m • Serves: {food.servings}
          </Text>

          {/* Allergy Information */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>Allergies</Text>
            <View style={styles.tagWrap}>
              {food.allergy_info?.length > 0 && food.allergy_info[0] !== "none" ? (
                food.allergy_info.map((a, i) => (
                  <View key={i} style={styles.allergyTag}>
                    <Text style={styles.allergyText}>{a}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.mutedText}>None</Text>
              )}
            </View>
          </View>

          {/* Ayurvedic Properties */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>Ayurvedic Profile</Text>
            <View style={styles.ayurvedaGrid}>
              <View style={styles.ayurvedaItem}>
                <Text style={styles.labelBold}>Rasa</Text>
                <Text style={styles.valueText}>{food.ayurveda.rasa.join(", ")}</Text>
              </View>
              <View style={styles.ayurvedaItem}>
                <Text style={styles.labelBold}>Guna</Text>
                <Text style={styles.valueText}>{food.ayurveda.guna.join(", ")}</Text>
              </View>
              <View style={styles.ayurvedaItem}>
                <Text style={styles.labelBold}>Virya</Text>
                <Text style={styles.valueText}>{food.ayurveda.virya}</Text>
              </View>
            </View>
          </View>

          {/* Dosha Suitability */}
          <View style={styles.section}>
            <Text style={styles.subTitle}>Dosha Effect</Text>
            <View style={styles.doshaContainer}>
              {["vata", "pitta", "kapha"].map((dosha) => {
                const { bg, color } = getPrakritiColor(food.prakriti[dosha]);
                return (
                  <View key={dosha} style={[styles.doshaBadge, { backgroundColor: bg }]}>
                    <Text style={{ color: color, fontWeight: "700", fontSize: 12 }}>
                      {dosha.toUpperCase()}
                    </Text>
                    <Text style={{ color: color, fontSize: 12 }}>
                      {food.prakriti[dosha]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// --- Main Screen ---
export default function RecipeScreen() {
  // Use String for input to prevent "glitchy" 0 behavior
  const [numItemsStr, setNumItemsStr] = useState("3");
  const [searchTerm, setSearchTerm] = useState("");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const getPrakritiColor = (effect) => {
    switch (effect) {
      case "pacifying":
        return { bg: "#D1F2E5", color: "#0F8C53" };
      case "aggravating":
        return { bg: "#F8D7DA", color: "#A5161C" };
      default:
        return { bg: "#F2F2F2", color: "#555" };
    }
  };

  const generateRandom = () => {
    // Convert string to number safely
    const numItems = parseInt(numItemsStr);

    if (isNaN(numItems) || numItems < 1 || numItems > 50) {
      alert("Please enter a number between 1—50");
      return;
    }
    
    // Dismiss keyboard
    Keyboard.dismiss();

    setLoading(true);
    setTimeout(() => {
      const result = shuffle(recipesData).slice(0, numItems);
      setFoods(result);
      setNoResults(result.length === 0);
      setLoading(false);
    }, 300);
  };

  const searchFoods = () => {
    if (!searchTerm.trim()) {
      alert("Enter a search term");
      return;
    }
    
    Keyboard.dismiss();
    setLoading(true);
    
    setTimeout(() => {
      const results = recipesData.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFoods(results);
      setNoResults(results.length === 0);
      setLoading(false);
    }, 200);
  };

  const clearResults = () => {
    setFoods([]);
    setSearchTerm("");
    setNumItemsStr("3");
    setNoResults(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    generateRandom();
  }, []);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled" // Fixes touch issues while keyboard is open
    >
      <Text style={styles.screenTitle}>🌿 Ayurvedic Recipe Generator</Text>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Random Generator Input */}
        <View style={styles.row}>
          <TextInput
            value={numItemsStr}
            onChangeText={setNumItemsStr} // Stores raw string
            keyboardType="numeric"
            placeholder="#"
            maxLength={2}
            style={[styles.input, { width: 60, textAlign: 'center' }]}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={generateRandom}>
            <Text style={styles.btnTextWhite}>Generate</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.row}>
          <TextInput
            placeholder="Search (e.g. kitchari)"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={[styles.input, { flex: 1 }]}
          />
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={searchFoods}>
             <Text style={styles.btnTextPrimary}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostButton} onPress={clearResults}>
             <Text style={styles.btnTextGray}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Output Area */}
      {loading && <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 20}} />}
      
      {noResults && (
        <Text style={styles.noResults}>No recipes found.</Text>
      )}

      <View style={styles.listContainer}>
        {foods.map((food, idx) => (
          <RecipeCard key={idx} food={food} getPrakritiColor={getPrakritiColor} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 16 }, 
  screenTitle: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 20, color: colors.primary },

  // --- Controls Styling ---
  controlPanel: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    gap: 12
  },
  row: { flexDirection: "row", gap: 10, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#FAFAFA",
    fontSize: 15
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#E6F4ED", 
    paddingVertical: 12,
    borderRadius: 10,
    flex: 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary
  },
  ghostButton: {
    paddingVertical: 12,
    flex: 1,
    alignItems: "center",
  },
  btnTextWhite: { color: "#fff", fontWeight: "600" },
  btnTextPrimary: { color: colors.primary, fontWeight: "600" },
  btnTextGray: { color: "#666", fontWeight: "600" },

  noResults: { textAlign: "center", color: "#888", marginTop: 20, fontSize: 16 },
  listContainer: { gap: 16 },

  // --- Card Styling ---
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    overflow: 'hidden',
    elevation: 1,
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff'
  },
  foodName: { fontSize: 18, fontWeight: "700", color: "#2D3436", marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { 
    fontSize: 12, 
    backgroundColor: "#F0F0F0", 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    color: "#555",
    overflow: 'hidden',
    textTransform: 'capitalize'
  },
  timeText: { fontSize: 12, color: "#888" },
  chevron: { fontSize: 18, color: "#CCC" },

  // --- Expanded Body Styling ---
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 16 },
  
  // Differentiated Content Boxes
  contentBox: {
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0"
  },
  instructionBox: {
    backgroundColor: "#FFFBF0", 
    borderColor: "#F5E6CC",
    borderLeftWidth: 4,
    borderLeftColor: "#E0C097"
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#444", marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  paragraphText: { fontSize: 15, color: "#4A4A4A", lineHeight: 22 },
  
  detailText: { fontSize: 13, color: "#888", marginBottom: 16, fontStyle: 'italic' },

  // Info Sections
  section: { marginTop: 12 },
  subTitle: { fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8 },
  
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  allergyTag: { backgroundColor: "#FFE5E5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  allergyText: { color: "#D63031", fontSize: 12, fontWeight: "600" },
  mutedText: { color: "#999", fontStyle: "italic" },

  // Grids
  ayurvedaGrid: { flexDirection: 'row', backgroundColor: "#F8F9FA", borderRadius: 8, padding: 10, justifyContent: 'space-between' },
  ayurvedaItem: { alignItems: 'center', flex: 1 },
  labelBold: { fontWeight: "700", fontSize: 12, color: "#555", marginBottom: 2 },
  valueText: { fontSize: 13, color: "#333", textAlign: 'center' },

  doshaContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  doshaBadge: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
});