// /screens/doctor/ChatList.js
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Platform,
  StatusBar,
  Animated,
  RefreshControl,
} from "react-native";
import { colors } from "../../colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import io from "socket.io-client";

import { patientsAPI, chatAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { SOCKET_URL } from "../../config/server";

// --- DYNAMIC HEADER CONSTANTS ---
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 48 : StatusBar.currentHeight || 24;
const HEADER_CONTENT_HEIGHT = 80; 
const TOTAL_HEADER_HEIGHT = STATUSBAR_HEIGHT + HEADER_CONTENT_HEIGHT;

export default function ChatList() {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [patients, setPatients] = useState([]); 
  const [filtered, setFiltered] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const socketRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header Animation
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  // --- 1. HIDE DEFAULT HEADER ---
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // --- 2. LOAD DATA ---
  const loadData = async () => {
    try {
      const res = await patientsAPI.getAll();
      const rawList = res.data.data.patients || [];

      // Enrich with last message & unread count
      const enriched = await Promise.all(
        rawList.map(async (p) => {
          try {
            const chatRes = await chatAPI.getConversation(p.userId);
            const msgs = chatRes.data.data || [];
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            
            // Count unread messages (received by me & not seen)
            const unreadCount = msgs.filter(
              (m) => m.receiverId === user.id && m.isRead === false 
            ).length;

            return {
              ...p,
              lastMessage: lastMsg?.message || null,
              lastTime: lastMsg?.createdAt || null,
              unreadCount: unreadCount,
            };
          } catch (err) {
            return { ...p, lastMessage: null, lastTime: null, unreadCount: 0 };
          }
        })
      );

      // Sort: Latest message first
      const sorted = enriched.sort((a, b) => {
        const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
        const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
        return timeB - timeA;
      });

      setPatients(sorted);
      setFiltered(sorted);
    } catch (err) {
      console.log("Chat load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- FIX: REFRESH ON FOCUS WITH DELAY ---
  useFocusEffect(
    useCallback(() => {
      // Small delay allows DB to update 'seen' status before we fetch
      const timer = setTimeout(() => {
        loadData();
      }, 500); 
      return () => clearTimeout(timer);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- 3. SOCKET LISTENER ---
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinRoom", user.id);
    });

    // Handle New Message (Move to Top + Increment Unread)
    socket.on("newMessage", (msg) => {
      setPatients((prevPatients) => {
        const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        const patientIndex = prevPatients.findIndex((p) => p.userId === partnerId);
        
        if (patientIndex === -1) return prevPatients;

        const updatedPatient = { ...prevPatients[patientIndex] };
        updatedPatient.lastMessage = msg.message;
        updatedPatient.lastTime = msg.createdAt;
        
        if (msg.receiverId === user.id) {
            updatedPatient.unreadCount = (updatedPatient.unreadCount || 0) + 1;
        }

        const otherPatients = prevPatients.filter((_, idx) => idx !== patientIndex);
        return [updatedPatient, ...otherPatients];
      });
    });

    // Handle Messages Read (Real-time update)
    // If your backend emits this event, this will clear the badge instantly
    socket.on("messagesRead", ({ senderId, receiverId }) => {
        if (receiverId === user.id) { // Someone read my messages
             // Logic if needed (e.g. show blue ticks)
        }
        if (senderId === user.id) { // I read someone's messages on another device
             // Clear badge locally
        }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // --- 4. SEARCH FILTER ---
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(patients);
    } else {
      const query = search.toLowerCase();
      setFiltered(
        patients.filter((p) => (p.user?.name || "").toLowerCase().includes(query))
      );
    }
  }, [search, patients]);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const getStripColor = (unreadCount) => {
    if (unreadCount > 0) return colors.primary; 
    return colors.border; 
  };

  const renderItem = ({ item }) => {
    const name = item.user?.name || "Unknown";
    const avatar = `https://api.dicebear.com/8.x/initials/png?seed=${name}&backgroundColor=e3f2fd&color=1e88e5`;
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
            // 1. Optimistic Update: Clear badge immediately
            const updatedList = patients.map(p => 
                p.id === item.id ? { ...p, unreadCount: 0 } : p
            );
            setPatients(updatedList);
            setFiltered(updatedList); // Also update filtered list to reflect change

            // 2. Navigate
            navigation.navigate("ChatScreen", {
                patientUserId: item.userId,
                patientTableId: item.id,
                patientName: name,
            });
        }}
      >
        <View style={[styles.leftStrip, { backgroundColor: getStripColor(item.unreadCount) }]} />

        <View style={styles.cardContent}>
            <View style={styles.rowTop}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    <View style={styles.onlineDot} />
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={[styles.time, hasUnread && styles.timeActive]}>
                            {formatTime(item.lastTime)}
                        </Text>
                    </View>

                    <View style={styles.msgRow}>
                        <Text 
                            numberOfLines={1} 
                            style={[styles.message, hasUnread && styles.messageBold]}
                        >
                            {item.lastMessage ? item.lastMessage : "Tap to start conversation"}
                        </Text>
                        
                        {hasUnread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
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
    <View style={styles.container}>
      
      {/* FLOATING HEADER */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity },
        ]}
      >
        <View style={styles.headerContent}>
            <View>
                <Text style={styles.screenTitle}>Messages</Text>
                <Text style={styles.subTitle}>Recent conversations</Text>
            </View>
        </View>
      </Animated.View>

      {/* LIST */}
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}

        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        
        ListHeaderComponent={
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.foregroundLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search chats..."
                placeholderTextColor={colors.foregroundLight}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        }

        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet.</Text>
            </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  loadingScreen: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },

  /* Header */
  floatingHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 20,
    backgroundColor: '#fff', 
    height: TOTAL_HEADER_HEIGHT,
    paddingTop: STATUSBAR_HEIGHT,
    paddingHorizontal: 20,
    justifyContent: "flex-end", 
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
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

  /* List */
  listContent: { 
    paddingTop: TOTAL_HEADER_HEIGHT + 16, 
    paddingHorizontal: 16, 
    paddingBottom: 100 
  },

  searchRow: { 
    marginBottom: 16, 
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#fff', 
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    color: colors.foreground, 
    fontSize: 15 
  },

  /* Card */
  card: {
    flexDirection: "row",
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  leftStrip: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundLight,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2ecc71",
    position: "absolute",
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: colors.foregroundLight,
  },
  timeActive: {
    color: colors.primary,
    fontWeight: "700",
  },

  msgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 13,
    color: colors.foregroundLight,
    flex: 1,
    marginRight: 10,
  },
  messageBold: {
    color: colors.foreground,
    fontWeight: "600",
  },

  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: 'center'
  },
  emptyText: {
    color: colors.foregroundLight,
    fontSize: 16
  }
});