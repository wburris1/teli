import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import React, { ContextType, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useUserItemsSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import Values from '@/constants/Values';
import { useTab } from '@/contexts/listContext';
import { EditListScreen } from '@/components/EditList';
import { AnimatedSearch } from '@/components/AnimatedSearch';
import { UserItem } from '@/constants/ImportTypes';
import { LinearGradient } from 'expo-linear-gradient';
import { DefaultPost } from './LogoView';

type RowProps = {
    item: UserItem;
    index: number;
    items: UserItem[];
    listID: string;
    redirectLink?: string;
    setImagesLoaded: () => void;
};

type ScreenProps = {
    listTypeID: string;
    listID: string;
    description: string;
    name: string;
    userID: string;
    redirectLink?: string;
}

const imgUrl = 'https://image.tmdb.org/t/p/w342';

const itemWidth = (Dimensions.screenWidth - 12) / 3;

const RenderItem = forwardRef<View, RowProps>(({ item, index, items, listID, redirectLink = '/home', setImagesLoaded }, ref) => {
    const score = item.score == 10 ? '10' : item.score.toFixed(1);
    const isMovie = 'title' in item;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    var date = "";
    const colorScheme = useColorScheme();
  
    date = isMovie ? item.release_date : item.first_air_date;
    date = date.slice(0,4);

    // useEffect(() => {
    //   if (!item.poster_path) setImagesLoaded();
    // }, [])
  
    return (
      <View>
        <Link href={{pathname: redirectLink + "_item" as any, params: { id: item.item_id, groupKey: isMovie ? "movie" : "tv" }}} style={styles.linkStyle} asChild>
          <TouchableOpacity>
            <View style={[styles.innerContainer, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
              {item.poster_path ? <Image
                  source={{ uri: imgUrl + item.poster_path }}
                  style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text }]}
                  onLoadEnd={() => setImagesLoaded()}
              /> : <DefaultPost style={[styles.image, {overflow: 'hidden'}, ]}
              text={isMovie ? item.title : item.name}/>}
              {item.score && item.score >= 0 &&
              <>
                <LinearGradient
                  colors={['transparent', 'black']}
                  style={styles.gradient}
                />
                <Text style={[styles.rank, {color: 'white', fontSize: 18, fontWeight: '500'}]}>{index + 1}.</Text>
                <Text style={[styles.scoreText, styles.score, {color: 'white'}]}>{score}</Text>
              </>
              }
            </View>
          </TouchableOpacity>
        </Link>
      </View>
    );
});

const MakeList = ({ listID, listTypeID, onItemsUpdate, items, redirectLink = '/home' }:
  {listID: string, listTypeID: string, onItemsUpdate: (items: UserItem[]) => void, items: UserItem[], redirectLink?: string }) => {
    const colorScheme = useColorScheme();
    const [imagesLoaded, setImagesLoaded] = useState(0);

    useEffect(() => {
      if (items) {
        onItemsUpdate(items.sort((a: UserItem, b: UserItem) => b.score - a.score));
      }
    }, [items])

    if (items) {
      return (
        <View style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1}}>
          {imagesLoaded < items.length && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', backgroundColor: Colors[colorScheme ?? 'light'].background, justifyContent: 'center', zIndex: 2 }}>
              <ActivityIndicator size="large" color={Colors['loading']}/>
            </View>
          )}
          <LinearGradient
          colors={[Colors[colorScheme ?? 'light'].gray, colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent']}
          style={{position: 'absolute', top: 0, left: 0, right: 0, height: 5, zIndex: 1}}
          />
          <FlatList
            data={items}
            renderItem={({ item, index }) => <RenderItem item={item} index={index} items={items} listID={listID} redirectLink={redirectLink} setImagesLoaded={() => setImagesLoaded(prev => prev + 1)} />}
            keyExtractor={item => item.item_id}
            numColumns={3}
            style={{paddingTop: 10}}
          />
        </View>
      )
    } else {
      return (
        <Text>Loading</Text>
      )
    }
}

export const ListPage = ({listTypeID, listID, description, name, userID, redirectLink = '/home'}: ScreenProps) => {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isCustomList = (listID == Values.seenListID || listID == Values.bookmarkListID) ? false : true;
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currDescription, setCurrDescription] = useState("");
    const [currName, setCurrName] = useState("");
    const [searchVisible, setSearchVisible] = useState(false);
    const [filteredItems, setFilteredItems] = useState<UserItem[]>([]);
    //const { items, loaded } = useUserItemsSeenSearch(listID as string, listTypeID as string);
    const { items, loaded } = useUserItemsSearch(userID as string, listID as string, listTypeID as string);
    const [search, setSearch] = useState('');

    useEffect(() => {
      if (description) {
        setCurrDescription(description as string);
      }
      if (name) {
        setCurrName(name as string);
      }
    }, [name, description])

    const onItemsUpdate = (items: UserItem[]) => {
      setFilteredItems(items);
    }

    useEffect(() => {
      if (loaded) {
          setFilteredItems(items);
      }
    }, [items, loaded]);

    const onClose = () => {
      setEditModalVisible(false);
    }

    const onEditDetails = (newName: string, newDescription: string) => {
      setCurrName(newName);
      setCurrDescription(newDescription);
    }

    const handleSearch = (query: string) => {
      setSearch(query);
      const filtered = items.filter(item => {
        const title = 'title' in item ? item.title : item.name;
        return title.toLowerCase().includes(query.toLowerCase());
      });
      setFilteredItems(filtered);
    }

    useLayoutEffect(() => {
      navigation.setOptions({
        headerTitle: currName,
        headerRight: () => (<>
          <Pressable onPress={() => {
              setSearchVisible(!searchVisible)
            }}>
            {({ pressed }) => (
              <Ionicons
                name={searchVisible ? "close" : "search"}
                size={25}
                color={Colors[colorScheme ?? 'light'].text}
                style={{ opacity: pressed ? 0.5 : 1 }}
              />
            )}
          </Pressable>
          </>
        ),
      })
    }, [navigation, listID, currName, searchVisible])

    var ItemList = useCallback(() =>  (
        <MakeList listID={listID as string} listTypeID={listTypeID as string} onItemsUpdate={onItemsUpdate} items={filteredItems} redirectLink={redirectLink} />
    ), [currDescription, filteredItems]);
  
    return (
        <View style={{ backgroundColor: '#fff', flex: 1 }}>
        {currDescription != "" && <View style={[styles.description, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
            <Text>{currDescription}</Text>
        </View>}
        <EditListScreen listID={listID as string} listTypeID={listTypeID as string} name={name as string} description={description as string}
            items={items} visible={editModalVisible} onClose={onClose} onEdit={onEditDetails} isRanked={true} />
        <AnimatedSearch searchVisible={searchVisible} search={search} handleSearch={handleSearch} />

        {loaded ? 
        <ItemList /> : (
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <ActivityIndicator size="large" color={Colors['loading']}/>
          </View>
        )}
        </View>
    );
  }

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    description: {
      padding: 10,
      borderBottomWidth: 1,
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
    scoreText: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    rank: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      backgroundColor: 'transparent'
    },
    score: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: 'transparent'
    },
    image: {
      width: '100%',
      aspectRatio: 1 / 1.5,
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
    fullSize: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
    },
    linkStyle: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'center',
      padding: 0,
      margin: 0,
    },
    innerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: itemWidth,
      marginLeft: 3,
      marginBottom: 3,
    },
    gradient: {
      position: 'absolute',
      bottom: 1,
      left: 1,
      right: 1,
      height: 100,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    },
  });