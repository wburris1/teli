import { StyleSheet, Image, TouchableOpacity, Animated, Pressable, Modal, Button, ActivityIndicator, View, ScrollView, PixelRatio } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/TemplateFiles/useColorScheme';
import { Link, useRouter } from 'expo-router';
import Rank from './RankItem';
import { Text } from './Themed';
import Values from '@/constants/Values';
import { useData } from '@/contexts/dataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { addToBookmarked } from '@/data/addItem';
import { removeFromList } from '@/data/deleteItem';
import { CastMember, UserItem } from '@/constants/ImportTypes';
import { ExpandableText } from './AnimatedViews.tsx/ExpandableText';
import AddToListsScreen from './AddToListsModal';
import Toast from 'react-native-toast-message';
import { CastList } from './CastList';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

type Props = {
    item: Item
    cast: CastMember[]
};

const ItemDetails = ({item, cast}: Props) => {
    const isMovie = 'title' in item ? true : false;
    const listID = Values.seenListID;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    //const [items, setItems] = useState<UserItem[]>([]);
    const { refreshFlag, refreshListFlag, movies, shows } = useData();
    const [isDupe, setDupe] = useState(false);
    //const [rankButtonLoading, setRankButtonLoading] = useState(true);
    const [rankVisible, setRankVisible] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const router = useRouter();
    const bookmarkFunc = addToBookmarked();
    const removeFunc = removeFromList();
    const [score, setScore] = useState("");
    const [seenItems, setSeenItems] = useState<UserItem[]>([]);
    const [listsModalVisible, setListsModalVisible] = useState(false);

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

    const filterByList = (toFilter: UserItem[]) => {
        return toFilter.filter(item => item.lists.includes(Values.seenListID));
    }

    useEffect(() => {
        const items = filterByList(movies && listTypeID == Values.movieListsID ? movies :
            (shows && listTypeID == Values.tvListsID ? shows : []))
        setSeenItems(items);
        setDupe(checkDupe(items));
        if (movies && shows) {
            const itemData = isMovie ? movies.find(movie => movie.item_id == item.id) : shows.find(show => show.item_id == item.id);
            if (itemData) {
                setBookmarked(itemData.lists.includes(Values.bookmarkListID));
            }
        }
    }, [movies, shows, refreshFlag])

    const listsModal = useCallback(() => {
        const isNew = isMovie && movies ? !movies.find(movie => movie.item_id == item.id) :
            (!isMovie && shows ? !shows.find(show => show.item_id == item.id) : false);
        return (
            <Modal
            animationType="slide"
            transparent={true}
            visible={listsModalVisible}
            onRequestClose={() => setListsModalVisible(false)}
            >
            <AddToListsScreen item_id={item.id.toString()} 
                item_name={isMovie ? item.title : item.name}
                newItem={isNew ? item : null}
                listTypeID={listTypeID} 
                isRanking={false} 
                onClose={() => setListsModalVisible(false)} 
                onSelectedListsChange = {() => {}}
                isWatched={isDupe}
            />
            </Modal>
        )
    }, [movies, shows, listsModalVisible])

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
                                    <View style={{borderWidth: 1, borderRadius: 50, borderColor: Colors[colorScheme ?? 'light'].text,
                                        height: 45, aspectRatio: 1, marginLeft: 8, marginVertical: 3, alignItems: 'center', justifyContent: 'center'}}>
                                        <Text style={{fontSize: 22, fontWeight: '600'}}>{score}</Text>
                                    </View>} 
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 0 }}>
                            <TouchableOpacity onPress={() => setRankVisible(true)} style={{}}>
                                <Ionicons
                                name={isDupe ? "eye" : "eye-outline"}
                                size={35}
                                color={Colors[colorScheme ?? 'light'].text}
                                />
                            </TouchableOpacity>
                            {((isMovie && movies) || (!isMovie && shows)) && !isDupe &&
                            <TouchableOpacity onPress={() => {
                                    if (!bookmarked) {
                                        setBookmarked(true);
                                        bookmarkFunc(item, isMovie).then(() => {
                                          Toast.show({
                                            type: 'info',
                                            text1: "Added to bookmarks",
                                            text2: (isMovie ? item.title : item.name) + " has been added to your bookmarks",
                                            position: "bottom",
                                            visibilityTime: 3000,
                                            bottomOffset: 100
                                          });
                                        });
                                    } else {
                                        setBookmarked(false);
                                        removeFunc(Values.bookmarkListID, listTypeID, item.id.toString()).then(() => {
                                          Toast.show({
                                            type: 'info',
                                            text1: "Removed from bookmarks",
                                            text2: (isMovie ? item.title : item.name) + " has been removed from your bookmarks",
                                            position: "bottom",
                                            visibilityTime: 3000,
                                            bottomOffset: 100
                                          });
                                        })
                                    }
                                }}
                                style={{ paddingLeft: 5 }}
                            >
                                <Ionicons
                                name={bookmarked ? "bookmark" : "bookmark-outline"}
                                size={30}
                                color={Colors[colorScheme ?? 'light'].text}
                                />
                            </TouchableOpacity>}
                            <TouchableOpacity onPress={() => setListsModalVisible(true)} style={{paddingLeft: 5}}>
                                <Ionicons
                                    name={"add-circle-outline"}
                                    size={35}
                                    color={Colors[colorScheme ?? 'light'].text}
                                />
                            </TouchableOpacity>
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
                <View style={styles.castContainer}>
                  <Text style={styles.castText}>Cast</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row'}}>
                  {cast.map((row, rowIndex) => (
                    <CastList key={rowIndex} cast={row} />
                  ))}
                  </View>
                </ScrollView>
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={rankVisible}
                  onRequestClose={() => setRankVisible(false)}>
                    <Rank item={item} items={seenItems} isDupe={isDupe} setDupe={setDupe} onClose={() => setRankVisible(false)} />
                </Modal>
            </View>
        </ScrollView>
        {listsModal()}
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
        height: 140 * 1.5, //202.5
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
        width: screenWidth/3,
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
        fontSize: screenWidth > 400 ? 24 : 20,
        fontWeight: 'bold'
    },
    buttonText: {
        paddingHorizontal: 1,
        fontSize: screenWidth > 400 ?  16 : 12, //(Dimensions.screenWidth/1000) * 34 ,//PixelRatio.get() * 4, //16,
        fontWeight: '600',
    },
    date: {
        textAlign: 'right',
        paddingBottom: 10,
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
        paddingLeft: 5
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
  castContainer: {
    flexDirection: 'row',
    width: screenWidth,
    alignItems: 'center',
  },
  castText: {
      textAlign: 'left',
      fontSize: screenWidth > 400 ? 24 : 20,
      fontWeight: 'bold', 
      paddingLeft: 10, // Ensure padding on the left to align with the rest of the content
  }
});

export default ItemDetails;