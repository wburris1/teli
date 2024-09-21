import { Image, ImageBackground, ImageStyle, StyleProp, StyleSheet } from "react-native"
import { Text, View } from './Themed';
import Dimensions from "@/constants/Dimensions";
const screenWidth = Dimensions.screenWidth;

export const Logo = ({width, height}: { width: number, height: number }) => {
    return (
        <Image
            source={require('../assets/images/clapperboard.png')}
            style={{width: width, height: height, resizeMode: 'contain'}}
        />
    )
}
export const DefaultPost = ({style, text, fontSize}: { style: StyleProp<ImageStyle>, text?: string, fontSize?: number}) => {
  const defaultFontSize = screenWidth > 400 ? 20 : 16;

  return (
      text ? 
      (<ImageBackground
        source={require('../assets/images/plain_poster_background.jpg')} ////poster-placeholder.png'
        style={style}>
          <View style={styles.textContainer}>
            <Text style={[styles.movieName, {fontSize: fontSize? fontSize : defaultFontSize} ]}>{text}</Text>
          </View>
      </ImageBackground>)
      : (<ImageBackground
        source={require('../assets/images/poster-placeholder.jpg')} ////poster-placeholder.png'
        style={style}/>) 
  )
} //           <Text style={styles.movieName}>POSTER NOT YET AVAILABLE</Text>

const styles = StyleSheet.create({
  textContainer: {
    flex: 1, // Take up the full height and width of the parent

    backgroundColor: 'rgba(0, 0, 0, 0)', // Optional: Add semi-transparent background
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center', // Center vertically

    borderRadius: 5,
  },
  movieName: {
    color: '#999', // White text for contrast // 555
    fontSize: screenWidth > 400 ? 20 : 16, // change font size to be dependent on screen size
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic', // Make text italicized

  },
});