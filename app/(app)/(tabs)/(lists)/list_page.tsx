import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import SearchTabs from '@/components/Search/SearchTabs';
import React, { ContextType, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation } from 'expo-router';
import { removeFromList, useUserItemDelete, useUserItemsSeenSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { useData } from '@/contexts/dataContext';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Values from '@/constants/Values';
import { useTab } from '@/contexts/listContext';

type RowProps = {
    item: UserItem;
    index: number;
    items: UserItem[];
    listID: string;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;
const DELETE_WIDTH = 80;

const RenderItem = forwardRef<View, RowProps>(({ item, index, items, listID }, ref) => {
    const { setItem } = useTab();
    const [isSwiped, setSwiped] = useState(false);
    const score = item.score.toFixed(1);
    const isMovie = 'title' in item;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    const isCustomList = (listID == Values.seenListID || listID == Values.bookmarkListID) ? false : true;
    var date = "";
  
    const handleSetSwiped = (value: boolean) => {
      setSwiped(value);
    };
  
    date = isMovie ? item.release_date : item.first_air_date;
    date = date.slice(0,4);
    const deleteItem = useUserItemDelete(item.item_id, item.score, Values.seenListID, listTypeID);
    const removeItem = removeFromList(listID, listTypeID, item.item_id);
  
    const transX = useSharedValue(0);
  
    const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      if (isSwiped) {
        transX.value = withSpring(0);
      }
    })
    .onUpdate((event) => {
      if (!isSwiped) {
        transX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (transX.value > DELETE_WIDTH || transX.value < -DELETE_WIDTH) {
        runOnJS(handleSetSwiped)(true);
        transX.value = transX.value > 0 ? withSpring(DELETE_WIDTH) : withSpring(-DELETE_WIDTH);
      } else {
        runOnJS(handleSetSwiped)(false);
        transX.value = withSpring(0);
      }
    });
  
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: transX.value }]
      }
    }, [transX.value]);
  
    const deleteButtonStyle = useAnimatedStyle(() => ({
      opacity: interpolate(transX.value, [0, DELETE_WIDTH], [0, 1]),
      transform: [{ translateX: transX.value - screenWidth }],
      width: transX.value > 0 ? transX.value : DELETE_WIDTH,
    }));
  
    const addButtonStyle = useAnimatedStyle(() => ({
      opacity: interpolate(transX.value, [0, -DELETE_WIDTH], [0, 1]),
      transform: [{ translateX: 0 }],
      width: transX.value < 0 ? Math.abs(transX.value) : DELETE_WIDTH,
    }));
    
    const onDelete = (item_id: string) => {
      const alertHeaderText = isCustomList ? "Confirm Remove" : "Confirm Delete";
      const alertText = isCustomList ? "Are you sure you want to remove this item from the list?" : 
        "Are you sure you want to delete this item?";
      const alertButtonText = isCustomList ? "Remove" : "Delete";
      Alert.alert(
        alertHeaderText,
        alertText,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: alertButtonText,
            onPress: () => {
              if (!isCustomList) {
                console.log("Delete Pressed, deleting item with ID:", item_id);
                deleteItem(items.filter(filterItem => filterItem.item_id !== item.item_id));
              } else {
                console.log("Remove Pressed, removing item with ID:", item_id);
                removeItem();
              }
            }
          }
        ]
      );
    };
  
    return (
      <GestureDetector gesture={panGesture}>
        <View>
        <Animated.View style={[!isCustomList ? styles.deleteButtonContainer : styles.removeButtonContainer, deleteButtonStyle]}>
          <TouchableOpacity style={styles.fullSize} onPress={() => onDelete(item.item_id)}>
            <Ionicons
              name={!isCustomList ? "trash" : "close"}
              size={40}
              color={'#fff'}
            />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.itemContainer, animatedStyle]}>
          <Link href={{pathname: "/list_item", params: { id: item.item_id, groupKey: isMovie ? "movie" : "tv" }}} style={styles.linkStyle}>
            <View style={styles.innerContainer}>
              <View style={styles.rank}><View style={styles.scoreCircle}><Text style={styles.text}>#{index + 1}</Text></View></View>
              <Image
                  source={{ uri: imgUrl + item.poster_path }}
                  style={styles.image}
              />
              <View style={styles.textContainer}>
                <Text style={styles.itemText}>{'title' in item ? item.title : item.name}</Text>
                <Text style={styles.dateText}>{date}</Text>
              </View>
              {listID != Values.bookmarkListID &&
              <View style={styles.score}><View style={styles.scoreCircle}><Text style={styles.text}>{score}</Text></View></View>}
              <Ionicons
                name="chevron-forward"
                size={15}
                color={Colors['light'].text}
              />
            </View>
          </Link>
        </Animated.View>
        <Animated.View style={[styles.addButtonContainer, addButtonStyle]}>
          <Link href={{pathname: "/add_to_list", params: {item_id: item.item_id, listTypeID: listTypeID }}} asChild>
            <TouchableOpacity style={styles.fullSize} onPress={() => setItem(item)}>
              <Ionicons
                name="add"
                size={40}
                color={'#fff'}
              />
            </TouchableOpacity>
          </Link>
        </Animated.View>
        </View>
      </GestureDetector>
    );
});

const MakeList = ({ listID, listTypeID }: {listID: string, listTypeID: string}) => {
    const { items, loaded } = useUserItemsSeenSearch(listID, listTypeID);
    if (items != null) {
      items.sort((a: UserItem, b: UserItem) => b.score - a.score);
    }
    if (items) {
      return (
        <>
          {items.length > 0 ? 
          <FlatList
            data={items}
            renderItem={({ item, index }) => <RenderItem item={item} index={index} items={items} listID={listID} />}
            keyExtractor={item => item.item_id}
            numColumns={1}
          /> : 
          <Text>Rank something!</Text>}
        </>
      )
    } else {
      return (
        <Text>Loading</Text>
      )
    }
}

export default function TabOneScreen() {
    const { refreshFlag } = useData();
    const { listTypeID, listID } = useLocalSearchParams();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isCustomList = (listID == Values.seenListID || listID == Values.bookmarkListID) ? false : true;

    useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: listID,
        headerRight: () => (<>
          {listID == Values.seenListID &&
            <Link href="/reorder" asChild>
            <Pressable>
              {({ pressed }) => (
                <Ionicons
                  name="menu"
                  size={35}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>}
          {isCustomList && 
            <Pressable>
              {({ pressed }) => (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={35}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>}
          </>
        ),
      })
    }, [navigation, listID])
    
    var ItemList = useCallback(() =>  
      <MakeList listID={listID as string} listTypeID={listTypeID as string}/>
    , [refreshFlag]);
  
    return (
        <GestureHandlerRootView>
          <View style={{ backgroundColor: '#fff', flex: 1 }}>
            <ItemList />
          </View>
        </GestureHandlerRootView>
    );
  }

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    separator: {
      marginVertical: 30,
      height: 1,
      width: '80%',
    },
    itemText: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    itemLabel: {
      alignItems: 'center',
      flexDirection: 'column',
    },
    text: {
      fontSize: 16
    },
    rank: {
      paddingHorizontal: 10,
      backgroundColor: 'transparent'
    },
    score: {
      paddingHorizontal: 5,
      backgroundColor: 'transparent'
    },
    scoreCircle: {
      width: 35,
      height: 35,
      backgroundColor: '#fff',
      borderRadius: 35/2,
      borderWidth: 0.5,
      borderColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    itemContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomColor: '#000',
      overflow: 'hidden',
      paddingRight: 5,
      width: '100%',
    },
    image: {
      width: '20%',
      aspectRatio: 1 / 1.5,
      paddingHorizontal: 5,
      marginVertical: 10,
      borderWidth: 0.5,
      borderColor: '#000',
      borderRadius: 10,
    },
    textContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: 10,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '200',
    },
    deleteButtonContainer: {
      flexDirection: 'row',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'red',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    removeButtonContainer: {
      flexDirection: 'row',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'blue',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    fullSize: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomColor: '#000',
    },
    addButtonContainer: {
      flexDirection: 'row',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: '#32CD32',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    linkStyle: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'center',
      padding: 0,
      margin: 0,
    },
    innerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      height: '100%',
    },
  });