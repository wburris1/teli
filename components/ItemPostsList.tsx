import Dimensions from "@/constants/Dimensions"
import { TouchableOpacity, StyleSheet, Image, useColorScheme } from "react-native"
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors"
import { FeedPost, Post } from "@/constants/ImportTypes"
import { Link } from "expo-router"
import { useCallback, useState } from "react"


const screenWidth = Dimensions.screenWidth
const imgUrl = 'https://image.tmdb.org/t/p/w342';
const itemWidth = (Dimensions.screenWidth / 3) - 20;

export const ItemPostList =  ({ itemPost, redirectLink}: { itemPost: FeedPost, redirectLink: string }) => {
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
            <Text ellipsizeMode="tail" numberOfLines={2} style={{backgroundColor: 'transparent', maxHeight: 50, paddingRight: 10, 
                fontSize: 14, flex: 1, width: headerWidth ? headerWidth - 10 : 0, paddingBottom: 5}}>
                {itemPost.caption}
            </Text>
        </View>
    )
  }, [headerWidth, itemPost])

  return (
    <View style={[styles.itemContainer, styles.shadow, {backgroundColor: colorScheme == 'light' ? '#f2f2f2' : '#121212',
        shadowColor: 'black', marginRight: 10}]} >
      <View onLayout={onLayout} style={{flexDirection: 'row', backgroundColor: 'transparent', alignItems: 'center'}}>
        <Link href={{pathname: redirectLink + '_user' as any, params: { userID: itemPost.user_id }}} asChild>
        <TouchableOpacity>
          <Image
          source={ itemPost.profile_picture ? {uri: itemPost.profile_picture,  cache: 'force-cache' } : require('../assets/images/emptyprofilepic.jpg')}
          style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text, borderWidth: 0}]}
          />
        </TouchableOpacity>
        </Link>
        <View style={{backgroundColor: 'transparent', flex: 1, alignItems: 'flex-start', flexDirection: 'row',}}>
          <Link href={{pathname: redirectLink + '_user' as any, params: { userID: itemPost.user_id }}} asChild>
              <TouchableOpacity>
                <Text style={{backgroundColor: 'transparent', fontSize: 16, fontWeight: '500', marginRight: 5, lineHeight: 26.5}}>
                  {itemPost.first_name} 
                </Text>
              </TouchableOpacity>
          </Link>
          <Text style={{backgroundColor: 'transparent', fontSize: 16, fontWeight: '500', marginRight: 5, lineHeight: 24}}>
              <Text style={{fontWeight: '400',}}>ranked this <Text style={{fontWeight: 'bold', fontSize: 18, lineHeight: 24}}>
                {itemPost.score.toFixed(1)}</Text></Text>
          </Text>
        </View>
      </View>
      {/*itemPost.caption && (
            <>
                {caption()}
            </>
      )*/}
    </View>
  )
}

const styles = StyleSheet.create({
    itemContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 12,
        padding: 5,
    },
    shadow: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    profilePic: {
        width: 45,
        height: 45,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: 'gray',
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