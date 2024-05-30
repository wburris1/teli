import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import SearchTabs from '@/components/Search/SearchTabs';
import React, { ContextType, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ListTab from '@/components/ListTab';
import { Link, useNavigation } from 'expo-router';
import { useUserItemDelete, useUserItemsSeenSearch, useUserListsSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { useData } from '@/contexts/dataContext';
import { Gesture, GestureDetector, GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, Swipeable } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTab } from '@/contexts/listContext';
import Values from '@/constants/Values';

type Props = {
  seen: React.ReactNode;
  want: React.ReactNode;
  recs: React.ReactNode;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';

const ListTabs = ({seen, want, recs}: Props) => {
  return (
    <>
      <ListTab title="Seen" children={seen} />
      <ListTab title="Want To See" children={want} />
      <ListTab title="Recommendations" children={recs}  />
    </>
  );
}

const RenderListItem = ({ list, listTypeID }: { list: List, listTypeID: string }) => {
  const posters = [
    list.top_poster_path != "" ? imgUrl + list.top_poster_path : "/",
    list.second_poster_path != "" ? imgUrl + list.second_poster_path : "/",
    list.bottom_poster_path != "" ? imgUrl + list.bottom_poster_path : "/"
  ];
  return (
    <Link
      key={list.list_id}
      href={{pathname: "/list_page", params: { listTypeID: listTypeID, listID: list.list_id }}}
      style={styles.itemContainer}
    >
      <View>
        <OverlappingImages images={posters} />
        <Text style={styles.title}>{list.list_id}</Text>
      </View>
    </Link>
  )
}

const OverlappingImages = ({ images }: { images: string[] }) => {
  return (
    <View style={styles.imageContainer}>
      {images.map((image, index) => (
        <Image
          key={index}
          source={{ uri: image }}
          style={[styles.image, { left: index * -90, top: index * 10, zIndex: images.length - index }]}
        />
      ))}
    </View>
  );
};

const reorderData = (data: List[], firstId: string, secondId: string) => {
  const firstItem = data.find(item => item.list_id === firstId);
  const secondItem = data.find(item => item.list_id === secondId);
  const restItems = data.filter(item => item.list_id !== firstId && item.list_id !== secondId);
  if (!firstItem || !secondItem) {
    return data;
  }
  return [firstItem, secondItem, ...restItems];
};

const makeList = (lists: List[], listTypeID: string) => {
  if (lists) {
    return (
      <>
        {lists.length > 0 ? 
        <FlatList
          data={lists}
          renderItem={({ item }) => <RenderListItem list={item} listTypeID={listTypeID} />}
          keyExtractor={list => list.list_id}
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

const chunkLists = (lists: List[], size: number) => {
  const result = [];
  for (let i = 0; i < lists.length; i += size) {
    result.push(lists.slice(i, i + size));
  }
  return result;
};

const HorizontalListWithRows = ({lists, listTypeID}: {lists: List[], listTypeID: string}) => {
  const numRows = 3;
  const reorderedLists = reorderData(lists, Values.seenListID, Values.bookmarkListID);

  const numColumns = Math.ceil(reorderedLists.length / numRows);
  const chunkedData = chunkLists(reorderedLists, numColumns);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {chunkedData.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map(list => (
            <RenderListItem list={list} listTypeID={listTypeID} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const MovieTabContent = () => {
  const { lists, loaded } = useUserListsSearch(Values.movieListsID);
  //const seen = makeList(lists, Values.movieListsID);
  //const want = makeList(lists, Values.movieListsID);
  //const recs = makeList([], Values.movieListsID);
  //return <ListTabs seen={seen} want={want} recs={recs}/>;
  return <HorizontalListWithRows lists={lists} listTypeID={Values.movieListsID} />
};

const TVTabContent = () => {
  const { lists, loaded } = useUserListsSearch(Values.tvListsID);
  const seen = makeList(lists, Values.tvListsID);
  const want = makeList(lists, Values.tvListsID);
  const recs = makeList([], Values.tvListsID);
  return <ListTabs seen={seen} want={want} recs={recs}/>;
};

export default function TabOneScreen() {
  const { refreshFlag } = useData();
  const { setActiveTab } = useTab();

  var moviesTabContent = useCallback(() =>  
    <MovieTabContent />
  , [refreshFlag]);
  var showsTabContent = useCallback(() => 
    <TVTabContent />
  , [refreshFlag]);

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
            <SearchTabs tabs={searchTabs} onTabChange={index => setActiveTab(index)} />
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
  row: {
    flexDirection: 'row',
    padding: 10,
  },
  itemContainer: {
    alignItems: 'center',
    height: 200,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 100 * (3/2) + 20,
    width: 120
  },
  image: {
    width: 100,
    aspectRatio: 2/3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'black',
    backgroundColor: 'gray',
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    width: 120,
    paddingTop: 3,
  },
});