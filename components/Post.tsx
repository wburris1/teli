import { Post } from "@/constants/ImportTypes";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, LayoutAnimation, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Dimensions from "@/constants/Dimensions";

const imgUrl = 'https://image.tmdb.org/t/p/w500';

export const ProfilePost = ({item, index, name}: {item: Post, index: number, name: string}) => {
    const colorScheme = useColorScheme();
    const timestamp = item.created_at;
    const date = timestamp as Timestamp ? (timestamp as Timestamp).toDate() : new Date();
    const formattedDate = format(date, 'PP');
    const [isExpanded, setIsExpanded] = useState(false);
    const [captionHeight, setCaptionHeight] = useState<number | null>(null);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const maxCaptionHeight = (item.score && (item.score == -2 || item.score >= 0)) ? 65 : 80;

    useEffect(() => {
      if (captionHeight !== null) {
        if (isExpanded) {
          Animated.timing(animatedHeight, {
            toValue: captionHeight,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(animatedHeight, {
            toValue: maxCaptionHeight,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      }
    }, [isExpanded, captionHeight]);

    const toggleExpanded = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
    };

    const onTextLayout = (e: any) => {
      if (captionHeight === null) {
        setCaptionHeight(e.nativeEvent.layout.height);
      }
    };

    const animatedStyle = {
      height: captionHeight !== null ? animatedHeight : null,
    };

    return (
      <View style={[styles.postContainer, {borderColor: Colors[colorScheme ?? 'light'].text}]} key={item.post_id}>
        <View style={{flexDirection: 'row'}}>
          <Image
            source={{ uri: imgUrl + item.poster_path }}
            style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text }]}
          />
          <View style={{justifyContent: 'space-between'}}>
            <View>
              <View style={{flexDirection: 'row',}}>
                <View>
                  {(item.score >= 0 || item.score == -2) && 
                  <Text style={{fontSize: 14, fontWeight: '300'}}>
                    {item.score == -2 ? name + " bookmarked" : name + " ranked"}
                  </Text>}
                  <Text numberOfLines={1} style={{fontSize: 17, fontWeight: '600', marginBottom: 3, width: Dimensions.screenWidth - 125}}>
                    {item.item_name}
                  </Text>
                </View>
                <TouchableOpacity style={{paddingLeft: 5}}>
                  <Ionicons name="ellipsis-horizontal" size={25} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row',}}>
                {item.score >= 0 && (
                  <View style={[styles.scoreContainer, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                    <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
                  </View>
                )}
                <Pressable onPress={() => {
                    if (captionHeight && captionHeight > maxCaptionHeight) {
                      toggleExpanded();
                    }
                  }}>
                  <Animated.View style={animatedStyle}>
                    <Text style={[styles.caption, { marginRight: (!item.score || item.score < 0) ? 80 : 125 }]} onLayout={onTextLayout}>
                      {item.caption}
                    </Text>
                  </Animated.View>
                  {!isExpanded && captionHeight && captionHeight > maxCaptionHeight && (
                    <LinearGradient
                      colors={[colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent', Colors[colorScheme ?? 'light'].background]}
                      style={styles.gradient}
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.postFooter}>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 15, flexDirection: 'row'}}>
              <Ionicons name="heart" size={30} color={Colors[colorScheme ?? 'light'].text} style={{paddingRight: 3}} />
              <View>
                <Text style={{fontSize: 14, fontWeight: '300'}}>Likes</Text>
                <Text style={{fontSize: 14, fontWeight: '500'}}>{item.likes.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 5, flexDirection: 'row'}}>
              <Ionicons name="chatbubble-ellipses" size={30} color={Colors[colorScheme ?? 'light'].text} style={{paddingRight: 3}}/>
              <View>
                <Text style={{fontSize: 14, fontWeight: '300'}}>Comments</Text>
                <Text style={{fontSize: 14, fontWeight: '500'}}>{item.num_comments}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={{fontSize: 14, fontWeight: '200', alignSelf: 'flex-end'}}>{formattedDate}</Text>
        </View>
      </View>
    )
  }

  const styles = StyleSheet.create({
    postFooter: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    username: {
      fontSize: 18,
      color: 'gray',
    },
    caption: {
      fontSize: 16,
      fontWeight: '300',
    },
    postContainer: {
      padding: 10,
      borderBottomWidth: 1,
    },
    itemImage: {
      width: 70,
      aspectRatio: 2/3,
      borderRadius: 10,
      marginRight: 7,
      borderWidth: 0.5,
    },
    scoreContainer: {
      width: 40,
      aspectRatio: 1,
      borderRadius: 50,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 5,
      marginTop: 5,
    },
    scoreText: {
      fontSize: 18,
      fontWeight: '500',
    },
  });