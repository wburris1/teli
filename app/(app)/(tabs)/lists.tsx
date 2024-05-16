import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View } from 'react-native';
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
    const [isSwiped, setSwiped] = useState(false);
    const score = item.score.toFixed(1);
    var date = "";

    const handleSetSwiped = (value: boolean) => {
      setSwiped(value);
    };

    if ('release_date' in item) {
      date = item.release_date;
    } else {
      date = item.first_air_date;
    }
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
      console.log(transX.value);
    })
    .onEnd(() => {
      if (transX.value > 100) { // Threshold for triggering delete
        //transX.value = withSpring(1000); // Move item out of screen
        runOnJS(handleSetSwiped)(true);
        transX.value = withSpring(100);
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
    

    return (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.itemContainer, animatedStyle]}>
                <View style={styles.rank}><View style={styles.scoreCircle}><Text style={styles.text}>#{index + 1}</Text></View></View>
                <Image
                    source={{ uri: imgUrl + item.poster_path }}
                    style={styles.image}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.itemText}>{item.title}</Text>
                  <Text style={styles.dateText}>{date}</Text>
                </View>
                
                <View style={styles.score}><View style={styles.scoreCircle}><Text style={styles.text}>{score}</Text></View></View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={Colors['light'].text}
                />
            </Animated.View>
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
    paddingHorizontal: 5,
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
  }
});