// screens/food/FoodDetailModal.js
import React from "react";
import {
  View, Text, Modal, StyleSheet, ScrollView, Image, TouchableOpacity
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
  if (!food) return null;

  const categoryColor = CATEGORY_COLOR[(food.category || "OTHER").toUpperCase()] || colors.primary;

  // Schema Fields
  const { rasa, virya, guna, vipaka, dosha, notes } = food;

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />

        <View style={styles.modalContainer}>
          {/* HERO IMAGE */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: food.imageUrl || "https://via.placeholder.com/400" }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.imageGradient} />
            
            <View style={styles.headerButtons}>
               <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                  <Ionicons name="create-outline" size={24} color="#fff" />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.iconBtn, {marginLeft: 10}]} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#fff" />
               </TouchableOpacity>
            </View>

            <View style={styles.headerContent}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                <Text style={styles.categoryText}>{food.category || "Food"}</Text>
              </View>
              <Text style={styles.title}>{food.name}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {food.description || "No description available."}
            </Text>

            {/* NUTRITION */}
            <Text style={styles.sectionTitle}>Nutrition <Text style={styles.subTitle}>(per 100g)</Text></Text>
            <View style={styles.macroGrid}>
              <MacroItem label="Calories" value={food.calories} unit="kcal" icon="fire" color="#FF6B6B" />
              <MacroItem label="Protein" value={food.protein} unit="g" icon="food-drumstick" color="#4ECDC4" />
              <MacroItem label="Carbs" value={food.carbs} unit="g" icon="barley" color="#FFD93D" />
              <MacroItem label="Fat" value={food.fat} unit="g" icon="water" color="#6C5CE7" />
            </View>

            {/* AYURVEDA */}
            <View style={styles.ayurvedaSection}>
              <View style={styles.ayurvedaHeader}>
                <MaterialCommunityIcons name="flower-tulip" size={20} color={colors.primary} />
                <Text style={styles.ayurvedaTitle}>Ayurvedic Profile</Text>
              </View>

              <View style={styles.ayurvedaGrid}>
                {/* Dosha */}
                <View style={styles.ayurvedaRow}>
                  <Text style={styles.ayurLabel}>Dosha Type</Text>
                  <View style={styles.ayurValueContainer}>
                     <Text style={styles.ayurValue}>{dosha || "—"}</Text>
                  </View>
                </View>

                {/* Rasa */}
                <View style={styles.ayurvedaRow}>
                  <Text style={styles.ayurLabel}>Rasa (Taste)</Text>
                  <Text style={styles.ayurValueText}>{rasa || "—"}</Text>
                </View>

                {/* Virya */}
                <View style={styles.ayurvedaRow}>
                  <Text style={styles.ayurLabel}>Virya (Potency)</Text>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                      {(virya || "").toLowerCase().includes('hot') && <Ionicons name="flame" size={12} color="#FF6B6B" style={{marginRight:4}}/>}
                      {(virya || "").toLowerCase().includes('cold') && <Ionicons name="snow" size={12} color="#4ECDC4" style={{marginRight:4}}/>}
                      <Text style={styles.ayurValueText}>{virya || "—"}</Text>
                  </View>
                </View>

                 {/* Vipaka */}
                 <View style={styles.ayurvedaRow}>
                  <Text style={styles.ayurLabel}>Vipaka (Post-Digest)</Text>
                  <Text style={styles.ayurValueText}>{vipaka || "—"}</Text>
                </View>

                {/* Guna */}
                <View style={[styles.ayurvedaRow, {borderBottomWidth: 0}]}>
                  <Text style={styles.ayurLabel}>Guna (Qualities)</Text>
                  <Text style={styles.ayurValueText}>{guna || "—"}</Text>
                </View>
              </View>
            </View>

            {/* NOTES */}
            {notes ? (
                <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{notes}</Text>
                </View>
            ) : null}

            {/* EDIT BUTTON */}
            <TouchableOpacity style={styles.editActionBtn} onPress={onEdit}>
                <Ionicons name="pencil" size={18} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.editActionText}>Edit Food Details</Text>
            </TouchableOpacity>

            <View style={{height:40}}/>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContainer: { backgroundColor: colors.background, height: "92%", width: "100%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  
  imageContainer: { height: 240, width: "100%", position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140 },
  headerButtons: { position: "absolute", top: 20, right: 20, flexDirection: 'row' },
  iconBtn: { backgroundColor: "rgba(0,0,0,0.4)", width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerContent: { position: "absolute", bottom: 20, left: 20, right: 20 },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  categoryText: { color: "#fff", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  scrollContent: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8, marginTop: 16 },
  subTitle: { fontSize: 14, fontWeight: "400", color: colors.foregroundLight },
  description: { fontSize: 15, color: colors.foregroundLight, lineHeight: 22 },

  macroGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 8 },
  macroCard: { width: "48%", backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  macroIcon: { padding: 8, borderRadius: 20, marginBottom: 6 },
  macroValue: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  macroUnit: { fontSize: 12, color: colors.foregroundLight },
  macroLabel: { fontSize: 12, color: colors.foregroundLight, marginTop: 2 },

  ayurvedaSection: { marginTop: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.primary + "40", overflow: 'hidden' },
  ayurvedaHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + "15", padding: 12 },
  ayurvedaTitle: { fontSize: 16, fontWeight: "700", color: colors.primary, marginLeft: 8 },
  ayurvedaGrid: { padding: 16 },
  ayurvedaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  ayurLabel: { fontSize: 14, color: colors.foregroundLight, fontWeight: '500' },
  ayurValueContainer: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  ayurValue: { fontSize: 13, color: colors.foreground, fontWeight: "600" },
  ayurValueText: { fontSize: 14, color: colors.foreground, fontWeight: "600", textAlign: 'right', flex: 1, marginLeft: 10 },

  notesSection: { marginTop: 20, padding: 12, backgroundColor: colors.backgroundLight, borderRadius: 10 },
  notesLabel: { fontSize: 12, fontWeight: '700', color: colors.foregroundLight, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.foreground },

  editActionBtn: { marginTop: 30, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  editActionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});