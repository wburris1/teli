import { StyleSheet, Image, TouchableOpacity, Animated, Pressable, Modal, Button, ActivityIndicator, View, ScrollView, PixelRatio, Platform, TouchableWithoutFeedback, UIManager, LayoutAnimation } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import Dimensions from '@/constants/Dimensions';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/TemplateFiles/useColorScheme';
import { Link, useRouter } from 'expo-router';
import Rank, { RankItemWrapper } from './RankItem';
import { Text } from './Themed';
import Values from '@/constants/Values';
import { useData } from '@/contexts/dataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { addToBookmarked } from '@/data/addItem';
import { removeFromList } from '@/data/deleteItem';
import { CastMember, FeedPost, Post, UserItem } from '@/constants/ImportTypes';
import { ExpandableText } from './AnimatedViews.tsx/ExpandableText';
import AddToListsScreen from './AddToListsModal';
import Toast from 'react-native-toast-message';
import { CastList } from './CastList';
import { DisplayItemInfo } from './DisplayItemInfo';
import { Reccomendation } from './Reccomendation';
import { drop } from 'lodash';
import { Logo } from './LogoView';
import { useAuth } from '@/contexts/authContext';
import { FetchFollowedUsersRankings } from './Helpers/FetchFunctions';
import { ItemPostList } from './ItemPostsList';

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;

type Props = {
    item: Item
    director: CastMember | undefined
    cast: CastMember[]
    reccomendations: Item[]
    redirectLink: string
};

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ItemDetails = ({item, director, cast, reccomendations, redirectLink}: Props) => {
    const isMovie = 'title' in item ? true : false;
    const {user} = useAuth();
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
    const [followedUsersPosts, setFollowedUsersPosts] = useState<FeedPost[] | undefined>();
    const runTime = 'title' in item ? item.runtime : item.episode_run_time; 

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

    const animate = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

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

    const convertNum = (revenue: number) => {
        if (revenue > 1000000000) {
          return `$${(revenue/1000000000).toFixed(1)}B`
        } else {
          return `$${(revenue/1000000).toFixed(1)}M`
        }
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

    useEffect(() => {
      const fetchposts = async () => {
        if (!user) return;
        const adi = await FetchFollowedUsersRankings(item.id.toString(), user.uid)
        setFollowedUsersPosts(adi.sort((a, b) => b.caption.length - a.caption.length));
        animate();
      }
      fetchposts();
    }, [user])

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

    const convertRunTime = (runTime: number) => {
        return runTime < 60 ? 
        `${runTime}m` : 
        `${Math.floor(runTime / 60)}h ${runTime % 60}m`
    }

    return (
        <>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].background}]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={35} color={Colors[colorScheme ?? 'light'].text}/>
        </TouchableOpacity>
        <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background}}>
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={{position: 'absolute'}}>
                    <Image source={{ uri: imgUrl + item.backdrop_path }} style={styles.backdropImage} />
                    <LinearGradient
                        colors={['transparent', Colors[colorScheme ?? 'light'].background]}
                        style={styles.gradient}
                    />
                </View>
                <View style={[styles.info, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                    <View style={styles.posterContainer}>
                        <Image source={{ uri: imgUrl + item.poster_path }} style={[styles.image, {borderColor: Colors[colorScheme ?? 'light'].text}]} />
                    </View>
                    <View style={styles.rightInfo}>
                        <View>
                            <Text style={styles.title}>{title}</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingBottom: 5}}>
                                {runTime && (
                                <>
                                    <Text style={styles.date}>{convertRunTime(runTime)}</Text>
                                    <Ionicons name="ellipse" size={5} color={Colors[colorScheme ?? 'light'].text} style={{paddingHorizontal: 3}} />
                                </>
                                )}
                                <Text style={styles.date}>{releaseYear}</Text>
                                </View> 
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <TouchableOpacity onPress={() => setRankVisible(true)} style={{
                                flexDirection: 'row', alignItems: 'center', height: 35, borderWidth: 1.5,
                                backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 5,
                                borderColor: 'black',
                            }}>
                                <Logo width={20} height={20} />
                                <Text style={[styles.buttonText, {color: 'black', paddingLeft: 3}]}>
                                    {isDupe ? 'Rerank' : 'Rank'}
                                </Text>
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
                            {isDupe && score &&
                            <View style={{borderWidth: 1, borderRadius: 50, borderColor: Colors[colorScheme ?? 'light'].text,
                                height: 37, aspectRatio: 1, marginLeft: 5, alignItems: 'center', justifyContent: 'center'}}>
                                <Text style={{fontSize: 18, fontWeight: 'bold'}}>{score}</Text>
                            </View>} 
                        </View>
                    </View>
                </View>
                {item.overview &&
                <View style={styles.overviewContainer}>
                    {item.tagline != "" && <Text style={{fontSize: 16, textAlign: 'left', width: screenWidth, paddingHorizontal: 10, paddingBottom: 2, fontWeight: '300'}}>{item.tagline}</Text>}
                    <ExpandableText text={item.overview} maxHeight={65} textStyle={styles.overview} startExpanded={false} />
                </View>}
                {(director || item.genres) &&
                <View style={[styles.castContainer, {justifyContent: 'space-between', alignItems: 'center'}]}>
                  <View>
                    {director &&
                    <Text style={styles.directorText}>Directed by
                      <Text style={{fontWeight: '600'}}> {director.name}</Text>
                    </Text>}
                    {item.genres && 
                    <ScrollView showsHorizontalScrollIndicator={false} horizontal style=
                        {{width: item.budget && item.revenue ? screenWidth - 80 : screenWidth}}
                    >
                        <View style={styles.genreContainer} >
                        {item.genres.map(genre => (
                            <View key={genre.id} style={[styles.genreButton, {borderColor: Colors[colorScheme ?? 'light'].text,
                                backgroundColor: Colors[colorScheme ?? 'light'].gray}]}>
                                <Text style={{fontWeight: '600'}}>{genre.name}</Text>
                            </View>
                        ))}
                        </View>
                    </ScrollView>}
                  </View>
                  {item.budget && item.revenue && (
                    <View style={{marginRight: 10, alignItems: 'center', borderWidth: 0.5, width: 65,
                        borderColor: Colors[colorScheme ?? 'light'].gray, borderRadius: 10, padding: 5, justifyContent: 'center'}}>
                        <Text style={{fontSize: 12, fontWeight: '300'}}>{convertNum(item.budget)}</Text>
                        <Text style={{paddingBottom: 3, fontSize: 10, fontWeight: '300'}}>Budget</Text>
                        <Text style={{fontSize: 12, fontWeight: '300'}}>{convertNum(item.revenue)}</Text>
                        <Text style={{fontSize: 10, fontWeight: '300'}}>Revenue</Text>
                    </View>
                  )}
                </View>}
                <TouchableOpacity style={{flex: 1}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 7,  alignItems: 'center'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.castText}>Reviews</Text>
                            <Ionicons name="ellipse" size={7} color={Colors[colorScheme ?? 'light'].text} style={{paddingLeft: 5}}/>
                            <Text style={[styles.castText, { fontWeight:  'bold', paddingLeft: 5}]}>
                                {item.vote_average.toFixed(1)}
                            </Text>
                        </View>
                        
                        <View style={{flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 5}}>
                            <Text style={{fontSize: 16, fontWeight: '300'}}>
                            {item.vote_count > 500 ? `${(Math.round(item.vote_count / 1000) * 1000).toLocaleString()}+` :
                            item.vote_count.toLocaleString()}
                            </Text>
                            <Ionicons name='caret-forward' size={20} color={Colors[colorScheme ??  'light'].text} />
                        </View>
                    </View>
                </TouchableOpacity>
                {followedUsersPosts && followedUsersPosts.length > 0 &&
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{width: screenWidth, paddingHorizontal: 10, paddingBottom: 10}}>
                    {followedUsersPosts.map(post => (
                        <TouchableOpacity key={post.user_id}>
                            <ItemPostList itemPost={post} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>}
                {
                //<DisplayItemInfo item={item}></DisplayItemInfo>
                }
                <View style={styles.castContainer}>
                  <Text style={styles.castText}>Cast</Text>
                </View>
                <ScrollView style={{width: screenWidth}} horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row', justifyContent: 'flex-start'}}>
                  {cast.map((row, rowIndex) => (
                    <CastList key={rowIndex} cast={row} />
                  ))}
                  </View>
                </ScrollView>
                <View style={styles.castContainer}>
                  <Text style={styles.castText}>More Like This</Text>
                </View>

                <ScrollView style={{width: screenWidth}} horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row'}}>
                  {reccomendations.map((item, rowIndex) => (
                    <Reccomendation key={rowIndex} item={item} redirectLink={redirectLink} />
                  ))}
                  </View>
                </ScrollView>
                {Platform.OS !== 'android' &&
                  <Modal
                  animationType="fade"
                  transparent={true}
                  visible={rankVisible}
                  onRequestClose={() => setRankVisible(false)}>
                    <Rank item={item} items={seenItems} isDupe={isDupe} setDupe={setDupe} onClose={() => setRankVisible(false)} isIOS={true} />
                </Modal>
                }
            </View>
        </ScrollView>
        {listsModal()}
        {Platform.OS === 'android' && rankVisible && 
            <TouchableWithoutFeedback onPress={() => setRankVisible(false)}>
              <View style={[styles.fullScreen]}>
                  <RankItemWrapper item={item} items={seenItems} isDupe={isDupe} setDupe={setDupe} onClose={() => setRankVisible(false)}/>
              </View>
          </TouchableWithoutFeedback >
        }
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
    fullScreen: {
      position: 'absolute',  // Ensures it covers the whole screen
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',  // Ensures full width
      height: '100%',  // Ensures full height
      //backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Optional: Dim the background
      justifyContent: 'center',  // Centers content vertically
      alignItems: 'center',  // Centers content horizontally
      zIndex: 1,
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
        paddingBottom: 2,
        justifyContent: 'flex-end',
        height: 140 * 1.5, //202.5
    },
    posterContainer: {
        zIndex: 1,
        borderRadius: 5,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 1,
        shadowOpacity: 1,
        shadowColor: 'black'
    },
    image: {
        width: screenWidth/3,
        aspectRatio: 1 / 1.5,
        borderRadius: 5,
        borderWidth: 1,
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
        height: screenWidth > 400 ? 100 : 80,
    },
    title: {
        textAlign: 'right',
        fontSize: screenWidth > 400 ? 24 : 20,
        fontWeight: 'bold'
    },
    buttonText: {
        paddingHorizontal: 1,
        fontSize: screenWidth > 400 ?  22 : 18, //(Dimensions.screenWidth/1000) * 34 ,//PixelRatio.get() * 4, //16,
        fontWeight: '600',
    },
    date: {
        textAlign: 'right',
        fontSize: 14,
        alignSelf: 'flex-start'
    },
    overviewContainer: {
        width: screenWidth,
        paddingVertical: 5,
        alignItems: 'center',
        //borderBottomWidth: 1,
    },
    overview: {
        textAlign: 'left',
        fontSize: 14,
        width: screenWidth,
        paddingLeft: 10,
        paddingRight: 10,
    },
    genreContainer: {
        flexDirection: 'row',
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
  },
  directorText: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '300', 
    paddingLeft: 10,
    paddingBottom: 0
  }
});

export default ItemDetails;