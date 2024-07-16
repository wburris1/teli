import { Image, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Dimensions from "@/constants/Dimensions";

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const itemWidth = (Dimensions.screenWidth / 3) - 20;

const OverlappingImages = ({ images }: { images: string[] }) => {
    const colorScheme = useColorScheme();
  
    return (
      <View style={styles.imageContainer}>
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={[styles.image,
              { left: index * -90, top: index * 10, zIndex: images.length - index,
                opacity: image == "/" ? 0 : 100, borderColor: Colors[colorScheme ?? 'light'].text,
               }]}
          />
        ))}
      </View>
    );
};

export const UserList = ({ list, listTypeID, isListTab, userID }: { list: List, listTypeID: string, isListTab: boolean, userID: string }) => {
  const posters = [
    list.top_poster_path != "" ? imgUrl + list.top_poster_path : "/",
    list.second_poster_path != "" ? imgUrl + list.second_poster_path : "/",
    list.bottom_poster_path != "" ? imgUrl + list.bottom_poster_path : "/"
  ];
  const isEmpty = posters[0] == "/";
  const listName = list.name;

  return (
    <Link
      href={{pathname: isListTab ? '/list_page' : '/search_list_page', params: { listTypeID: listTypeID, listID: list.list_id, description: list.description, name: list.name, userID: userID }}}
      style={styles.itemContainer}
    >
      <View>
        {isEmpty ? 
        <View style={styles.emptyList}>

        </View> : 
        <OverlappingImages images={posters} />}
        <Text numberOfLines={2} style={!isEmpty ? styles.title : styles.emptyListTitle}>{listName}</Text>
      </View>
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