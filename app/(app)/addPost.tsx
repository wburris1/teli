import { Image, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { Text, View } from '../../components/Themed';
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

const imgUrl = 'https://image.tmdb.org/t/p/w500';

const MovieTabContent = ({ query, onSelect }: { query: string, onSelect: (item: AboutItem) => void}) => {
  const [listID, setListID] = useState('');

  return (
    <View>
      <View>
        <SearchCategories listTypeID={Values.movieListsID} isPost={true} onChange={selectedID => setListID(selectedID)} />
      </View>
      <NewPostSearchLists query={query} listTypeID={Values.movieListsID} listID={listID} onSelect={onSelect} />
    </View>
  )
}

const TVTabContent = ({ query, onSelect }: { query: string, onSelect: (item: AboutItem) => void}) => {
  const [listID, setListID] = useState('');

  return (
    <View>
      <View>
        <SearchCategories listTypeID={Values.tvListsID} isPost={true} onChange={selectedID => setListID(selectedID)} />
      </View>
      <NewPostSearchLists query={query} listTypeID={Values.tvListsID} listID={listID} onSelect={onSelect} />
    </View>
  )
}

type AboutItem = {
  id: string,
  name: string,
  poster_path: string,
  date: string,
  listTypeID: string,
}

export default function NewPostScreen() {
  const colorScheme = useColorScheme();
  const [caption, setCaption] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const { requestRefresh } = useData();
  const postFunc = MakePost();
  const router = useRouter();
  const [movieListID, setMovieListID] = useState('');
  const [tvListID, setTVListID] = useState('');
  // TODO: Implement functionality to pass movei/show props, or episode or season props to post
  const { itemID, name, poster_path, date,
    seasonID, seasonName, seasonPoster,
    episodeID, episodeName, episodePoster,
   } = useLocalSearchParams();
   const navigation = useNavigation();

   const emptyItem = {
    id: "",
    name: "",
    poster_path: "",
    date: "",
    listTypeID: "",
   }
   const [aboutItem, setAboutItem] = useState<AboutItem>(emptyItem);

   useEffect(() => {
    if (tvListID !== movieListID) {
    setTVListID(movieListID);
    }
   }, [movieListID])
   useEffect(() => {
    if (movieListID !== tvListID) {
    setMovieListID(tvListID);
    }
   }, [tvListID])

   const moviesTabContent = useCallback(() => 
    <View>
      <View>
        <SearchCategories listTypeID={Values.movieListsID} isPost={true} onChange={selectedID => setMovieListID(selectedID)} />
      </View>
      <NewPostSearchLists query={search} listTypeID={Values.movieListsID} listID={movieListID} onSelect={item => setAboutItem(item)} />
    </View>
   , [search, movieListID])

   const showsTabContent = useCallback(() => 
    <View>
      <View>
        <SearchCategories listTypeID={Values.tvListsID} isPost={true} onChange={selectedID => setTVListID(selectedID)} />
      </View>
      <NewPostSearchLists query={search} listTypeID={Values.tvListsID} listID={tvListID} onSelect={item => setAboutItem(item)} />
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>{caption && aboutItem.id &&
          <TouchableOpacity onPress={() => {
              postFunc(caption, aboutItem.id, aboutItem.poster_path, aboutItem.name, hasSpoilers, aboutItem.listTypeID).then(() => {
                requestRefresh();
                router.back();
                Toast.show({
                  type: 'info',
                  text1: "You made a new post about " + aboutItem.name + "!",
                  position: "bottom",
                  visibilityTime: 3000,
                  bottomOffset: 100
                });
              })
            }}>
            <View style={[styles.postButton, {backgroundColor: Colors[colorScheme ?? 'light'].text}]}>
              <Text style={{fontSize: 16, color: Colors[colorScheme ?? 'light'].background}}>Share</Text>
            </View>
          </TouchableOpacity>}
        </>
      )
    })
  })

  return (
    <GestureHandlerRootView>
      <View style={[styles.container, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
        <TextInput
            multiline
            autoCapitalize="sentences"
            placeholder="Speak your mind..."
            value={caption}
            onChangeText={setCaption}
            style={[styles.inputField,
                { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text,
                    color: Colors[colorScheme ?? 'light'].text,
                }]}
        />
        <View style={styles.switchContainer}>
          <Text style={styles.spoilerText}>Spoiler Alert?</Text>
          <Switch
            trackColor={{ false: Colors[colorScheme ?? 'light'].text, true: "#32CD32" }}
            thumbColor={Colors[colorScheme ?? 'light'].background}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => setHasSpoilers(prev => !prev)}
            value={hasSpoilers}
          />
        </View>
        {!aboutItem.id ? <>
          <View style={styles.switchContainer}>
            <Text style={styles.aboutText}>What's this about?</Text>
            <TouchableOpacity onPress={() => {
              setSearchVisible(prev => !prev);
            }}>
              <Ionicons name={searchVisible ? "close" : "search"} size={35} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
          </View>
          <AnimatedSearch searchVisible={searchVisible} search={search} handleSearch={handleSearch} />
          <SearchTabs tabs={searchTabs} onTabChange={() => {}} index={0} />
        </> :
        <View>
          <View style={styles.switchContainer}>
            <Text style={styles.aboutText}>About</Text>
            <TouchableOpacity onPress={() => setAboutItem(emptyItem)}>
              <Ionicons name="close" size={35} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
          </View>
          <View style={styles.switchContainer}>
            <View style={[styles.imageBorder, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
              <Image
                  source={{ uri: imgUrl + aboutItem.poster_path }}
                  style={styles.aboutImage}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{aboutItem.name}</Text>
              <Text style={{fontWeight: '200', fontSize: 16}}>{aboutItem.date}</Text>
            </View>
          </View>
        </View>}
      </View>
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
    fontSize: 26,
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