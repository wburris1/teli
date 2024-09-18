import { useCallback, useEffect, useRef, useState } from "react"
import { Animated, LayoutAnimation, Platform, Pressable, StyleSheet, TextStyle, UIManager, useColorScheme } from "react-native";
import { Text, View } from "../Themed";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/Colors";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ExpandableText = ({ text, maxHeight, textStyle, startExpanded, isDesc = false }:
  { text: string, maxHeight: number, textStyle: TextStyle, startExpanded: boolean, isDesc?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [textHeight, setCaptionHeight] = useState<number | null>(null);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const colorScheme = useColorScheme();

    useEffect(() =>  {
      if (startExpanded && textHeight && !isExpanded && textHeight > maxHeight) {
        toggleExpanded();
      }
    }, [textHeight])

    useEffect(() => {
        if (textHeight !== null) {
          if (isExpanded) {
            Animated.timing(animatedHeight, {
              toValue: textHeight,
              duration: 300,
              useNativeDriver: false,
            }).start();
          } else {
            Animated.timing(animatedHeight, {
              toValue: maxHeight,
              duration: 300,
              useNativeDriver: false,
            }).start();
          }
        }
      }, [isExpanded, textHeight]);

      const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
      };

      const onTextLayout = (e: any) => {
        if (textHeight === null) {
          setCaptionHeight(e.nativeEvent.layout.height);
        }
      };
  
      const animatedStyle = {
        height: textHeight !== null ? animatedHeight : null,
      };

      return (
        <>
          {(textHeight == null || textHeight > maxHeight) ? 
            <Pressable onPress={() => {
                if (textHeight && textHeight > maxHeight) {
                    toggleExpanded();
                }
                }}>
                <Animated.View style={animatedStyle}>
                <Text style={textStyle} onLayout={onTextLayout}>
                    {text}
                </Text>
                </Animated.View>
                {!isExpanded && textHeight && textHeight > maxHeight && (
                <LinearGradient
                    colors={[colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent', Colors[colorScheme ?? 'light'].background]}
                    style={styles.gradient}
                />
                )}
            </Pressable> : !isDesc ?
            <View style={{height: maxHeight}}>
              <Text style={textStyle} onLayout={onTextLayout}>
                {text}
              </Text>
            </View> : 
            <View>
              <Text style={textStyle} onLayout={onTextLayout}>
                {text}
              </Text>
            </View>}</>
      );
}

const styles = StyleSheet.create({
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
    },
});