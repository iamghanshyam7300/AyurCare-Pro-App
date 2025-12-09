// /screens/doctor/EditPatient.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../colors";
import { patientsAPI, diseaseAPI, usersAPI } from "../../services/api"; 

const FieldCard = ({ label, icon, children }) => (
  <View style={styles.fieldCard}>
    <View style={styles.fieldLabelRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
    {children}
  </View>
);

export default function EditPatient({ route, navigation }) {
  // ✅ Extract onRefresh from params
  const { patientId, onRefresh } = route?.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patient, setPatient] = useState(null);
  const [diseases, setDiseases] = useState([]);
  
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [sleepPattern, setSleepPattern] = useState("");
  const [bowelMovement, setBowelMovement] = useState("");
  const [doshaType, setDoshaType] = useState("");
  
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [diseaseModalVisible, setDiseaseModalVisible] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [patientRes, diseaseRes] = await Promise.all([
        patientsAPI.getById(patientId),
        diseaseAPI.getAll({ limit: 100 })
      ]);

      let diseaseList = [];
      // Handle various API response structures
      if (diseaseRes.data && diseaseRes.data.data && Array.isArray(diseaseRes.data.data.data)) {
        diseaseList = diseaseRes.data.data.data;
      } else if (Array.isArray(diseaseRes.data)) {
        diseaseList = diseaseRes.data;
      }
      setDiseases(diseaseList);

      const p = patientRes.data.data;
      setPatient(p);
      setHeight(String(p.height || ""));
      setWeight(String(p.weight || ""));
      setSleepPattern(p.sleepPattern || "");
      setBowelMovement(p.bowelMovement || "");
      setDoshaType(p.user?.doshaType || "");

      const existingDisease = p.user?.disease || p.disease;
      if (existingDisease) {
        setSelectedDisease(existingDisease);
      }

    } catch (error) {
      console.error("❌ Error loading data:", error);
      Alert.alert("Error", "Could not load patient details.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
  
      const patientPayload = {
        height: Number(height),
        weight: Number(weight),
        sleepPattern,
        bowelMovement,
      };

      await patientsAPI.update(patientId, patientPayload);

      if (patient && patient.userId) {
          const userPayload = {
             diseaseId: selectedDisease ? selectedDisease.id : null,
             doshaType: doshaType 
          };
          await usersAPI.update(patient.userId, userPayload);
      }

      Alert.alert("Success", "Patient updated successfully", [
          { 
              text: "OK", 
              onPress: () => {
                  // ✅ TRIGGER REFRESH BEFORE GOING BACK
                  if (onRefresh) onRefresh();
                  navigation.goBack();
              } 
          }
      ]);
  
    } catch (error) {
      console.error("❌ Update error:", error.response?.data || error);
      const msg = error.response?.data?.message || "Failed to update patient";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredDiseases = diseases.filter(d => 
    d.name.toLowerCase().includes(diseaseSearch.toLowerCase())
  );
  
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.header}>Edit Patient</Text>

        <View style={styles.twoColumnWrap}>
          <FieldCard label="Height (cm)" icon="resize">
            <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />
          </FieldCard>
          <FieldCard label="Weight (kg)" icon="barbell">
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
          </FieldCard>
          <FieldCard label="Sleep Pattern" icon="moon">
            <View style={styles.dropdown}>
              <Picker selectedValue={sleepPattern} onValueChange={setSleepPattern}>
                <Picker.Item label="4–5 hours" value="4–5 hours" />
                <Picker.Item label="5–6 hours" value="5–6 hours" />
                <Picker.Item label="6–7 hours" value="6–7 hours" />
                <Picker.Item label="7–8 hours" value="7–8 hours" />
                <Picker.Item label="8+ hours" value="8+ hours" />
              </Picker>
            </View>
          </FieldCard>
          <FieldCard label="Bowel Movement" icon="water">
            <View style={styles.dropdown}>
              <Picker selectedValue={bowelMovement} onValueChange={setBowelMovement}>
                <Picker.Item label="Regular" value="Regular" />
                <Picker.Item label="Slightly irregular" value="Slightly irregular" />
                <Picker.Item label="Constipated" value="Constipated" />
                <Picker.Item label="Loose / Diarrhea" value="Loose / Diarrhea" />
                <Picker.Item label="Hard stools" value="Hard stools" />
              </Picker>
            </View>
          </FieldCard>
          <FieldCard label="Dosha Type" icon="leaf">
            <View style={styles.dropdown}>
              <Picker selectedValue={doshaType} onValueChange={setDoshaType}>
                <Picker.Item label="VATA" value="VATA" />
                <Picker.Item label="PITTA" value="PITTA" />
                <Picker.Item label="KAPHA" value="KAPHA" />
                <Picker.Item label="VATA-PITTA" value="VATA_PITTA" />
                <Picker.Item label="VATA-KAPHA" value="VATA_KAPHA" />
                <Picker.Item label="PITTA-KAPHA" value="PITTA_KAPHA" />
                <Picker.Item label="TRIDOSHA" value="TRIDOSHA" />
              </Picker>
            </View>
          </FieldCard>
        </View>

        <View style={styles.fullWidthCard}>
           <View style={styles.fieldLabelRow}>
              <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primary} />
              <Text style={styles.label}>Primary Condition</Text>
           </View>
           
           <TouchableOpacity style={styles.diseaseSelector} onPress={() => setDiseaseModalVisible(true)}>
              <Text style={[styles.diseaseText, !selectedDisease && { color: colors.foregroundLight }]}>
                  {selectedDisease ? selectedDisease.name : "Select Disease..."}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.foregroundLight} />
           </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={saveChanges} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>

      </ScrollView>

      <Modal visible={diseaseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Disease</Text>
              <TouchableOpacity onPress={() => setDiseaseModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={colors.foregroundLight} />
              <TextInput style={styles.searchInput} placeholder="Search..." value={diseaseSearch} onChangeText={setDiseaseSearch} autoFocus />
            </View>
            <FlatList
              data={filteredDiseases}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.diseaseItem, selectedDisease?.id === item.id && styles.diseaseItemActive]}
                  onPress={() => {
                    setSelectedDisease(item);
                    setDiseaseModalVisible(false);
                  }}
                >
                  <Text style={[styles.diseaseName, selectedDisease?.id === item.id && { color: colors.primary, fontWeight: '700' }]}>
                    {item.name}
                  </Text>
                  {selectedDisease?.id === item.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 20, color: colors.foreground },
  twoColumnWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  fieldCard: { width: "48%", backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: colors.primary },
  fullWidthCard: { width: "100%", backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#E67E22" },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  label: { fontSize: 12, color: colors.foregroundLight },
  input: { backgroundColor: colors.background, padding: 10, borderRadius: 8, color: colors.foreground, borderWidth: 1, borderColor: colors.border },
  dropdown: { backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  diseaseSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  diseaseText: { fontSize: 14, color: colors.foreground, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 8 },
  diseaseItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  diseaseItemActive: { backgroundColor: colors.primary + '10' },
  diseaseName: { fontSize: 16, color: colors.foreground },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: "center", marginTop: 20, marginBottom: 50 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});