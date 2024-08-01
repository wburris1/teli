import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import React, { ContextType, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useUserItemsSeenSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withClamp, withSpring } from 'react-native-reanimated';
import Values from '@/constants/Values';
import { useTab } from '@/contexts/listContext';
import { removeFromList, useUserItemDelete } from '@/data/deleteItem';
import { EditListScreen } from '@/components/EditList';
import SearchInput from '@/components/Search/SearchInput';
import { AnimatedSearch } from '@/components/AnimatedSearch';
import { UserItem } from '@/constants/ImportTypes';
import { LinearGradient } from 'expo-linear-gradient';

type RowProps = {
    item: UserItem;
    index: number;
    items: UserItem[];
    listID: string;
    popUpIndex: number;
    setPopUpIndex: (index: number) => void;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;
const itemWidth = (screenWidth - 12) / 3;

const RenderItem = forwardRef<View, RowProps>(({ item, index, items, listID, popUpIndex, setPopUpIndex }, ref) => {
    const { setItem } = useTab();
    const score = item.score.toFixed(1);
    const isMovie = 'title' in item;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    const isAll = listID == Values.seenListID ? true : false;
    const colorScheme = useColorScheme();
    const router = useRouter();
    //const popupRef = useRef<View>(null);
    let date = isMovie ? item.release_date : item.first_air_date;
    date = date.slice(0,4);
    const deleteItem = useUserItemDelete(item.item_id, item.score, Values.seenListID, listTypeID);
    const removeItem = removeFromList();
    const scale = useSharedValue(1);
    const transY = useSharedValue(0);
    const transX = useSharedValue(0);

    const onDelete = (item_id: string) => {
      const alertHeaderText = !isAll ? "Confirm Remove" : "Confirm Delete";
      const alertText = !isAll ? "Are you sure you want to remove this item from the list?" : 
        "Are you sure you want to delete this item?";
      const alertButtonText = !isAll ? "Remove" : "Delete";
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
              if (isAll) {
                console.log("Delete Pressed, deleting item with ID:", item_id);
                deleteItem(items.filter(filterItem => filterItem.item_id !== item.item_id));
              } else {
                console.log("Remove Pressed, removing item with ID:", item_id);
                removeItem(listID, listTypeID, item.item_id);
              }
            }
          }
        ]
      );
    };

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scaleX: scale.value }, { scaleY: scale.value }, { translateY: transY.value }, { translateX: transX.value }]
      }
    }, [scale.value, transY.value, transX.value]);

    useEffect(() => {
      if (popUpIndex !== index && scale.value > 1) {
        handleClose();
      }
    }, [popUpIndex])

    const handleLongPress = () => {
      if (popUpIndex === index) {
        setPopUpIndex(-1);
        return;
      }
      setPopUpIndex(index);
      const height = itemWidth * 1.5;
      transY.value = withSpring(-height * 0.07);
      if (index % 3 == 2) {
        transX.value = withSpring(-itemWidth * 0.07);
      } else if (index % 3 == 0) {
        transX.value = withSpring(itemWidth * 0.07);
      }
      scale.value = withSpring(1.15);
    }

    const handleClose = () => {
      transY.value = withSpring(0);
      transX.value = withSpring(0);
      scale.value = withSpring(1);
    }
  
    return (
      <>
      <View style={{zIndex: popUpIndex === index ? 2 : 0}}>
        <Link href={{pathname: "/list_item", params: { id: item.item_id, groupKey: isMovie ? "movie" : "tv" }}} asChild>
          <TouchableOpacity onLongPress={handleLongPress}>
            <Animated.View style={[styles.innerContainer, animatedStyle, popUpIndex === index ? styles.shadow : {}]}>
              <Image
                  source={{ uri: imgUrl + item.poster_path }}
                  style={[styles.image, { borderColor: 'black' }]}
              />
              {popUpIndex === index && (
                <>
                  <TouchableOpacity style={[styles.popUpButton, {top: 7, left: 7, backgroundColor: 'red', borderColor: 'white'}]} onPress={() => onDelete(item.item_id)}>
                    <Ionicons name="trash" size={25} color={'white'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.popUpButton, {top: 7, right: 7, backgroundColor: '#32CD32', borderColor: 'white'}]} onPress={() => {
                    setItem(item);
                    router.push({pathname: "/add_to_list", params: { item_id: item.item_id, listTypeID: listTypeID }});
                  }}>
                    <Ionicons name="add" size={25} color={'white'} />
                  </TouchableOpacity>
                </>
              )}
              {item.score && item.score >= 0 &&
              <>
                <LinearGradient
                  colors={['transparent', 'black']}
                  style={styles.gradient}
                />
                <Text style={[styles.rank, {color: 'white', fontSize: 18, fontWeight: '500'}]}>{index + 1}.</Text>
                <Text style={[styles.scoreText, styles.score, {color: 'white'}]}>{score}</Text>
              </>
              }
            </Animated.View>
          </TouchableOpacity>
        </Link>
      </View>
      {popUpIndex >= 0 && <Pressable onPress={() => setPopUpIndex(-1)} style={styles.overlay}></Pressable>}
      </>
    );
});

const MakeList = ({ listID, listTypeID, onItemsUpdate, items }:
  {listID: string, listTypeID: string, onItemsUpdate: (items: UserItem[]) => void, items: UserItem[] }) => {
    const colorScheme = useColorScheme();
    const [popUpIndex, setPopUpIndex] = useState(-1);
    const topPadding = useSharedValue(0);

    useEffect(() => {
      if (popUpIndex >= 0 && popUpIndex < 3) {
        topPadding.value = withSpring((itemWidth * 1.5) * 0.2);
      } else {
        topPadding.value = withSpring(0);
      }
    }, [popUpIndex])

    useEffect(() => {
      if (items) {
        onItemsUpdate(items);
      }
    }, [items])

    const animatedStyle = useAnimatedStyle(() => {
      return {
        paddingTop: topPadding.value,
      }
    }, [topPadding.value]);

    if (items) {
      items.sort((a: UserItem, b: UserItem) => b.score - a.score);

      return (
        <View style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1,}}>
          {items.length > 0 ? 
            <Animated.FlatList
              data={items}
              renderItem={({ item, index }) => <RenderItem item={item} index={index} items={items} listID={listID} 
                popUpIndex={popUpIndex} setPopUpIndex={setPopUpIndex} />}
              keyExtractor={item => item.item_id}
              numColumns={3}
              removeClippedSubviews={true}
              showsVerticalScrollIndicator={false}
              style={animatedStyle}
            /> : (
            <Text>Rank something!</Text>
          )}
        </View>
      )
    } else {
      return (
        <Text>Loading</Text>
      )
    }
}

export default function TabOneScreen() {
    const { listTypeID, listID, description, name } = useLocalSearchParams();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isCustomList = (listID == Values.seenListID || listID == Values.bookmarkListID) ? false : true;
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currDescription, setCurrDescription] = useState("");
    const [currName, setCurrName] = useState("");
    const [searchVisible, setSearchVisible] = useState(false);
    const [filteredItems, setFilteredItems] = useState<UserItem[]>([]);
    const { items, loaded } = useUserItemsSeenSearch(listID as string, listTypeID as string);
    const [search, setSearch] = useState('');

    useEffect(() => {
      if (description) {
        setCurrDescription(description as string);
      }
      if (name) {
        setCurrName(name as string);
      }
    }, [name, description])

    const onItemsUpdate = (items: UserItem[]) => {
      setFilteredItems(items);
    }

    useEffect(() => {
      if (loaded) {
          setFilteredItems(items);
      }
    }, [items, loaded]);

    const onClose = () => {
      setEditModalVisible(false);
    }

    const onEditDetails = (newName: string, newDescription: string) => {
      setCurrName(newName);
      setCurrDescription(newDescription);
    }

    const handleSearch = (query: string) => {
      setSearch(query);
      const filtered = items.filter(item => {
        const title = 'title' in item ? item.title : item.name;
        return title.toLowerCase().includes(query.toLowerCase());
      });
      setFilteredItems(filtered);
    }

    useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: currName,
        headerRight: () => (<>
          <Pressable onPress={() => {
              setSearchVisible(!searchVisible)
            }}>
            {({ pressed }) => (
              <Ionicons
                name={searchVisible ? "close" : "search"}
                size={25}
                color={Colors[colorScheme ?? 'light'].text}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
          {listID == Values.seenListID &&
            <Link href="/reorder" asChild>
            <Pressable style={{paddingLeft: 10,}}>
              {({ pressed }) => (
                <Ionicons
                  name="repeat"
                  size={35}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          </Link>}
          {isCustomList && 
            <Pressable onPress={() => setEditModalVisible(true)} style={{paddingLeft: 10,}}>
              {({ pressed }) => (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>}
          </>
        ),
      })
    }, [navigation, listID, currName, searchVisible])

    var ItemList = useCallback(() =>  (
        <MakeList listID={listID as string} listTypeID={listTypeID as string} onItemsUpdate={onItemsUpdate} items={filteredItems}/>
    ), [currDescription, filteredItems]);
  
    return (
        <GestureHandlerRootView>
          <View style={{ backgroundColor: '#fff', flex: 1 }}>
            {currDescription != "" && <View style={[styles.description, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
              <Text>{currDescription}</Text>
            </View>}
            <EditListScreen listID={listID as string} listTypeID={listTypeID as string} name={name as string} description={description as string}
              items={items} visible={editModalVisible} onClose={onClose} onEdit={onEditDetails} />
            <AnimatedSearch searchVisible={searchVisible} search={search} handleSearch={handleSearch} />
            {loaded ? 
            <ItemList /> :
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors[colorScheme ?? 'light'].background}}>
              <ActivityIndicator size="large" />
            </View>
            }
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
    description: {
      padding: 10,
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
    scoreText: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    rank: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      backgroundColor: 'transparent'
    },
    score: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'transparent'
    },
    scoreCircle: {
      width: 50,
      height: 50,
      backgroundColor: '#fff',
      borderRadius: 50,
      borderWidth: 1,
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
      overflow: 'hidden',
      paddingRight: 5,
      width: '100%',
    },
    image: {
      width: '100%',
      aspectRatio: 1 / 1.5,
      borderWidth: 1,
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
    innerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: itemWidth,
      marginLeft: 3,
      marginBottom: 3,
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
      elevation: 5,
    },
    popUpButton: {
      borderWidth: 1,
      width: 35,
      height: 35,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      borderRadius: 50,
    }
  });