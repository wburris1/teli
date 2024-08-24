import Dimensions from "@/constants/Dimensions"
import { CastMember } from "@/constants/ImportTypes"
import { TouchableOpacity, StyleSheet, Image, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';




const screenWidth = Dimensions.screenWidth
const imgUrl = 'https://image.tmdb.org/t/p/w500';
const itemWidth = (Dimensions.screenWidth / 3) - 20;

export const DisplayItemInfo =  ({ item }: { item: Item }) => {
  const colorScheme = useColorScheme();
// if budget is below certain count
// people icon, time icon 

  return (
    <View style={styles.castContainer}>
      {item.number_of_seasons !== undefined && (
      <Text style={styles.castText}>{`Total Seasons: ${item.number_of_seasons}`}</Text>
    )}
    <MaterialIcons name="attach-money" size={24} color="black" />
    <FontAwesome5 name="dollar-sign" size={24} color="black" />
    <Ionicons
                      name="people"
                      size={25}
                      color={Colors[colorScheme ?? 'light'].text}
                  />
    {item.number_of_episodes !== undefined && (
      <Text style={styles.castText}>{`Total Episodes: ${item.number_of_episodes}`}</Text>
    )}
    
    {item.vote_average !== undefined && (
      <Text style={styles.castText}>{`Average Score: ${item.vote_average.toFixed(2)}`}</Text>
    )}
    {item.vote_count > 500 && (
      <Text style={styles.castText}>{`Ranked by ${(Math.round(item.vote_count / 1000) * 1000).toLocaleString()}+ people`}</Text>
    )}
    {item.runtime !== undefined && (
      <Text style={styles.castText}>{`Runtime: ${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`}</Text>
    )}
    
    {item.revenue && (
      <Text style={styles.castText}>{`Revenue: $${(item.revenue/1000000000).toFixed(1)}B`}</Text>
    )}
    </View>
  ) // ${(item.revenue/1000000).toLocaleString()}
}
/*
{item.budget && (
  <Text style={styles.castText}>{`Budget: $${(item.budget).toLocaleString()}M`}</Text>
)} */

const styles = StyleSheet.create({
  castText: {
    textAlign: 'left',
    fontSize: screenWidth > 400 ? 16 : 14,
    fontWeight: '400', 
    paddingLeft: 10, // Ensure padding on the left to align with the rest of the content
  },
  castContainer: {
    //flexDirection: 'column',
    width: screenWidth,
  },
})