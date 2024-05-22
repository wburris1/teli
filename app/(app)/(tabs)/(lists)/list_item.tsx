import { View, Text } from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import ItemDetails from "@/components/ItemDetails";

export default function ItemPage() {
  const params = useLocalSearchParams();
  const item = Array.isArray(params) ? params[0] : params;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ItemDetails item={item} />
    </View>
  );
}