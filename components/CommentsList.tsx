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
import { formatDate, getDate } from './Helpers/FormatDate';
import { toFinite } from 'lodash';
import { Link } from 'expo-router';
import { createNotification } from './Helpers/CreatePlusAddNotification';
import { isDate } from 'date-fns';
import { checkShouldSendNotification, sendPushNotification } from './Helpers/sendNotification';

const screenWidth = Dimensions.screenWidth;
const DELETE_WIDTH = 80;
const db = FIREBASE_DB;
const REPLIES_LIMIT = 3;

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RenderItem = React.memo(({ comments, comment, parentCommentID, post, handleReply, deleteReply, onClose,
    redirectLink, changeComments, newReply, updateNumReplies, animateComment }: 
    {
        comments: any[],
        comment: any, parentCommentID: string, post: any,
        handleReply: (username: string, comment_id: string, parentCommentID: string) => void,
        deleteReply: (comment_id: string) => void,  onClose: () => void, redirectLink: string,
        changeComments: (comments: any[]) => void,
        newReply: any,
        updateNumReplies: (parentID: string, inc: number) => void,
        animateComment: () => void,
    }) => {
    const { user, userData } = useAuth();
    const colorScheme = useColorScheme();
    const [isSwiped, setSwiped] = useState(false);
    const isUserComment = user && user.uid == comment.user_id;
    const [isLiked, setIsLiked] = useState(comment.likes.includes(user?.uid || ""));
    const [numLikes, setNumLikes] = useState(comment.likes.length);
    const [replies, setReplies] = useState<any[]>([]);
    const [lastReply, setLastReply] = useState<any>(null);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const { replyID, requestRefresh, setCurrNumComments, setCurrPostID } = useData();
    const [repliesOpen, setRepliesOpen] = useState(false);
    const formattedDate = isDate(comment.created_at) ? getDate(comment.created_at) : 
        formatDate(comment.created_at as Timestamp);

    useEffect(() => {
        if (newReply && newReply.parent_id == comment.id) {
            if (!newReply.id) {
                setReplies(prev => [newReply, ...prev]);
                toggleReplies();
            } else {
                let oldReplies = replies.filter(rep => rep.id !== '');
                setReplies([newReply, ...oldReplies]);
            }
        }
    }, [newReply])

    const fetchPostedReply = useCallback(async () => {
        if (parentCommentID !== "" || !user || !replyID) return;
        const postRef = post.score >= 0 ? doc(db, "users", post.user_id, post.list_type_id, Values.seenListID, "items", post.item_id) :
            (post.score == -2 ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "users", post.user_id, "posts", post.post_id));

        const commentRef = doc(postRef, "comments", comment.id);
        const replyRef = doc(commentRef, "replies", replyID);
        const replyResp = await getDoc(replyRef);

        if (replyResp.exists() && userData) {
            const replyData = replyResp.data();
            setReplies(prev => !prev.some(reply => reply.id === replyData.id) ? [replyData, ...prev] : prev);
            toggleReplies();
        }
    }, [parentCommentID, comment.id, post, replyID])

    const fetchReplies = useCallback(async (fetchNum: number) => {
        if (parentCommentID !== "") return;
        setLoadingReplies(true);
        const postRef = post.score >= 0 ? doc(db, "globalPosts", post.post_id) :
            (post.score == -2 ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "globalPosts", post.post_id));

        const commentRef = doc(postRef, "comments", comment.id);
        const repliesRef = collection(commentRef, "replies");
        let q = query(repliesRef, orderBy("created_at", "desc"), limit(fetchNum));

        if (lastReply) {
            q = query(repliesRef, orderBy("created_at", "desc"), startAfter(lastReply), limit(REPLIES_LIMIT));
        }

        const snapshot = await getDocs(q);
        const newReplies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as DisplayComment }));

        if (snapshot.docs.length > 0) {
            setLastReply(snapshot.docs[snapshot.docs.length - 1]);
        }

        setReplies(prevReplies => [...prevReplies, ...newReplies.filter(item => 
            !prevReplies.some(reply => reply.id === item.id)
        )]);
        setLoadingReplies(false);
        toggleReplies();
    }, [parentCommentID, lastReply, comment.id, post, replyID]);

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
            transform: [{ translateX: comment.id ? transX.value : 0 }]
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
        if (!user || !comment.id) return;

        const postRef = post.score >= 0 ? doc(db, "globalPosts", post.post_id) :
            (post.score == -2 ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                doc(db, "globalPosts", post.post_id));

        let commentRef = doc(postRef, "comments", comment.id);

        if (parentCommentID !== "") {
            commentRef = doc(postRef, "comments", parentCommentID, "replies", comment.id);
        }

        setIsLiked(!isLiked);

        if (isLiked) {
            setNumLikes(numLikes - 1);
            await updateDoc(commentRef, {
                likes: arrayRemove(user.uid),
            });
        } else {
            setNumLikes(numLikes + 1);
            await updateDoc(commentRef, {
                likes: arrayUnion(user.uid)
            });
            if (userData) {
              const sendNotification = await checkShouldSendNotification(NotificationType.LikedCommentNotification, comment.user_id, userData);
              if (sendNotification) {
                createNotification(comment.user_id, NotificationType.LikedCommentNotification, userData, post, comment.comment, post.id)
                sendPushNotification(comment.user_id, "Liked Comment", `${userData.first_name} liked your comment`)
              }
            }
        }
    }, [isLiked, numLikes, user, post, comment.id, parentCommentID]);

    const handleDelete = useCallback(async () => {
        if (comment && user && comment.id) {
            try {
                const postRef = post.score >= 0 ? doc(db, "globalPosts", post.post_id) :
                (post.score == -2 ?  doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
                    doc(db, "globalPosts", post.post_id));
                
                let commentRef = doc(postRef, "comments", comment.id);

                if (parentCommentID != "") {
                    commentRef = doc(postRef, "comments", parentCommentID, "replies", comment.id);
                    deleteReply(comment.id);
                } else {
                    changeComments(comments.filter(com => com.id !== comment.id));
                    animateComment();
                }
                
                await deleteDoc(commentRef);
                if (parentCommentID != "") {
                    await updateDoc(doc(postRef, "comments", parentCommentID), { num_replies: increment(-1) });
                } else {
                    await updateDoc(postRef, { num_comments: increment(-1 - comment.num_replies) });
                }
                let totalComments = 0;
                comments.forEach(cmt => {
                    totalComments += cmt.num_replies + 1;
                })
                setCurrPostID(post.post_id);
                setCurrNumComments(totalComments > 0 ? totalComments - comment.num_replies - 1 : 0);
                //requestRefresh();
            } catch (err: any) {
                console.error("Error deleting comment: ", err);
            }
        }
    }, [user, post, comment.id, parentCommentID])

    const removeFromReplies = useCallback(() => (comment_id: string) => {
        setReplies(replies.filter(reply => reply.id !== comment_id));
        updateNumReplies(comment.id, -1);
        toggleReplies();
    }, [replies, updateNumReplies]);

    const toggleReplies = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const countReplies = () => {
        let count = 0;
        replies.forEach(element => {
            if (element.id) count++;
        });
        return count;
    }

    return (
        <View>
            <GestureDetector gesture={panGesture} key={comment.id}>
                <View>
                    <Animated.View style={[styles.itemContainer, animatedStyle, {
                        backgroundColor: Colors[colorScheme ?? 'light'].background, borderBottomColor: Colors[colorScheme ?? 'light'].text,
                        paddingLeft: parentCommentID !== "" ? 55 : 0,
                    }]}>
                        <Link href={{pathname: redirectLink + '_user' as any, params: { userID: comment.user_id }}} asChild>
                          <TouchableOpacity onPress={onClose}>

                            <Image source={ comment.profile_picture ? {uri: comment.profile_picture,  cache: 'force-cache' } : require('../assets/images/emptyprofilepic.jpg')}
                            style={styles.profilePic} />
                          </TouchableOpacity>
                        </Link>
                        <View style={{ flex: 1 }}>
                          <Link href={{pathname: redirectLink + '_user' as any, params: { userID: comment.user_id }}} asChild>
                            <TouchableOpacity onPress={onClose}>
                              <Text style={styles.name}>{comment.first_name} <Text style={styles.username}>@{comment.username}</Text></Text>
                            </TouchableOpacity>
                          </Link>
                            <Text style={styles.comment}>{comment.comment}</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                {comment.id ?
                                <>
                                    <Text style={{ fontSize: 13, fontWeight: '300', marginTop: 3 }}>{formattedDate}</Text>
                                    <Ionicons name="ellipse" size={5} color='gray' style={{marginTop: 3, paddingHorizontal: 3}} />
                                    <TouchableOpacity onPress={() => {setRepliesOpen(true); handleReply(comment.username, comment.id, parentCommentID)}} style={{ width: 40 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '300', marginTop: 3, color: 'gray' }}>Reply</Text>
                                    </TouchableOpacity>
                                </> : <>
                                    <Text style={{ fontSize: 13, fontWeight: '300', marginTop: 3, }}>Posting...</Text>
                                    <ActivityIndicator size={10} style={{marginTop: 5, marginLeft: 10}} color={Colors['loading']}/>
                                </>}
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
                    <View key={reply.id}>
                        <RenderItem comment={reply} key={reply.id} parentCommentID={comment.id} post={post} handleReply={handleReply}
                            deleteReply={removeFromReplies} redirectLink={redirectLink} onClose={onClose} changeComments={changeComments}
                            comments={comments} newReply={null} updateNumReplies={() => {}} animateComment={() => {}} />
                    </View>
                ))}
                </View>}
            {comment.num_replies > 0 && parentCommentID == "" && (
                loadingReplies ? <ActivityIndicator size={20} color={Colors['loading']} style={{alignSelf: 'flex-start', paddingLeft: 100}}/> :
                <View style={{flexDirection: 'row', alignItems: 'center', paddingLeft: 70, height: 20}}>
                    {!(repliesOpen && comment.num_replies <= replies.length) &&
                    <TouchableOpacity onPress={() => {
                        fetchReplies(REPLIES_LIMIT);
                        setRepliesOpen(true);
                    }}>
                        <Text style={{ fontSize: 11, fontWeight: '400', }}>
                            View {repliesOpen && replies.length > 0 ? (comment.num_replies - countReplies()) + " more" : comment.num_replies}{comment.num_replies > 1 ? " replies" : " reply"}
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

export const CommentsList = ({comments, post, handleReply, onClose, redirectLink, changeComments, newReply, updateNumReplies, animateComment, isPostPage=false }:
{ comments: any[], post: any,
    handleReply: (username: string, comment_id: string, parentCommentID: string) => void,
    onClose: () => void, redirectLink: string,
    changeComments: (comments: any[]) => void,
    newReply: any,
    updateNumReplies: (parentID: string, inc: number) => void,
    animateComment: () => void,
    isPostPage?: boolean
}) => {
    const colorScheme = useColorScheme();

    const renderCallback = useCallback(({ item }: { item: any }) => 
        <RenderItem comments={comments} comment={item} parentCommentID='' post={post} handleReply={handleReply}
            deleteReply={() => {}} onClose={onClose} redirectLink={redirectLink} changeComments={changeComments}
            newReply={newReply} updateNumReplies={updateNumReplies} animateComment={animateComment} />
    , [comments, post, newReply, changeComments, redirectLink, handleReply])

    if (comments) {
        return (
            <View style={{marginBottom: 150}}>
                {!isPostPage ? 
                <FlatList
                    data={comments}
                    renderItem={renderCallback}
                    keyExtractor={item => item.id}
                    numColumns={1}
                    removeClippedSubviews={true}
                /> : 
                comments.map((item, index) => (
                    <View key={index}>
                        <RenderItem comments={comments} comment={item} parentCommentID='' post={post} handleReply={handleReply}
                        deleteReply={() => {}} onClose={onClose} redirectLink={redirectLink} changeComments={changeComments}
                        newReply={newReply} updateNumReplies={updateNumReplies} animateComment={animateComment} />
                    </View>))}
            </View>
            
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
      height: 50,
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