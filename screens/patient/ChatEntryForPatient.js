import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../colors";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChatEntryForPatient({ navigation }) {
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    waitForTokenThenLoad();
  }, []);

  const waitForTokenThenLoad = async () => {
    let tries = 0;
    while (tries < 10) {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) break;
      await new Promise((r) => setTimeout(r, 300));
      tries++;
    }
    loadDoctor();
  };

  const loadDoctor = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await api.get("/patients/stats/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctor(res.data.data || null);
    } catch (err) {
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDoctorTitle}>No Doctor Assigned</Text>
        <Text style={styles.noDoctorText}>
          Your assigned doctor will appear here once connected.
        </Text>
      </View>
    );
  }

  /* -------------------------------
      RENDER UI
  --------------------------------*/
  return (
    <View style={styles.container}>

      {/* ⭐ BOTPRESS CHAT AI BUTTON */}
      <TouchableOpacity
        style={styles.chatBotBtn}
        onPress={() => navigation.navigate("BotpressChat")}
      >
        <Text style={styles.chatBotBtnText}>Chat with AyurBot AI 🌿</Text>
      </TouchableOpacity>

      {/* ⭐ Assigned Doctor Card */}
      <View style={styles.card}>
        <Text style={styles.heading}>Your Assigned Doctor</Text>

        <View style={styles.doctorBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {doctor.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpecial}>Ayurvedic Practitioner</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() =>
            navigation.navigate("ChatScreen", {
              patientUserId: doctor.id,
              patientName: doctor.name,
            })
          }
        >
          <Text style={styles.chatBtnText}>Start Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "flex-start",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  noDoctorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 8,
  },
  noDoctorText: {
    fontSize: 15,
    textAlign: "center",
    color: colors.foregroundLight,
  },

  /* ⭐ NEW AI CHAT BUTTON */
  chatBotBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  chatBotBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  /* Doctor Card */
  card: {
    backgroundColor: colors.card,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
  },
  heading: {
    fontSize: 20,
    color: colors.foreground,
    fontWeight: "700",
    marginBottom: 20,
  },
  doctorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 14,
    backgroundColor: `${colors.primary}33`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
  },
  doctorName: {
    fontSize: 18,
    color: colors.foreground,
    fontWeight: "700",
  },
  doctorSpecial: {
    fontSize: 13,
    color: colors.foregroundLight,
  },

  chatBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  chatBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
