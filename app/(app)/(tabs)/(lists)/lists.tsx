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
import { AddList } from '@/components/AddList';

type Props = {
  seen: React.ReactNode;
  want: React.ReactNode;
  recs: React.ReactNode;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';

const RenderListItem = ({ list, listTypeID }: { list: List, listTypeID: string }) => {
  const posters = [
    list.top_poster_path != "" ? imgUrl + list.top_poster_path : "/",
    list.second_poster_path != "" ? imgUrl + list.second_poster_path : "/",
    list.bottom_poster_path != "" ? imgUrl + list.bottom_poster_path : "/"
  ];
  const isEmpty = posters[0] == "/";
  const listName = list.list_id == Values.seenListID ? "All " + (listTypeID == Values.movieListsID ? "Movies" : "Shows") : list.list_id;

  return (
    <Link
      href={{pathname: "/list_page", params: { listTypeID: listTypeID, listID: list.list_id }}}
      style={styles.itemContainer}
    >
      <View>
        {isEmpty ? 
        <View style={styles.emptyList}>
          <Link href="/search" asChild>
          <TouchableOpacity>
            <Ionicons
              name="add-circle-outline"
              size={70}
              color={Colors['light'].text}
            />
          </TouchableOpacity>
          </Link>
        </View> : 
        <OverlappingImages images={posters} />}
        <Text style={!isEmpty ? styles.title : styles.emptyListTitle}>{listName}</Text>
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
          style={[styles.image,
            { left: index * -90, top: index * 10, zIndex: images.length - index,
              opacity: image == "/" ? 0 : 100,
             }]}
        />
      ))}
    </View>
  );
};

const reorderData = (data: List[], firstId: string, secondId: string) => {
  const firstItem = data.find(item => item.list_id === firstId);
  const restItems = data.filter(item => item.list_id !== firstId && item.list_id !== secondId);
  if (!firstItem) {
    return data;
  }
  return [firstItem, ...restItems];
};

const chunkLists = (lists: List[], size: number) => {
  var result: (List[])[] = [];
  if (lists.length <= 3) {
    result = [lists];
    return result;
  } else if (lists.length == 4) {
    result.push(lists.slice(0, 3));
    result.push(lists.slice(3, 4));
    return result;
  }
  for (let i = 0; i < lists.length; i += size) {
    result.push(lists.slice(i, i + size));
  }
  return result;
};

const HorizontalListWithRows = ({lists, listTypeID}: {lists: List[], listTypeID: string}) => {
  const numRows = 2;
  const reorderedLists = reorderData(lists, Values.seenListID, Values.bookmarkListID);

  const numColumns = Math.ceil(reorderedLists.length / numRows);
  const chunkedData = chunkLists(reorderedLists, numColumns);
  
  const bookmarkList = lists.find(item => item.list_id === Values.bookmarkListID);
  var unwatchedLists: List[] = [];
  if (bookmarkList) {
    unwatchedLists = [bookmarkList];
  }
  const chunkedUnwatched = chunkLists(unwatchedLists, numColumns);

  return (
    <ScrollView style={styles.listsContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.topSeparator}>
          <Text style={styles.separatorText}>Watched</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{flexDirection: 'column'}}>
          {chunkedData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(list => (
                <RenderListItem key={list.list_id} list={list} listTypeID={listTypeID} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.listSeparator}>
          <Text style={styles.separatorText}>Unwatched</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{flexDirection: 'column'}}>
          {chunkedUnwatched.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(list => (
                <RenderListItem key={list.list_id} list={list} listTypeID={listTypeID} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const MovieTabContent = () => {
  const { lists, loaded } = useUserListsSearch(Values.movieListsID);
  return <HorizontalListWithRows lists={lists} listTypeID={Values.movieListsID} />
};

const TVTabContent = () => {
  const { lists, loaded } = useUserListsSearch(Values.tvListsID);
  return <HorizontalListWithRows lists={lists} listTypeID={Values.tvListsID} />
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
        <View style={{ backgroundColor: '#fff', flex: 1, }}>
          <SafeAreaView style={styles.container}>
            <AddList />
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
  listsContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  itemContainer: {
    alignItems: 'center',
    height: 200,
    marginLeft: 15,
    marginTop: 5,
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
    fontWeight: '600',
    textAlign: 'left',
    width: 120,
    paddingTop: 3,
  },
  emptyList: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 170,
    width: 120,
    borderWidth: 1,
    borderRadius: 15,
    marginTop: 10,
    backgroundColor: '#d3d3d3',
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
    width: 120,
    paddingTop: 3,
  },
  topSeparator: {
    flex: 1,
    width: Dimensions.screenWidth,
    padding: 10,
  },
  listSeparator: {
    flex: 1,
    width: Dimensions.screenWidth,
    marginTop: 10,
    padding: 10,
    borderTopWidth: 3,
    borderColor: 'black',
  },
  separatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});