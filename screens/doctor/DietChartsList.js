// /screens/doctor/DietChartsList.js
import React, { useState, useCallback, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"; 
import { colors } from "../../colors";
import { dietPlansAPI } from "../../services/api";

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;
const HEADER_CONTENT_HEIGHT = 80; 
const TOTAL_HEADER_HEIGHT = STATUSBAR_HEIGHT + HEADER_CONTENT_HEIGHT;

// --- DETAIL MODAL COMPONENT ---
const DietPlanDetailModal = ({ visible, plan, onClose, onEdit }) => {
    if (!plan) return null;
  
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{flex: 1}}>
                <Text style={styles.modalTitle}>{plan.name}</Text>
                {plan.patient && <Text style={styles.modalSub}>For: {plan.patient.name}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
            {/* Description & Badges */}
            <Text style={styles.modalDesc}>{plan.description}</Text>
            
            <View style={styles.modalMetaRow}>
              <View style={styles.modalBadge}>
                 <MaterialCommunityIcons name="leaf" size={14} color={colors.primary} />
                 <Text style={styles.modalBadgeText}>{plan.doshaType ? plan.doshaType.replace("_","-") : "Tri-Dosha"}</Text>
              </View>
              <View style={styles.modalBadge}>
                 <Ionicons name="time-outline" size={14} color={colors.foregroundLight} />
                 <Text style={[styles.modalBadgeText, {color: colors.foreground}]}>{plan.duration} Days</Text>
              </View>
            </View>
  
            <View style={styles.divider} />
            
            {/* Schedule Rendering */}
            <Text style={styles.sectionHeader}>Full Schedule</Text>
            {Array.from({ length: plan.duration }).map((_, i) => {
               const dayNum = i + 1;
               const dayItems = plan.items?.filter(item => item.dayNumber === dayNum) || [];
               if(dayItems.length === 0) return null;
  
               return (
                 <View key={dayNum} style={styles.dayBlock}>
                    <Text style={styles.dayTitle}>Day {dayNum}</Text>
                    
                    {/* --- UPDATED: Included 'SNACK' in the map array --- */}
                    {['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'].map(mealType => {
                        const mealItems = dayItems.filter(item => item.mealType === mealType);
                        if (mealItems.length === 0) return null;
  
                        return (
                            <View key={mealType} style={styles.mealGroup}>
                                <Text style={styles.mealHeaderTitle}>{mealType}</Text>
                                {mealItems.map((item, idx) => (
                                    <View key={idx} style={styles.foodItem}>
                                        <Text style={styles.mealTime}>{item.time}</Text>
                                        <View style={{flex:1, paddingHorizontal: 10}}>
                                            <Text style={styles.foodName}>{item.food?.name || "Food Item"}</Text>
                                            {item.notes ? <Text style={styles.foodNotes}>{item.notes}</Text> : null}
                                        </View>
                                        <Text style={styles.foodQty}>{item.quantity} {item.unit}</Text>
                                    </View>
                                ))}
                            </View>
                        )
                    })}
                 </View>
               )
            })}
          </ScrollView>
  
          {/* Modal Footer Action */}
          <View style={styles.modalFooter}>
             <TouchableOpacity style={styles.modalEditBtn} onPress={() => { onClose(); onEdit(plan.id); }}>
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.modalEditText}>Edit Plan</Text>
             </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
};

export default function DietChartsList({ navigation }) {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null); // For Modal

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, -10], extrapolate: "clamp" });
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.95], extrapolate: "clamp" });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadCharts = async () => {
    try {
      const res = await dietPlansAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCharts(list);
    } catch (err) {
      console.log("Error loading charts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadCharts(); }, []));
  const onRefresh = () => { setRefreshing(true); loadCharts(); };

  const handleEdit = (id) => navigation.navigate("CreateDietChart", { chartId: id });

  const handleDelete = (id) => {
    Alert.alert("Delete Chart?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const prev = [...charts];
            setCharts(prev.filter((c) => c.id !== id));
            await dietPlansAPI.delete(id);
          } catch (err) {
            Alert.alert("Error", "Could not delete chart.");
            loadCharts(); 
          }
        }
      },
    ]);
  };

  // --- SUMMARY CALCULATOR ---
  const calculateCardSummary = (plan) => {
    if (!plan.items || plan.items.length === 0) return null;
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    let heating = 0, cooling = 0;
    const foodNames = [];

    plan.items.forEach(item => {
      if (item.food) {
        totalCals += (item.food.calories || 0);
        totalProt += (item.food.protein || 0);
        totalCarbs += (item.food.carbs || 0);
        totalFat += (item.food.fat || 0);
        
        if (foodNames.length < 3 && !foodNames.includes(item.food.name)) {
            foodNames.push(item.food.name);
        }

        const v = (item.food.virya || "").toLowerCase();
        if (v.includes('hot')) heating++;
        if (v.includes('cold')) cooling++;
      }
    });

    const duration = Math.max(1, plan.duration || 1); 
    const avgCal = Math.round(totalCals / duration);
    const avgProt = Math.round(totalProt / duration);
    const avgCarb = Math.round(totalCarbs / duration);
    const avgFat = Math.round(totalFat / duration);

    let nature = "Neutral";
    if (heating > cooling) nature = "Heating";
    if (cooling > heating) nature = "Cooling";

    return { avgCal, avgProt, avgCarb, avgFat, nature, foodPreview: foodNames.join(", ") + (plan.items.length > 3 ? "..." : ""), itemCount: plan.items.length };
  };

  const getDoshaColor = (type) => {
    if (!type) return colors.foregroundLight;
    const t = type.toUpperCase();
    if (t.includes("VATA")) return "#A29BFE"; 
    if (t.includes("PITTA")) return "#FF7675"; 
    if (t.includes("KAPHA")) return "#55EFC4"; 
    return colors.primary;
  };

  const formatDate = (dateString) => {
      if(!dateString) return "";
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderCard = ({ item }) => {
    const isTemplate = !item.patientId;
    const stats = calculateCardSummary(item);
    const displayDosha = item.doshaType ? item.doshaType.replace("_", "-") : "Tri-Dosha";
    const doshaColor = getDoshaColor(displayDosha);

    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelectedPlan(item)} activeOpacity={0.9}>
        <View style={[styles.leftStrip, { backgroundColor: doshaColor }]} />

        <View style={styles.cardContent}>
          <View style={styles.rowTop}>
            <View style={{flex: 1, marginRight: 8}}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.createdDate}>Created {formatDate(item.createdAt)}</Text>
            </View>
            
            <View style={styles.actionsRow}>
                <TouchableOpacity onPress={() => handleEdit(item.id)} style={styles.iconBtn}>
                   <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.iconBtn, {marginLeft: 6}]}>
                   <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}

          {stats && (
             <View style={styles.macroContainer}>
                <View style={styles.macroItem}><Text style={styles.macroValue}>{stats.avgProt}g</Text><Text style={styles.macroLabel}>Prot</Text></View>
                <View style={styles.vertLine} />
                <View style={styles.macroItem}><Text style={styles.macroValue}>{stats.avgCarb}g</Text><Text style={styles.macroLabel}>Carb</Text></View>
                <View style={styles.vertLine} />
                <View style={styles.macroItem}><Text style={styles.macroValue}>{stats.avgFat}g</Text><Text style={styles.macroLabel}>Fat</Text></View>
             </View>
          )}

          {stats && (
            <View style={styles.analysisRow}>
                <View style={[styles.statBadge, {borderColor: '#F59E6C'}]}>
                    <Ionicons name="flame" size={10} color="#F59E6C" />
                    <Text style={[styles.statText, {color: '#E67E22'}]}>{stats.avgCal} kcal</Text>
                </View>
                <View style={[styles.statBadge, {borderColor: doshaColor}]}>
                    <MaterialCommunityIcons name="leaf" size={10} color={doshaColor} />
                    <Text style={[styles.statText, {color: doshaColor}]}>{displayDosha}</Text>
                </View>
                {stats.nature !== "Neutral" && (
                    <View style={styles.statBadge}>
                        <Ionicons name={stats.nature === "Heating" ? "thermometer" : "snow"} size={10} color={stats.nature === "Heating" ? "#FF6B6B" : "#4ECDC4"} />
                        <Text style={[styles.statText, {color: stats.nature === "Heating" ? "#FF6B6B" : "#4ECDC4"}]}>{stats.nature}</Text>
                    </View>
                )}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.patientBadge}>
               <Ionicons name={isTemplate ? "document-text-outline" : "person-outline"} size={14} color={colors.foregroundLight} />
               <Text style={styles.patientText}>{item.patient?.name ? `${item.patient.name}` : "Template"}</Text>
            </View>
            <View style={styles.durationBadge}>
               <Ionicons name="time-outline" size={14} color={colors.foregroundLight} />
               <Text style={styles.durationText}>{item.duration || 1} Days</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.floatingHeader, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
            <View>
                <Text style={styles.screenTitle}>Diet Charts</Text>
                <Text style={styles.subTitle}>Manage templates & assigned plans</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("ChatEntry")} style={styles.chatHeaderBtn}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <Animated.FlatList
          data={charts}
          keyExtractor={(i) => i.id}
          renderItem={renderCard}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={60} color={colors.border} />
              <Text style={styles.emptyText}>No diet charts found</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("CreateDietChart")}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Detail Modal */}
      <DietPlanDetailModal 
         visible={!!selectedPlan} 
         plan={selectedPlan} 
         onClose={() => setSelectedPlan(null)} 
         onEdit={handleEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  floatingHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: '#fff', height: TOTAL_HEADER_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT, paddingHorizontal: 20,
    justifyContent: "flex-end",
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 3,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: colors.foreground },
  subTitle: { fontSize: 14, color: colors.foregroundLight, marginTop: 4 },
  chatHeaderBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },

  listContent: { paddingTop: TOTAL_HEADER_HEIGHT + 16, paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    flexDirection: "row", backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#eee', overflow: 'hidden',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  leftStrip: { width: 6, height: '100%' },
  cardContent: { flex: 1, padding: 16 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, marginBottom: 2 },
  createdDate: { fontSize: 11, color: '#999', marginBottom: 6 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, backgroundColor: '#F9FAFB', borderRadius: 8 },
  
  cardDesc: { fontSize: 13, color: colors.foregroundLight, marginBottom: 12, lineHeight: 18 },

  macroContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, marginBottom: 10, alignSelf: 'flex-start' },
  macroItem: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 6 },
  macroValue: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  macroLabel: { fontSize: 10, color: colors.foregroundLight, marginLeft: 2 },
  vertLine: { width: 1, height: 12, backgroundColor: '#E5E7EB' },

  analysisRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#eee' },
  statText: { fontSize: 10, fontWeight: '600', color: colors.foreground, marginLeft: 4 },

  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  patientBadge: { flexDirection: 'row', alignItems: 'center' },
  patientText: { fontSize: 12, color: colors.foregroundLight, marginLeft: 4, fontWeight: '500' },
  durationBadge: { flexDirection: 'row', alignItems: 'center' },
  durationText: { fontSize: 12, color: colors.foregroundLight, marginLeft: 4, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.foregroundLight, marginTop: 16 },
  emptySub: { fontSize: 14, color: colors.foregroundLight, marginTop: 6, textAlign: 'center' },

  fab: { position: "absolute", bottom: 26, right: 20, width: 60, height: 60, backgroundColor: colors.primary, borderRadius: 30, alignItems: "center", justifyContent: "center", elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },

  /* --- MODAL STYLES --- */
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.foreground },
  modalSub: { fontSize: 13, color: colors.foregroundLight, marginTop: 2 },
  closeBtn: { padding: 4 },
  modalDesc: { fontSize: 15, color: colors.foregroundLight, marginBottom: 16, lineHeight: 22 },
  modalMetaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 },
  modalBadgeText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginTop: 10, color: colors.foreground },
  
  dayBlock: { marginBottom: 24 },
  dayTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 10, backgroundColor: colors.background, padding: 10, borderRadius: 8, overflow: 'hidden' },
  mealGroup: { marginBottom: 12, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.border },
  mealHeaderTitle: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', marginBottom: 4 },
  foodItem: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  mealTime: { fontSize: 11, color: colors.foregroundLight, width: 50 },
  foodName: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  foodNotes: { fontSize: 12, color: colors.foregroundLight, fontStyle: 'italic' },
  foodQty: { fontSize: 13, fontWeight: '600', color: colors.foreground },

  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  modalEditBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12 },
  modalEditText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 },
});