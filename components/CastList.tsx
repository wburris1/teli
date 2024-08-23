import Dimensions from "@/constants/Dimensions"
import { CastMember } from "@/constants/ImportTypes"
import { TouchableOpacity, StyleSheet, Image, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors"


const screenWidth = Dimensions.screenWidth
const imgUrl = 'https://image.tmdb.org/t/p/w500';
const itemWidth = (Dimensions.screenWidth / 3) - 20;

export const CastList =  ({ cast }: { cast: CastMember }) => {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.itemContainer} >
      <Image source={{ uri: imgUrl + cast.profile_path }} style={[styles.Itemimage, {borderColor: Colors[colorScheme ?? 'light'].text}]} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.actorName}>
        {cast.name}
      </Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.characterName}>
        {cast.character}
      </Text>
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
    actorName: {
      marginTop: 5,
      fontSize: screenWidth > 400 ? 13 : 9, // 9, //14
      fontWeight: '600', //600
      textAlign: 'center',
      width: itemWidth - 20,
    },
    characterName: {
      marginTop: 2,
      fontSize: screenWidth > 400 ? 12 : 8, //8, //12
      fontWeight: '400',
      textAlign: 'center',
      width: itemWidth - 20,
    },
  }
)