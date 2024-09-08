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

type RowProps = {
    item: UserItem;
    index: number;
    items: UserItem[];
    listID: string;
};

const imgUrl = 'https://image.tmdb.org/t/p/w342';

const itemWidth = (Dimensions.screenWidth - 12) / 3;

const RenderItem = forwardRef<View, RowProps>(({ item, index, items, listID }, ref) => {
    const score = item.score.toFixed(1);
    const isMovie = 'title' in item;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    var date = "";
    const colorScheme = useColorScheme();
  
    date = isMovie ? item.release_date : item.first_air_date;
    date = date.slice(0,4);
  
    return (
      <View>
        <Link href={{pathname: "/search_item", params: { id: item.item_id, groupKey: isMovie ? "movie" : "tv" }}} style={styles.linkStyle} asChild>
          <TouchableOpacity>
            <View style={[styles.innerContainer, {backgroundColor: Colors[colorScheme ?? 'light'].background}]}>
              <Image
                  source={{ uri: imgUrl + item.poster_path }}
                  style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text }]}
              />
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

const MakeList = ({ listID, listTypeID, onItemsUpdate, items }:
  {listID: string, listTypeID: string, onItemsUpdate: (items: UserItem[]) => void, items: UserItem[] }) => {
    const colorScheme = useColorScheme();

    useEffect(() => {
      if (items) {
        onItemsUpdate(items);
      }
    }, [items])

    if (items) {
      items.sort((a: UserItem, b: UserItem) => b.score - a.score);

      return (
        <View style={{backgroundColor: Colors[colorScheme ?? 'light'].background, flex: 1}}>
          {items.length > 0 ? 
          <FlatList
            data={items}
            renderItem={({ item, index }) => <RenderItem item={item} index={index} items={items} listID={listID} />}
            keyExtractor={item => item.item_id}
            numColumns={3}
          /> : 
          <Text>Rank something!</Text>}
        </View>
      )
    } else {
      return (
        <Text>Loading</Text>
      )
    }
}

export default function TabOneScreen() {
    const { listTypeID, listID, description, name, userID } = useLocalSearchParams();
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
        <MakeList listID={listID as string} listTypeID={listTypeID as string} onItemsUpdate={onItemsUpdate} items={filteredItems}/>
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
            <ActivityIndicator size="large" />
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
      borderWidth: 1,
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