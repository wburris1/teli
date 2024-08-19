import { AppNotification, FeedPost, NotificationType } from "@/constants/ImportTypes";
import { Timestamp, addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Image, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Text, View } from "./Themed";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import Values from "@/constants/Values";
import { formatDate } from "./Helpers/FormatDate";
import { ExpandableText } from "./AnimatedViews.tsx/ExpandableText";
import { Link } from "expo-router";
import React from "react";
import { createNotification } from "./Helpers/CreatePlusAddNotification";
import { sendPushNotification } from "./Helpers/sendNotification";
import { useData } from "@/contexts/dataContext";
import Dimensions from "@/constants/Dimensions";

const imgUrl = 'https://image.tmdb.org/t/p/w500';
const db = FIREBASE_DB;

type PostFeedProps = {
  item: FeedPost;
  index: number;
  handleComments: (show: boolean, post: FeedPost) => void;
  handleLikes: (show: boolean, post: FeedPost) => void;
  redirectLink?: string; // Optional parameter with default value
};

export const PostFeed = ({item, index, handleComments, handleLikes, redirectLink = '/home'}: PostFeedProps) => {
    const colorScheme = useColorScheme();
    const screenwidth = Dimensions.screenWidth;
    const {userPushToken} = useData();
    const { user, userData } = useAuth();
    const formattedDate = formatDate(item.created_at as Timestamp);
    const maxCaptionHeight = 65;
    const [isLiked, setIsLiked] = useState(item.likes.includes(user?.uid || ""));
    const [numLikes, setNumLikes] = useState(item.likes.length);
    const id = item.user_id + "/" + (item.score >= 0 ? item.item_id : item.post_id);
    const feedFontSize = screenwidth > 400 ? 18 : 14.5
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
            createNotification(item.user_id, NotificationType.LikedPostNotification, userData, item)
            sendPushNotification(item.userPushToken, "Liked Post", `${userData.first_name} liked your post`)
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
      <View style={[styles.postContainer, {borderColor: Colors[colorScheme ?? 'light'].gray}]} key={id}>
        <View style={{flexDirection: 'row', flex: 1,}}>
            <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
              <TouchableOpacity>
                  <Image
                      source={{ uri: item.profile_picture === '' ? undefined: item.profile_picture }}
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
                      <Link href={{pathname: redirectLink + '_item' as any, params: { id: item.item_id, groupKey: 'title' in item ? "movie" : "tv" }}} asChild>
                          <TouchableOpacity>
                              <Text style={{fontWeight: 'bold',fontSize: feedFontSize}}>{item.item_name}</Text>
                          </TouchableOpacity>
                      </Link>
                    </Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', paddingRight: item.score >= 0 ? 95 : 80}}>
                  <Link href={{pathname: redirectLink + '_user' as any, params: { userID: item.user_id }}} asChild>
                    <TouchableOpacity style={{paddingRight: 5}}>
                        <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '300',}}>@{item.username}</Text>
                    </TouchableOpacity>
                  </Link>
                  <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '200', alignSelf: 'flex-start',}}>{formattedDate}</Text>
                </View>
                
            </View>
            {item.score >= 0 && (
                <View style={[styles.scoreContainer, {borderColor: Colors[colorScheme ?? 'light'].text}]}>
                    <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
                </View>
            )}
        </View>
        <View style={{flexDirection: 'row', paddingTop: 5,}}>
          <View style={{flex: 1}}>
            <ExpandableText text={item.caption} maxHeight={maxCaptionHeight} textStyle={styles.text} />
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
                      <Text style={{fontSize: 14, fontWeight: '300'}}><Text style={{fontWeight: '500'}}>{item.num_comments}</Text> Comments</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
          <Link href={{pathname: redirectLink + "_item" as any, params: { id: item.item_id, groupKey: 'title' in item ? "movie" : "tv" }}} asChild>
              <TouchableOpacity>
              <Image
                source={{ uri: imgUrl + item.poster_path }}
                style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text }]}
              />
              </TouchableOpacity>
          </Link>
        </View>
      </View>
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
      borderBottomWidth: 1,
    },
    itemImage: {
      width: 70,
      aspectRatio: 2/3,
      borderRadius: 10,
      borderWidth: 0.5,
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
      fontSize: 18,
      fontWeight: '500',
    },
  });