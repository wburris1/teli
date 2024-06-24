import { StyleSheet, Image, TouchableOpacity, Animated, Pressable, Modal, Button, ActivityIndicator, View, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/TemplateFiles/useColorScheme';
import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Rank from './RankItem';
import { Text } from './Themed';
import { getDataLocally } from '@/data/userLocalData';
import { useAuth } from '@/contexts/authContext';
import Values from '@/constants/Values';
import { useData } from '@/contexts/dataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { addToBookmarked } from '@/data/addItem';
import { removeFromList } from '@/data/deleteItem';
import { UserItem } from '@/constants/ImportTypes';
import { ExpandableText } from './AnimatedViews.tsx/ExpandableText';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

type Props = {
    item: Item
};

const ItemDetails = ({item}: Props) => {
    const { user } = useAuth();
    const isMovie = 'title' in item ? true : false;
    const listID = Values.seenListID;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    const [items, setItems] = useState<UserItem[]>([]);
    const { refreshFlag, refreshListFlag } = useData();
    const [isDupe, setDupe] = useState(false);
    const [rankButtonLoading, setRankButtonLoading] = useState(true);
    const [rankVisible, setRankVisible] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const router = useRouter();
    const bookmarkFunc = addToBookmarked();
    const removeFunc = removeFromList();
    const [score, setScore] = useState("");

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

    function checkDupe(localItems: UserItem[]) {
        var exists = false;
        if (item && localItems) {
          localItems.forEach(seenItem => {
            if (seenItem.item_id == item.id) {
              exists = true;
              if (seenItem.score <= 10 && seenItem.score >= 0) {
                setScore(seenItem.score.toFixed(1));
              }
            }
          });
        }
        return exists;
    }

    useEffect(() => {
        getDataLocally(`items_${user!.uid}_${listTypeID}_${listID}`).then(localItems => {
          setItems(localItems);
          if (checkDupe(localItems)) {
            setDupe(true);
          } else {
            setDupe(false);
          }
          setRankButtonLoading(false);
        })
      }, [refreshFlag, refreshListFlag])

    return (
        <>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].background}]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={35} color={Colors[colorScheme ?? 'light'].text}/>
        </TouchableOpacity>
        <ScrollView style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background}}>
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={{position: 'absolute'}}>
                    <Image source={{ uri: imgUrl + item.backdrop_path }} style={styles.backdropImage} />
                    <LinearGradient
                        colors={['transparent', Colors[colorScheme ?? 'light'].background]}
                        style={styles.gradient}
                    />
                </View>
                <View style={[styles.info, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                    <View style={[styles.posterContainer, {borderColor: Colors[colorScheme ?? 'light'].text, shadowColor: Colors[colorScheme ?? 'light'].background}]}>
                        <Image source={{ uri: imgUrl + item.poster_path }} style={styles.image} />
                    </View>
                    <View style={styles.rightInfo}>
                        <View>
                            <Text style={styles.title}>{title}</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                <Text style={styles.date}>{releaseYear}</Text> 
                                {isDupe && score &&
                                    <View style={{borderWidth: 1, borderRadius: 50, borderColor: Colors[colorScheme ?? 'light'].text, padding: 5, marginLeft: 8, marginVertical: 3,}}>
                                        <Text style={{fontSize: 22, fontWeight: '600', paddingVertical: 3}}>{score}</Text>
                                    </View>} 
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 5 }}>
                            {rankButtonLoading && <View style={styles.addButton}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>}
                            {!rankButtonLoading &&
                            <TouchableOpacity onPress={() => setRankVisible(true)} style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].text }]}>
                                <Ionicons
                                name={isDupe ? "refresh" : "add"}
                                size={30}
                                color={Colors[colorScheme ?? 'light'].background}
                                />
                                <Text style={[styles.buttonText, { color: Colors[colorScheme ?? 'light'].background }]}>{isDupe ? "Rerank" : "Seen"}</Text>
                            </TouchableOpacity>}
                            {!rankButtonLoading && !isDupe &&
                            <TouchableOpacity onPress={() => {
                                    if (!bookmarked) {
                                        bookmarkFunc(item, isMovie).then(() => {
                                            setBookmarked(true);
                                        })
                                    } else {
                                        removeFunc(Values.bookmarkListID, listTypeID, item.id.toString()).then(() => {
                                            setBookmarked(false);
                                        })
                                    }
                                }}
                                style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].text }]}
                            >
                                <Ionicons
                                name={bookmarked ? "bookmark" : "bookmark-outline"}
                                size={30}
                                color={Colors[colorScheme ?? 'light'].background}
                                />
                                <Text style={[styles.buttonText, { color: Colors[colorScheme ?? 'light'].background }]}>{bookmarked ? "Bookmarked" : "Bookmark"}</Text>
                            </TouchableOpacity>}
                        </View>
                    </View>
                </View>
                <View style={styles.overviewContainer}>
                    {item.tagline != "" && <Text style={{fontSize: 17, textAlign: 'left', width: screenWidth, paddingHorizontal: 10, paddingBottom: 2, fontWeight: '300'}}>{item.tagline}</Text>}
                    <ExpandableText text={item.overview} maxHeight={65} textStyle={styles.overview} />
                </View>
                <View style={styles.genreContainer}>
                    {item.genres.map(genre => (
                        <View key={genre.id} style={[styles.genreButton, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                            <Text>{genre.name}</Text>
                        </View>
                    ))}
                </View>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={rankVisible}
                    onRequestClose={() => setRankVisible(false)}
                >
                    <Rank item={item} items={items} isDupe={isDupe} setDupe={setDupe} onClose={() => setRankVisible(false)} />
                </Modal>
            </View>
        </ScrollView>
        </>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
    },
    backButton: {
        position: 'absolute',
        zIndex: 1,
        top: 50,
        left: 10,
        borderWidth: 2,
        borderRadius: 50,
        padding: 1,
    },
    info: {
        marginTop: (screenWidth / 1.5) - 120,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: screenWidth,
        paddingLeft: 10,
        paddingRight: 0,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    rightInfo: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
        justifyContent: 'flex-end',
        height: 130 * 1.5,
    },
    posterContainer: {
        zIndex: 1,
        borderRadius: 5,
        borderWidth: 1,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 1,
        shadowOpacity: 1,
    },
    image: {
        width: 130,
        aspectRatio: 1 / 1.5,
        borderRadius: 5,
        //borderWidth: 0.5,
    },
    backdropImage: {
        width: screenWidth,
        aspectRatio: 1.5,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    title: {
        textAlign: 'right',
        paddingVertical: 5,
        fontSize: 24,
        fontWeight: 'bold'
    },
    buttonText: {
        paddingHorizontal: 5,
        fontSize: 16,
        fontWeight: '600',
    },
    date: {
        textAlign: 'right',
        paddingVertical: 2,
        fontSize: 14,
        alignSelf: 'flex-start'
    },
    overviewContainer: {
        width: screenWidth,
        paddingVertical: 5,
        paddingLeft: 10,
        paddingRight: 10,
        alignItems: 'center',
        //borderBottomWidth: 1,
    },
    overview: {
        textAlign: 'left',
        fontSize: 14,
    },
    genreContainer: {
        flexDirection: 'row',
        width: screenWidth,
        alignItems: 'center',
        padding: 5,
    },
    genreButton: {
        borderRadius: 50,
        padding: 5,
        borderWidth: 1,
        margin: 2.5,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 50,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginLeft: 5,
    },
});

export default ItemDetails;