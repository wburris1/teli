import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import SearchTabs from '@/components/Search/SearchTabs';
import React, { ContextType, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigation } from 'expo-router';
import { useUserListsSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { useData } from '@/contexts/dataContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import Values from '@/constants/Values';
import { AddList } from '@/components/AddList';
import { UserList } from '@/components/UserList';

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
  const colorScheme = useColorScheme();
  const numRows = 2;
  const reorderedLists = lists != null ? reorderData(lists, Values.seenListID, Values.bookmarkListID) : [];

  const numColumns = Math.ceil(reorderedLists.length / numRows);
  const chunkedData = chunkLists(reorderedLists, numColumns);
  
  const bookmarkList = lists != null ? lists.find(item => item.list_id === Values.bookmarkListID) : null;
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
            <View key={rowIndex} style={[styles.row, styles.rowSpacing]}>
              {row.map(list => (
                <UserList key={list.list_id} list={list} listTypeID={listTypeID} isListTab={true} userID='' index={0} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.listSeparator, { borderColor: Colors[colorScheme ?? 'light'].text}]}>
          <Text style={styles.separatorText}>Unwatched</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{flexDirection: 'column'}}>
          {chunkedUnwatched.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(list => (
                <UserList key={list.list_id} list={list} listTypeID={listTypeID} isListTab={true} userID='' index={0} />
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
  const colorScheme = useColorScheme();
  const { refreshFlag, refreshListFlag } = useData();
  const { setActiveTab } = useTab();

  var moviesTabContent = useCallback(() =>  
    <MovieTabContent />
  , [refreshFlag, refreshListFlag]);
  var showsTabContent = useCallback(() => 
    <TVTabContent />
  , [refreshFlag, refreshListFlag]);

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
        <View style={{ backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1, }}>
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
  rowSpacing: {
    marginBottom: 20,
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
  },
  separatorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});