import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import SearchTabs from '@/components/Search/SearchTabs';
import React, { ContextType, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { useData } from '@/contexts/dataContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import Values from '@/constants/Values';
import { AddList } from '@/components/AddList';
import { List } from '@/constants/ImportTypes';
import { HorizontalListWithRows } from '@/components/ListList';
import { Timestamp } from 'firebase/firestore';

export default function TabOneScreen() {
  const colorScheme = useColorScheme();
  const { refreshFlag, refreshListFlag, movieLists, tvLists } = useData();
  const { setActiveTab } = useTab();

  var moviesTabContent = useCallback(() => {
    movieLists.sort((a, b) => {
      const dateA = (a.last_modified instanceof Date) ? a.last_modified as Date : (a.last_modified as Timestamp | undefined)?.toDate();
      const dateB = (b.last_modified instanceof Date) ? b.last_modified as Date : (b.last_modified as Timestamp | undefined)?.toDate();
      // Handle cases where dateA or dateB might be undefined
      if (!dateA) return 1; // If dateA is undefined, consider it "less than" dateB
      if (!dateB) return -1; // If dateB is undefined, consider it "greater than" dateA

      return dateB.getTime() - dateA.getTime(); // Sort in descending order (most recent first)
    }); 
   return <HorizontalListWithRows lists={movieLists} listTypeID={Values.movieListsID} userID='' isListTab={true} numRows={2} redirectLink='' />
  }, [refreshFlag, refreshListFlag, movieLists]); // array used to be [refreshFlag, refreshListFlag, movieLists]

  var showsTabContent = useCallback(() => {
    tvLists.sort((a, b) => {
      const dateA = (a.last_modified instanceof Date) ? a.last_modified as Date : (a.last_modified as Timestamp | undefined)?.toDate();
      const dateB = (b.last_modified instanceof Date) ? b.last_modified as Date : (b.last_modified as Timestamp | undefined)?.toDate();
      // Handle cases where dateA or dateB might be undefined
      if (!dateA) return 1; // If dateA is undefined, consider it "less than" dateB
      if (!dateB) return -1; // If dateB is undefined, consider it "greater than" dateA

      return dateB.getTime() - dateA.getTime(); // Sort in descending order (most recent first)
    }); 
    return <HorizontalListWithRows lists={tvLists} listTypeID={Values.tvListsID} userID='' isListTab={true} numRows={2} redirectLink='' />
  }
  , [refreshFlag, refreshListFlag, tvLists]);

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
            <SearchTabs browse={false} tabs={searchTabs} onTabChange={index => setActiveTab(index)} index={0} />
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