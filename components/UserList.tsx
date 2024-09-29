import { Image, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Dimensions from "@/constants/Dimensions";
import { List } from "@/constants/ImportTypes";
import { DefaultPost } from "./LogoView";
import { useData } from "@/contexts/dataContext";

const imgUrl = 'https://image.tmdb.org/t/p/w200';
const itemWidth = (Dimensions.screenWidth / 3) - 20;
const screenWidth = Dimensions.screenWidth;


const OverlappingImages = ({ images, list, posterNames }: { images: string[], list: List, posterNames: string[] }) => {
    const colorScheme = useColorScheme();
  
    return (
      <View style={styles.imageContainer}>
        {images.map((image, index) => (
          
          !image.endsWith('null') ? 
            (<Image
                key={index}
                source={{ uri: image }}
                style={[styles.image,
                  { left: index * -(itemWidth - 33), top: index * 10, zIndex: images.length - index,
                    opacity: image == "/" ? 0 : 100, borderColor: Colors[colorScheme ?? 'light'].text, overflow: 'hidden'
                   }]}
                />
            ) 
             : (<DefaultPost  key={index} fontSize={screenWidth > 400 ? 16 : 10.5} text={posterNames[index]} style={[styles.image,
                  { left: index * -(itemWidth - 33), top: index * 10, zIndex: images.length - index,
                    opacity: image == "/" ? 0 : 100, borderColor: Colors[colorScheme ?? 'light'].text, overflow: 'hidden'
                   }]}/>)
            
          
        ))}
      </View>
    );
};

export const UserList = ({ list, listTypeID, isListTab, userID, index, redirectLink = '' }: { list: List, listTypeID: string, isListTab: boolean, userID: string, index: number, redirectLink: string }) => {
  const { storedListPosters } = useData();
  const posters = [
    storedListPosters[list.top_poster_path] ? storedListPosters[list.top_poster_path] : (list.top_poster_path ? imgUrl + list.top_poster_path : "/"),
    storedListPosters[list.second_poster_path] ? storedListPosters[list.second_poster_path] : (list.second_poster_path ? imgUrl + list.second_poster_path : "/"),
    storedListPosters[list.bottom_poster_path] ? storedListPosters[list.bottom_poster_path]: (list.bottom_poster_path ? imgUrl + list.bottom_poster_path : "/"),
  ];
  const posterNames = [list.top_item_name, list.second_item_name, list.bottom_item_name];
  const isEmpty = posters[0] == "/";
  const listName = list.name;

  return (
    <Link
      href={{pathname: isListTab ? '/list_page' : `${redirectLink}_list_page` as any, params: { 
        listTypeID: listTypeID, listID: list.list_id, description: list.description,
        name: list.name, userID: userID, isRanked: list.is_ranked ? 'true' : 'false',
      }}}
      style={[styles.itemContainer, {height: (itemWidth - 20) * (3/2) + 45, marginTop: 5}]} asChild
    >
      <TouchableOpacity>
        {isEmpty ? 
        <View style={styles.emptyList}>

        </View> : 
        <OverlappingImages images={posters} list={list} posterNames={posterNames} />}
        <Text numberOfLines={2} style={!isEmpty ? styles.title : styles.emptyListTitle}>{listName}</Text>
      </TouchableOpacity>
    </Link>
  )
}

const styles = StyleSheet.create({
    itemContainer: {
        alignItems: 'center',
        height: (itemWidth - 20) * (3/2) + 45,
        width: itemWidth,
        marginLeft: 15,
        marginTop: 5,
      },
      imageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
        height: (itemWidth - 20) * (3/2) + 20,
        width: itemWidth,
      },
      image: {
        width: itemWidth - 23,
        aspectRatio: 2/3,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'gray',
      },
      title: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left',
        width: itemWidth,
      },
      emptyList: {
        alignItems: 'flex-start',
        height: (itemWidth - 20) * (3/2) + 17,
        width: itemWidth,
        borderWidth: 1,
        borderRadius: 15,
        backgroundColor: '#d3d3d3',
      },
      emptyListTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'left',
        width: itemWidth,
        marginTop: 3,
      },
});