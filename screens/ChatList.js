import React, { useState } from "react";
import { StatusBar } from "react-native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { colors } from "../colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { patientsAPI, chatAPI } from "../services/api";

export default function ChatList() {
  const navigation = useNavigation();

  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      loadPatients();
    }, [])
  );

  const loadPatients = async () => {
    try {
      const res = await patientsAPI.getAll();
      const list = res.data.data.patients || [];

      const enriched = await Promise.all(
        list.map(async (p) => {
          try {
            const chatRes = await chatAPI.getConversation(p.userId);
            const msgs = chatRes.data.data || [];

            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

            return {
              ...p,
              lastMessage: lastMsg?.message || null,
              lastTime: lastMsg?.createdAt || null,
            };
          } catch (err) {
            console.log("Chat fetch error for:", p.userId);
            return { ...p, lastMessage: null, lastTime: null };
          }
        })
      );

      setPatients(enriched);
      setFiltered(enriched);
    } catch (err) {
      console.log("Chat load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  const searchFilter = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(patients);
      return;
    }
    const query = text.toLowerCase();
    setFiltered(
      patients.filter((p) =>
        (p.user?.name || "").toLowerCase().includes(query)
      )
    );
  };

  const renderItem = ({ item }) => {
    const name = item.user?.name || "Unknown";
    const avatar = `https://api.dicebear.com/8.x/initials/png?seed=${name}`;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ChatScreen", {
            patientUserId: item.userId,
            patientTableId: item.id,
            patientName: name,
          })
        }
        activeOpacity={0.85}
      >
        {/* Avatar + online dot */}
        <View style={{ position: "relative" }}>
          <Image source={{ uri: avatar }} style={styles.avatar} />

          <View style={styles.onlineDot} />
        </View>

        {/* Text section */}
        <View style={styles.textArea}>
          <Text style={styles.name}>{name}</Text>

          <Text numberOfLines={1} style={styles.lastMessage}>
            {item.lastMessage ? item.lastMessage : "Start a conversation"}
          </Text>
        </View>

        {/* Time */}
        <Text style={styles.timeText}>
          {item.lastTime
            ? new Date(item.lastTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </Text>

        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: StatusBar.currentHeight || 20 }]}>
      {/* Header title */}
      <Text style={styles.headerTitle}>Messages</Text>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.foregroundLight} />
        <TextInput
          placeholder="Search patients..."
          placeholderTextColor={colors.foregroundLight}
          value={search}
          onChangeText={searchFilter}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 6 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 16,
    color: colors.foreground,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.foreground,
    fontSize: 15,
  },

  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f1f1",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 13,
  },

  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2ecc71",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.card,
  },

  textArea: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
  },

  lastMessage: {
    fontSize: 13,
    color: colors.foregroundLight,
    marginTop: 4,
  },

  timeText: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: 6,
  },
});
