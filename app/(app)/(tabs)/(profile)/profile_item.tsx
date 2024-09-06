import { View, Text } from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import ItemDetails from "@/components/ItemDetails";
import { useItemDetails } from "@/data/itemData";

export default function ItemPage() {
  const { id, groupKey } = useLocalSearchParams();
  const {item, director, cast, reccomendations} = useItemDetails(id as string, groupKey == "movie");

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {item &&
      <ItemDetails item={item} director={director} cast={cast} reccomendations={reccomendations} redirectLink="profile" />}
    </View>
  );
}