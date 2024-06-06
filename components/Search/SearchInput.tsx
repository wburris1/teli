import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Pressable, TouchableHighlight, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
    search: string;
    setSearch: (value: string) => void;
};

const SearchInput = ({search, setSearch}: Props) => {
    const colorScheme = useColorScheme();
    //const [search, setSearch] = useState('');

    return (
        <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.inner}>
                <View style={styles.search} pointerEvents='none'>
                    <Ionicons name="search" size={25} color={Colors[colorScheme ?? 'light'].text} />
                </View>
                <TextInput placeholder="Search..." style={[styles.field, {color: Colors[colorScheme ?? 'light'].text}]} value={search} onChangeText={setSearch}/>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    inner: {
        flexDirection: 'row',
    },
    search: {
        position: 'absolute',
        top: 12,
        left: 5,
        zIndex: 1,
    },
    field: {
        flex: 1,
        marginLeft: 5,
        marginRight: 5,
        paddingVertical: 0,
        paddingLeft: 37,
        paddingRight: 10,
        borderRadius: 10,
        height: 50,
        fontSize: 16,
    },
    filter: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
    },
});

export default SearchInput;