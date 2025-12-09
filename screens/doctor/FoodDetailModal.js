// /screens/doctor/FoodDetailModal.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../colors";

const CATEGORY_COLOR = {
  GRAINS: "#D9A84C", VEGETABLES: "#6FBF73", FRUITS: "#F59E6C",
  DAIRY: "#7FB5FF", SPICES: "#D96C6C", HERBS: "#6CCDB2",
  NUTS: "#C8A08A", LEGUMES: "#8FCBDF", MEAT: "#D36B6B",
  FISH: "#5AA6D8", OTHER: colors.primary, ALL: colors.primary,
};

export default function FoodDetailModal({ visible, food, onClose, onEdit }) {
  
  // 🟢 Local state ensures UI updates immediately if parent props change
  const [localFood, setLocalFood] = useState(food);

  useEffect(() => {
    if (food) setLocalFood(food);
  }, [food]);

  if (!localFood) return null;

  const categoryColor = CATEGORY_COLOR[(localFood.category || "OTHER").toUpperCase()] || colors.primary;

  // --- PARSE HELPERS ---
  const parseList = (jsonStr) => {
      if (!jsonStr) return [];
      try {
          const parsed = JSON.parse(jsonStr);
          return Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e) {
          // Fallback for legacy comma-separated strings
          return jsonStr.includes(',') ? jsonStr.split(',').map(s => s.trim()) : [jsonStr];
      }
  };

  const benefits = parseList(localFood.benefits);
  const precautions = parseList(localFood.precautions);

  // --- COMPONENTS ---
  const MacroItem = ({ label, value, unit, icon, color }) => (
    <View style={styles.macroCard}>
      <View style={[styles.macroIcon, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.macroValue}>
        {value || 0}<Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );

  const AyurItem = ({ label, value, icon }) => (
      <View style={styles.ayurItem}>
          <Text style={styles.ayurLabel}>{label}</Text>
          <View style={styles.ayurValueRow}>
              <MaterialCommunityIcons name={icon} size={14} color={colors.primary} style={{marginRight: 4}} />
              <Text style={styles.ayurValue} numberOfLines={1}>{value || "—"}</Text>
          </View>
      </View>
  );

  // --- DOSHA INDICATOR (Updated for integers) ---
  const DoshaIndicator = ({ label, value, color }) => {
      let iconName = "remove";
      let iconColor = "#90A4AE"; // Grey for Neutral
      let text = "Neutral";

      // 1 = Increases, -1 = Decreases, 0 = Neutral
      if (value === 1) {
          iconName = "arrow-up-circle";
          iconColor = "#E53935"; // Red
          text = "Increases";
      } else if (value === -1) {
          iconName = "arrow-down-circle";
          iconColor = "#00897B"; // Teal
          text = "Decreases";
      }

      return (
          <View style={styles.doshaBox}>
              <Text style={[styles.doshaName, {color}]}>{label}</Text>
              <View style={styles.doshaStatus}>
                  <Ionicons name={iconName} size={16} color={iconColor} />
                  <Text style={[styles.doshaText, { color: iconColor }]}>{text}</Text>
              </View>
          </View>
      );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Click background to close */}
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <View style={styles.modalContainer}>
          
          {/* --- HERO IMAGE HEADER --- */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: localFood.imageUrl || "https://via.placeholder.com/400" }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.imageGradient}
            />
            
            {/* Header Buttons */}
            <View style={styles.headerButtons}>
               <TouchableOpacity style={styles.iconBtn} onPress={() => onEdit(localFood)}>
                  <Ionicons name="create-outline" size={24} color="#fff" />
               </TouchableOpacity>

               <TouchableOpacity style={[styles.iconBtn, {marginLeft: 10}]} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#fff" />
               </TouchableOpacity>
            </View>

            <View style={styles.headerContent}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>{localFood.category || "Food"}</Text>
              </View>
              <Text style={styles.title}>{localFood.name}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* --- DESCRIPTION --- */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {localFood.description || "No detailed description available for this item."}
            </Text>

            {/* --- NUTRITION GRID --- */}
            <Text style={styles.sectionTitle}>Nutritional Value <Text style={styles.subTitle}>(per 100g)</Text></Text>
            <View style={styles.macroGrid}>
              <MacroItem label="Calories" value={localFood.calories} unit="kcal" icon="fire" color="#FF6B6B" />
              <MacroItem label="Protein" value={localFood.protein} unit="g" icon="food-drumstick" color="#4ECDC4" />
              <MacroItem label="Carbs" value={localFood.carbs} unit="g" icon="barley" color="#FFD93D" />
              <MacroItem label="Fats" value={localFood.fat} unit="g" icon="water" color="#6C5CE7" />
            </View>

            {/* --- AYURVEDIC PROFILE --- */}
            <View style={styles.ayurvedaSection}>
              <View style={styles.ayurvedaHeader}>
                <MaterialCommunityIcons name="leaf" size={20} color={colors.primary} />
                <Text style={styles.ayurvedaTitle}>Ayurvedic Properties</Text>
              </View>

              {/* DOSHA ROW - Using Integers from DB */}
              <View style={styles.doshaRow}>
                  <DoshaIndicator label="Vata" value={localFood.vata} color="#5E35B1" />
                  <View style={styles.vDivider} />
                  <DoshaIndicator label="Pitta" value={localFood.pitta} color="#C62828" />
                  <View style={styles.vDivider} />
                  <DoshaIndicator label="Kapha" value={localFood.kapha} color="#00695C" />
              </View>

              <View style={styles.hDivider} />

              <View style={styles.ayurvedaGrid}>
                  <AyurItem label="Rasa (Taste)" value={localFood.rasa} icon="water-outline" />
                  <View style={styles.hDividerLight} />
                  <AyurItem label="Virya (Potency)" value={localFood.virya} icon="thermometer" />
                  <View style={styles.hDividerLight} />
                  <AyurItem label="Vipaka (Post-Digest)" value={localFood.vipaka} icon="timer-sand" />
                  <View style={styles.hDividerLight} />
                  <AyurItem label="Guna (Qualities)" value={localFood.guna} icon="layers-outline" />
              </View>
            </View>

            {/* --- HEALTH BENEFITS --- */}
            {benefits.length > 0 && (
                <View style={styles.infoSection}>
                    <Text style={[styles.sectionTitle, {color: colors.primary}]}>Health Benefits</Text>
                    {benefits.map((item, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{marginTop: 2}} />
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* --- PRECAUTIONS --- */}
            {precautions.length > 0 && (
                <View style={[styles.infoSection, {marginTop: 16}]}>
                    <Text style={[styles.sectionTitle, {color: '#FF6B6B'}]}>Precautions</Text>
                    {precautions.map((item, index) => (
                        <View key={index} style={styles.bulletRow}>
                            <Ionicons name="alert-circle" size={16} color="#FF6B6B" style={{marginTop: 2}} />
                            <Text style={styles.bulletText}>{item}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* --- EDIT BUTTON --- */}
            <TouchableOpacity style={styles.editActionBtn} onPress={() => onEdit(localFood)}>
                <Ionicons name="pencil" size={18} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.editActionText}>Edit Food Details</Text>
            </TouchableOpacity>

            {/* --- FOOTER --- */}
            <View style={styles.metaInfo}>
                <Text style={styles.metaText}>Last Updated: {new Date().toLocaleDateString()}</Text>
            </View>
            
            <View style={{height: 40}} />

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end", 
  },
  modalContainer: {
    backgroundColor: colors.background,
    height: "92%",
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  
  /* HERO HEADER */
  imageContainer: {
    height: 240,
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 140,
  },
  
  headerButtons: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: 'row',
  },
  iconBtn: {
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },

  headerContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* CONTENT */
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 8,
    marginTop: 16,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.foregroundLight,
  },
  description: {
    fontSize: 15,
    color: colors.foregroundLight,
    lineHeight: 22,
  },

  /* MACRO GRID */
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  macroCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    flexDirection: "column",
  },
  macroIcon: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 6,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
  },
  macroUnit: {
    fontSize: 12,
    color: colors.foregroundLight,
    fontWeight: "500",
  },
  macroLabel: {
    fontSize: 12,
    color: colors.foregroundLight,
    marginTop: 2,
  },

  /* AYURVEDA SECTION */
  ayurvedaSection: {
    marginTop: 20,
    backgroundColor: colors.card, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + "40", 
    overflow: 'hidden',
  },
  ayurvedaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + "15", 
    padding: 12,
  },
  ayurvedaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 8,
  },
  doshaRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingVertical: 12,
      backgroundColor: '#fff',
  },
  doshaBox: {
      alignItems: 'center',
      width: '30%',
  },
  doshaName: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 4,
  },
  doshaStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  doshaText: {
      fontSize: 11,
      fontWeight: '600',
  },
  vDivider: {
      width: 1,
      height: '80%',
      backgroundColor: colors.border,
      alignSelf: 'center',
  },
  ayurvedaGrid: {
    padding: 16,
  },
  ayurItem: {
      marginBottom: 8,
  },
  ayurLabel: {
      fontSize: 12,
      color: colors.foregroundLight,
      marginBottom: 2,
  },
  ayurValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  ayurValue: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
      flex: 1,
  },
  hDivider: {
      height: 1,
      backgroundColor: colors.border,
  },
  hDividerLight: {
      height: 1,
      backgroundColor: colors.border + '60',
      marginVertical: 8,
  },

  /* INFO LISTS */
  infoSection: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 20,
  },
  bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
  },
  bulletText: {
      fontSize: 14,
      color: colors.foreground,
      marginLeft: 10,
      flex: 1,
      lineHeight: 20,
  },

  /* BUTTONS & FOOTER */
  editActionBtn: {
    marginTop: 30,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  metaInfo: {
      marginTop: 30,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
  },
  metaText: {
      fontSize: 12,
      color: colors.foregroundLight
  }
});