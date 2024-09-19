import { AppNotification, FeedPost, NotificationType } from "@/constants/ImportTypes";
import { Timestamp, addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import Values from "@/constants/Values";
import { formatDate } from "./Helpers/FormatDate";
import { ExpandableText } from "./AnimatedViews.tsx/ExpandableText";
import { Link, useRouter } from "expo-router";
import React from "react";
import { createNotification } from "./Helpers/CreatePlusAddNotification";
import { checkShouldSendNotification, sendPushNotification } from "./Helpers/sendNotification";
import { useData } from "@/contexts/dataContext";
import Dimensions from "@/constants/Dimensions";
import { LinearGradient } from "expo-linear-gradient";
import { getUserData } from "./Helpers/FetchFunctions";
import { DefaultPost } from "./LogoView";

const imgUrl = 'https://image.tmdb.org/t/p/w342';
const db = FIREBASE_DB;

type PostFeedProps = {
  item: any;
  index: number;
  handleComments: (show: boolean, post: FeedPost) => void;
  handleLikes: (show: boolean, post: FeedPost) => void;
  redirectLink?: string; // Optional parameter with default value
  incrementComment: boolean,
  isPostPage?: boolean,
};

export const PostFeed = ({item, index, handleComments, handleLikes, redirectLink = '/home', incrementComment, isPostPage = false,}: PostFeedProps) => {
    const colorScheme = useColorScheme();
    const screenwidth = Dimensions.screenWidth;
    const { user, userData } = useAuth();
    const formattedDate = formatDate(item.created_at as Timestamp, isPostPage);
    const maxCaptionHeight = 30;
    const [isLiked, setIsLiked] = useState(item.likes.includes(user?.uid || ""));
    const [numLikes, setNumLikes] = useState(item.likes.length);
    const id = item.user_id + "/" + (item.score >= 0 ? item.item_id : item.post_id);
    const feedFontSize = screenwidth > 400 ? 18 : 14.5
    const [hideSpoilers, setHideSpoilers] = useState(user && item.has_spoilers && item.user_id != user.uid && item.caption);
    const isInitialRender = useRef(true);
    const [expanded, setExpanded] = useState(false);
    const [numComments, setNumComments] = useState<number>(item.num_comments);
    const isMovie = item.score == -1 ? item.isMovie : 'title' in item;
    const router = useRouter();

    useEffect(() => {
      if (isInitialRender.current) {
        // If this is the initial render, skip the effect
        isInitialRender.current = false;
      } else { setNumComments((prevNumComments) => prevNumComments + 1) }
    }, [incrementComment]) 

    const handleHeart = async () => {
      if (!user) return;
      
      const postRef = item.score == -2 
      ? doc(db, "users", item.user_id, item.list_type_id, Values.bookmarkListID, "items", item.item_id)
      : doc(db, "globalPosts", item.post_id);
      
      setIsLiked(!isLiked);
      try {
        if (isLiked) {
          setNumLikes(numLikes - 1);
          await updateDoc(postRef, {
            likes: arrayRemove(user.uid)
          }); 
        } else {
          if (userData) {
            const sendNotification = await checkShouldSendNotification(NotificationType.LikedPostNotification, item.user_id, userData);
            if (sendNotification) {
              createNotification(item.user_id, NotificationType.LikedPostNotification, userData, item, '', item.id)
              sendPushNotification(item.user_id, "Liked Post", `${userData.first_name} liked your post`)
            }
          }
          setNumLikes(numLikes + 1);
          await updateDoc(postRef, {
            likes: arrayUnion(user.uid)
          }); 
        }
      } catch (error) {
        console.error("Failed to update likes:", error);
      }
    }

    return (
      <>
      {!isPostPage ?
      <Link href={{pathname: redirectLink + '_post' as any, params: { postID: item.id }}} asChild>
      <TouchableOpacity>
      <View style={[styles.postContainer, {flexDirection: 'row', 
        justifyContent: 'space-between', borderColor: Colors[colorScheme ?? 'light'].gray,
        marginBottom: 10 }]}>
      <View style={[{borderColor: Colors[colorScheme ?? 'light'].gray, flex: 1}]} key={id}>
        <View style={{flexDirection: 'row', flex: 1,}}>
            <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
              <TouchableOpacity>
                  <Image
                    source={{ uri: item.profile_picture || undefined, cache: 'force-cache' }}
                    style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text}]}
                  />
              </TouchableOpacity>
            </Link>
            <View style={{flex: 1, alignItems: 'flex-start', paddingLeft: 7,}}>
                <View style={{flexDirection: 'row', alignItems: 'flex-start',}}>
                    <Text numberOfLines={2} style={{fontSize: 17, marginBottom: 3, flex: 1, paddingRight: 15,}}>
                      <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
                          <TouchableOpacity>
                            <Text style={{fontWeight: '500',fontSize: feedFontSize}}>{item.first_name}</Text>
                          </TouchableOpacity>
                      </Link>
                      <View>
                        <Text style = {{fontWeight: '300', fontSize: feedFontSize}}>{item.score >= 0 ? " ranked " : (item.score == -2 ? " bookmarked " : " commented on ")}</Text>
                      </View>
                      <Link href={{pathname: redirectLink + '_item' as any, params: { id: item.item_id, groupKey: isMovie ? 'movie' : 'tv'}}} asChild>
                          <TouchableOpacity>
                              <Text style={{fontWeight: 'bold',fontSize: feedFontSize}}>{item.item_name}</Text>
                          </TouchableOpacity>
                      </Link>
                    </Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', paddingRight: 15}}>
                  <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
                    <TouchableOpacity style={{paddingRight: 5}}>
                        <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '300',}}>@{item.username}</Text>
                    </TouchableOpacity>
                  </Link>
                  <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '200', alignSelf: 'flex-start',}}>{formattedDate}</Text>
                </View>
                
            </View>
        </View>
        <View style={{flexDirection: 'row', paddingTop: 5,}}>
          <View style={{flex: 1,}}>
            {!hideSpoilers ? (
              <ExpandableText text={item.caption} maxHeight={maxCaptionHeight} textStyle={styles.text}  startExpanded={expanded} />
            ) : (
              <View style={{height: maxCaptionHeight, alignItems: 'center', justifyContent: 'center'}}>
                <TouchableOpacity style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}} onPress={() => {
                  Alert.alert(
                    "Show Spoilers?",
                    "",
                    [
                        {
                            text: "Cancel",
                            style: "cancel"
                        },
                        {
                            text: "Reveal",
                            onPress: () => {
                                setExpanded(true);
                                setHideSpoilers(false);
                            }
                        }
                    ]
                  );
                }}>
                  <Text style={{fontSize: 16, fontWeight: '600', paddingRight: 3}}>Spoiler Alert</Text>
                  <Ionicons name="alert-circle" size={30} color={Colors[colorScheme ?? 'light'].text} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.postFooter}>
                <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity style={{alignItems: 'center', paddingTop: 5,}} onPress={handleHeart}>
                      <Ionicons
                        name={isLiked ? "heart" :"heart-outline"} size={30}
                        color={isLiked ? '#8b0000' : Colors[colorScheme ?? 'light'].text}
                        style={{paddingRight: 2}}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 7, flexDirection: 'row'}} onPress={() => handleLikes(true, item)}>
                      <Text style={{fontSize: 14, fontWeight: '300'}}><Text style={{fontWeight: '500'}}>{numLikes}</Text> Likes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{alignItems: 'center', paddingTop: 5,}} onPress={() => handleComments(true, item)}>
                      <Ionicons name="chatbubble-outline" size={30} color={Colors[colorScheme ?? 'light'].text} style={{paddingRight: 3}}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 5, flexDirection: 'row'}} onPress={() => handleComments(true, item)}>
                      <Text style={{fontSize: 14, fontWeight: '300'}}><Text style={{fontWeight: '500'}}>{numComments}</Text> Comments</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        </View>
      </View>
        <Link style={{height: 130}} href={{pathname: redirectLink + "_item" as any, params: { id: item.item_id, groupKey: isMovie ? 'movie' : 'tv' }}} asChild>
          <TouchableOpacity>
          {item.poster_path ? 
                            <Image
                                source={{ uri: imgUrl + item.poster_path }}
                                style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text, overflow: 'hidden' }]}
                                /> : <DefaultPost style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text, overflow: 'hidden' }]}/>}
            {item.score && item.score >= 0 &&
              <>
                <LinearGradient
                  colors={['transparent', 'black']}
                  style={{position: 'absolute',
                  bottom: 1,
                  left: 1,
                  right: 1,
                  height: 60,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,}}
                />
                <Text style={[styles.scoreText, {color: 'white', position: 'absolute',
                  bottom: 5,
                  right: 6,
                  backgroundColor: 'transparent'}]}>
                    {item.score.toFixed(1)}
                </Text>
              </>
              }
          </TouchableOpacity>
        </Link>
      </View>
      </TouchableOpacity>
      </Link> : 
      <View>
        <View style={{padding: 10}}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].background}]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={35} color={Colors[colorScheme ?? 'light'].text}/>
        </TouchableOpacity>
        <View style={{position: 'absolute'}}>
                    <Image source={item.backdrop_path ? { uri: imgUrl + item.backdrop_path } :
                      require('../assets/images/linear_gradient.png')} style={styles.backdropImage} />
                    <LinearGradient
                        colors={[colorScheme == 'light' ? 'rgba(255,255,255,0)' : 'transparent', Colors[colorScheme ?? 'light'].background]}
                        style={styles.gradientBackdrop}
                    />
                </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: (Dimensions.screenWidth / 1.5) - 90, backgroundColor: 'transparent'}}>
            <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} style={{alignSelf: 'flex-end', paddingBottom: 5}} asChild>
              <TouchableOpacity>
                  <Image
                    source={{ uri: item.profile_picture || undefined, cache: 'force-cache' }}
                    style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text}]}
                  />
              </TouchableOpacity>
            </Link>
            <View style={{flex: 1, alignItems: 'flex-start', paddingLeft: 7, paddingBottom: 5, alignSelf: 'flex-end',
              backgroundColor: 'transparent'}}>
              <View style={{flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'transparent'}}>
                  <Text numberOfLines={2} style={{fontSize: 17, marginBottom: 3, flex: 1, paddingRight: 15,}}>
                    <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
                        <TouchableOpacity>
                          <Text style={{fontWeight: '500',fontSize: feedFontSize}}>{item.first_name}</Text>
                        </TouchableOpacity>
                    </Link>
                    <View style={{backgroundColor: 'transparent'}}>
                      <Text style = {{fontWeight: '300', fontSize: feedFontSize}}>{item.score >= 0 ? " ranked " : (item.score == -2 ? " bookmarked " : " commented on ")}</Text>
                    </View>
                    <Link href={{pathname: redirectLink + '_item' as any, params: { id: item.item_id, groupKey: isMovie ? 'movie' : 'tv'}}} asChild>
                        <TouchableOpacity>
                            <Text style={{fontWeight: 'bold',fontSize: feedFontSize}}>{item.item_name}</Text>
                        </TouchableOpacity>
                    </Link>
                  </Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', paddingRight: 15,
              backgroundColor: 'transparent'}}>
                <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
                  <TouchableOpacity style={{paddingRight: 5}}>
                      <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '300',}}>@{item.username}</Text>
                  </TouchableOpacity>
                </Link>
                <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '200', alignSelf: 'flex-start',}}>{formattedDate}</Text>
              </View>   
            </View>
            <Link style={{height: 130}} href={{pathname: redirectLink + "_item" as any, params: { id: item.item_id, groupKey: isMovie ? 'movie' : 'tv' }}} asChild>
          <TouchableOpacity>
            <Image
              source={item.poster_path ? { uri: imgUrl + item.poster_path } :
              require('../assets/images/poster-placeholder.png')}
              style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text }]}
            />
            {item.score && item.score >= 0 &&
              <>
                <LinearGradient
                  colors={['transparent', 'black']}
                  style={{position: 'absolute',
                  bottom: 1,
                  left: 1,
                  right: 1,
                  height: 60,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,}}
                />
                <Text style={[styles.scoreText, {color: 'white', position: 'absolute',
                  bottom: 5,
                  right: 6,
                  backgroundColor: 'transparent'}]}>
                    {item.score.toFixed(1)}
                </Text>
              </>
              }
          </TouchableOpacity>
        </Link>
          </View>    
        </View>
        {!hideSpoilers ? (
          item.caption && <Text style={styles.postText}>{item.caption}</Text>
        ) : (
          <View style={{height: maxCaptionHeight, alignItems: 'center', justifyContent: 'center'}}>
            <TouchableOpacity style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'row'}} onPress={() => {
              Alert.alert(
                "Show Spoilers?",
                "",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Reveal",
                        onPress: () => {
                            setExpanded(true);
                            setHideSpoilers(false);
                        }
                    }
                ]
              );
            }}>
              <Text style={{fontSize: 16, fontWeight: '600', paddingRight: 3}}>Spoiler Alert</Text>
              <Ionicons name="alert-circle" size={30} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
          </View>
        )}
      </View>}
      </>
    )
  }

  const styles = StyleSheet.create({
    profilePic: {
        width: 60,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: 'gray',
        borderWidth: 1,
    },
    postFooter: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
    },
    text: {
      fontSize: 16,
      fontWeight: '300',
      paddingRight: 15,
    },
    postText: {
      fontSize: 16,
      fontWeight: '300',
      paddingHorizontal: 10,
      paddingBottom: 5,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    username: {
      fontSize: 18,
      color: 'gray',
    },
    caption: {
      fontSize: 16,
      fontWeight: '300',
      paddingRight: 15,
    },
    postContainer: {
      padding: 10,
      borderWidth: 1,
      marginHorizontal: 10,
      borderRadius: 20,
      shadowOffset: { width: 0, height: 2 },
        shadowRadius: 1,
        shadowOpacity: 0.5,
        shadowColor: 'black'
    },
    itemImage: {
      //flex: 1,
      height: 130,
      maxHeight: 180,
      aspectRatio: 2/3,
      borderRadius: 10,
      borderWidth: 1,
    },
    scoreContainer: {
      width: 40,
      aspectRatio: 1,
      borderRadius: 50,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
      alignSelf: 'center',
    },
    scoreText: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    backdropImage: {
      height: '100%',
        width: Dimensions.screenWidth,
        aspectRatio: 1.5,
    },
    gradientBackdrop: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Dimensions.screenWidth > 400 ? 120 : 100,
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
  });