import { StatusBar } from 'expo-status-bar';
import { FlatList, Platform, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

import { Text, View } from '../../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import Dimensions from '@/constants/Dimensions';
import Colors from '@/constants/Colors';
import { useUserItemsSeenSearch, useUserListsSearch } from '@/data/userData';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTab } from '@/contexts/listContext';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';
import { useLocalSearchParams } from 'expo-router';
import { useGetItemLists } from '@/data/addToList';

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

type RowProps = {
  item: List;
  index: number;
  onSelect: (item: List) => void;
  onDeselect: (item: List) => void;
  isSelected: boolean;
};

export default function AddToListsScreen() {
    const { item_id, listTypeID } = useLocalSearchParams();
    const { inLists, outLists, loaded } = useGetItemLists(item_id as string, listTypeID as string);
    const { selectedLists, setSelectedLists, removeLists, setRemoveLists } = useTab();
    const colorScheme = useColorScheme();

    useEffect(() => {
      setSelectedLists(inLists);
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

    const RenderItem = ({ item, index, onSelect, onDeselect, isSelected }: RowProps) => {        
      return (
        <TouchableOpacity onPress={() => isSelected ? onDeselect(item) : onSelect(item)}>
          <View style={[styles.itemContainer, { borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
              <View style={[styles.innerContainer, { padding: 10 }]}>
                <View style={styles.textContainer}>
                  <Text style={styles.itemText}>{item.name}</Text>
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

    return (
        <GestureHandlerRootView>
            <View style={styles.centeredView}>
              {loaded &&
                <FlatList
                data={[...outLists, ...inLists]}
                renderItem={({ item, index }) => 
                <RenderItem
                  item={item}
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
});