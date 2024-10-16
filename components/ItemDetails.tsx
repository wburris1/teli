import { View, StyleSheet, Image, TouchableOpacity, Animated, Pressable, Modal, Button, ActivityIndicator, ScrollView, PixelRatio, Platform, TouchableWithoutFeedback, UIManager, LayoutAnimation, InteractionManager, SafeAreaView } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
import { CastMember, FeedPost, UserItem } from '@/constants/ImportTypes';
import { ExpandableText } from './AnimatedViews.tsx/ExpandableText';
import AddToListsScreen from './AddToListsModal';
import Toast from 'react-native-toast-message';
import { CastList } from './CastList';
import { DisplayItemInfo } from './DisplayItemInfo';
import { Reccomendation } from './Reccomendation';
import { drop, groupBy } from 'lodash';
import { DefaultPost, Logo } from './LogoView';
import { useAuth } from '@/contexts/authContext';
import { FetchFollowedUsersRankings } from './Helpers/FetchFunctions';
import { ItemPostList } from './ItemPostsList';
import { WritePost } from './WritePost';
import { StreamingService } from '@/data/itemData';
import Spinner from 'react-native-loading-spinner-overlay';
import { Asset } from 'expo-asset';

const logoImgUrl = 'https://image.tmdb.org/t/p/w200';
const imgUrl = 'https://image.tmdb.org/t/p/w500';
const imgUrl780 = 'https://image.tmdb.org/t/p/w780';

const screenWidth = Dimensions.screenWidth;
const screenHeight = Dimensions.screenHeight;
const overViewFontSize = screenWidth * 0.03255814; // fontsize 14
const titleFontSize = screenWidth > 400 ? 24 : 20 // screenWidth * 0.05581395; // fontsize 24
const directorFontSize = screenWidth * 0.0372093; // fontsize 16
const rerankButtonFontSize = screenWidth > 400 ? 20 : 18  // fontsize 22
const logoWidthHeight = screenWidth > 400 ? 20 : 18;
const budgetNumFontSize = screenWidth * 0.02790698; // fontsize 12
const budgetTextFontSize = screenWidth * 0.02325581 // fontsize 10
const genreFontSize = screenWidth > 400 ? overViewFontSize : 12;

type Props = {
    item: Item
    director: CastMember | undefined
    cast: CastMember[]
    recomendations: Item[]
    streamingServices: StreamingService[]
    redirectLink: string
};

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ItemDetails = ({item, director, cast, recomendations, streamingServices, redirectLink}: Props) => {
    const isMovie = 'title' in item ? true : false;
    const {user} = useAuth();
    const listID = Values.seenListID;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    //const [items, setItems] = useState<UserItem[]>([]);
    const { refreshFlag, refreshListFlag, movies, shows, following } = useData();
    const [isDupe, setDupe] = useState(false);
    const [dupePostID, setDupePostID] = useState("");
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
    const [postModalVisible, setPostModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [storedPoster, setStoredPoster] = useState<any>();
    const [storedBackdrop, setStoredBackdrop] = useState<any>();
    const [imagesReady, setImagesReady] = useState(false);
    const lastPress = useRef<NodeJS.Timeout | null>(null); // timer for last bookmark press
    const updateBookmark = useRef(false); // useRef to track the number of presses. if user preses bookmark twice or 4 times in short span than we don't want to do anything

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

    const handleBookmarkPress = () => {
      Toast.show({
        type: 'info',
        text1: `${!bookmarked ? 'Added to' : 'Removed from'} bookmarks`,
        text2: (isMovie ? item.title : item.name) + ` has been ${!bookmarked ? 'added to' : 'removed from'} bookmarks`,
        position: "bottom",
        visibilityTime: 3000,
        bottomOffset: 100
      })
      updateBookmark.current = !updateBookmark.current
      // Clear previous timer if there's any
      if (lastPress.current) {
        clearTimeout(lastPress.current);
      }
      // Set a new timer for debounce
      lastPress.current = setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          if (!bookmarked && updateBookmark.current) {
            bookmarkFunc(item, isMovie); // this makes ui lag for a little because we use SetMovies
            updateBookmark.current = !updateBookmark.current
          } else if (bookmarked && updateBookmark.current) {
            removeFunc(Values.bookmarkListID, listTypeID, item.id.toString()); //this makes ui lag for a little because we use SetMovies
            updateBookmark.current = !updateBookmark.current
          }
        });
      }, 750); // Debounce time 
    };
 
    function checkDupe(localItems: UserItem[]) {
        var exists = false;
        if (item && localItems) {
          localItems.forEach(seenItem => {
            if (seenItem.item_id == item.id.toString()) {
              exists = true;
              if (seenItem.score <= 10 && seenItem.score >= 0) {
                setScore(seenItem.score == 10 ? '10' : seenItem.score.toFixed(1));
                setDupePostID(seenItem.post_id);
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
          const billionRevenue = revenue / 1000000000;
          return `$${billionRevenue % 1 === 0 ? billionRevenue.toFixed(0) : billionRevenue.toFixed(1)}B`
        } else {
          const millionRevenue = revenue / 1000000;
          return `$${millionRevenue % 1 === 0 ?millionRevenue.toFixed(0) : millionRevenue.toFixed(1)}M`
        }
    }

    useEffect(() => {
        const prefetchPoster = async () => {
            const imageAsset = await Asset.fromURI(imgUrl + item.poster_path).downloadAsync();
            setStoredPoster(imageAsset.localUri);
        }
        const prefetchBackdrop = async () => {
            const imageAsset = await Asset.fromURI(imgUrl780 + item.backdrop_path).downloadAsync();
            setStoredBackdrop(imageAsset.localUri);
        }
        
        prefetchPoster();
        prefetchBackdrop();
    }, [item])

    useEffect(() => {
        if (storedPoster != undefined && storedBackdrop != undefined) setImagesReady(true);
    }, [storedPoster, storedBackdrop])

    useEffect(() => {
        const items = filterByList(movies && listTypeID == Values.movieListsID ? movies :
            (shows && listTypeID == Values.tvListsID ? shows : []))
        setSeenItems(items);
        setDupe(checkDupe(items));
        if (movies && shows) {
            const itemData = isMovie ? movies.find(movie => movie.item_id == item.id.toString() && movie.score != -1) : shows.find(show => show.item_id == item.id.toString() && show.score != -1);
            if (itemData) {
                setBookmarked(itemData.lists.includes(Values.bookmarkListID));
            }
        }
        setLoading(false);
    }, [movies, shows]) // this dependency array used to be movies, shows, refreshFlag

    useEffect(() => {
      const fetchposts = async () => {
        if (!user) return;
        const adi = await FetchFollowedUsersRankings(item.id.toString(), user.uid, following || [])
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
    const checkRunTime = (runTime: number) => {
        return !!(runTime && runTime > 0)
    }
    
    const checkRevBudget = ({ budget, revenue }: Item): boolean => {
      return !!(budget && revenue && budget > 0 && revenue > 0)
    }

    const getPressableStyle = ({ pressed } : {pressed : boolean}) => ({
        opacity: pressed ? 0.5 : 1.0,
    });

    const detailModalCallback = useCallback(() => {
        return (
        <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
        >
            <Pressable style={styles.overlay} onPress={() => setDetailModalVisible(false)}>
                <Pressable style={[styles.tabContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text, borderBottomWidth: 0 }]} onPress={(e) => e.stopPropagation()}>
                    <View style={{width: '100%'}}>
                        <Pressable onPress={() => setPostModalVisible(true)}
                        style={getPressableStyle}>
                            <View style={[styles.tab, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                                <Ionicons name="pencil" size={30} color={Colors[colorScheme ?? 'light'].text} style={styles.icon}/>
                                <Text style={styles.tabTitle}>Make Post</Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{width: '100%'}}>
                        <Pressable onPress={() => setListsModalVisible(true)}
                        style={getPressableStyle}>
                            <View style={[styles.tab, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                                <Ionicons name="add" size={35} color={Colors[colorScheme ?? 'light'].text} style={styles.icon}/>
                                <Text style={styles.tabTitle}>Add To List</Text>
                            </View>
                        </Pressable>
                    </View>
                    <View style={{width: '100%'}}>
                        <Pressable onPress={() => setDetailModalVisible(false)}
                        style={getPressableStyle}>
                            <View style={[styles.tab, {borderBottomWidth: 0,}]}>
                                <Ionicons name="close" size={30} color={Colors[colorScheme ?? 'light'].text} style={styles.icon}/>
                                <Text style={styles.tabTitle}>Close</Text>
                            </View>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
            {listsModal()}
            <Modal
            animationType="slide"
            transparent={true}
            visible={postModalVisible}
            onRequestClose={() => setPostModalVisible(false)}
            >
            <WritePost id={item.id} name={isMovie ? item.title : item.name}
                poster={item.poster_path} groupKey={isMovie ? "movies" : "shows"} isHome={false}
                onClose={() => setPostModalVisible(false)} backdrop={item.backdrop_path}
                runtime={isMovie ? item.runtime : item.episode_run_time} />
            </Modal>
        </Modal>
        )
    }, [detailModalVisible, listsModalVisible, postModalVisible, item, ])

    if (!imagesReady) {
        return (
            <View style={{width: screenWidth, height: screenHeight, justifyContent: 'center', backgroundColor: Colors[colorScheme ?? 'light'].background}}>
                <ActivityIndicator size="large" color={Colors['loading']}/>
            </View>
        )
    }

    return (
        <>
        <SafeAreaView style={{flexDirection: 'row', position: 'absolute', top: 10, justifyContent: 'space-between', zIndex: 2, backgroundColor: 'transparent', alignItems: 'center', width: screenWidth}}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.7)', left: 10}]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={35} color={'black'}/>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.7)', right: 10}]} onPress={() => setDetailModalVisible(true)}>
            <Ionicons name="ellipsis-horizontal" size={35} color={'black'}/>
        </TouchableOpacity>
        </SafeAreaView>
        <View>
            <Spinner visible={loading} color={Colors['loading']} />
        {detailModalCallback()}
        
        <ScrollView showsVerticalScrollIndicator={false} style={{flex: 1, backgroundColor: Colors[colorScheme ?? 'light'].background}}>
            <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                <View style={{position: 'absolute'}}>
                    <Image source={item.backdrop_path ? { uri: storedBackdrop } :
                      require('../assets/images/download2.jpg')} style={styles.backdropImage} />
                    <LinearGradient
                        colors={['transparent', Colors[colorScheme ?? 'light'].background]}
                        style={styles.gradient}
                    />
                </View>
                <View style={[styles.info, {borderBottomColor: Colors[colorScheme ?? 'light'].text}]}>
                    <View style={styles.posterContainer}>
                    {item.poster_path ? 
                            <Image
                                source={{ uri: storedPoster }}
                                style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text }]}
                                /> : <DefaultPost style={[styles.image, { borderColor: Colors[colorScheme ?? 'light'].text, overflow: 'hidden' }]}/>}
                        
                    </View>
                    <View style={styles.rightInfo}>
                        <View>
                            <Text style={[styles.title, {paddingBottom: (releaseYear || checkRunTime(runTime)) ? 0 : 5}]}>{title}</Text>
                            {(releaseYear || checkRunTime(runTime)) && <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingBottom: 5}}>
                                {checkRunTime(runTime) && (
                                <>
                                    <Text style={styles.date}>{convertRunTime(runTime)}</Text>
                                    <Ionicons name="ellipse" size={5} color={Colors[colorScheme ?? 'light'].text} style={{paddingHorizontal: 3}} />
                                </>
                                )}
                                <Text style={styles.date}>{releaseYear}</Text>
                                </View> 
                            </View>}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <TouchableOpacity onPress={() => setRankVisible(true)} style={{
                                flexDirection: 'row', alignItems: 'center', height: 35, borderWidth: 1.5,
                                backgroundColor: colorScheme === 'light' ? 'white' : 'black', borderRadius: 20, paddingHorizontal: 5,
                                borderColor: Colors['theme'],
                            }}>
                                {<Logo width={logoWidthHeight} height={logoWidthHeight} />
                                }
                                <Text style={[styles.buttonText, {color: colorScheme === 'light' ? 'black' : 'white', paddingLeft: 5}]}>
                                    {isDupe ? 'Rerank' : 'Rank'}
                                </Text>
                            </TouchableOpacity>
                            {((isMovie && movies) || (!isMovie && shows)) && !isDupe &&
                            <TouchableOpacity style={{paddingLeft: 5}} onPress={() => {
                              setBookmarked((prev) => !prev)
                              handleBookmarkPress();
                              }}>
                                <Ionicons
                                name={bookmarked ? "bookmark" : "bookmark-outline"}
                                size={30}
                                color={Colors['theme']}
                                />
                            </TouchableOpacity>}
                            {isDupe && score &&
                            <View style={{borderWidth: 2, borderRadius: 50, borderColor: Colors['theme'],
                                height: 37, aspectRatio: 1, marginLeft: 5, alignItems: 'center', justifyContent: 'center'}}>
                                <Text style={{fontSize: rerankButtonFontSize, fontWeight: 'bold'}}>{score}</Text>
                            </View>} 
                        </View>
                    </View>
                </View>
                <LinearGradient
                    colors={[Colors[colorScheme ?? 'light'].gray, colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent']}
                    style={{height: 10, zIndex: 1, width: Dimensions.screenWidth}}
                />
                {item.overview &&
                <View style={styles.overviewContainer}>
                    {item.tagline != "" && <Text style={{fontSize: directorFontSize, textAlign: 'left', width: screenWidth, paddingHorizontal: 10, paddingBottom: 5, fontWeight: '600', color: Colors[colorScheme == 'light' ? 'dark' : 'light'].gray}}>{item.tagline}</Text>}
                    <ExpandableText text={item.overview} maxHeight={65} textStyle={styles.overview} startExpanded={false} isDesc={true}/>
                </View>}
                {(director || item.genres) &&
                <View style={[styles.castContainer, {justifyContent: 'space-between', alignItems: 'center'}]}>
                  <View>
                    {director &&
                    <Text style={[styles.directorText, {paddingBottom: checkRevBudget(item) ? 0 : (item.genres.length == 0 ? 0 : 5), paddingTop: item.overview ? 0 : 10}]}>Directed by
                      <Text style={{fontWeight: '600'}}> {director.name}</Text>
                    </Text>}
                    {item.genres && item.genres.length > 0 &&
                    <ScrollView showsHorizontalScrollIndicator={false} horizontal style=
                        {{width: checkRevBudget(item) ? screenWidth - 80 : screenWidth}}
                    >
                        <View style={styles.genreContainer} >
                        {item.genres.map(genre => (
                            <View key={genre.id} style={[styles.genreButton, {borderColor: Colors[colorScheme ?? 'light'].text,
                                backgroundColor: Colors[colorScheme ?? 'light'].gray}]}>
                                <Text style={{fontWeight: '600', fontSize: genreFontSize}}>{genre.name}</Text>
                            </View>
                        ))}
                        </View>
                    </ScrollView>}
                  </View>
                  {checkRevBudget(item) && (
                    <View style={{marginRight: 10, alignItems: 'center', borderWidth: 0.5, width: screenWidth > 400 ? 63 : 68, // don't change this width -adi
                        borderColor: Colors[colorScheme ?? 'light'].gray, borderRadius: 10, padding: 5, justifyContent: 'center'}}>
                        <Text style={{fontSize: budgetNumFontSize, fontWeight: '300'}}>{convertNum(item.budget)}</Text>
                        <Text style={{paddingBottom: 3, fontSize: budgetTextFontSize, fontWeight: '300'}}>Budget</Text>
                        <Text style={{fontSize: budgetNumFontSize, fontWeight: '300'}}>{convertNum(item.revenue)}</Text>
                        <Text style={{fontSize: budgetTextFontSize, fontWeight: '300'}}>Revenue</Text>
                    </View>
                  )}
                </View>}
                <Link href={{pathname: redirectLink + '_discussion' as any, params: { itemID: item.id, name: isMovie ? item.title : item.name, poster: item.poster_path,
                    backdrop: item.backdrop_path, runtime: isMovie ? item.runtime : item.episode_run_time, groupKey: isMovie ? 'movies' : 'shows'
                 }}} asChild>
                    <TouchableOpacity style={{flex: 1, justifyContent: 'flex-start', width: '100%'}}>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-start', width: '100%', paddingVertical: 7,  alignItems: 'center'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={styles.castText}>Reviews</Text>
                                {item.vote_average > 0 && <>
                                <Ionicons name="ellipse" size={7} color={Colors[colorScheme ?? 'light'].text} style={{paddingLeft: 5}}/>
                                <Text style={[styles.castText, { fontWeight:  'bold', paddingLeft: 5}]}>
                                    {item.vote_average.toFixed(1)}
                                </Text></>}
                            </View>
                        </View>
                    </TouchableOpacity>
                </Link>
                {followedUsersPosts && followedUsersPosts.length > 0 &&
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{width: screenWidth, paddingHorizontal: 10, paddingBottom: 10}}>
                    {followedUsersPosts.map((post, index) => (
                        <Link href={{pathname: redirectLink + '_post' as any, params: { postID: post.post_id }}} key={index} asChild>
                        <TouchableOpacity key={index}>
                            <ItemPostList itemPost={post} redirectLink={redirectLink}/>
                        </TouchableOpacity>
                        </Link>
                    ))}
                </ScrollView>}
                <Link href={{pathname: redirectLink + '_discussion' as any, params: { itemID: item.id, name: isMovie ? item.title : item.name, poster: item.poster_path,
                    backdrop: item.backdrop_path, runtime: isMovie ? item.runtime : item.episode_run_time, groupKey: isMovie ? 'movies' : 'shows' }}} asChild>
                    <TouchableOpacity style={{flex: 1, borderColor: Colors[colorScheme ?? 'light'].gray, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 10, marginTop: (followedUsersPosts || []).length > 0 ? 5 : 0}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, alignItems: 'center'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10}}>
                                <Ionicons name="chatbubbles-outline" size={30} color={Colors[colorScheme ?? 'light'].text} />
                                <Text style={{fontSize: 20, fontWeight: '600', paddingLeft: 5}}>Discussion</Text>
                            </View>
                            
                            <View style={{flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 5}}>
                                <Ionicons name='chevron-forward' size={20} color={Colors[colorScheme ??  'light'].text} style={{paddingLeft: 0}} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </Link>
                {streamingServices && streamingServices.length > 0 && (
                    <>
                    <View style={styles.castContainer}>
                        <Text style={styles.castText}>Streaming</Text>
                    </View>
                    <ScrollView style={{width: screenWidth, marginHorizontal: 10}} horizontal showsHorizontalScrollIndicator={false}>
                    {streamingServices.map((row, rowIndex) => (
                      <View key={rowIndex} style={{marginLeft: 10, marginVertical: 10, alignItems: 'center', borderWidth: 0.5, borderColor: 'gray', borderRadius: 10, overflow: 'hidden'}}>
                        <Image source={{uri: logoImgUrl + row.logo_path}} style={{height: 50, aspectRatio: 1, borderRadius: 10}} />
                      </View>
                    ))}
                    </ScrollView>
                    </>
                )}
                {cast && cast.length > 0 && <>
                <View style={styles.castContainer}>
                  <Text style={styles.castText}>Cast</Text>
                </View>
                <ScrollView style={{width: screenWidth}} horizontal showsHorizontalScrollIndicator={false}>
                  {cast.map((row, rowIndex) => (
                    <CastList key={rowIndex} cast={row} />
                  ))}
                </ScrollView></>}
                {recomendations && recomendations.length > 0 && <>
                <View style={styles.castContainer}>
                  <Text style={styles.castText}>More Like This</Text>
                </View>

                <ScrollView style={{width: screenWidth}} horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row'}}>
                  {recomendations.map((item, rowIndex) => (
                    <Reccomendation key={rowIndex} item={item} redirectLink={redirectLink} />
                  ))}
                  </View>
                </ScrollView>
                </>}
                {Platform.OS !== 'android' &&
                  <Modal
                  animationType="fade"
                  transparent={true}
                  visible={rankVisible}
                  onRequestClose={() => setRankVisible(false)}>
                    <Rank item={item} items={seenItems} isDupe={isDupe} setDupe={setDupe} onClose={() => setRankVisible(false)} isIOS={true} dupePostID={dupePostID} poster={storedPoster} />
                </Modal>
                }
            </View>
        </ScrollView>
        {Platform.OS === 'android' && rankVisible && 
            <TouchableWithoutFeedback onPress={() => setRankVisible(false)}>
              <View style={[styles.fullScreen]}>
                  <RankItemWrapper item={item} items={seenItems} isDupe={isDupe} setDupe={setDupe} onClose={() => setRankVisible(false)} dupePostID={dupePostID} poster={storedPoster} />
              </View>
          </TouchableWithoutFeedback >
        }
        </View>
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
        zIndex: 1,
        borderWidth: 2,
        borderRadius: 50,
        padding: 1,
    },
    info: {
        marginTop: (screenWidth / 1.5) - 110,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: screenWidth,
        paddingLeft: 10,
        paddingRight: 0,
        paddingTop: 10,
        paddingBottom: 10,
    },
    rightInfo: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        justifyContent: 'flex-end',
        height: (screenWidth / 3) * 1.5, //202.5
    },
    posterContainer: {
        zIndex: 1,
        borderRadius: 5,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 1,
        shadowOpacity: 1,
        shadowColor: 'black',
        alignSelf: 'flex-end'
    },
    image: {
        height: screenHeight * 0.2306867, //  215,
        width: screenWidth/3,
        aspectRatio: 1 / 1.5,
        borderRadius: 5,
        borderWidth: 1,
        marginRight: 1,
        //borderWidth: 0.5,
    },
    backdropImage: {
      height: '100%',
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
        fontSize: titleFontSize, 
        fontWeight: 'bold'
    },
    buttonText: {
        paddingHorizontal: 1,
        fontSize: rerankButtonFontSize,
        fontWeight: '600',
    },
    date: {
        textAlign: 'right',
        fontSize: overViewFontSize, 
        alignSelf: 'flex-start'
    },
    overviewContainer: {
        width: screenWidth,
        paddingBottom: 5,
        alignItems: 'center',
        //borderBottomWidth: 1,
    },
    overview: {
        textAlign: 'left',
        fontSize: overViewFontSize,
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
      fontSize: titleFontSize,
      fontWeight: 'bold', 
      paddingLeft: 10, // Ensure padding on the left to align with the rest of the content
  },
  directorText: {
    textAlign: 'left',
    fontSize: directorFontSize,
    fontWeight: '300', 
    paddingLeft: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    tabContainer: {
        flex: 1,
        alignSelf: 'center',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        marginTop: (Dimensions.screenHeight * .6452) + (Dimensions.screenHeight / 12),
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 0.5,
        marginBottom: 0,
    },
    tab: {
        flexDirection: 'row',
        width: '100%',
        borderBottomWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: Dimensions.screenHeight / 12,
    },
    tabTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    icon: {
        position: 'absolute',
        left: 10,
        top: Dimensions.screenHeight / 48,
    },
});

export default ItemDetails;