import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import Dimensions from '@/constants/Dimensions';
import Colors from '@/constants/Colors';
import { useUserItemsSeenSearch } from '@/data/userData';
import Values from '@/constants/Values';
import { UserItem } from '@/constants/ImportTypes';

type RowProps = {
    item: UserItem;
    index: number;
    onSelect: (item: UserItem) => void;
    onDeselect: (item: UserItem) => void;
    isSelected: boolean;
};

type ListModalScreenProps = {
    listTypeID: string,
    visible: boolean;
    containedItems: UserItem[],
    onClose: () => void;
    onSelectedItemsChange: (items: UserItem[], removedItems: UserItem[]) => void;
  };

export const ListModalScreen = ({ listTypeID, visible, containedItems, onClose, onSelectedItemsChange }: ListModalScreenProps) => {
  const { items, loaded } = useUserItemsSeenSearch(Values.seenListID, listTypeID);
  const [listItems, setListItems] = useState<UserItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<UserItem[]>(containedItems);
  const [removedItems, setRemovedItems] = useState<UserItem[]>([]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (items) {
        items.sort((a: UserItem, b: UserItem) => b.score - a.score);
        setListItems(items);
    }
  }, [items])

  const handleSelect = (item: UserItem) => {
    if (removedItems.some(removedItem => removedItem.item_id == item.item_id)) {
        setRemovedItems(prev => prev.filter(i => i.item_id !== item.item_id));
    }
    setSelectedItems(prev => [...prev, item]);
  };

  const handleDeselect = (item: UserItem) => {
    if (containedItems.some(containedItem => containedItem.item_id == item.item_id)) {
        setRemovedItems(prev => [...prev, item]);
    }
    setSelectedItems(prev => prev.filter(i => i.item_id !== item.item_id));
  };

  const RenderItem = ({ item, index, onSelect, onDeselect, isSelected }: RowProps) => {    
    return (
        <TouchableOpacity onPress={() => isSelected ? onDeselect(item) : onSelect(item)}>
            <View style={[styles.itemContainer, { borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
                <View style={[styles.innerContainer, { padding: 10 }]}>
                    <View style={styles.rank}><Text style={[styles.text, {color: Colors[colorScheme ?? 'light'].text}]}>{index + 1}.</Text></View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.itemText, {color: Colors[colorScheme ?? 'light'].text}]}>{'title' in item ? item.title : item.name}</Text>
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
    <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
    >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons
                name="close-circle"
                size={45}
                color='red'
            />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSelectedItemsChange(selectedItems, removedItems)} style={styles.saveButton}>
            <Ionicons
                name="checkmark-circle"
                size={45}
                color='#32CD32'
            />
        </TouchableOpacity>
        <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.header}>
                <Text style={[styles.text, {fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].text}]}>Add to List</Text>
            </View>
            <FlatList
            data={listItems}
            renderItem={({ item, index }) =>
                <RenderItem
                item={item}
                index={index}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                isSelected={selectedItems.some(i => i.item_id === item.item_id)}
                />}
            keyExtractor={item => item.item_id}
            numColumns={1}
            />
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    header: {
        marginTop: 55,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderBottomWidth: 1,
        borderColor: 'gray',
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
    saveButton: {
        position: 'absolute',
        right: 10,
        top: 55,
        zIndex: 1,
    },
    closeButton: {
        position: 'absolute',
        left: 10,
        top: 55,
        zIndex: 1,
    },
});