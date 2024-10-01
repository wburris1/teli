import { useLoading } from '@/contexts/loading';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Image, StyleSheet, FlatList, ActivityIndicator, Pressable, Animated, TouchableOpacity, useColorScheme } from 'react-native';
import Dimensions from '@/constants/Dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Themed';
import Colors from '@/constants/Colors';
import { useData } from '@/contexts/dataContext';
import Values from '@/constants/Values';
import { DefaultPost } from '../LogoView';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const imgUrl780 = 'https://image.tmdb.org/t/p/w780';
const screenHeight = Dimensions.screenHeight;
const screenWidth = Dimensions.screenWidth;

type Props = {
    movieList: Item[],
    isAdding: boolean,
    addItems: Item[],
    outItems: Item[],
    setAddItems: (items: Item[]) => void,
    setOutItems: (items: Item[]) => void,
    listID: string,
    isPosting: boolean,
};

const ItemScreen = ({movieList, isAdding, addItems, outItems, setAddItems, setOutItems, listID, isPosting}: Props) => {
    const colorScheme = useColorScheme();
    const {movies, shows} = useData();
    const isMovieList = movieList.length > 0 && 'title' in movieList[0];

    const prefetchImages = async (items: Item[]) => {
        return Promise.all(
          items.map(item => Image.prefetch(imgUrl + item.poster_path)) // Prefetch all images
        );
      };
      
      const prefetchBackdrops = async (items: Item[]) => {
        return Promise.all(
          items.map(item => Image.prefetch(imgUrl780 + item.backdrop_path)) // Prefetch all backdrops
        );
      };
    
    //   useEffect(() => {
    //     const prefetchImagesForGrid = async () => {
    //         await prefetchImages(movieList); // Prefetch all images
    //     };
    //     const prefetchBackdropForGrid = async () => {
    //         await prefetchBackdrops(movieList); // Prefetch all images
    //     };
    //     prefetchImagesForGrid();
    //     prefetchBackdropForGrid();
    //   }, [movieList]);

    const renderItem = ({ item, index }: { item: Item, index: number }) => {
        var title = "";
        const isMovie = 'title' in item;
        var date = isMovie ? item.release_date : item.first_air_date;
        date = date ? date.slice(0,4) : "";
        let isIn = false;

        if (isMovie) {
            title = item.title;
            isIn = movies && listID ? movies.find(movie => movie.item_id == item.id && movie.lists.includes(listID)) != null : false;
        } else {
            title = item.name;
            isIn = shows && listID ? shows.find(show => show.item_id == item.id && show.lists.includes(listID)) != null : false;
        }

        const handleSelect = () => {
            if (isIn) {
                if (outItems.includes(item)) {
                    setOutItems(outItems.filter(prevItem => prevItem.id != item.id));
                } else {
                    setOutItems([item, ...outItems]);
                }
            } else if (addItems.includes(item)) {
                setAddItems(addItems.filter(prevItem => prevItem.id != item.id));
            } else {
                setAddItems([item, ...addItems]);
            }
        }

        return (
            <>{!isAdding ?
            <Link href={{pathname: isPosting ? "/post_page" : "/search_item", params: 
            { id: item.id, poster: item.poster_path, name: 'title' in item ? item.title : item.name,
            groupKey: isMovie ? "movie" : "tv", backdrop: item.backdrop_path, runtime: isMovie ? item.runtime : item.episode_run_time }}} asChild>
                <TouchableOpacity>
                    <View style={[styles.container, { borderBottomColor: Colors[colorScheme ?? 'light'].text }]}>
                        <View style={[styles.imageBorder, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                          {item.poster_path ? 
                            <Image
                                source={{ uri: imgUrl + item.poster_path }}
                                style={styles.image}
                            /> : <DefaultPost style={styles.image}/>}
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
            </Link> :
            <TouchableOpacity onPress={handleSelect}>
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
                        name={addItems.includes(item) || (isIn && !outItems.includes(item)) ? "checkmark-circle" : "ellipse-outline"}
                        size={35}
                        color={Colors[colorScheme ?? 'light'].text}
                        style={{padding: 10}}
                    />
                </View>
            </TouchableOpacity>
            }</>
        );
    };
    

    return (
        <View style={styles.list}>
            <FlatList
                data={!isAdding ? movieList : movieList.filter(item => {
                    if (isMovieList && movies) {
                        return movies.find(movie => movie.item_id == item.id && movie.lists.includes(Values.seenListID)) == null;
                    } else if (!isMovieList && shows) {
                        return shows.find(show => show.item_id == item.id && show.lists.includes(Values.seenListID)) == null;
                    }
                })}
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
        height: 120,
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