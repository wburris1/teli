import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, FlatList, useColorScheme, Image, View, Alert, Pressable, ActivityIndicator, Platform, UIManager, LayoutAnimation, KeyboardAvoidingView } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import Dimensions from '@/constants/Dimensions';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { DisplayComment, FeedPost, NotificationType } from '@/constants/ImportTypes';
import { useAuth } from '@/contexts/authContext';
import { fetchUserData } from '@/data/getComments';
import { FIREBASE_DB } from '@/firebaseConfig';
import { Timestamp, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, increment, limit, orderBy, query, startAfter, updateDoc } from 'firebase/firestore';
import Values from '@/constants/Values';
import { useData } from '@/contexts/dataContext';
import { formatDate } from './Helpers/FormatDate';
import { toFinite } from 'lodash';
import { Link } from 'expo-router';
import { createNotification } from './Helpers/CreatePlusAddNotification';

const screenWidth = Dimensions.screenWidth;
const DELETE_WIDTH = 80;
const db = FIREBASE_DB;
const REPLIES_LIMIT = 3;

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RenderItem = React.memo(({ comment, parentCommentID, post, handleReply, deleteReply, onClose, redirectLink}: 
    {
        comment: DisplayComment, parentCommentID: string, post: FeedPost,
        handleReply: (username: string, comment_id: string, parentCommentID: string) => void,
        deleteReply: (comment_id: string) => void,  onClose: () => void, redirectLink: string
    }) => {
    const { user, userData } = useAuth();
    const colorScheme = useColorScheme();
    const [isSwiped, setSwiped] = useState(false);
    const isUserComment = user && user.uid == comment.user_id;
    const [isLiked, setIsLiked] = useState(comment.likes.includes(user?.uid || ""));
    const [numLikes, setNumLikes] = useState(comment.likes.length);
    const [replies, setReplies] = useState<DisplayComment[]>([]);
    const [lastReply, setLastReply] = useState<any>(null);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const { replyID, requestRefresh } = useData();
    const [repliesOpen, setRepliesOpen] = useState(false);
    const formattedDate = formatDate(comment.created_at as Timestamp);

    useEffect(() => {
        if (repliesOpen) fetchPostedReply();
    }, [replyID])

    const fetchPostedReply = useCallback(async () => {
        if (parentCommentID !== "" || !user || !replyID) return;
        const postRef = post.score >= 0 ? doc(db, "users", post.user_id, post.list_type_id, Values.seenListID, "items", post.item_id) :
            (post.score == -2 ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "users", post.user_id, "posts", post.post_id));

        const commentRef = doc(postRef, "comments", comment.comment_id);
        const replyRef = doc(commentRef, "replies", replyID);
        const replyResp = await getDoc(replyRef);

        if (replyResp.exists() && userData) {
            const replyData = replyResp.data() as DisplayComment;
            const newReply = {
                comment_id: replyID,
                user_id: user.uid,
                username: userData.username,
                profile_picture: userData.profile_picture,
                first_name: userData.first_name,
                last_name: userData.last_name,
                comment: replyData.comment,
                likes: replyData.likes,
                created_at: replyData.created_at,
                num_replies: replyData.num_replies,
            };
            setReplies(prev => !prev.some(reply => reply.comment_id === newReply.comment_id) ? [newReply, ...prev] : prev);
            toggleReplies();
        }
    }, [parentCommentID, comment.comment_id, post, replyID])

    const fetchReplies = useCallback(async (fetchNum: number) => {
        if (parentCommentID !== "") return;
        setLoadingReplies(true);
        const postRef = post.score >= 0 ? doc(db, "users", post.user_id, post.list_type_id, Values.seenListID, "items", post.item_id) :
            (post.score == -2 ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "users", post.user_id, "posts", post.post_id));

        const commentRef = doc(postRef, "comments", comment.comment_id);
        const repliesRef = collection(commentRef, "replies");
        let q = query(repliesRef, orderBy("created_at", "asc"), limit(fetchNum));

        if (lastReply) {
            q = query(repliesRef, orderBy("created_at", "asc"), startAfter(lastReply), limit(REPLIES_LIMIT));
        }

        const snapshot = await getDocs(q);
        const newReplies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as DisplayComment }));

        if (snapshot.docs.length > 0) {
            setLastReply(snapshot.docs[snapshot.docs.length - 1]);
        }

        const displayCommentsPromises = newReplies.map(async (comment) => {
            const userData = await fetchUserData(comment.user_id);
            return {
                comment_id: comment.id,
                user_id: comment.user_id,
                username: userData.username,
                profile_picture: userData.profile_picture,
                first_name: userData.first_name,
                last_name: userData.last_name,
                comment: comment.comment,
                likes: comment.likes,
                created_at: comment.created_at,
                num_replies: comment.num_replies,
            };
        });
        const response = await Promise.all(displayCommentsPromises);
        setReplies(prevReplies => [...prevReplies, ...response.filter(item => 
            !prevReplies.some(reply => reply.comment_id === item.comment_id)
        )]);
        setLoadingReplies(false);
        toggleReplies();
    }, [parentCommentID, lastReply, comment.comment_id, post, replyID]);

    const handleSetSwiped = useCallback((value: boolean) => {
        setSwiped(value);
    }, []);

    const transX = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .onStart(() => {
            if (isSwiped) {
                transX.value = withSpring(0);
            }
        })
        .onUpdate((event) => {
            if (!isSwiped && event.translationX < 0) {
                transX.value = event.translationX;
            }
        })
        .onEnd(() => {
            if (transX.value < -DELETE_WIDTH) {
                runOnJS(handleSetSwiped)(true);
                transX.value = transX.value < 0 ? withSpring(-DELETE_WIDTH) : withSpring(DELETE_WIDTH);
            } else {
                runOnJS(handleSetSwiped)(false);
                transX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: transX.value }]
        }
    });

    const deleteButtonStyle = useAnimatedStyle(() => ({
        opacity: interpolate(transX.value, [0, -DELETE_WIDTH], [0, 1]),
        transform: [{ translateX: 0 }],
        width: transX.value < 0 ? -transX.value : DELETE_WIDTH,
    }));

    const onDelete = useCallback(() => {
        const alertHeaderText = "Confirm Delete";
        const alertText = "Are you sure you want to delete this comment?";
        const alertButtonText = "Delete";
        Alert.alert(
            alertHeaderText,
            alertText,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: alertButtonText,
                    onPress: () => {
                        handleDelete();
                    }
                }
            ]
        );
    }, [comment, post, parentCommentID]);

    const handleHeart = useCallback(async () => {
        if (!user) return;

        const postRef = post.score >= 0 ? doc(db, "users", post.user_id, post.list_type_id, Values.seenListID, "items", post.item_id) :
            (post.score == -2 ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "users", post.user_id, "posts", post.post_id));

        let commentRef = doc(postRef, "comments", comment.comment_id);

        if (parentCommentID !== "") {
            commentRef = doc(postRef, "comments", parentCommentID, "replies", comment.comment_id);
        }

        setIsLiked(!isLiked);

        if (isLiked) {
            setNumLikes(numLikes - 1);
            await updateDoc(commentRef, {
                likes: arrayRemove(user.uid)
            });
        } else {
            setNumLikes(numLikes + 1);
            await updateDoc(commentRef, {
                likes: arrayUnion(user.uid)
            });
            if (userData) {
              createNotification(comment.user_id, NotificationType.LikedCommentNotification, userData, post, comment.comment)
            }
        }
    }, [isLiked, numLikes, user, post, comment.comment_id, parentCommentID]);

    const handleDelete = useCallback(async () => {
        if (comment && user) {
            const postRef = post.score >= 0 ? doc(db, "users", post.user_id, post.list_type_id, Values.seenListID, "items", post.item_id) :
            (post.score == -2 ?  doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "users", post.user_id, "posts", post.post_id));
            
            let commentRef = doc(postRef, "comments", comment.comment_id);

            if (parentCommentID != "") {
                commentRef = doc(postRef, "comments", parentCommentID, "replies", comment.comment_id);
            }
            
            await deleteDoc(commentRef)
            if (parentCommentID != "") {
                await updateDoc(doc(postRef, "comments", parentCommentID), { num_replies: increment(-1) })
            } else {
                await updateDoc(postRef, { num_comments: increment(-1) })
            }
            requestRefresh();
            deleteReply(comment.comment_id);
        }
    }, [user, post, comment.comment_id, parentCommentID])

    const removeFromReplies = (comment_id: string) => {
        setReplies(replies.filter(reply => reply.comment_id !== comment_id));
    }

    const toggleReplies = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    return (
        <View>
            <GestureDetector gesture={panGesture} key={comment.comment_id}>
                <View>
                    <Animated.View style={[styles.itemContainer, animatedStyle, {
                        backgroundColor: Colors[colorScheme ?? 'light'].background, borderBottomColor: Colors[colorScheme ?? 'light'].text,
                        paddingLeft: parentCommentID !== "" ? 55 : 0,
                    }]}>
                        <Link href={{pathname: redirectLink + '_user', params: { userID: comment.user_id }}} asChild>
                          <TouchableOpacity onPress={onClose}>
                            <Image source={{ uri: comment.profile_picture }} style={styles.profilePic} />
                          </TouchableOpacity>
                        </Link>
                        <View style={{ flex: 1 }}>
                          <Link href={{pathname: redirectLink + '_user', params: { userID: comment.user_id }}} asChild>
                            <TouchableOpacity onPress={onClose}>
                              <Text style={styles.name}>{comment.first_name} <Text style={styles.username}>@{comment.username}</Text></Text>
                            </TouchableOpacity>
                          </Link>
                            <Text style={styles.comment}>{comment.comment}</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <Text style={{ fontSize: 13, fontWeight: '300', marginTop: 3 }}>{formattedDate}</Text>
                                <Ionicons name="ellipse" size={5} color='gray' style={{marginTop: 3, paddingHorizontal: 3}} />
                                <TouchableOpacity onPress={() => {setRepliesOpen(true); handleReply(comment.username, comment.comment_id, parentCommentID)}} style={{ width: 40 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '300', marginTop: 3, color: 'gray' }}>Reply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{ paddingHorizontal: 5, alignItems: 'center', alignSelf: 'flex-start', marginTop: 15 }}>
                            <Pressable onPress={handleHeart}>
                                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? '#8b0000' : Colors[colorScheme ?? 'light'].text} />
                            </Pressable>
                            {numLikes > 0 &&
                                <TouchableOpacity>
                                    <Text style={{ fontSize: 14, fontWeight: '400' }}>{numLikes}</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </Animated.View>
                    <Animated.View style={[isUserComment ? styles.deleteButtonContainer : styles.removeButtonContainer, deleteButtonStyle]}
                        pointerEvents={isSwiped && transX.value <= -DELETE_WIDTH ? 'auto' : 'none'}>
                        <TouchableOpacity style={[styles.fullSize, { borderBottomColor: Colors[colorScheme ?? 'light'].text }]} onPress={() => onDelete()}>
                            <Ionicons
                                name={isUserComment ? "trash" : "arrow-redo"}
                                size={30}
                                color={'#fff'}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </GestureDetector>
            {repliesOpen && replies.length > 0 &&
                <View>
                {replies.map(reply => reply && (
                    <View key={reply.comment_id}>
                        <RenderItem comment={reply} key={reply.comment_id} parentCommentID={comment.comment_id} post={post} handleReply={handleReply} deleteReply={removeFromReplies} redirectLink={redirectLink}/>
                    </View>
                ))}
                </View>}
            {comment.num_replies > 0 && parentCommentID == "" && (
                loadingReplies ? <ActivityIndicator size={20} style={{alignSelf: 'flex-start', paddingLeft: 100}}/> :
                <View style={{flexDirection: 'row', alignItems: 'center', paddingLeft: 70, height: 20}}>
                    {!(repliesOpen && comment.num_replies <= replies.length) &&
                    <TouchableOpacity onPress={() => {
                        fetchReplies(REPLIES_LIMIT);
                        setRepliesOpen(true);
                    }}>
                        <Text style={{ fontSize: 11, fontWeight: '400', }}>
                            View {repliesOpen && replies.length > 0 ? (comment.num_replies - replies.length) + " more" : comment.num_replies}{comment.num_replies > 1 ? " replies" : " reply"}
                        </Text>
                    </TouchableOpacity>}
                    {repliesOpen && replies.length > 0 && (
                        <>
                            <Ionicons name="caret-forward" size={12} color={Colors[colorScheme ?? 'light'].text} />
                            <TouchableOpacity onPress={() => {
                                setRepliesOpen(false);
                                setReplies([]);
                                setLastReply(null);
                                toggleReplies();
                            }}>
                                <Text style={{ fontSize: 11, fontWeight: '400', }}>Close</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );
});

export const CommentsList = ({ comments, post, handleReply, onClose, redirectLink}: { comments: DisplayComment[], post: FeedPost,
    handleReply: (username: string, comment_id: string, parentCommentID: string) => void,
    onClose: () => void, redirectLink: string}) => {
    const colorScheme = useColorScheme();

    if (comments) {
        return (
            <FlatList
                data={comments}
                renderItem={({ item }) => <RenderItem comment={item} parentCommentID='' post={post} handleReply={handleReply} deleteReply={() => {}} onClose={onClose} redirectLink={redirectLink}/>}
                keyExtractor={item => item.comment_id}
                numColumns={1}
            />
        )
    } else {
        return (
            <View></View>
        )
    }
}

const styles = StyleSheet.create({
    itemContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      flexDirection: 'row',
      overflow: 'hidden',
      paddingRight: 5,
      paddingVertical: 8,
      width: '100%',
    },
    deleteButtonContainer: {
      flexDirection: 'row',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'red',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    removeButtonContainer: {
      flexDirection: 'row',
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: 'blue',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    profilePic: {
      borderRadius: 50,
      width: 50,
      aspectRatio: 1,
      backgroundColor: 'gray',
      marginHorizontal: 10,
      alignSelf: 'flex-start',
    },
    fullSize: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    comment: {
        fontSize: 14,
        fontWeight: '400',
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
    },
    username: {
        fontSize: 14,
        fontWeight: '300',
    }
  });