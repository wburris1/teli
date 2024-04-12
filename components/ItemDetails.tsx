import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Pressable, Modal, Button } from 'react-native'
import React, { useState } from 'react'
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useMovieDetails } from '@/data/movieData';
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
    const releaseYear = item.release_date.slice(0, 4);
    const colorScheme = useColorScheme();
    const movie = useMovieDetails(item.id);
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Image source={{ uri: imgUrl + item.poster_path }} style={styles.image} />
                <View style={styles.titleInfo}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.date}>{releaseYear}</Text>
                </View>
            </View>
            <Text style={styles.overview}>{item.overview}</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                <Ionicons
                    name="add-circle"
                    size={85}
                    color={Colors[colorScheme ?? 'light'].text}
                />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                
                <BlurView intensity={100} style={styles.blurContainer}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Ionicons
                    name="close-circle"
                    size={45}
                    color={Colors[colorScheme ?? 'light'].text}
                />
                </TouchableOpacity>
                <Rank item={item} />
                </BlurView>
            </Modal>
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
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50
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
    addButton: {
        position: 'absolute',
        bottom: 10,
    },
    cancelButton: {
        position: 'absolute',
        right: 10,
        top: 55,
    }
});

export default ItemDetails;