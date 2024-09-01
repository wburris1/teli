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
  const runTime = 'title' in item ? item.runtime : item.episode_run_time; 
  const convertNum = (revenue: number) => {
    if (revenue > 1000000000) {
      return `$${(revenue/1000000000).toFixed(1)}B`
    } else {
      return `$${(revenue/1000000).toFixed(1)}M`
    }
  }
  const convertRunTime = (runTime: number) => {
    return runTime < 60 ? 
    `Runtime: ${runTime}m` : 
    `Runtime: ${Math.floor(runTime / 60)}h ${runTime % 60}m`
  }

  return (
    <View style={styles.castContainer}>
      {item.number_of_seasons !== undefined && (
      <Text style={styles.castText}>{`Total Seasons: ${item.number_of_seasons}`}</Text>
    )}
    
    {item.number_of_episodes !== undefined && (
      <Text style={styles.castText}>{`Total Episodes: ${item.number_of_episodes}`}</Text>
    )}
    
    {item.vote_average > 0 && (
      <Text style={styles.castText}>{`Average Score: ${item.vote_average.toFixed(2)}`}</Text>
    )}
    {item.vote_count > 500 && (
      <Text style={styles.castText}>{`Ranked by ${(Math.round(item.vote_count / 1000) * 1000).toLocaleString()}+ people`}</Text>
    )}
    {runTime > 0 && (
      <Text style={styles.castText}>{convertRunTime(runTime)}</Text>
    )}
     {item.budget > 0 && (
      <Text style={styles.castText}>{`Budget: ${convertNum(item.budget)}`}</Text>
    )}
    {item.revenue > 0 && (
      <Text style={styles.castText}>{`Revenue: ${convertNum(item.revenue)}`}</Text>
    )}
    </View>
  ) // ${(item.revenue/1000000).toLocaleString()}
}


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