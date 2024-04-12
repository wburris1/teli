import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Pressable, TouchableHighlight, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
    search: string;
    setSearch: (value: string) => void;
};

const onFilterPress = () => {

};

const SearchInput = ({search, setSearch}: Props) => {
    const colorScheme = useColorScheme();
    //const [search, setSearch] = useState('');

    return (
        <View style={styles.container}>
            <View style={styles.inner}>
                <View style={styles.search} pointerEvents='none'>
                    <Ionicons name="search" size={25} color={Colors[colorScheme ?? 'light'].text} />
                </View>
                <TextInput placeholder="Search..." style={styles.field} value={search} onChangeText={setSearch}/>
                <View style={styles.filter}>
                    <TouchableOpacity onPress={onFilterPress}>
                        <Ionicons
                            name="filter"
                            size={25}
                            color={Colors[colorScheme ?? 'light'].text}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 10,
    },
    inner: {
        flexDirection: 'row',
    },
    search: {
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1,
    },
    field: {
        flex: 1,
        marginLeft: 5,
        marginRight: 5,
        paddingVertical: 10,
        paddingLeft: 37,
        paddingRight: 37,
        backgroundColor: 'white',
        borderRadius: 10,
        height: 50,
        fontSize: 16,
        // Shadow properties
        shadowColor: '#2f95dc',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    filter: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
    },
});

export default SearchInput;