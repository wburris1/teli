import Dimensions from "@/constants/Dimensions"
import { CastMember } from "@/constants/ImportTypes"
import { TouchableOpacity, StyleSheet, Image, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors"
import { Link } from "expo-router"
import { useEffect } from "react"
import { useItemDetails } from "@/data/itemData"
import { RootStackParamList } from "@/constants/ImportTypes"
import { ScreenNavigationProp } from "@/constants/ImportTypes"
import { useNavigation } from "@react-navigation/native"


const screenWidth = Dimensions.screenWidth
const imgUrl = 'https://image.tmdb.org/t/p/w500';
const itemWidth = (Dimensions.screenWidth / 3) - 20;

export const Reccomendation =  ({ item, redirectLink }: { item: Item, redirectLink: string }) => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation<ScreenNavigationProp>();
  const handleNavigation = () => {
    navigation.push(redirectLink + "_item", { id: item.id, groupKey: 'title' in item ? "movie" : "tv" })
  };

  return (
    <View style={styles.itemContainer} >
        <TouchableOpacity onPress={handleNavigation}>
          <Image source={{ uri: imgUrl + item.poster_path }} style={[styles.Itemimage, {borderColor: Colors[colorScheme ?? 'light'].text}]} />
        </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    itemContainer: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      height: (itemWidth - 20) * (3/2) + 45,
      width: itemWidth - 8,
      marginLeft: 0,
      marginTop: 5,
      marginBottom: 25,
      borderRadius: 12,
    },
    Itemimage: {
      width: itemWidth - 20,
      aspectRatio: 2/3,
      borderRadius: 12,
      borderWidth: 0.5,
      marginLeft: 8,
    },
  }
)