import { View, Text } from "react-native";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";
import ItemDetails from "@/components/ItemDetails";
import { useItemDetails } from "@/data/itemData";

export default function ItemPage() {
  const { id, groupKey } = useLocalSearchParams();
  const {item, director, cast, reccomendations, streaming} = useItemDetails(id as string, groupKey == "movie");

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {item &&
      <ItemDetails item={item} director={director} cast={cast} recomendations={reccomendations} streamingServices={streaming} redirectLink="list"/>}
    </View>
  );
}