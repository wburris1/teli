import { FlatList, Platform, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

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
    const { activeTab, selectedLists, setSelectedLists, removeLists, setRemoveLists, item } = useTab();
    const colorScheme = useColorScheme();
    const addToListsFunc = addAndRemoveItemFromLists();
    const { requestRefresh } = useData();

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
                    if (!isRanking) {
                        addToListsFunc(item, selectedLists, removeLists,
                        activeTab == 0 ? Values.movieListsID : Values.tvListsID).then(() => {
                            requestRefresh();
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
            {loaded &&
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
              />}
          </View>
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
});