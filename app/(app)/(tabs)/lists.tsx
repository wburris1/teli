import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import SearchTabs from '@/components/Search/SearchTabs';
import React, { ContextType, forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import ListTab from '@/components/ListTab';
import { Link } from 'expo-router';
import { useUserItemsSeenSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { useData } from '@/contexts/dataContext';
import { Gesture, GestureDetector, GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, Swipeable } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { arrayUnion, collection, doc, getDoc, getDocs, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';

type Props = {
    seen: React.ReactNode;
    want: React.ReactNode;
    recs: React.ReactNode;
};

type RowProps = {
  item: UserItem;
  index: number;
  //onDelete: (item: UserItem) => void;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const DELETE_WIDTH = 100;
const db = FIREBASE_DB;

const ListTabs = ({seen, want, recs}: Props) => {
    return (
        <>
            <ListTab title="Seen" children={seen} />
            <ListTab title="Want To See" children={want} />
            <ListTab title="Recommendations" children={recs}  />
        </>
    );
}

const RenderItem = forwardRef<View, RowProps>(({ item, index }, ref) => {
    const { requestRefresh } = useData();
    const { user } = useAuth();
    const [isSwiped, setSwiped] = useState(false);
    const score = item.score.toFixed(1);
    var date = "";

    const handleSetSwiped = (value: boolean) => {
      setSwiped(value);
    };

    date = 'release_date' in item ? item.release_date : item.first_air_date;
    date = date.slice(0,4);

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
      if (transX.value > DELETE_WIDTH) { // Threshold for triggering delete
        //transX.value = withSpring(1000); // Move item out of screen
        runOnJS(handleSetSwiped)(true);
        transX.value = withSpring(DELETE_WIDTH);
        //setTimeout(() => onDelete(item.id), 500); // Delay deletion for the animation
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

    const deleteItem = async (item_id: string, collection_name: string): Promise<void> => {
      if (user) {
        const collRef = collection(db, "users", user.uid, collection_name);
        const itemQuery = query(collRef,
          where("item_id", "==", item_id)
        );
        const snapshot = await getDocs(itemQuery);
        
        try {
          const snapshot = await getDocs(itemQuery);
          const batch = writeBatch(db);

          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();
          console.log("Item successfully deleted: ", item_id);
        } catch (error) {
          console.error("Error removing document: ", error);
        }
      }
    };
    
    const onDelete = (item_id: string, isMovie: boolean) => {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this item?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            onPress: () => {
              console.log("Delete Pressed, deleting item with ID:", item_id);
              deleteItem(item_id, isMovie ? "movies" : "shows").then(() => {
                requestRefresh();
              });
            }
          }
        ]
      );
    };

    return (
          <GestureDetector gesture={panGesture}>
            <View>
            <Animated.View style={[styles.deleteButtonContainer, deleteButtonStyle]}>
              <TouchableOpacity style={styles.fullSize} onPress={() => onDelete(item.item_id, 'title' in item ? true : false)}>
                <Ionicons
                  name="trash"
                  size={40}
                  color={'#fff'}
                />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={[styles.itemContainer, animatedStyle]}>
                <View style={styles.rank}><View style={styles.scoreCircle}><Text style={styles.text}>#{index + 1}</Text></View></View>
                <Image
                    source={{ uri: imgUrl + item.poster_path }}
                    style={styles.image}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.itemText}>{'title' in item ? item.title : item.name}</Text>
                  <Text style={styles.dateText}>{date}</Text>
                </View>
                
                <View style={styles.score}><View style={styles.scoreCircle}><Text style={styles.text}>{score}</Text></View></View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={Colors['light'].text}
                />
            </Animated.View>
            </View>
          </GestureDetector>
    );
});

const makeList = (items: UserItem[]) => {
    return (
        <FlatList
            data={items}
            renderItem={({ item, index }) => <RenderItem item={item} index={index} />}
            keyExtractor={item => item.item_id}
            numColumns={1}
        />
    )
}

const MoviesTabContent = () => {
    const { refreshFlag } = useData();
    const items = useUserItemsSeenSearch(true, refreshFlag);
    items.sort((a: UserItem, b: UserItem) => b.score - a.score);
    const seen = makeList(items);
    const want = makeList(items);
    const recs = <Text>Empty</Text>;
    return <ListTabs seen={seen} want={want} recs={recs}/>;
};

const ShowsTabContent = () => {
  const { refreshFlag } = useData();
  const items = useUserItemsSeenSearch(false, refreshFlag);
  items.sort((a: UserItem, b: UserItem) => b.score - a.score);
  const seen = makeList(items);
  const want = makeList(items);
  const recs = <Text>Empty</Text>;
  return <ListTabs seen={seen} want={want} recs={recs}/>;
};

export default function TabOneScreen() {
    const { refreshFlag } = useData();

    var moviesTabContent = useCallback(() => 
        <MoviesTabContent />, [refreshFlag]);
    var showsTabContent = useCallback(() => 
        <ShowsTabContent />, [refreshFlag]);

    const searchTabs = [
        {
            title: 'Movies',
            content: moviesTabContent
        },
        {
            title: 'Shows',
            content: showsTabContent
        }
    ];

    return (
      <GestureHandlerRootView>
        <View style={{ backgroundColor: '#fff', flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <SearchTabs tabs={searchTabs} />
            </SafeAreaView>
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
    //position: 'absolute',
    //left: 10,
    //top: 5,
    paddingHorizontal: 10,
    backgroundColor: 'transparent'
  },
  score: {
    //position: 'absolute',
    //right: 10,
    //top: 5,
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
    width: screenWidth,
    backgroundColor: 'red',
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
});