import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Text } from '@/components/Themed';
import React, { ContextType, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withClamp, withSpring, withTiming } from 'react-native-reanimated';
import Values from '@/constants/Values';
import { useTab } from '@/contexts/listContext';
import { removeFromList, useUserItemDelete } from '@/data/deleteItem';
import { EditListScreen } from '@/components/EditList';
import SearchInput from '@/components/Search/SearchInput';
import { AnimatedSearch } from '@/components/AnimatedSearch';
import { UserItem } from '@/constants/ImportTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { useData } from '@/contexts/dataContext';
import  AddToListsScreen  from '@/components/AddToListsModal';

type RowProps = {
    item: UserItem;
    index: number;
    items: UserItem[];
    listID: string;
    popUpIndex: number;
    setPopUpIndex: (index: number) => void;
    selectionMode: boolean;
    selectedItems: UserItem[];
    setselectedItems: (lists: UserItem[]) => void;
};

const imgUrl = 'https://image.tmdb.org/t/p/w342';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;
const itemWidth = (screenWidth - 12) / 3;

const RenderItem = forwardRef<View, RowProps>(({ item, index, items, listID, popUpIndex, setPopUpIndex, selectionMode, selectedItems, setselectedItems}, ref) => {
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
    const deleteItem = useUserItemDelete();
    const removeItem = removeFromList();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);
    const transY = useSharedValue(0);
    const transX = useSharedValue(0);

    const onDelete = (item_id: string) => {
      const alertHeaderText = !isAll ? "Confirm Remove" : "Confirm Delete";
      const alertText = !isAll ? "Are you sure you want to remove this item from the list?" : 
        "Deleting this item will remove it from all your lists. Are you sure you want to delete this item?";
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
                deleteItem(items.filter(filterItem => filterItem.item_id !== item.item_id), item.post_id ,item.item_id, item.score, Values.seenListID, listTypeID);
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
      opacity.value = withSpring(1);
    }

    const handleClose = () => {
      transY.value = withSpring(0);
      transX.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(0);
    }

    const animatedOpacity = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      }
    }, [opacity.value])

    const toggleSelect = () => {
      if (!selectionMode) {
        return;
      }
      if (selectedItems.includes(item)) {
        setselectedItems(selectedItems.filter(filterItem => filterItem.item_id !== item.item_id));

      } else {
          setselectedItems([...selectedItems, item]);

        }
    };

    const ConditionalLink = ({
      condition,
      children,
      href,
    }: {
      condition: boolean;
      children: React.ReactNode;
      href: any;
    }) => {
      return condition ? <>{children}</> : <Link href={href} asChild>{children}</Link>;
    };
  
    return (
      <>
      <View style={{zIndex: popUpIndex === index ? 2 : 0}}>
      <ConditionalLink
        condition={selectionMode}
        href={{ pathname: "/list_item", params: { id: item.item_id, groupKey: isMovie ? "movie" : "tv" } }}
      >
          <TouchableOpacity onPress={toggleSelect} onLongPress={handleLongPress} activeOpacity={selectionMode ? 1.0: .5}>
            <Animated.View style={[styles.innerContainer, animatedStyle, popUpIndex === index ? styles.shadow : {}]}>
              <Image
                  source={item.poster_path ? { uri: imgUrl + item.poster_path } :
                  require('../../../../assets/images/poster-placeholder.png')}
                  style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text }]}
              />
               {selectionMode && (
              <TouchableOpacity onPress={toggleSelect} style={styles.checkbox}>
                <Ionicons
                  name={selectedItems.includes(item) ? "checkmark-circle" : "ellipse-outline"}
                  size={30}
                  color=  "white" //{Colors['light'].text}
                />
              </TouchableOpacity>
            )}
              {popUpIndex === index && (
                <Animated.View style={[animatedOpacity, {position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', top: 0, width: '100%'}]}>
                  <TouchableOpacity style={styles.popUpButton} onPress={() => onDelete(item.item_id)}>
                    <Ionicons name={listID == Values.seenListID ? "trash" : "close"} size={25} color={'white'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.popUpButton} onPress={() => {
                    setItem(item);
                    router.push({pathname: "/add_to_list", params: { item_id: item.item_id, item_name: item.item_name, listTypeID: listTypeID, isWatched: item.lists.includes(Values.seenListID) ? 'true' : 'false' }});
                  }}>
                    <Ionicons name="add" size={28} color={'white'} />
                  </TouchableOpacity>
                  <LinearGradient
                    colors={['black', 'transparent']}
                    style={{position: 'absolute', top: 1,
                      left: 1,
                      right: 1,
                      height: 100,
                      borderTopLeftRadius: 10,
                      borderTopRightRadius: 10,}}
                  />
                </Animated.View>
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
        </ConditionalLink>
      </View>
      {popUpIndex >= 0 && <Pressable onPress={() => setPopUpIndex(-1)} style={styles.overlay}></Pressable>}
      </>
    );
});

const MakeList = ({ listID, listTypeID, onItemsUpdate, items, selectionMode, selectedItems, setselectedItems }:
  {listID: string, listTypeID: string, onItemsUpdate: (items: UserItem[]) => void, items: UserItem[], selectionMode: boolean,
  selectedItems: UserItem[], setselectedItems: (lists: UserItem[]) => void }) => {
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
      return (
        <View style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1}}>
          {items.length > 0 ?
              <Animated.FlatList
                data={items}
                renderItem={({ item, index }) => <RenderItem item={item} index={index} items={items} listID={listID} 
                selectionMode={selectionMode} selectedItems={selectedItems} setselectedItems={setselectedItems}
                  popUpIndex={popUpIndex} setPopUpIndex={setPopUpIndex} />}
                keyExtractor={item => item.item_id}
                numColumns={3}
                removeClippedSubviews={true}
                showsVerticalScrollIndicator={false}
                style={[animatedStyle, {flex: 1}]}
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
  const { listTypeID, listID, description, name, isRanked } = useLocalSearchParams();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isCustomList = (listID == Values.seenListID || listID == Values.bookmarkListID) ? false : true;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currDescription, setCurrDescription] = useState("");
  const [currName, setCurrName] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [filteredItems, setFilteredItems] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const { movies, shows } = useData();
  const [items, setItems] = useState<UserItem[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setselectedItems] = useState<UserItem[]>([]);
  const isAll = listID == Values.seenListID ? true : false;
  const [listsModalVisible, setListsModalVisible] = useState(false);
  const deleteItem = useUserItemDelete();
  const removeItem = removeFromList();
  useEffect(() => {
    if (description) {
      setCurrDescription(description as string);
    }
    if (name) {
      setCurrName(name as string);
    }
  }, [name, description]);

  const onItemsUpdate = (newItems: UserItem[]) => {
    setFilteredItems(newItems);
  };

  const filterByList = (toFilter: UserItem[]) => {
    return toFilter.filter(item => item.lists.includes(listID as string));
  };

  useEffect(() => {
    if (movies && listTypeID == Values.movieListsID) {
      const filtered = filterByList(movies);
      setItems(filtered);
      setFilteredItems(filtered);
    } else if (shows && listTypeID == Values.tvListsID) {
      const filtered = filterByList(shows);
      setItems(filtered);
      setFilteredItems(filtered);
    }
  }, [movies, shows]);

  const onClose = () => {
    setEditModalVisible(false);
  };

  const onEditDetails = (newName: string, newDescription: string) => {
    setCurrName(newName);
    setCurrDescription(newDescription);
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    const filtered = items.filter(item => {
      const title = 'title' in item ? item.title : item.name;
      return title.toLowerCase().includes(query.toLowerCase());
    });
    setFilteredItems(filtered);
  };
const handleClose = () => {
  handleSelectionMode();
  setListsModalVisible(false);
}
  const listsModal = useCallback(() => (
   
    <Modal
      animationType="slide"
      transparent={true}
      visible={listsModalVisible}
      onRequestClose={() => setListsModalVisible(false)}
    >
      <AddToListsScreen 
        item_id={""}
        item_name={""}
        listTypeID={listTypeID as string}
        onClose={() => handleClose()}
        isRanking={false}
        isWatched={isRanked as string == 'true'}
        onSelectedListsChange={() => {}}
        newItem={null}
        items={selectedItems}
      />
    </Modal>
  ), [listsModalVisible, selectedItems, setselectedItems]);

  const onSelectionDelete = () => {
    const alertHeaderText = !isAll ? "Confirm Remove" : "Confirm Delete";
    const pluralText = selectedItems.length > 1 ? "these items" : "this item";
    const alertText = !isAll ? "Are you sure you want to remove " + pluralText + " from the list?" : 
      "Deleting " + pluralText + " will remove it from all your lists. Are you sure you want to delete " + pluralText + "?";
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
          onPress: async () => {
            try {
              if (isAll) {
                const newList = filteredItems.filter(
                  filteredItem => !selectedItems.some(
                    selectedItem => selectedItem.item_id === filteredItem.item_id
                  )
                );
                await Promise.all(selectedItems.map(async (item) => {
                  await deleteItem(newList.filter(filterItem => filterItem.item_id !== item.item_id), item.post_id, item.item_id, item.score, Values.seenListID, listTypeID as string);
                }));
              } else {
                await Promise.all(selectedItems.map(async (item) => {
                  await removeItem(listID as string, listTypeID as string, item.item_id);
                })); 
              }
              setselectedItems([]); 
              setSelectionMode(false);
            } catch (error) {
              console.error("Error deleting/removing items:", error);
            }
          }
        }
      ]
    );
  };

  const handleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setselectedItems([]);
    } else {
      setSelectionMode(true);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: currName,
      headerRight: () => (
        <>
          <Pressable onPress={() => { setSearchVisible(!searchVisible); }}>
            {({ pressed }) => (
              <Ionicons
                name={searchVisible ? "close" : "search"}
                size={25}
                color={Colors[colorScheme ?? 'light'].text}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
          <Pressable onPress={handleSelectionMode} style={{ paddingLeft: 10 }}>
            {({ pressed }) => (
              <Ionicons
                name="menu"
                size={25}
                color={Colors[colorScheme ?? 'light'].text}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
          {listID == Values.seenListID && (
            <Link href="/reorder" asChild>
              <Pressable style={{ paddingLeft: 10 }}>
                {({ pressed }) => (
                  <Ionicons
                    name="repeat"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          )}
          {isCustomList && (
            <Pressable onPress={() => setEditModalVisible(true)} style={{ paddingLeft: 10 }}>
              {({ pressed }) => (
                <Ionicons
                  name="ellipsis-horizontal"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          )}
        </>
      ),
    });
  }, [navigation, listID, selectionMode, currName, searchVisible, selectedItems]);

  var ItemList = useCallback(() => (
    <MakeList listID={listID as string} listTypeID={listTypeID as string} onItemsUpdate={onItemsUpdate} items={filteredItems} 
      selectionMode={selectionMode} selectedItems={selectedItems} setselectedItems={setselectedItems} />
  ), [currDescription, filteredItems, selectionMode, selectedItems]);

  const slideAnim = useSharedValue(200); 

  useEffect(() => {
    if (selectedItems.length > 0) {
      // Trigger animation when selectedItems length is greater than 0
      slideAnim.value = withTiming(0, { duration: 250 });
    } else {
      // Reset animation if selectedItems length becomes 0
      slideAnim.value = withTiming(200, { duration: 250 });
    }
  }, [selectedItems.length]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: slideAnim.value }],
    };
  });
  return (
    <GestureHandlerRootView>
      <View style={{ backgroundColor: '#fff', flex: 1 }}>
        {currDescription != "" && (
          <View style={[styles.description, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
            <Text>{currDescription}</Text>
          </View>
        )}
        <EditListScreen listID={listID as string} listTypeID={listTypeID as string} name={name as string} description={description as string}
          items={items} visible={editModalVisible} onClose={onClose} onEdit={onEditDetails} isRanked={isRanked as string == 'true'} />
        <AnimatedSearch searchVisible={searchVisible} search={search} handleSearch={handleSearch} />
        {((listTypeID == Values.movieListsID && movies) || (listTypeID == Values.tvListsID && shows)) ? 
          <ItemList /> : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
              <ActivityIndicator size="large" />
            </View>
        )}
      </View>
      {listsModal()}
      {selectionMode && selectedItems.length > 0 && (
        <Animated.View style={[styles.fabContainer, animatedStyle]}>
           <TouchableOpacity
            style={styles.fabAdd}
            onPress={() => setListsModalVisible(true)}
          >
            <Ionicons name="add" 
            size={45}
            color={"white"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: 'black' }]}
            onPress={onSelectionDelete}
          >
            <Ionicons name="trash" 
            size={30}
            color={"white"} />
          </TouchableOpacity>
        </Animated.View>
      )}
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
    image: {
      //height: 209,
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
      bottom: 1,
      left: 1,
      right: 1,
      height: 100,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: -screenHeight,
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
      marginHorizontal: 7,
      marginTop: 10,
      zIndex: 1,
    },
    checkbox: {
      position: 'absolute',
      top: 10,
      left: 10,
      zIndex: 1,
    },
    fabContainer: {
      position: 'absolute',
      bottom: 30,
      right: 20,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      backgroundColor: '#32CD32',
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
    },
    fabAdd: {
      backgroundColor: 'black',
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 2,
    },
    fabIcon: {
      color: 'white',
      fontSize: 30,
    },
  });