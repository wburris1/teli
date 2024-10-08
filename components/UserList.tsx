import { ActivityIndicator, Animated, Easing, Image, Modal, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed"
import Colors from "@/constants/Colors";
import {  Link, router, useNavigation } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import Dimensions from "@/constants/Dimensions";
import { List, UserItem } from "@/constants/ImportTypes";
import { DefaultPost } from "./LogoView";
import { useData } from "@/contexts/dataContext";
import { useEffect, useRef, useState } from "react";
import { ListModalScreen } from "./ListModal";
import { editListItems, editUnwatchedItems } from "@/data/editListItems";
import Values from "@/constants/Values";
import { AddUnwatchedScreen } from "./AddUnwatched";
import { useLoading } from "@/contexts/loading";

const imgUrl = 'https://image.tmdb.org/t/p/w200';
const itemWidth = (Dimensions.screenWidth / 3) - 20;
const screenWidth = Dimensions.screenWidth;


const OverlappingImages = ({ images, list, posterNames }: { images: string[], list: List, posterNames: string[] }) => {
    const colorScheme = useColorScheme();
  
    return (
      <View style={styles.imageContainer}>
        {images.map((image, index) => (
          !image.endsWith('null') ? 
            (<Image key={index} source={{ uri: image }}
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
  const { movies, shows, storedListPosters } = useData();
  const editItemsFunc = editListItems();
  const { setLoading } = useLoading();
  const editItemsFuncUnseen = editUnwatchedItems();

  const posters = [
    storedListPosters[list.top_poster_path] ? storedListPosters[list.top_poster_path] : (list.top_poster_path ? imgUrl + list.top_poster_path : "/"),
    storedListPosters[list.second_poster_path] ? storedListPosters[list.second_poster_path] : (list.second_poster_path ? imgUrl + list.second_poster_path : "/"),
    storedListPosters[list.bottom_poster_path] ? storedListPosters[list.bottom_poster_path]: (list.bottom_poster_path ? imgUrl + list.bottom_poster_path : "/"),
  ];
  const posterNames = [list.top_item_name, list.second_item_name, list.bottom_item_name];
  const isEmpty = posters[0] == "/";
  const [addModalVisible, setAddModalVisible] = useState(false);
  const listName = list.name;

  const AnimatedPlaceholder = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
  
    // Pulsating animation
    useEffect(() => {
      const animatePulse = Animated.sequence([
        // Step 1: Grow large (2 times the size)
        Animated.timing(pulseAnim, {
          toValue: 2,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        // Step 2: Shrink to medium size (1.5 times the size)
        Animated.timing(pulseAnim, {
          toValue: 1.5, // Medium size
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]);
      // Start animation
      const animation = Animated.loop(animatePulse, { iterations: 1 }); // Run only once
      animation.start();
  
      // Stop the animation after 3 seconds (it finishes with a medium size)
      const timer = setTimeout(() => {
        animation.stop(); // Stop the animation
      }, 3000);
      // Cleanup the timer if the component unmounts
      return () => clearTimeout(timer);
    }, [pulseAnim]);

    return (
      <View style={styles.emptyList}>
        <Animated.View style={[styles.plusIcon, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="add-circle-outline" size={50} color={Colors['theme']} />
        </Animated.View>
        <Text style={styles.addText}>Start your list!</Text>
      </View>
    )
  }

  const handleAddRemove = (addItems: UserItem[], removedItems: UserItem[]) => {
    setLoading(true);
    editItemsFunc(addItems, removedItems, list.list_id, listTypeID).then(() => {
        setLoading(false);
        setAddModalVisible(false);
    })
  }
  const handleAddRemoveUnseen = (addItems: Item[], removedItems: Item[]) => {
    setLoading(true);
    editItemsFuncUnseen(addItems, removedItems, list.list_id, listTypeID).then(() => {
      setLoading(false);
      setAddModalVisible(false);
    })
  }

  return (
    <>
      <ListModalScreen
        listTypeID={listTypeID}
        visible={addModalVisible && list.is_ranked}
        containedItems={[]} 
        onClose={() => {
          setAddModalVisible(false);
        }} 
        onSelectedItemsChange={handleAddRemove}
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible && !list.is_ranked}
        onRequestClose={() => setAddModalVisible(false)}>
        <AddUnwatchedScreen 
          listID={list.list_id} 
          listTypeID={listTypeID}
          onClose={() => setAddModalVisible(false)} 
          onSave={(addItems, removeItems) => {
            handleAddRemoveUnseen(addItems, removeItems);
          }}
          />
      </Modal>
  
      <TouchableOpacity
        style={[styles.itemContainer, {zIndex: 3, height: (itemWidth - 20) * (3 / 2) + 45, marginTop: 5, }, ]}
        onPress={() => {
          if (isEmpty) {
            if (list.is_ranked && movies && movies.filter(movie => movie.lists.includes(Values.seenListID)).length === 0 && listTypeID == Values.movieListsID) {
              router.push({
                pathname: '/search',
                params: { initialIndex: 0, triggerNumber: Math.random(),},
              });
            } else if (list.is_ranked && shows && shows.filter(shows => shows.lists.includes(Values.seenListID)).length === 0 && listTypeID == Values.tvListsID) {
              router.push({
                pathname: '/search',
                params: { initialIndex: 1, triggerNumber: Math.random(),},
              });
            } else {
              setAddModalVisible(true);
            }            
          } else {
            // Redirect to list_page when the list is not empty
            router.push({pathname: '/list_page', params: {
              listTypeID: listTypeID,
              listID: list.list_id,
              description: list.description,
              name: list.name,
              userID: userID,
              isRanked: list.is_ranked ? 'true' : 'false',
              isEmpty: isEmpty ? 'true' : 'false',
              }
            });
          }
        }}
      >
        {isEmpty ? <AnimatedPlaceholder/> : <OverlappingImages images={posters} list={list} posterNames={posterNames} />}
        <Text numberOfLines={2} style={!isEmpty ? styles.title : styles.emptyListTitle}>{listName}</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
    itemContainer: {
        alignItems: 'center',
        height: (itemWidth - 20) * (3/2) + 45,
        width: itemWidth,
        marginLeft: 15,
        marginTop: 5,
      },
      spinnerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 1,
    },
      plusIcon: {
        position: 'absolute',
        alignSelf: 'center',
        top: '25%',
      },
      addText2: {
        marginTop: '60%', // Position the text below the plus sign
        fontSize: 16,
        color: '#aaa',
      },
      addText: {
        position: 'absolute',
        alignSelf: 'center',
        top: '70%',
        fontSize: 14,
        color: Colors['theme'],
        fontWeight: '500'
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