import { useLoading } from '@/contexts/loading';
import { Link } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react'
import { View, Image, StyleSheet, FlatList, ActivityIndicator, Pressable, Animated, TouchableOpacity, useColorScheme } from 'react-native';
import Dimensions from '@/constants/Dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Themed';
import Colors from '@/constants/Colors';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

type Props = {
    movieList: Item[],
};

const ItemScreen = ({movieList}: Props) => {
    const colorScheme = useColorScheme();

    const renderItem = ({ item, index }: { item: Item, index: number }) => {
        var title = "";
        const isMovie = 'title' in item;
        var date = isMovie ? item.release_date : item.first_air_date;
        date = date.slice(0,4);

        if (isMovie) {
            title = item.title;
        } else {
            title = item.name;
        }
        
        return (
            <Link href={{pathname: "/search_item", params: { id: item.id, groupKey: isMovie ? "movie" : "tv" }}} asChild>
                <TouchableOpacity>
                    <View style={[styles.container, { borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
                        <View style={[styles.imageBorder, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                        <Image
                            source={{ uri: imgUrl + item.poster_path }}
                            style={styles.image}
                        />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={{fontWeight: '200'}}>{date}</Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={15}
                            color={Colors[colorScheme ?? 'light'].text}
                            style={{padding: 5,}}
                        />
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };
    

    return (
        <View style={styles.list}>
            <FlatList
                data={movieList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={1}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: screenWidth,
        paddingTop: screenHeight / 4,
    },
    list: {
        //flex: 1
        paddingBottom: 15
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        borderBottomWidth: 1,
    },
    image: {
        width: 80,
        aspectRatio: 1 / 1.5,
    },
    imageBorder: {
        borderWidth: 1,
        borderColor: '#000',
        overflow: 'hidden',
        borderRadius: 10,
        marginVertical: 10,
        marginLeft: 10,
    },
    title: {
        flex: 1,
        textAlign: 'left',
        fontSize: 16,
        fontWeight: '500',
        paddingLeft: 2,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 5,
    },
});

export default ItemScreen;