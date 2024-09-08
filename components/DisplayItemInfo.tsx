import Dimensions from "@/constants/Dimensions"
import { CastMember } from "@/constants/ImportTypes"
import { TouchableOpacity, StyleSheet, Image, useColorScheme, ScrollView } from "react-native"
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';




const screenWidth = Dimensions.screenWidth
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

  return (
    <ScrollView style={styles.castContainer} showsHorizontalScrollIndicator={false} horizontal>
      <View style={styles.container}>
        {item.number_of_seasons !== undefined && (
          <View style={[styles.infoContainer, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
            <Text style={[styles.numberText, {color: Colors[colorScheme ?? 'light'].background}]}>
              {item.number_of_seasons}
            </Text>
            <View style={styles.bottomText}>
              <Text style={[styles.castText, {color: Colors[colorScheme ?? 'light'].background,}]}>Seasons</Text>
            </View>
          </View>
        )}
        
        {item.number_of_episodes !== undefined && (
          <View style={[styles.infoContainer, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
            <Text style={[styles.numberText, {color: Colors[colorScheme ?? 'light'].background}]}>
              {item.number_of_episodes}
            </Text>
            <View style={styles.bottomText}>
              <Text style={[styles.castText, {color: Colors[colorScheme ?? 'light'].background,}]}>Episodes</Text>
            </View>
          </View>
        )}
        
        {item.budget > 0 && (
          <View style={[styles.infoContainer, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
            <Text style={[styles.numberText, {color: Colors[colorScheme ?? 'light'].background}]}>
              {convertNum(item.budget)}
            </Text>
            <View style={styles.bottomText}>
              <Text style={[styles.castText, {color: Colors[colorScheme ?? 'light'].background,}]}>
                Budget
              </Text>
              <Ionicons name='wallet' size={20} color={Colors[colorScheme ??  'light'].background} />
            </View>
          </View>
        )}
        {item.revenue > 0 && (
          <View style={[styles.infoContainer, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
            <Text style={[styles.numberText, {color: Colors[colorScheme ?? 'light'].background}]}>
              {convertNum(item.revenue)}
            </Text>
            <View style={styles.bottomText}>
              <Text style={[styles.castText, {color: Colors[colorScheme ?? 'light'].background,}]}>
                Revenue
              </Text>
              <Ionicons name='cash' size={20} color={Colors[colorScheme ??  'light'].background} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  ) // ${(item.revenue/1000000).toLocaleString()}
}


const styles = StyleSheet.create({
  castText: {
    textAlign: 'left',
    fontSize: screenWidth > 400 ? 16 : 14,
    fontWeight: '300', 
    paddingRight: 2,
  },
  castContainer: {
    //flexDirection: 'column',
    width: screenWidth,
  },
  container: {
    flexDirection: 'row',
    padding: 7.5,
    alignItems: 'center',
  },
  infoContainer: {
    borderRadius: 15,
    padding: 5,
    paddingHorizontal:  10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 18,
    fontWeight: '600'
  },
  bottomText: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    alignItems: 'center',
  }
})