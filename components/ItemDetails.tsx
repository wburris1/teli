import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Pressable, Modal, Button } from 'react-native'
import React, { useState } from 'react'
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Link } from 'expo-router';
import { BlurView } from 'expo-blur';
import Rank from './RankItem';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

type Props = {
    item: Item
};

const ItemDetails = ({item}: Props) => {
    var releaseYear = "";
    var title = "";
    if ('title' in item) {
        title = item.title;
        releaseYear = item.release_date.slice(0, 4);
    } else if ('name' in item) {
        title = item.name;
        releaseYear = item.first_air_date.slice(0, 4);
    }
    const colorScheme = useColorScheme();
    //const movie = useMovieDetails(item.id);

    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Image source={{ uri: imgUrl + item.poster_path }} style={styles.image} />
                <View style={styles.titleInfo}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.date}>{releaseYear}</Text>
                </View>
            </View>
            <Text style={styles.overview}>{item.overview}</Text>

            <Rank item={item} />
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        backgroundColor: '#fff'
    },
    info: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: screenWidth,
        paddingLeft: 10,
        paddingRight: 0,
        paddingTop: 10
    },
    titleInfo: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
    },
    image: {
        width: 200,
        aspectRatio: 1 / 1.5,
        borderRadius: 5,
        borderWidth: 0.5
    },
    title: {
        textAlign: 'right',
        paddingVertical: 5,
        fontSize: 24,
        fontWeight: 'bold'
    },
    date: {
        textAlign: 'right',
        paddingVertical: 5,
        fontSize: 14,
    },
    overview: {
        textAlign: 'left',
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 14,
    },
});

export default ItemDetails;