import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../colors";
import { useNavigation } from "@react-navigation/native";

export default function ChatHeaderButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={{ paddingRight: 15 }}
      onPress={() => navigation.navigate("ChatEntry")}
    >
      <Ionicons 
        name="chatbubble-ellipses-outline" 
        size={26} 
        color={colors.primary} 
      />
    </TouchableOpacity>
  );
}
