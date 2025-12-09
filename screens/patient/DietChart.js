// /screens/patient/DietChart.js
import React, { useEffect, useState, useMemo, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  Modal,
  Alert
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// --- EXPO IMPORTS ---
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { colors } from "../../colors";
import { dietPlansAPI } from "../../services/api";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// --- HELPER: PARSE JSON STRINGS ---
const parseList = (jsonStr) => {
    if (!jsonStr) return [];
    try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch (e) {
        return jsonStr.includes(',') ? jsonStr.split(',').map(s => s.trim()) : [jsonStr];
    }
};

// --- FOOD DETAIL MODAL (Unchanged) ---
const DietItemDetailModal = ({ visible, item, onClose }) => {
  if (!item || !item.food) return null;

  const { food, quantity, unit, notes, time, mealType } = item;
  const qtyRatio = (quantity || 100) / 100;

  const macros = {
      cals: Math.round((food.calories || 0) * qtyRatio),
      prot: Math.round((food.protein || 0) * qtyRatio),
      carbs: Math.round((food.carbs || 0) * qtyRatio),
      fat: Math.round((food.fat || 0) * qtyRatio),
      fiber: Math.round((food.fiber || 0) * qtyRatio),
  };

  const doshaEffects = parseList(food.doshaEffects);
  const vitamins = parseList(food.vitamins);
  const minerals = parseList(food.minerals);
  const benefits = parseList(food.benefits);
  const precautions = parseList(food.precautions);

  const MacroItem = ({ label, value, unitLabel, icon, color }) => (
      <View style={styles.macroCard}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>{unitLabel}</Text></Text>
          <Text style={styles.macroLabel}>{label}</Text>
      </View>
  );

  const InfoTag = ({ text, color }) => (
      <View style={[styles.tagChip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
          <Text style={[styles.tagText, { color: color }]}>{text}</Text>
      </View>
  );

  const AyurRow = ({ label, value }) => (
      <View style={styles.ayurRow}>
          <Text style={styles.ayurLabel}>{label}</Text>
          <Text style={styles.ayurVal}>{value || "—"}</Text>
      </View>
  );

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
          <View style={styles.modalContainer}>
              <View style={styles.imageContainer}>
                  <Image 
                      source={{ uri: food.imageUrl || "https://via.placeholder.com/400" }} 
                      style={styles.heroImage} 
                      resizeMode="cover" 
                  />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.imageGradient} />
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.headerContent}>
                      <View style={styles.tagRow}>
                          <View style={styles.catBadge}>
                              <Text style={styles.catText}>{food.category}</Text>
                          </View>
                          <View style={styles.mealBadge}>
                              <Text style={styles.catText}>{mealType} • {time}</Text>
                          </View>
                      </View>
                      <Text style={styles.modalTitle}>{food.name}</Text>
                  </View>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                  <View style={styles.prescriptionCard}>
                      <View style={styles.prescRow}>
                          <View style={styles.prescIcon}>
                              <MaterialCommunityIcons name="scale" size={24} color={colors.primary} />
                          </View>
                          <View>
                              <Text style={styles.prescLabel}>Prescribed Quantity</Text>
                              <Text style={styles.prescValue}>{quantity} {unit}</Text>
                          </View>
                      </View>
                  </View>

                  {notes ? (
                      <View style={styles.noteCard}>
                          <View style={styles.noteHeader}>
                              <Ionicons name="document-text-outline" size={18} color="#D97706" />
                              <Text style={styles.noteLabel}>Doctor's Note</Text>
                          </View>
                          <Text style={styles.noteContent}>"{notes}"</Text>
                      </View>
                  ) : null}

                  <Text style={styles.sectionTitle}>Nutrition Facts <Text style={styles.subTitle}>(for this portion)</Text></Text>
                  <View style={styles.macroGrid}>
                      <MacroItem label="Calories" value={macros.cals} unitLabel="kcal" icon="fire" color="#FF6B6B" />
                      <MacroItem label="Protein" value={macros.prot} unitLabel="g" icon="food-drumstick" color="#4ECDC4" />
                      <MacroItem label="Carbs" value={macros.carbs} unitLabel="g" icon="barley" color="#FFD93D" />
                      <MacroItem label="Fats" value={macros.fat} unitLabel="g" icon="water" color="#6C5CE7" />
                  </View>
                  {macros.fiber > 0 && (
                      <View style={styles.fiberRow}>
                          <Text style={styles.fiberText}>Dietary Fiber: <Text style={{fontWeight:'700'}}>{macros.fiber}g</Text></Text>
                      </View>
                  )}

                  <View style={styles.sectionCard}>
                      <View style={styles.cardHeaderRow}>
                          <MaterialCommunityIcons name="leaf" size={20} color={colors.primary} />
                          <Text style={styles.cardTitle}>Ayurvedic Profile</Text>
                      </View>
                      <View style={styles.tagContainer}>
                          {doshaEffects.map((d, i) => <InfoTag key={i} text={d} color={colors.primary} />)}
                      </View>
                      <View style={styles.divider} />
                      <AyurRow label="Rasa (Taste)" value={food.rasa} />
                      <AyurRow label="Virya (Potency)" value={food.virya} />
                      <AyurRow label="Vipaka (Post-Digest)" value={food.vipaka} />
                      <AyurRow label="Guna (Qualities)" value={food.guna} />
                  </View>

                  {(vitamins.length > 0 || minerals.length > 0) && (
                      <View style={styles.sectionCard}>
                          <View style={styles.cardHeaderRow}>
                              <MaterialCommunityIcons name="flask-outline" size={20} color="#8E44AD" />
                              <Text style={styles.cardTitle}>Micro-Nutrients</Text>
                          </View>
                          {vitamins.length > 0 && (
                              <View style={{marginBottom: 8}}>
                                  <Text style={styles.subHeader}>Vitamins</Text>
                                  <View style={styles.tagContainer}>
                                      {vitamins.map((v, i) => <InfoTag key={i} text={v} color="#8E44AD" />)}
                                  </View>
                              </View>
                          )}
                          {minerals.length > 0 && (
                              <View>
                                  <Text style={styles.subHeader}>Minerals</Text>
                                  <View style={styles.tagContainer}>
                                      {minerals.map((m, i) => <InfoTag key={i} text={m} color="#2980B9" />)}
                                  </View>
                              </View>
                          )}
                      </View>
                  )}

                  <View style={styles.sectionCard}>
                      <View style={styles.cardHeaderRow}>
                          <MaterialCommunityIcons name="heart-pulse" size={20} color="#27AE60" />
                          <Text style={styles.cardTitle}>Health Insights</Text>
                      </View>
                      {benefits.length > 0 && (
                          <View style={{marginBottom: 12}}>
                              <Text style={[styles.subHeader, {color: '#27AE60'}]}>Benefits</Text>
                              {benefits.map((b, i) => (
                                  <View key={i} style={styles.bulletRow}>
                                      <Ionicons name="checkmark-circle" size={16} color="#27AE60" style={{marginTop:2}} />
                                      <Text style={styles.bulletText}>{b}</Text>
                                  </View>
                              ))}
                          </View>
                      )}
                      {precautions.length > 0 && (
                          <View>
                              <Text style={[styles.subHeader, {color: '#C0392B'}]}>Precautions</Text>
                              {precautions.map((p, i) => (
                                  <View key={i} style={styles.bulletRow}>
                                      <Ionicons name="alert-circle" size={16} color="#C0392B" style={{marginTop:2}} />
                                      <Text style={styles.bulletText}>{p}</Text>
                                  </View>
                              ))}
                          </View>
                      )}
                  </View>
                  <View style={{height: 40}} />
              </ScrollView>
          </View>
      </Modal>
  );
};

export default function DietChart({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [plan, setPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadMyPlan();
  }, []);
const loadMyPlan = async () => {
  try {
    setLoading(true);

    // 🔥 Correct API call based on your backend routes
    const res = await dietPlansAPI.getAllByPatient(user.id);


    const plans = Array.isArray(res.data.data)
      ? res.data.data
      : [];

    if (!plans || plans.length === 0) {
      setPlan(null);
      return;
    }

    // 🔥 Sort and pick most recent plan
    const sorted = plans.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    setPlan(sorted[0]); 
  } catch (err) {
    console.log("❌ Error loading diet plan:", err);
    setPlan(null);
  } finally {
    setLoading(false);
  }
};



  // Data for the current view (App UI)
  const dayData = useMemo(() => {
    if (!plan || !plan.items) return null;
    const currentItems = plan.items.filter(i => i.dayNumber === activeDay);
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    const meals = { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] };

    currentItems.forEach(item => {
      if (item.food) {
         const qtyRatio = (item.quantity || 100) / 100;
         totalCals += (item.food.calories || 0) * qtyRatio;
         totalProt += (item.food.protein || 0) * qtyRatio;
         totalCarbs += (item.food.carbs || 0) * qtyRatio;
         totalFat += (item.food.fat || 0) * qtyRatio;
      }
      const type = item.mealType ? item.mealType.toUpperCase() : "SNACK";
      if(meals[type]) meals[type].push(item);
      else meals.SNACK.push(item);
    });

    return {
      stats: { cals: Math.round(totalCals), prot: Math.round(totalProt), carbs: Math.round(totalCarbs), fat: Math.round(totalFat) },
      meals
    };
  }, [plan, activeDay]);

  const getDoshaColor = (type) => {
    if (!type) return colors.primary;
    if (type.includes("VATA")) return "#A29BFE"; 
    if (type.includes("PITTA")) return "#FF7675"; 
    if (type.includes("KAPHA")) return "#55EFC4"; 
    return colors.primary;
  };

  /* ---------------------------------------------------------
   * SAVE FILE HELPER (Robust for Android/iOS)
   * --------------------------------------------------------- */
  const saveFile = async (uri, filename, mimetype) => {
    if (Platform.OS === "android") {
      if (FileSystem.StorageAccessFramework) {
        try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
                const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, mimetype)
                .then(async (newUri) => {
                    await FileSystem.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                    Alert.alert("Success", "Full diet plan saved successfully!");
                })
                .catch(e => {
                    console.log(e);
                    Sharing.shareAsync(uri, { mimeType: mimetype, dialogTitle: 'Download Diet Plan' });
                });
            } else {
                Sharing.shareAsync(uri, { mimeType: mimetype, dialogTitle: 'Download Diet Plan' });
            }
        } catch (error) {
            console.log("SAF Error:", error);
            Sharing.shareAsync(uri, { mimeType: mimetype, dialogTitle: 'Download Diet Plan' });
        }
      } else {
        Alert.alert("Download", "Opening file options...");
        await Sharing.shareAsync(uri, { mimeType: mimetype, dialogTitle: 'Download Diet Plan' });
      }
    } else {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: mimetype });
    }
  };

  /* ---------------------------------------------------------
   * PDF GENERATION LOGIC (ALL DAYS - PROFESSIONAL)
   * --------------------------------------------------------- */
  const generatePDF = async () => {
    if (!plan) return;
    setExporting(true);

    try {
        // 1. Structure Data by Day
        const daysMap = {};
        for(let i = 1; i <= plan.duration; i++) {
            daysMap[i] = { 
                day: i, 
                stats: { cals:0, prot:0, carbs:0, fat:0 }, 
                meals: { BREAKFAST: [], LUNCH: [], SNACK: [], DINNER: [] } 
            };
        }

        plan.items.forEach(item => {
            const d = item.dayNumber;
            if (daysMap[d]) {
                const type = item.mealType ? item.mealType.toUpperCase() : "SNACK";
                if (daysMap[d].meals[type]) {
                    daysMap[d].meals[type].push(item);
                } else {
                    daysMap[d].meals.SNACK.push(item);
                }

                // Stats calc
                if (item.food) {
                    const ratio = (item.quantity || 100) / 100;
                    daysMap[d].stats.cals += (item.food.calories || 0) * ratio;
                    daysMap[d].stats.prot += (item.food.protein || 0) * ratio;
                    daysMap[d].stats.carbs += (item.food.carbs || 0) * ratio;
                    daysMap[d].stats.fat += (item.food.fat || 0) * ratio;
                }
            }
        });

        // 2. HTML Construction Helpers
        const renderMealTable = (title, items) => {
            if (!items || items.length === 0) return '';
            const rows = items.map(item => `
                <tr>
                    <td class="time-cell">${item.time || "--:--"}</td>
                    <td class="food-cell">
                        <div class="food-name">${item.food?.name || "Food"}</div>
                        ${item.notes ? `<div class="food-note">${item.notes}</div>` : ''}
                    </td>
                    <td class="qty-cell">${item.quantity} ${item.unit}</td>
                    <td class="cal-cell">${Math.round((item.food?.calories || 0) * (item.quantity/100))} kcal</td>
                </tr>
            `).join('');

            return `
                <div class="meal-section">
                    <div class="meal-title">${title}</div>
                    <table class="meal-table">
                        ${rows}
                    </table>
                </div>
            `;
        };

        const renderDaySection = (dayNum) => {
            const day = daysMap[dayNum];
            return `
                <div class="day-container">
                    <div class="day-header">
                        <span class="day-title">Day ${dayNum}</span>
                        <div class="day-macros">
                            <span>🔥 ${Math.round(day.stats.cals)} kcal</span>
                            <span>🥩 ${Math.round(day.stats.prot)}g P</span>
                            <span>🍞 ${Math.round(day.stats.carbs)}g C</span>
                            <span>🥑 ${Math.round(day.stats.fat)}g F</span>
                        </div>
                    </div>
                    <div class="day-content">
                        ${renderMealTable('Breakfast', day.meals.BREAKFAST)}
                        ${renderMealTable('Lunch', day.meals.LUNCH)}
                        ${renderMealTable('Snacks', day.meals.SNACK)}
                        ${renderMealTable('Dinner', day.meals.DINNER)}
                    </div>
                </div>
            `;
        };

        // 3. Assemble Full HTML
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @page { margin: 25px; size: A4; }
                body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #2c3e50; margin: 0; padding: 0; }
                
                /* --- COLOR THEME: PROFESSIONAL TEAL & SLATE --- */
                :root {
                    --primary: #00695c; /* Deep Teal */
                    --secondary: #4db6ac; /* Light Teal */
                    --accent: #263238; /* Dark Slate */
                    --light-bg: #f4f6f6;
                    --border: #cfd8dc;
                }

                /* Header */
                .doc-header { text-align: center; padding-bottom: 20px; border-bottom: 3px solid var(--primary); margin-bottom: 30px; }
                .app-brand { font-size: 26px; font-weight: bold; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; }
                .doc-subtitle { font-size: 14px; color: #7f8c8d; margin-top: 5px; }

                /* Plan Info Box */
                .plan-info { display: flex; justify-content: space-between; background: var(--light-bg); padding: 15px 25px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 30px; }
                .info-item { text-align: center; }
                .info-label { font-size: 11px; text-transform: uppercase; color: #7f8c8d; font-weight: bold; letter-spacing: 1px; }
                .info-val { font-size: 16px; font-weight: bold; color: var(--accent); margin-top: 4px; }

                /* Day Section */
                .day-container { page-break-inside: avoid; margin-bottom: 40px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
                .day-header { background: var(--accent); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
                .day-title { font-size: 18px; font-weight: bold; }
                .day-macros { font-size: 12px; opacity: 0.9; font-weight: 500; }
                .day-macros span { margin-left: 15px; }

                /* Meals Table */
                .day-content { padding: 15px; }
                .meal-section { margin-bottom: 15px; }
                .meal-section:last-child { margin-bottom: 0; }
                .meal-title { font-size: 14px; font-weight: bold; color: var(--primary); margin-bottom: 5px; text-transform: uppercase; border-bottom: 1px solid var(--secondary); padding-bottom: 2px; display: inline-block; }
                
                .meal-table { width: 100%; border-collapse: collapse; font-size: 13px; }
                .meal-table td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
                .meal-table tr:last-child td { border-bottom: none; }
                
                .time-cell { width: 60px; font-weight: bold; color: #7f8c8d; font-size: 11px; padding-top: 9px; }
                .food-cell { }
                .food-name { font-weight: 600; color: #333; }
                .food-note { font-size: 11px; color: #d35400; font-style: italic; margin-top: 2px; }
                .qty-cell { width: 80px; text-align: right; color: #555; }
                .cal-cell { width: 60px; text-align: right; font-weight: bold; color: var(--primary); }

                .footer { text-align: center; font-size: 10px; color: #bdc3c7; margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="doc-header">
                <div class="app-brand">AyurCare</div>
                <div class="doc-subtitle">Comprehensive Ayurvedic Diet Protocol</div>
            </div>

            <div class="plan-info">
                <div class="info-item">
                    <div class="info-label">Plan Duration</div>
                    <div class="info-val">${plan.duration} Days</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dosha Profile</div>
                    <div class="info-val" style="color: var(--primary)">${plan.doshaType ? plan.doshaType.replace("_", "-") : "BALANCED"}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Generated On</div>
                    <div class="info-val">${new Date().toLocaleDateString()}</div>
                </div>
            </div>

            ${Object.keys(daysMap).map(dayNum => renderDaySection(dayNum)).join('')}

            <div class="footer">
                This document is a generated diet plan. Please consult your physician before starting any new diet. <br/>
                Generated by AyurCare App
            </div>
        </body>
        </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const filename = `AyurCare_FullPlan_${plan.duration}Days.pdf`;
        await saveFile(uri, filename, 'application/pdf');

    } catch (error) {
        console.error("Export Error:", error);
        Alert.alert("Export Error", "Failed to generate PDF.");
    } finally {
        setExporting(false);
    }
  };


  /* ---------------------------------------------------------
   * RENDER HELPERS
   * --------------------------------------------------------- */
  const renderMealSection = (title, icon, color, items) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.mealCard}>
         <View style={[styles.leftStrip, { backgroundColor: color }]} />
         <View style={styles.mealContent}>
             <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                   <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                      <Ionicons name={icon} size={18} color={color} />
                   </View>
                   <Text style={styles.mealTitle}>{title}</Text>
                </View>
             </View>
             
             {items.map((item, idx) => (
                <TouchableOpacity 
                    key={idx} 
                    style={styles.foodItem}
                    activeOpacity={0.7}
                    onPress={() => setSelectedItem(item)} 
                >
                   <View style={styles.timeBox}><Text style={styles.timeText}>{item.time || "--:--"}</Text></View>
                   <View style={styles.foodDetails}>
                      <Text style={styles.foodName}>{item.food?.name || "Food"}</Text>
                      <View style={styles.foodMetaRow}>
                          <Text style={styles.foodQty}>{item.quantity} {item.unit}</Text>
                          <Text style={styles.dot}>•</Text>
                          <Text style={styles.foodCals}>{Math.round((item.food?.calories || 0) * (item.quantity/100))} kcal</Text>
                      </View>
                      {item.notes ? (
                        <View style={styles.noteInline}>
                           <Ionicons name="information-circle" size={12} color={colors.foregroundLight} />
                           <Text style={styles.noteInlineText} numberOfLines={1}>{item.notes}</Text>
                        </View>
                      ) : null}
                   </View>
                   <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </TouchableOpacity>
             ))}
         </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.container}>
         <View style={styles.header}>
             <Text style={styles.screenTitle}>My Diet Plan</Text>
             <TouchableOpacity onPress={() => navigation.navigate("ChatEntry")} style={styles.iconBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
             </TouchableOpacity>
         </View>
         <View style={styles.emptyState}>
            <MaterialCommunityIcons name="food-apple-outline" size={80} color={colors.border} />
            <Text style={styles.emptyTitle}>No Diet Plan</Text>
            <Text style={styles.emptySub}>You don't have an active diet plan assigned yet.</Text>
            
         </View>
      </View>
    );
  }

  const doshaColor = getDoshaColor(plan.doshaType || "");

  return (
    <View style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
            <Text style={styles.screenTitle}>My Diet Plan</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                <View style={[styles.doshaBadge, { backgroundColor: doshaColor + '20' }]}>
                    <Text style={[styles.doshaText, { color: doshaColor }]}>
                        {plan.doshaType ? plan.doshaType.replace("_", "-") : "Balanced"}
                    </Text>
                </View>
                <Text style={styles.planDuration}> • {plan.duration} Days</Text>
            </View>
        </View>
        
        <View style={styles.headerActions}>
            {/* PDF Export Button */}
            <TouchableOpacity 
                style={styles.iconBtn} 
                onPress={generatePDF}
                disabled={exporting}
            >
                {exporting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.iconBtn} 
                onPress={() => navigation.navigate("ChatEntry")}
            >
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- ANALYSIS CARD --- */}
        <View style={styles.analysisCard}>
           <View style={styles.analysisHeader}>
                <Text style={styles.analysisTitle}>Daily Targets</Text>
                <Text style={styles.totalCals}>{dayData.stats.cals} <Text style={{fontSize:12, color: colors.foregroundLight}}>kcal</Text></Text>
           </View>
           
           <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                 <Text style={styles.macroVal}>{dayData.stats.prot}g</Text>
                 <Text style={styles.macroLabel}>Protein</Text>
                 <View style={[styles.macroBar, {backgroundColor: '#4ECDC4', width: '60%'}]} />
              </View>
              <View style={styles.macroItem}>
                 <Text style={styles.macroVal}>{dayData.stats.carbs}g</Text>
                 <Text style={styles.macroLabel}>Carbs</Text>
                 <View style={[styles.macroBar, {backgroundColor: '#FFD93D', width: '70%'}]} />
              </View>
              <View style={styles.macroItem}>
                 <Text style={styles.macroVal}>{dayData.stats.fat}g</Text>
                 <Text style={styles.macroLabel}>Fats</Text>
                 <View style={[styles.macroBar, {backgroundColor: '#FF6B6B', width: '40%'}]} />
              </View>
           </View>
        </View>

        {/* --- DAY SELECTOR --- */}
        <Text style={styles.sectionTitle}>Schedule</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            {Array.from({ length: plan.duration }).map((_, i) => {
                const d = i + 1;
                const isActive = d === activeDay;
                return (
                    <TouchableOpacity 
                        key={d} 
                        style={[styles.dayChip, isActive && styles.dayChipActive]}
                        onPress={() => setActiveDay(d)}
                    >
                        <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>Day {d}</Text>
                    </TouchableOpacity>
                )
            })}
        </ScrollView>

        {/* --- MEALS LIST --- */}
        <View style={styles.mealsContainer}>
            {renderMealSection("Breakfast", "sunny", "#F59E6C", dayData.meals.BREAKFAST)}
            {renderMealSection("Lunch", "partly-sunny", "#F1C40F", dayData.meals.LUNCH)}
            {renderMealSection("Snacks", "cafe", "#81C784", dayData.meals.SNACK)}
            {renderMealSection("Dinner", "moon", "#6C5CE7", dayData.meals.DINNER)}
        </View>
       

        <View style={{height: 40}} />
      </ScrollView>

      {/* --- ITEM DETAIL POPUP --- */}
      <DietItemDetailModal 
         visible={!!selectedItem} 
         item={selectedItem} 
         onClose={() => setSelectedItem(null)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerActions: { flexDirection: 'row', gap: 10 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  doshaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  doshaText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  planDuration: { fontSize: 13, color: colors.foregroundLight, fontWeight: '500' },
  
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },

  scrollContent: { padding: 20 },

  /* Cards */
  analysisCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  analysisTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  totalCals: { fontSize: 20, fontWeight: "800", color: colors.primary },
  
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { width: '30%' },
  macroVal: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  macroLabel: { fontSize: 12, color: colors.foregroundLight, marginBottom: 6 },
  macroBar: { height: 4, borderRadius: 2, opacity: 0.8 },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  /* Day Selector */
  dayScroll: { flexDirection: "row", marginBottom: 24 },
  dayChip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginRight: 10 },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 14, fontWeight: "600", color: colors.foregroundLight },
  dayChipTextActive: { color: "#fff" },

  /* Meals */
  mealsContainer: { gap: 16, marginBottom: 30 },
  mealCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  leftStrip: { width: 6, height: '100%' },
  mealContent: { flex: 1, padding: 16 },
  mealHeader: { marginBottom: 12 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  foodItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  timeBox: { width: 50, paddingTop: 2 },
  timeText: { fontSize: 13, color: colors.foregroundLight, fontWeight: '600' },
  foodDetails: { flex: 1 },
  foodName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  foodMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  foodQty: { fontSize: 13, color: colors.foregroundLight },
  dot: { fontSize: 10, color: colors.foregroundLight, marginHorizontal: 6 },
  foodCals: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  noteInline: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  noteInlineText: { fontSize: 12, color: colors.foregroundLight, marginLeft: 4, fontStyle: 'italic' },

  /* Modal Styles */
  modalContainer: { flex: 1, backgroundColor: colors.background },
  imageContainer: { height: 260, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  closeBtn: { position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 20 },
  headerContent: { position: 'absolute', bottom: 24, left: 20, right: 20 },
  modalTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBadge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  catText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  mealBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  modalScroll: { padding: 20 },
  
  /* Section Cards in Modal */
  prescriptionCard: { backgroundColor: colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, marginBottom: 20 },
  prescRow: { flexDirection: 'row', alignItems: 'center' },
  prescIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  prescLabel: { fontSize: 12, color: colors.foregroundLight, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  prescValue: { fontSize: 22, fontWeight: '700', color: colors.primary },

  noteCard: { backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', marginBottom: 24 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noteLabel: { fontSize: 13, fontWeight: '700', color: '#B45309', marginLeft: 6 },
  noteContent: { fontSize: 15, color: '#92400E', lineHeight: 22, fontStyle: 'italic' },

  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  macroCard: { width: '48%', backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  macroValue: { fontSize: 18, fontWeight: '700', color: colors.foreground, marginTop: 8 },
  macroUnit: { fontSize: 12, color: colors.foregroundLight, fontWeight: '500' },
  macroLabel: { fontSize: 12, color: colors.foregroundLight, marginTop: 2 },
  fiberRow: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center', marginBottom: 20 },
  fiberText: { color: '#15803D', fontSize: 14 },

  sectionCard: { backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tagChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '600' },
  
  ayurRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ayurLabel: { fontSize: 13, color: colors.foregroundLight },
  ayurVal: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  subHeader: { fontSize: 13, fontWeight: '600', color: colors.foregroundLight, marginBottom: 6 },
  
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletText: { fontSize: 14, color: colors.foreground, marginLeft: 8, flex: 1, lineHeight: 20 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  bigHistoryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16, marginTop: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  bigHistoryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginTop: 16 },
  emptySub: { fontSize: 15, color: colors.foregroundLight, marginTop: 8, textAlign: 'center', width: '80%', marginBottom: 30 },
});