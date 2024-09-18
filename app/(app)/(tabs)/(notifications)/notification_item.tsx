import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ItemDetails from "@/components/ItemDetails";
import { useItemDetails } from "@/data/itemData";

export default function NotificationItem() {
  const { id, groupKey } = useLocalSearchParams();
  const {item, director, cast, reccomendations} = useItemDetails(id as string, groupKey == "movie");

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {item &&
      <ItemDetails item={item} director={director} cast={cast} reccomendations={reccomendations} redirectLink="notification" />}
    </View>
  );
}