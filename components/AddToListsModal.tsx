import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useLayoutEffect, useState } from 'react';
import Dimensions from '@/constants/Dimensions';
import Colors from '@/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';
import { addAndRemoveItemFromLists, useGetItemLists } from '@/data/addToList';
import { Text, View } from './Themed';
import { AddList } from './AddList';
import { useLoading } from '@/contexts/loading';

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

type ScreenProps = {
    item_id: string;
    listTypeID: string;
    isRanking: boolean;
    onClose: () => void;
}

type RowProps = {
  list: List;
  index: number;
  onSelect: (item: List) => void;
  onDeselect: (item: List) => void;
  isSelected: boolean;
};

export default function AddToListsScreen({item_id, listTypeID, isRanking, onClose}: ScreenProps) {
    const { inLists, outLists, loaded } = useGetItemLists(item_id, listTypeID);
    const { activeTab, selectedLists, setSelectedLists, removeLists, setRemoveLists, item, setAddModalVisible } = useTab();
    const colorScheme = useColorScheme();
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

    return (
        <GestureHandlerRootView>
          <View style={styles.centeredView}>
            <View style={styles.headerContainer}>
                <Pressable onPress={() => {
                  if (loading) return;
                  onClose();
                  resetAddLists();
                }}>
                {({ pressed }) => (
                  <Ionicons
                  name="close-circle"
                  size={35}
                  color={"red"}
                  style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
                </Pressable>
                <Text style={{fontSize: 16, fontWeight: 'bold'}}>Add to lists</Text>
                <Pressable onPress={() => {
                    if (!isRanking && !loading) {
                      setLoading(true);
                      addToListsFunc(item, selectedLists, removeLists,
                      activeTab == 0 ? Values.movieListsID : Values.tvListsID).then(() => {
                          requestRefresh();
                          setLoading(false);
                          resetAddLists();
                          onClose();
                      })
                    } else {
                        onClose();
                    }
                }}>
                {({ pressed }) => (
                    <Ionicons
                    name="checkmark-circle"
                    size={35}
                    color={"#32CD32"}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                )}
                </Pressable>
            </View>
            <View style={{width: '100%'}}>
              <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                <View style={[styles.addContainer, { borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                  <View style={[styles.innerContainer, { padding: 10 }]}>
                    <View style={styles.textContainer}>
                      <Text style={{fontSize: 16, width: '100%', fontWeight: '300'}}>Add list</Text>
                    </View>
                    <Ionicons
                        name="add"
                        size={25}
                        color={Colors[colorScheme ?? 'light'].text}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            {loading && (
              <View style={styles.spinnerOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
            {loaded ?
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
              /> : (
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                  <ActivityIndicator size="large" />
                </View>
              )}
          </View>
          <AddList />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 1,
    paddingTop: 50,
  },
  reorderHeader: {
    paddingHorizontal: 15,
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
  addContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    paddingRight: 5,
    width: '100%',
    borderBottomWidth: 1,
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    borderBottomWidth: 1,
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