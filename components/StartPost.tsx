import { Image, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import Colors from '@/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { AnimatedSearch } from '@/components/AnimatedSearch';
import SearchTabs from '@/components/Search/SearchTabs';
import { SearchCategories } from '@/components/SearchCategories';
import Values from '@/constants/Values';
import { NewPostSearchLists } from '@/components/PostSearchList';
import { MakePost } from '@/data/userPosts';
import { useData } from '@/contexts/dataContext';
import Toast from 'react-native-toast-message';
import { Text, View } from './Themed';

export const StartPostScreen = ({searchVisible, setSearchVisible}:
    {searchVisible: boolean, setSearchVisible: (vis: boolean) => void}) => {
    const colorScheme = useColorScheme();
    const [search, setSearch] = useState('');
    const { requestRefresh } = useData();
    const postFunc = MakePost();
    const router = useRouter();
    const [movieListID, setMovieListID] = useState('');
    const [tvListID, setTVListID] = useState('');
    // TODO: Implement functionality to pass movei/show props, or episode or season props to post
      
     const moviesTabContent = useCallback(() => 
      <View>
        <NewPostSearchLists query={search} listTypeID={Values.movieListsID} listID={movieListID} onSelect={() => {}} />
      </View>
     , [search, movieListID])
  
     const showsTabContent = useCallback(() => 
      <View>
        <NewPostSearchLists query={search} listTypeID={Values.tvListsID} listID={tvListID} onSelect={() => {}} />
      </View>
     , [search, tvListID])
  
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
  
    const handleSearch = (query: string) => {
     setSearch(query);
    }
  
    return (
      <GestureHandlerRootView>
        <SafeAreaView style={[styles.container, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
            <AnimatedSearch searchVisible={searchVisible} search={search} handleSearch={handleSearch} />
            <SearchTabs browse={false} tabs={searchTabs} onTabChange={() => {}} index={0} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    switchContainer: {
      flexDirection: 'row',
      width: '100%',
      padding: 10,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    postButton: {
      borderRadius: 20,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    itemText: {
      flex: 1,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'left',
    },
    text: {
      fontSize: 16
    },
    spoilerText: {
      fontSize: 18,
      fontWeight: '300',
    },
    aboutText: {
      fontSize: 22,
      fontWeight: '500',
    },
    rank: {
      paddingHorizontal: 10,
      backgroundColor: 'transparent'
    },
    inputField: {
      width: '100%',
      padding: 10,
      height: 150,
      fontSize: 16,
      borderBottomWidth: 1,
    },
    image: {
      width: 65,
      aspectRatio: 2/3,
    },
    aboutImage: {
      width: 120,
      aspectRatio: 2/3,
    },
    imageBorder: {
      borderWidth: 1,
      borderColor: '#000',
      overflow: 'hidden',
      borderRadius: 10,
    },
    title: {
      flex: 1,
      textAlign: 'left',
      fontSize: 22,
      fontWeight: '500',
      paddingLeft: 2,
    },
    textContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
      alignSelf: 'flex-start',
      width: '100%',
      paddingLeft: 5,
    },
  });