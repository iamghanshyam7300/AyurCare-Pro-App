// ====================== ChatScreen.js (PREMIUM WHATSAPP STYLE) ======================

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatAPI } from "../services/api";
import { colors } from "../colors";

export default function ChatScreen({ route, navigation }) {
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const patientUserId = route?.params?.patientUserId;
  const patientTableId = route?.params?.patientTableId;
  const patientName = route?.params?.patientName;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const flatListRef = useRef(null);

  // fade animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadMessages();
    }, [patientUserId])
  );

  const animateMessages = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const loadMessages = async () => {
    try {
      const res = await chatAPI.getConversation(patientUserId);
      setMessages(res.data.data || []);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        animateMessages();
      }, 80);
    } catch (err) {
      console.log("Load chat failed:", err);
    }
  };

  const send = async () => {
    if (!text.trim()) return;

    try {
      await chatAPI.sendMessage({
        receiverId: patientUserId,
        patientId: patientTableId,
        message: text,
      });

      setText("");
      loadMessages();

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 70);
    } catch (err) {
      console.log("Send message failed:", err);
    }
  };

  /* ----------- MESSAGE BUBBLE RENDER ----------- */
  const renderMessage = ({ item }) => {
    const isPatient = item.senderId === patientUserId;

    // Simple tick logic (you can replace with real status if available)
    const tickIcon = isPatient
      ? null
      : item.seen
      ? "checkmark-done"
      : "checkmark";

    const tickColor = item.seen ? "#6EA9FF" : colors.foregroundLight;

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View
          style={[
            styles.bubble,
            isPatient ? styles.leftBubble : styles.rightBubble,
            isPatient ? styles.patientBubble : styles.docBubble,
          ]}
        >
          <Text style={styles.msgText}>{item.message}</Text>

          {/* TIME + TICKS */}
          <View style={styles.timeRow}>
            <Text style={styles.time}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>

            {!isPatient && (
              <Ionicons
                name={tickIcon}
                size={16}
                color={tickColor}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerName}>{patientName}</Text>
          <Text style={styles.subHeader}>online</Text>
        </View>

        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* CHAT LIST */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(i) => i.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* INPUT BAR */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Message..."
            placeholderTextColor={colors.foregroundLight}
            value={text}
            onChangeText={setText}
            style={styles.input}
            multiline
          />

          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------ PREMIUM WHATSAPP STYLE ------------------ */
const styles = StyleSheet.create({
  /* HEADER */
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    elevation: 5,
  },
  backBtn: { padding: 4 },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
  },
  subHeader: {
    fontSize: 12,
    color: colors.primary,
  },

  /* BUBBLES */
  bubble: {
    padding: 12,
    maxWidth: "80%",
    borderRadius: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  rightBubble: { alignSelf: "flex-end", borderBottomRightRadius: 6 },
  leftBubble: { alignSelf: "flex-start", borderBottomLeftRadius: 6 },

  docBubble: {
    backgroundColor: "#d4f8d4", // soft light green
  },

  patientBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "#ececec",
  },

  msgText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.foreground,
  },

  timeRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    marginTop: 4,
  },

  time: {
    fontSize: 11,
    color: "#999",
  },

  /* INPUT */
  inputRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },

  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    fontSize: 15,
    maxHeight: 130,
    color: colors.foreground,
  },

  sendBtn: {
    marginLeft: 10,
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
