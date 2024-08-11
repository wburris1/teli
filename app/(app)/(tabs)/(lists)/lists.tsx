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
import { UserList } from '@/components/UserList';
import { List } from '@/constants/ImportTypes';
import { HorizontalListWithRows } from '@/components/ListList';

export default function TabOneScreen() {
  const colorScheme = useColorScheme();
  const { refreshFlag, refreshListFlag, movieLists, tvLists } = useData();
  const { setActiveTab } = useTab();

  var moviesTabContent = useCallback(() =>  
    <HorizontalListWithRows lists={movieLists} listTypeID={Values.movieListsID} userID='' isListTab={true} numRows={2} />
  , [refreshFlag, refreshListFlag, movieLists]);

  var showsTabContent = useCallback(() => 
    <HorizontalListWithRows lists={tvLists} listTypeID={Values.tvListsID} userID='' isListTab={true} numRows={2} />
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
            <SearchTabs tabs={searchTabs} onTabChange={index => setActiveTab(index)} index={0} />
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