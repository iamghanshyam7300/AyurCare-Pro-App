// /screens/patient/PatientDashboard.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../colors";
import { dietPlansAPI, remindersAPI } from "../../services/api";

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;
const HEADER_HEIGHT = 90; // Compact height
const TOTAL_HEADER_HEIGHT = STATUSBAR_HEIGHT + HEADER_HEIGHT;

export default function PatientDashboard({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeDietPlans: 0,
    upcomingReminders: 0,
  });
  const [loading, setLoading] = useState(true);

  // Animation Ref
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [dietPlansRes, remindersRes] = await Promise.all([
        dietPlansAPI.getAll(),
        remindersAPI.getAll(),
      ]);

      const now = new Date();
      const reminders = Array.isArray(remindersRes.data) ? remindersRes.data : (remindersRes.data?.data || []);
      const upcoming = reminders.filter((rem) => new Date(rem.date || rem.reminderTime) > now);

      const plans = Array.isArray(dietPlansRes.data) ? dietPlansRes.data : (dietPlansRes.data?.data || []);
      
      setStats({
        activeDietPlans: plans.length,
        upcomingReminders: upcoming.length,
      });
    } catch (error) {
      console.error("Stats Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
         <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
         <Text style={styles.statValue}>{value}</Text>
         <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const ActionCard = ({ title, icon, color, onPress, subtext }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.9}>
        <View style={[styles.actionIconBox, { backgroundColor: color }]}>
            <Ionicons name={icon} size={22} color="#fff" />
        </View>
        <View style={{flex:1}}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSub}>{subtext}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.border} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* --- FLOATING COMPACT HEADER --- */}
      <Animated.View 
        style={[
            styles.floatingHeader, 
            { 
                // Optional: Add shadow on scroll
                elevation: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 4],
                    extrapolate: 'clamp'
                }),
                shadowOpacity: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 0.1],
                    extrapolate: 'clamp'
                })
            }
        ]}
      >
          <LinearGradient colors={[colors.primary, '#1acb2fff']} style={StyleSheet.absoluteFill} />
          
          <View style={styles.headerContent}>
              <View>
                  <Text style={styles.greeting}>Hello,</Text>
                  <Text style={styles.name}>{user?.name?.split(' ')[0] || 'Patient'}</Text>
              </View>
              <TouchableOpacity
                  style={styles.profileBtn}
                  onPress={() => navigation.navigate("Settings")}
                >
                  
                </TouchableOpacity>
          </View>
      </Animated.View>

      <Animated.ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false } // useNativeDriver: false because we animate layout properties/elevation
          )}
          scrollEventThrottle={16}
      >
        
        {/* STATS ROW */}
        <View style={styles.statsRow}>
           <StatCard 
              title="Active Plan" 
              value={stats.activeDietPlans > 0 ? "Yes" : "No"} 
              icon="nutrition" 
              color="#F59E6C" 
              onPress={() => navigation.navigate('MyPlan')}
           />
           <StatCard 
              title="Reminders" 
              value={stats.upcomingReminders} 
              icon="alarm" 
              color="#6C5CE7" 
              onPress={() => navigation.navigate('Reminders')}
           />
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        
        <ActionCard 
            title="My Diet Plan" 
            subtext="View today's meals" 
            icon="restaurant" 
            color={colors.primary} 
            onPress={() => navigation.navigate('MyPlan')}
        />
        
        <ActionCard 
            title="Chat with Doctor" 
            subtext="Messages & consultations" 
            icon="chatbubbles" 
            color="#3498DB" 
            onPress={() => navigation.navigate('ChatEntry')}
        />

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  /* Floating Header */
  floatingHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: TOTAL_HEADER_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT,
    paddingHorizontal: 20,
    justifyContent: 'center',
    zIndex: 100,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden', // Clips the gradient to radius
  },
  headerContent: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      paddingBottom: 10 // Adjust content vertical alignment
  },
  greeting: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  name: { color: '#fff', fontSize: 24, fontWeight: '700' },
  
  profileBtn: { 
      width: 40, height: 40, borderRadius: 20, 
      backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
      shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },

  /* Scroll Content (Pushed down) */
  scrollContent: { 
      paddingHorizontal: 20, 
      paddingTop: TOTAL_HEADER_HEIGHT + 20, // Push content below floating header
      paddingBottom: 40 
  },

  /* Stats Grid */
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 30 },
  statCard: { 
      flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, 
      flexDirection: 'row', alignItems: 'center', 
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 
  },
  iconBox: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  statTitle: { fontSize: 12, color: colors.foregroundLight, marginTop: 2 },

  /* Actions */
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 14 },
  
  actionCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
      borderWidth: 1, borderColor: '#f0f0f0'
  },
  actionIconBox: {
      width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16,
      shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, elevation: 3
  },
  actionTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  actionSub: { fontSize: 13, color: colors.foregroundLight, marginTop: 2 },
});