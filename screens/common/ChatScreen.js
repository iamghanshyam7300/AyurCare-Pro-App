// screens/common/ChatScreen.js

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";

import { chatAPI } from "../../services/api";
import { colors } from "../../colors";
import { useAuth } from "../../contexts/AuthContext";
import { SOCKET_URL } from "../../config/server";

export default function ChatScreen({ route, navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const { user } = useAuth();
  
  const partnerId = route?.params?.patientUserId || route?.params?.doctorUserId; 
  const partnerName = route?.params?.patientName || route?.params?.doctorName || "Chat";
  const patientTableId = route?.params?.patientTableId; 

  const myId = user?.id;

  const [messages, setMessages] = useState([]); 
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!myId) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket Connected:", socket.id);
      socket.emit("joinRoom", myId);
    });

    socket.on("newMessage", (newMsg) => {
      if (newMsg.senderId === partnerId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMsg.id);
          if (exists) return prev;
          return [newMsg, ...prev]; 
        });
        
        // --- FIX: Mark incoming real-time message as read ---
        markMessagesAsRead([newMsg]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [myId, partnerId]);

  useEffect(() => {
    if (partnerId) loadHistory();
  }, [partnerId]);

  const loadHistory = async () => {
    try {
      const res = await chatAPI.getConversation(partnerId);
      const rawData = res?.data?.data || [];
      const reversedData = [...rawData].reverse(); 
      setMessages(reversedData);

      // --- FIX: Filter by 'isRead' (not 'seen') ---
      // We check for both just in case, but 'isRead' matches your backend
      const unreadMessages = rawData.filter(
        (m) => (m.isRead === false || m.seen === false) && m.receiverId === myId
      );

      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages);
      }

    } catch (err) {
      console.log("Error loading chat:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Helper to call API ---
  const markMessagesAsRead = async (msgsToMark) => {
    try {
      // Loop through and mark each as read
      // Since we can't change backend, we call the existing single-message endpoint loop
      await Promise.all(
        msgsToMark.map((msg) => chatAPI.markAsRead(msg.id))
      );
      console.log(`✅ Marked ${msgsToMark.length} messages as read`);
    } catch (error) {
      console.log("Failed to mark messages as read:", error);
    }
  };

  const sendMessage = async () => {
    const content = text.trim();
    if (!content) return;

    const payload = {
      receiverId: partnerId,
      message: content,
    };

    if (user.role === "DOCTOR" && patientTableId) {
      payload.patientId = patientTableId;
    }

    setText(""); 

    try {
      const res = await chatAPI.sendMessage(payload);
      const sentMsg = res?.data?.data;
      setMessages((prev) => [sentMsg, ...prev]);
    } catch (err) {
      console.log("Send Error:", err);
      alert("Failed to send message");
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderId === myId;
    
    // Check either property for the tick icon
    const isRead = item.isRead || item.seen;

    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.rightBubble : styles.leftBubble,
          isMe ? styles.myBubbleColor : styles.theirBubbleColor,
        ]}
      >
        <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>
          {item.message}
        </Text>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: '#999' }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <Ionicons 
              name={isRead ? "checkmark-done-outline" : "checkmark-outline"} 
              size={14} 
              color="rgba(255,255,255,0.8)" 
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{partnerName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 20}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            inverted={true} 
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: text.trim() ? colors.primary : '#ccc' }]} 
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
  },
  backBtn: { marginRight: 12 },
  headerInfo: { justifyContent: "center" },
  headerName: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  listContent: { paddingHorizontal: 16, paddingBottom: 10 },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 4,
  },
  rightBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  leftBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  myBubbleColor: { backgroundColor: colors.primary },
  theirBubbleColor: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e5e5" },
  msgText: { fontSize: 15, lineHeight: 20 },
  myText: { color: "#fff" },
  theirText: { color: "#333" },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  timeText: { fontSize: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10, 
    maxHeight: 100,
    fontSize: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
});