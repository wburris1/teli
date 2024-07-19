import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import React, { ContextType, forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useUserItemsSearch, useUserItemsSeenSearch } from '@/data/userData';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import Values from '@/constants/Values';
import { useTab } from '@/contexts/listContext';
import { removeFromList, useUserItemDelete } from '@/data/deleteItem';
import { EditListScreen } from '@/components/EditList';
import { AnimatedSearch } from '@/components/AnimatedSearch';
import { UserItem } from '@/constants/ImportTypes';

type RowProps = {
    item: UserItem;
    index: number;
    items: UserItem[];
    listID: string;
};

const imgUrl = 'https://image.tmdb.org/t/p/w500';

const RenderItem = forwardRef<View, RowProps>(({ item, index, items, listID }, ref) => {
    const score = item.score.toFixed(1);
    const isMovie = 'title' in item;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    var date = "";
    const colorScheme = useColorScheme();
  
    date = isMovie ? item.release_date : item.first_air_date;
    date = date.slice(0,4);
  
    return (
        <View style={[styles.itemContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
          <Link href={{pathname: "/search_item", params: { id: item.item_id, groupKey: isMovie ? "movie" : "tv" }}} style={styles.linkStyle}>
            <View style={styles.innerContainer}>
              <View style={styles.rank}><Text style={styles.text}>{index + 1}.</Text></View>
              <Image
                  source={{ uri: imgUrl + item.poster_path }}
                  style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text }]}
              />
              <View style={styles.textContainer}>
                <Text style={styles.itemText}>{'title' in item ? item.title : item.name}</Text>
                <Text style={styles.dateText}>{date}</Text>
              </View>
              {listID != Values.bookmarkListID &&
              <View style={styles.score}>
                <View style={[styles.scoreCircle, {backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text}]}>
                  <Text style={styles.scoreText}>{score}</Text>
                </View>
              </View>}
              <Ionicons
                name="chevron-forward"
                size={15}
                color={Colors[colorScheme ?? 'light'].text}
              />
            </View>
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
            numColumns={1}
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
            items={items} visible={editModalVisible} onClose={onClose} onEdit={onEditDetails} />
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
      fontSize: 20,
      fontWeight: '500',
    },
    rank: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 15,
      backgroundColor: 'transparent'
    },
    score: {
      paddingHorizontal: 7,
      backgroundColor: 'transparent'
    },
    scoreCircle: {
      width: 50,
      height: 50,
      backgroundColor: '#fff',
      borderRadius: 50,
      borderWidth: 1,
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
      overflow: 'hidden',
      paddingRight: 5,
      width: '100%',
    },
    image: {
      width: '20%',
      aspectRatio: 1 / 1.5,
      paddingHorizontal: 5,
      marginVertical: 10,
      borderWidth: 0.5,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      height: '100%',
    },
  });