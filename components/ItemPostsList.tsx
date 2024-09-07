import Dimensions from "@/constants/Dimensions"
import { TouchableOpacity, StyleSheet, Image, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors"
import { FeedPost, Post } from "@/constants/ImportTypes"
import { Link } from "expo-router"
import { useCallback, useState } from "react"


const screenWidth = Dimensions.screenWidth
const imgUrl = 'https://image.tmdb.org/t/p/w500';
const itemWidth = (Dimensions.screenWidth / 3) - 20;

export const ItemPostList =  ({ itemPost }: { itemPost: FeedPost }) => {
  const colorScheme = useColorScheme();
  const [headerWidth, setHeaderWidth] = useState<number | null>(null);

  const onLayout = (e: any) => {
    if (headerWidth === null) {
      setHeaderWidth(e.nativeEvent.layout.width);
    }
  };

  const caption = useCallback(() => {
    console.log(itemWidth)
    return (
        <View style={{flexDirection: 'row', backgroundColor: 'transparent', 
            alignItems: 'center', marginLeft: 5, width: headerWidth,}}>
            <Text ellipsizeMode="tail" numberOfLines={3} style={{backgroundColor: 'transparent', height: 50, paddingRight: 10, 
                fontSize: 12, flex: 1, width: headerWidth ? headerWidth - 55 : 0}}>
                {itemPost.caption}
            </Text>
            <View style={[styles.score, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
                <Text style={{
                    color: Colors[colorScheme ?? 'light'].background,
                    fontSize: 20,
                    fontWeight: '600'
                }}>{itemPost.score.toFixed(1)}</Text>
            </View>
        </View>
    )
  }, [headerWidth, itemPost])

  return (
    <View style={[styles.itemContainer, styles.shadow, {backgroundColor: colorScheme == 'light' ? '#f2f2f2' : '#121212',
        shadowColor: 'black', marginRight: 10}]} >
      <View onLayout={onLayout} style={{flexDirection: 'row', backgroundColor: 'transparent', alignItems: 'center'}}>
        <Image
        source={{ uri: itemPost.profile_picture || undefined, cache: 'force-cache' }}
        style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text}]}
        />
        <Text style={{backgroundColor: 'transparent', fontSize: 16, fontWeight: '500', marginRight: 5}}>
            {itemPost.first_name} <Text style={{fontWeight: '400'}}>ranked this</Text>
        </Text>
      </View>
      {itemPost.caption ? (
            <>
                {caption()}
            </>
        ) : (
            <View style={[styles.score, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
                <Text style={{
                    color: Colors[colorScheme ?? 'light'].background,
                    fontSize: 20,
                    fontWeight: '600'
                }}>{itemPost.score.toFixed(1)}</Text>
            </View>
        )}
    </View>
  )
}

const styles = StyleSheet.create({
    itemContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 12,
        padding: 5,
        height: 115
    },
    shadow: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    profilePic: {
        width: 45,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: 'gray',
        borderWidth: 1,
        margin: 5,
    },
    score: {
        width: 45,
        aspectRatio: 1,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5
    },
  }
)