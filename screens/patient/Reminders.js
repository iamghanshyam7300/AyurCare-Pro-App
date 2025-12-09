// /screens/patient/Reminders.js
import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../colors";
import { remindersAPI } from "../../services/api";
import api from "../../services/api";

const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 48 : StatusBar.currentHeight || 24;

export default function Reminders({ navigation }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------
  // Wait until token is available in AsyncStorage
  // ---------------------------------------------
  const waitForToken = async () => {
    let token = null;

    for (let i = 0; i < 10; i++) {
      token = await AsyncStorage.getItem("accessToken");
      if (token) return token;

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return null;
  };

  const loadData = async () => {
    try {
      await waitForToken();

      // 1️⃣ Load custom reminders from DB
      const remindersRes = await remindersAPI.getAll();
      const dbReminders = Array.isArray(remindersRes.data.data)
        ? remindersRes.data.data
        : [];

      // 2️⃣ Load diet plan for patient
      const plansRes = await api.get(`/diet-plans/patient/${user.id}`);

      const plans = Array.isArray(plansRes.data.data)
        ? plansRes.data.data
        : [];

      const activePlan =
        plans.length > 0
          ? plans.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )[0]
          : null;

      let dietReminders = [];

      if (activePlan && Array.isArray(activePlan.items)) {
        const todaysMeals = activePlan.items.filter(
          (item) => item.dayNumber === 1
        );

        dietReminders = todaysMeals.map((item, index) => ({
          id: `meal-${index}`,
          title:
            item.mealType.charAt(0) +
            item.mealType.slice(1).toLowerCase(),
          time: item.time || "08:00",
          date: new Date().toISOString(),
          type: "MEAL",
          description: item.food?.name
            ? `Eat ${item.quantity}${item.unit} of ${item.food.name}`
            : "Meal time",
          isCompleted: false,
          color: getMealColor(item.mealType),
        }));
      }

      const formattedDbReminders = dbReminders.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        time:
          r.time ||
          new Date(r.date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        date: r.date,
        type: "TASK",
        isCompleted: false,
        color: colors.primary,
      }));

      const allItems = [...formattedDbReminders, ...dietReminders].sort(
        (a, b) => getTimeValue(a.time) - getTimeValue(b.time)
      );

      setItems(allItems);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const getTimeValue = (timeStr) => {
    if (!timeStr) return 0;

    if (timeStr.includes(":") && !timeStr.includes("T")) {
      const [h, m] = timeStr.split(":");
      return parseInt(h) * 60 + parseInt(m);
    }

    const d = new Date(timeStr);
    return d.getHours() * 60 + d.getMinutes();
  };

  const getMealColor = (type) => {
    if (!type) return colors.primary;
    const t = type.toUpperCase();

    if (t === "BREAKFAST") return "#F59E6C";
    if (t === "LUNCH") return "#F1C40F";
    if (t === "DINNER") return "#6C5CE7";

    return colors.primary;
  };

  // ---------------------------------------------
  // Render list item
  // ---------------------------------------------
  const renderItem = ({ item, index }) => {
    const isLast = index === items.length - 1;

    const timeDisplay = item.time.includes("T")
      ? new Date(item.time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : item.time;

    return (
      <View style={styles.timelineRow}>
        {/* Time */}
        <View style={styles.timeCol}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
        </View>

        {/* Line */}
        <View style={styles.lineCol}>
          <View
            style={[
              styles.dot,
              { backgroundColor: item.color || colors.primary },
            ]}
          />
          {!isLast && <View style={styles.line} />}
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            { borderLeftColor: item.color || colors.primary },
          ]}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.tagRow}>
            {item.type === "MEAL" ? (
              <View style={styles.tagContainer}>
                <MaterialCommunityIcons
                  name="food-apple-outline"
                  size={12}
                  color={item.color}
                />
                <Text style={[styles.tagText, { color: item.color }]}>
                  Diet Plan
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.tagContainer,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name="alarm-outline"
                  size={12}
                  color={colors.foregroundLight}
                />
                <Text style={styles.tagText}>Custom</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ---------------------------------------------
  // Loading UI
  // ---------------------------------------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ---------------------------------------------
  // Main UI
  // ---------------------------------------------
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Daily Schedule</Text>
        <Text style={styles.subTitle}>
          Stay on track with your routine
        </Text>
      </View>

      {/* LIST */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-sleep-outline"
              size={60}
              color={colors.border}
            />
            <Text style={styles.emptyText}>No reminders for today</Text>
            <Text style={styles.emptySub}>Your schedule is clear.</Text>
          </View>
        }
      />

      {/* Add Reminder FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          Alert.alert("Add Reminder", "Feature coming soon!")
        }
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ========================================================
// Styles
// ========================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_HEIGHT + 20,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.foreground,
  },
  subTitle: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginTop: 4,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 20,
  },

  timelineRow: { flexDirection: "row" },

  timeCol: {
    width: 50,
    alignItems: "flex-end",
    paddingRight: 12,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foregroundLight,
  },

  lineCol: { alignItems: "center", width: 20 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    zIndex: 1,
    borderWidth: 2,
    borderColor: colors.background,
  },
  line: { width: 2, flex: 1, backgroundColor: colors.border },

  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginLeft: 10,
    borderLeftWidth: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.foregroundLight,
    lineHeight: 20,
    marginBottom: 10,
  },

  tagRow: { flexDirection: "row" },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
    textTransform: "uppercase",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foregroundLight,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: colors.foregroundLight,
    marginTop: 6,
  },

  fab: {
    position: "absolute",
    bottom: 26,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
