import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text } from "./Themed";
import LottieView from "lottie-react-native";
import { Dimensions, StyleSheet, useColorScheme} from 'react-native';
import { Dispatch, SetStateAction } from "react";
import Colors from "@/constants/Colors";


interface SplashScreenProps {
  setAnimationLoading: Dispatch<SetStateAction<boolean>>;
}

export default function EntryAnimationScreen({ setAnimationLoading }: SplashScreenProps): JSX.Element {
  const { height } = Dimensions.get('window');
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
    },
    headerText: {
      fontSize: 25,
      fontWeight: '300',
      padding: 5,
      color: 'white'
    },
  })



  return (
    /*
<SafeAreaView style={{flex: 1, alignItems: 'center', margin: 0, backgroundColor: backgroundColor}}>
      <LottieView
        source={require('../assets/animations/clapper.json')}
        autoPlay={true}
        loop={false}
        resizeMode="cover"
        style={{width: 400, height: 400, backgroundColor: backgroundColor}}
        onAnimationFinish={() => setAnimationLoading(true)}
      />
    </SafeAreaView>  */
    
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        backgroundColor: backgroundColor,
      }}
    >
      <View
        style={{
          width: 400,
          height: 400,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative', // Ensure the container has a relative position
          backgroundColor: backgroundColor,
        }}
      >
        <LottieView
          source={require('../assets/animations/clapper.json')}
          autoPlay={true}
          loop={false}
          resizeMode="cover"
          style={{
            width: 400,
            height: 400,
            backgroundColor: backgroundColor,
            top: -200,
          }}
          
          onAnimationFinish={() => setAnimationLoading(false)}
        />
        <Text
          style={{
            position: 'absolute', // Position the text absolutely
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            top: 100,
            color: Colors[colorScheme === 'light' ? 'dark' : 'light'].background, // 'black', // Adjust color as needed for visibility
          }}
        >
          Take Two
        </Text>
      </View>
    </SafeAreaView> 

  )
}