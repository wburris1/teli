import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import Dimensions from '@/constants/Dimensions';
import Colors from '@/constants/Colors';
import { useUserItemsSeenSearch } from '@/data/userData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

export default function ReorderScreen() {
  const { activeTab } = useTab();
  const listTypeID = activeTab == 0 ? Values.movieListsID : Values.tvListsID;
  const { items, loaded } = useUserItemsSeenSearch(Values.seenListID, listTypeID);
  const [listItems, setListItems] = useState<UserItem[]>([]);
  const { setMovies, setShows } = useData();

  useEffect(() => {
    items.sort((a: UserItem, b: UserItem) => b.score - a.score);
    setListItems(items);
    if (activeTab == 0) {
      setMovies(items);
    } else {
      setShows(items);
    }
  }, [items])

  const renderReorderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<UserItem>) => {
    const score = item.score.toFixed(1);
    const isMovie = 'title' in item;
    const index = getIndex();
    var date = "";
    
    return (
      <View style={styles.itemContainer}>
        <View style={[styles.innerContainer, { padding: 10 }]}>
        <View style={styles.rank}><Text style={styles.text}>{index! + 1}.</Text></View>
        <View style={styles.textContainer}>
          <Text style={styles.itemText}>{'title' in item ? item.title : item.name}</Text>
        </View>
        <TouchableOpacity onPressIn={drag}>
          <Ionicons
            name="reorder-three"
            size={25}
            color={Colors['light'].text}
          />
        </TouchableOpacity>
        </View>
      </View>
    )
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.centeredView}>
        <DraggableFlatList
          data={listItems}
          renderItem={renderReorderItem}
          keyExtractor={item => item.item_id}
          numColumns={1}
          onDragEnd={({ data }) => {
            setListItems(data);
            if (activeTab == 0) {
              setMovies(data);
            } else {
              setShows(data);
            }
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  reorderHeader: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
  rank: {
    paddingHorizontal: 10,
    backgroundColor: 'transparent'
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
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
    borderBottomColor: '#000',
    overflow: 'hidden',
    paddingRight: 5,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 10,
  },
});