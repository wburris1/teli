import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useLayoutEffect, useState } from 'react';
import Dimensions from '@/constants/Dimensions';
import Colors from '@/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { addAndRemoveItemFromLists, useGetItemLists } from '@/data/addToList';
import { useLoading } from '@/contexts/loading';
import { List } from '@/constants/ImportTypes';

type RowProps = {
  list: List;
  index: number;
  onSelect: (item: List) => void;
  onDeselect: (item: List) => void;
  isSelected: boolean;
};

export default function AddToListsScreen() {
    const { item_id, item_name, listTypeID, isWatched } = useLocalSearchParams();
    const { inLists, outLists } = useGetItemLists(item_id as string, listTypeID as string, isWatched as string === 'true');
    const { activeTab, selectedLists, setSelectedLists, removeLists, setRemoveLists } = useTab();
    const colorScheme = useColorScheme();
    const navigation = useNavigation();
    const router = useRouter();
    const addToListsFunc = addAndRemoveItemFromLists();
    const { requestRefresh } = useData();
    const { loading, setLoading } = useLoading();

    useEffect(() => {
      setSelectedLists(inLists);
      setRemoveLists([]);
    }, [inLists])

    const handleSelect = (item: List) => {
      setSelectedLists([...selectedLists, item]);
      if (removeLists.includes(item)) {
        setRemoveLists(removeLists.filter(i => i.list_id !== item.list_id));
      }
    };

    const handleDeselect = (item: List) => {
      setSelectedLists(selectedLists.filter(i => i.list_id !== item.list_id));
      if (inLists.includes(item) && !removeLists.includes(item)) {
        setRemoveLists([...removeLists, item]);
      }
    };

    const RenderItem = ({ list, index, onSelect, onDeselect, isSelected }: RowProps) => {        
      return (
        <TouchableOpacity onPress={() => isSelected ? onDeselect(list) : onSelect(list)}>
          <View style={[styles.itemContainer, { borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
              <View style={[styles.innerContainer, { padding: 10 }]}>
                <View style={styles.textContainer}>
                  <Text style={styles.itemText}>{list.name}</Text>
                </View>
                {isSelected &&
                  <Ionicons
                      name="checkmark"
                      size={25}
                      color={Colors[colorScheme ?? 'light'].text}
                  />}
              </View>
          </View>
        </TouchableOpacity>
      )
    };

    function resetAddLists() {
      setSelectedLists([]);
      setRemoveLists([]);
    }

    useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          <Pressable onPress={() => {
              if (loading) return;
              setLoading(true);
              addToListsFunc(item_id as string, item_name as string, null, selectedLists, removeLists,
                activeTab == 0 ? Values.movieListsID : Values.tvListsID).then(() => {
                    //requestRefresh();
                    setLoading(false);
                    resetAddLists();
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
        headerLeft: () => (
          <Pressable onPress={() => {
              if (loading) return;
              router.back();
              resetAddLists();
          }}>
          {({ pressed }) => (
              <Ionicons
              name="close-circle"
              size={35}
              color={Colors[colorScheme ?? 'light'].text}
              style={{ opacity: pressed ? 0.5 : 1 }}
              />
          )}
          </Pressable>
        ),
      })
    })

    return (
        <GestureHandlerRootView>
          <View style={styles.centeredView}>
            {loading && (
              <View style={styles.spinnerOverlay}>
                <ActivityIndicator size="large" color={Colors['loading']} />
              </View>
            )}
            <FlatList
            data={[...outLists, ...inLists]}
            renderItem={({ item, index }) => 
            <RenderItem
              list={item}
              index={index}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              isSelected={selectedLists.some(i => i.list_id === item.list_id)}
            />}
            keyExtractor={item => item.list_id}
            numColumns={1}
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