import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useLayoutEffect, useState } from 'react';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import Dimensions from '@/constants/Dimensions';
import Colors from '@/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';
import { UserItem } from '@/constants/ImportTypes';
import { useLoading } from '@/contexts/loading';
import Spinner from 'react-native-loading-spinner-overlay';
import { useNavigation, useRouter } from 'expo-router';
import { AdjustReorderedScores } from '@/data/itemScores';

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

export default function ReorderScreen() {
  const { activeTab } = useTab();
  const listTypeID = activeTab == 0 ? Values.movieListsID : Values.tvListsID;
  const [listItems, setListItems] = useState<UserItem[]>([]);
  const { movies, shows, requestRefresh } = useData();
  const colorScheme = useColorScheme();
  const { loading } = useLoading();
  const navigation = useNavigation();
  const router = useRouter();
  const reorderFunc = AdjustReorderedScores();

  const filterByList = (toFilter: UserItem[]) => {
    return toFilter.filter(item => item.lists.includes(Values.seenListID));
  }

  useEffect(() => {
    if (movies && shows) {
      if (activeTab == 0) {
        setListItems(filterByList(movies));
      } else {
        setListItems(filterByList(shows));
      }
    }
  }, [movies, shows])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => {
            if (loading) return;
            reorderFunc(listItems, Values.seenListID, listTypeID).then(() => {
                //requestRefresh();
                router.back();
            })
        }}>
        {({ pressed }) => (
            <Ionicons
            name="checkmark-circle"
            size={35}
            color={'#32CD32'}
            style={{ opacity: pressed ? 0.5 : 1 }}
            />
        )}
        </Pressable>
    ),
    })
  }, [listItems, listTypeID])

  const renderReorderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<UserItem>) => {
    const score = item.score.toFixed(1);
    const isMovie = 'title' in item;
    const index = getIndex();
    var date = "";
    
    return (
      <View style={[styles.itemContainer, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
        <View style={[styles.innerContainer, { padding: 10 }]}>
        <View style={styles.rank}><Text style={styles.text}>{index! + 1}.</Text></View>
        <View style={styles.textContainer}>
          <Text style={styles.itemText}>{'title' in item ? item.title : item.name}</Text>
        </View>
        <TouchableOpacity onPressIn={drag}>
          <Ionicons
            name="reorder-three"
            size={25}
            color={Colors[colorScheme ?? 'light'].text}
          />
        </TouchableOpacity>
        </View>
      </View>
    )
  };

  return (
    <GestureHandlerRootView>
      <View style={styles.centeredView}>
        {loading && (
          <View style={styles.spinnerOverlay}>
            <ActivityIndicator size="large" color={Colors['loading']}/>
          </View>
        )}
        {(movies && shows) ?
        <DraggableFlatList
          data={listItems}
          renderItem={renderReorderItem}
          keyExtractor={item => item.item_id}
          numColumns={1}
          onDragEnd={({ data }) => {
            setListItems(data);
          }}
        /> : 
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={Colors['loading']}/>
        </View>}
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
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});