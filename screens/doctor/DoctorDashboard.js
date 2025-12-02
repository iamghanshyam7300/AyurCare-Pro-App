// -------------------------------------------------------------
// DoctorDashboard.js — PREMIUM DOUGHNUT with SAFE Glow Pulse
// -------------------------------------------------------------

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import Svg, {
  G,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../colors";
import { patientsAPI } from "../../services/api";

/* ---------------- PREMIUM DOUGHNUT (STATIC SVG) + GLOW OVERLAY ----------------
   - compute slice geometry in JS
   - render static SVG (no animated transforms)
   - onPress slice => set selectedIndex and show Animated overlay (glow)
----------------------------------------------------------------------------*/

function PremiumDoughnutWithGlow({
  data = [],
  size = 160,
  strokeWidth = 36,
  glowSize = 56, // diameter of glow overlay
  glowColor = "#FFFFFF",
  animationDuration = 900,
  onSelect, // optional callback(idx, slice)
}) {
  const radius = size / 2;
  const center = radius;
  const outerR = radius;
  const innerR = radius - strokeWidth;

  // Clean & normalize data (prevent NaN / zero-total)
  const cleanData = useMemo(() => {
    const mapped = (data || []).map((d, i) => ({
      id: d?.id ?? `s-${i}`,
      value: Number(d?.value) || 0,
      color: d?.color || "#D1D5DB",
      label: d?.label ?? d?.id ?? `Item ${i + 1}`,
    }));
    const filtered = mapped.filter((m) => m.value > 0);
    if (filtered.length === 0) return [{ id: "no-data", value: 1, color: "#E5E7EB", label: "No data" }];
    return filtered;
  }, [data]);

  const total = useMemo(() => cleanData.reduce((s, d) => s + d.value, 0) || 1, [cleanData]);

  // build slice geometry and centroids
  const slices = useMemo(() => {
    let cumulative = 0;
    return cleanData.map((seg) => {
      const v = seg.value;
      const angle = (v / total) * Math.PI * 2;
      const start = cumulative;
      const end = cumulative + angle;
      cumulative += angle;
      const mid = start + angle / 2;

      // outer arc
      const x1 = center + outerR * Math.cos(start);
      const y1 = center + outerR * Math.sin(start);
      const x2 = center + outerR * Math.cos(end);
      const y2 = center + outerR * Math.sin(end);

      // inner arc
      const x3 = center + innerR * Math.cos(end);
      const y3 = center + innerR * Math.sin(end);
      const x4 = center + innerR * Math.cos(start);
      const y4 = center + innerR * Math.sin(start);

      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `
        M ${x1} ${y1}
        A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      const labelR = innerR + strokeWidth * 0.5;
      const labelX = center + labelR * Math.cos(mid);
      const labelY = center + labelR * Math.sin(mid);

      const percent = Math.round((v / total) * 100);

      return {
        ...seg,
        path,
        mid,
        labelX,
        labelY,
        percent,
        value: v,
      };
    });
  }, [cleanData, center, outerR, innerR, strokeWidth, total]);

  // selection state for which slice is active
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // overlay animated values
  const glowScale = useRef(new Animated.Value(0.7)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const [glowPos, setGlowPos] = useState({ left: 0, top: 0 }); // absolute coordinates relative to chart container

  // start pulse animation
  const startPulse = () => {
    glowOpacity.setValue(0.4);
    glowScale.setValue(0.9);
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.35,
          duration: animationDuration / 2,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.95,
          duration: animationDuration / 2,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.timing(glowOpacity, {
      toValue: 0.9,
      duration: 220,
      easing: Easing.out(Easing.linear),
      useNativeDriver: true,
    }).start();
  };

  const stopPulse = () => {
    glowOpacity.stopAnimation();
    glowScale.stopAnimation();
    Animated.parallel([
      Animated.timing(glowOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(glowScale, { toValue: 0.7, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // handle selection: compute overlay position and start/stop animation
  const handleSelect = (idx) => {
    if (idx === selectedIndex) {
      // deselect
      setSelectedIndex(-1);
      stopPulse();
      if (onSelect) onSelect(-1, null);
      return;
    }

    const s = slices[idx];
    if (!s) return;

    // labelX,labelY are SVG coordinates (0..size). We want to position overlay centered on that point.
    // get top-left position for overlay box to center it: left = labelX - glowSize/2, top = labelY - glowSize/2
    const left = s.labelX - glowSize / 2;
    const top = s.labelY - glowSize / 2;

    setGlowPos({ left, top });
    setSelectedIndex(idx);
    startPulse();
    if (onSelect) onSelect(idx, s);
  };

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Glow overlay: positioned absolutely on top of the SVG */}
      <View style={{ position: "absolute", left: 0, top: 0, width: size, height: size }}>
        {/* Render the animated glow only when a slice is selected */}
        {selectedIndex >= 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                width: glowSize,
                height: glowSize,
                borderRadius: glowSize / 2,
                backgroundColor: colors.foreground,
                // use additive blending feel by low opacity and blurred look — actual blur not used to keep compatibility
                opacity: glowOpacity,
                left: glowPos.left,
                top: glowPos.top,
                shadowColor: colors.foreground,
                shadowRadius: 18,
                shadowOpacity: 0.25,
                shadowOffset: { width: 0, height: 6 },
                elevation: 12,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
        )}
      </View>

      {/* SVG doughnut */}
      <Svg width={size} height={size}>
        <Defs>
          {slices.map((s) => (
            <SvgLinearGradient id={`g-${s.id}`} key={`g-${s.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={s.color} stopOpacity="1" />
              <Stop offset="100%" stopColor={s.color} stopOpacity="0.85" />
            </SvgLinearGradient>
          ))}
        </Defs>

        {/* Soft glow background layer (low opacity wider scale via a grouped transform) */}
        {slices.map((s) => (
          <G key={`glo-${s.id}`} transform={`translate(${center - center * 1.05}, ${center - center * 1.05}) scale(1.05)`}>
            <Path d={s.path} fill={s.color} opacity={0.04} />
          </G>
        ))}

        {/* slices */}
        {slices.map((s, i) => (
          <G key={s.id}>
            <Path
              d={s.path}
              fill={`url(#g-${s.id})`}
              onPress={() => handleSelect(i)}
            />
            {/* thin separating edge for clarity */}
            <Path d={s.path} fill="none" stroke={colors.background} strokeWidth={0.5} opacity={0.6} />
            {/* percent label */}
            {s.percent > 0 && (
              <SvgText
                x={s.labelX}
                y={s.labelY}
                fill="#fff"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {s.percent}%
              </SvgText>
            )}
          </G>
        ))}

        {/* doughnut hole to create ring look */}
        <Path
          d={`
            M ${center} ${center - innerR}
            A ${innerR} ${innerR} 0 1 1 ${center - 0.001} ${center - innerR}
            Z
          `}
          fill={colors.card}
        />

        {/* center label */}
        <SvgText x={center} y={center - 6} fill={colors.foreground} fontSize="14" fontWeight="700" textAnchor="middle">
          {selectedIndex === -1 ? `${total}` : `${slices[selectedIndex]?.label ?? slices[selectedIndex]?.id}`}
        </SvgText>

        <SvgText x={center} y={center + 14} fill={colors.foregroundLight} fontSize="12" fontWeight="600" textAnchor="middle">
          {selectedIndex === -1 ? `Total` : `${slices[selectedIndex]?.percent}%`}
        </SvgText>
      </Svg>
    </View>
  );
}

/* ---------------- Chart Legend ---------------- */
function ChartLegend({ items = [] }) {
  return (
    <View style={{ marginTop: 10 }}>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: it.color, marginRight: 8 }} />
          <Text style={{ color: colors.foreground }}>{it.label} • {it.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------------- Main DoctorDashboard component ---------------- */
export default function DoctorDashboard({ navigation }) {
  const { user } = useAuth();

  const [stats, setStats] = useState({ totalPatients: 0, avgBMI: 0 });
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [previewPatients, setPreviewPatients] = useState([]);
  const [search, setSearch] = useState("");

  const [genderData, setGenderData] = useState({ male: 0, female: 0, other: 0 });
  const [doshaData, setDoshaData] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      console.log("🚨 LOADALL START");
    console.log("USER:", user);
    console.log("ROLE:", user?.role);
    console.log("TOKEN:", user?.token?.slice(0, 20) + "...");  // avoid printing full token

    console.log("📡 Calling: patientsAPI.getMine()");
  
      // Fetch ONLY this doctor's patients
      const patientsRes = await patientsAPI.getMine();
  
      // Backend returns: data: [ { patientId, userId, name, ... } ]
      const doctorPatients = patientsRes?.data?.data || [];
  
      // ---------- STATS ----------
      const totalPatients = doctorPatients.length;
  
      // For BMI, gender, dosha we must fetch details from full GET /patients/:id
      // BUT your DB already stores user fields inside patient.user
      // So let's re-fetch full patient details:
  
      const detailed = [];
      for (let p of doctorPatients) {
        const full = await patientsAPI.getById(p.patientId);
        if (full?.data?.data) detailed.push(full.data.data);
      }
  
      // SAVE for listing
      setPatients(detailed);
      setPreviewPatients(detailed.slice(0, 5));
  
      // ---------- BMI ----------
      const bmiValues = detailed
        .map((p) => {
          const h = Number(p.height ?? p.user?.height ?? 0);
          const w = Number(p.weight ?? p.user?.weight ?? 0);
          if (!h || !w) return null;
          return w / ((h / 100) ** 2);
        })
        .filter(Boolean);
  
      const avgBMI =
        bmiValues.length > 0
          ? (bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length).toFixed(1)
          : 0;
  
      // ---------- GENDER ----------
      const genderCount = { male: 0, female: 0, other: 0 };
      detailed.forEach((p) => {
        const g = (p.user?.gender || "").toLowerCase();
        if (g === "male") genderCount.male++;
        else if (g === "female") genderCount.female++;
        else genderCount.other++;
      });
  
      // ---------- DOSHA ----------
      const doshaCount = {};
      detailed.forEach((p) => {
        const d = p.user?.doshaType || "Unknown";
        doshaCount[d] = (doshaCount[d] || 0) + 1;
      });
  
      // ---------- SET STATE ----------
      setStats({ totalPatients, avgBMI });
      setGenderData(genderCount);
      setDoshaData(doshaCount);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };
  

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, styles.shadow]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>{icon}</View>
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderPatient = ({ item }) => {
    const name = item?.user?.name || "Unknown";
    const age = item?.user?.age || "—";
    const gender = item?.user?.gender || "—";

    return (
      <TouchableOpacity
        style={[styles.patientCard, styles.shadowSmall]}
        onPress={() => navigation.navigate("PatientProfile", { patientId: item.id })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{name}</Text>
          <Text style={styles.patientSub}>{age} • {gender}</Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color={colors.foregroundLight} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // prepare doughnut data arrays
  const genderArray = [
    { id: "male", value: genderData.male, color: colors.primary, label: "Male" },
    { id: "female", value: genderData.female, color: colors.accent, label: "Female" },
    { id: "other", value: genderData.other, color: colors.warning, label: "Other" },
  ];

  const doshaArray = Object.keys(doshaData).map((k, i) => ({
    id: k,
    value: doshaData[k],
    color: ["#008CFF", "#FFAA00", "#EE4444", "#8A4FFF"][i % 4],
    label: k,
  }));

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* HEADER */}
        <LinearGradient colors={[colors.primary, `${colors.primary}bb`]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcome}>Hello Doctor,</Text>
              <Text style={styles.doctorName}>{user?.name}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={styles.profileIcon}>
              <Ionicons name="person-circle-outline" size={40} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Text>
        </LinearGradient>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.foregroundLight} />
            <TextInput placeholder="Search patients..." placeholderTextColor={colors.foregroundLight} value={search} onChangeText={setSearch} style={styles.searchInput} />
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          <StatCard icon={<Ionicons name="people" size={26} color={colors.primary} />} label="Patients" value={stats.totalPatients} color={colors.primary} />
          <StatCard icon={<Ionicons name="body" size={26} color={colors.accent} />} label="Avg BMI" value={stats.avgBMI} color={colors.accent} />
        </View>

        {/* DEMOGRAPHICS */}
        {/* DEMOGRAPHICS */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Patient Demographics</Text>

  {/* SIDE-BY-SIDE CHARTS */}
  <View style={styles.row}>
    {/* LEFT — Gender */}
    <View style={styles.chartBox}>
      <Text style={styles.subHeading}>Gender</Text>

      <PremiumDoughnutWithGlow
        data={genderArray}
        size={140}
        strokeWidth={32}
        glowSize={60}
      />

      <ChartLegend
        items={genderArray.map(g => ({
          label: g.label,
          value: g.value,
          color: g.color,
        }))}
      />
    </View>

    {/* RIGHT — Dosha */}
    <View style={styles.chartBox}>
      <Text style={styles.subHeading}>Dosha</Text>

      <PremiumDoughnutWithGlow
        data={doshaArray}
        size={140}
        strokeWidth={32}
        glowSize={60}
      />

      <ChartLegend
        items={doshaArray.map(g => ({
          label: g.label,
          value: g.value,
          color: g.color,
        }))}
      />
    </View>
  </View>
</View>


        {/* FOLLOW UPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Follow-Ups</Text>

          {patients.filter((p) => p.nextFollowUpDate).slice(0, 5).map((p) => (
            <View key={p.id} style={[styles.patientCard, styles.shadowSmall]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{p.user.name.charAt(0).toUpperCase()}</Text></View>

              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.user.name}</Text>
                <Text style={styles.patientSub}>Follow-up: {new Date(p.nextFollowUpDate).toDateString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* RECENT PATIENTS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Patients")}>
              <Text style={styles.viewAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <FlatList data={previewPatients} keyExtractor={(item) => item.id} scrollEnabled={false} renderItem={renderPatient} />
        </View>
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------
   STYLES
--------------------------------------------------------------*/
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcome: { color: "#fff", opacity: 0.9, fontSize: 15 },

  doctorName: { color: "#fff", fontSize: 26, fontWeight: "700", marginTop: 2 },

  dateText: { color: "#fff", opacity: 0.85, marginTop: 10 },

  profileIcon: { padding: 4 },

  searchContainer: { marginTop: 18, paddingHorizontal: 16 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },

  searchInput: { marginLeft: 10, fontSize: 16, flex: 1, color: colors.foreground },

  statsGrid: { paddingHorizontal: 16, marginTop: 20 },

  statCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  statIcon: {
    width: 55,
    height: 55,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: { fontSize: 20, fontWeight: "700", color: colors.foreground },

  statLabel: { fontSize: 13, color: colors.foregroundLight, marginTop: 2 },

  shadow: {
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  shadowSmall: {
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  section: { marginTop: 26, paddingHorizontal: 16 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },

  subHeading: {
    marginVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.foregroundLight,
  },

  viewAll: { color: colors.primary, fontWeight: "600" },

  patientCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}22`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  
  chartBox: {
    width: "48%",              // two equal columns
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    alignItems: "center",
  },
  

  patientInfo: { flex: 1 },

  patientName: { fontSize: 16, fontWeight: "700", color: colors.foreground },

  patientSub: { marginTop: 2, fontSize: 13, color: colors.foregroundLight },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
});
