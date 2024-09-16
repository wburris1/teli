import { DisplayComment, FeedPost, NotificationType } from "@/constants/ImportTypes";
import { Text, View } from "./Themed";
import { LayoutAnimation, Platform, ScrollView, TouchableOpacity, UIManager, useColorScheme } from "react-native";
import { PostFeed } from "./PostFeed";
import useModalState from "./ModalState";
import CommentsModal from "./CommentsModal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useCallback, useEffect, useState } from "react";
import LikesModal from "./LikesModal";
import Dimensions from "@/constants/Dimensions";
import { useAuth } from "@/contexts/authContext";
import { addDoc, arrayRemove, arrayUnion, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { createNotification } from "./Helpers/CreatePlusAddNotification";
import { checkShouldSendNotification, sendPushNotification } from "./Helpers/sendNotification";
import { FIREBASE_DB } from "@/firebaseConfig";
import Values from "@/constants/Values";
import { useData } from "@/contexts/dataContext";
import { CommentInput } from "./CommentInput";
import { getUserData } from "./Helpers/FetchFunctions";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

const db = FIREBASE_DB;

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const PostScreen = ({post, redirectLink}: { post: any, redirectLink: string }) => {
    const colorScheme = useColorScheme();
    const [incrementComment, setIncrementComment] = useState(false);
    const [showLikes, setShowLikes] = useState(false);
    // replyUsername, comment, setComment, handleComment, setReplyUsername, setReplyCommentID
    const [replyUsername, setReplyUsername] = useState('');
    const [comment, setComment] = useState('');
    const [replyCommentID, setReplyCommentID] = useState('');
    const [replyParentID, setReplyParentID] = useState('');
    const [reply, setReply] = useState<any>(null);
    const [displayComments, setDisplayComments] = useState<any[]>([]);
    const { user, userData } = useAuth();
    const { requestRefresh, requestReply } = useData();
    const [topLikers, setTopLikers] = useState<UserData[]>([]);
    const [isLiked, setIsLiked] = useState(post.likes.includes(user?.uid || ""));
    const [numLikes, setNumLikes] = useState(post.likes.length);
    const [focus, setFocus] = useState(0);
    const [numComments, setNumComments] = useState(post.num_comments);

    useEffect(() => {
        if (displayComments) {
            let num = displayComments.length;
            displayComments.forEach(cmt => {
                num += cmt.num_replies
            })
            setNumComments(num);
        }
    }, [displayComments])

    const getTopLikers = async () => {
        if (post.likes.length == 0) return;
        let likers: string[];
        let currLikers = !isLiked ? post.likes.filter((id: string) => id != user?.uid) : post.likes
        if (isLiked && !post.likes.find((id: string) => id == user?.uid)) {
            currLikers = [currLikers, user?.uid];
        }
        likers = currLikers.length > 1 ? [currLikers[0], currLikers[1]] : (currLikers.length == 0 ? [] : [currLikers[0]]);
        const getLikers = await Promise.all(likers.map(async (userID: string) => {
          const userData = await getUserData(userID);
          return userData;
        })); 
        setTopLikers(getLikers);
    }
  
    useEffect(() => {
        getTopLikers();
    }, [isLiked])

    const handleIncrementComment = () => {
        setIncrementComment((prev) => !prev);
    };

    const handleLikes = (show: boolean) => {
        setShowLikes(show);
    }

    const updateNumReplies = (parentID: string, inc: number) => {
        setDisplayComments(prevComments => prevComments.map(cmt => {
          if (cmt.id === parentID) {
            return { ...cmt, num_replies: cmt.num_replies + inc };
          }
          return cmt;
        }));
    }

    const animateComment = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    // Should abstract this
    const handleComment = async () => {
        if (comment && user && userData) {
          const userComment: DisplayComment = {
            user_id: user.uid,
            comment: comment,
            likes: [],
            created_at: serverTimestamp(),
            num_replies: 0,
            username: userData.username,
            profile_picture: userData.profile_picture,
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
          const localTimestamp = new Date();
          let displayComment = {id: '', ...userComment};
          displayComment.created_at = localTimestamp;
    
          setComment('');
          setReplyCommentID('');
          setReplyUsername('');
          setReplyParentID('');
    
          const postRef = post.score >= 0 ? doc(db, "globalPosts", post.post_id) :
            (post.score == -2 ?  doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
              doc(db, "globalPosts", post.post_id));
          
          let commentRef = collection(postRef, "comments");
          let replyData;
          if (replyCommentID) {
            const parentID = replyParentID || replyCommentID;
            replyData = { parent_id: parentID, ...displayComment };
            setReply(replyData);
            commentRef = collection(commentRef, parentID, "replies"); // Replying to a reply just replies to parent comment
            const parentCommentRef = doc(postRef, "comments", replyParentID != "" ? replyParentID : replyCommentID);
            await updateDoc(parentCommentRef, { num_replies: increment(1) })
            // TODO: Add tagged user when replying
          } else {
              setDisplayComments([displayComment, ...displayComments]);
              animateComment();
          }
          
          const resp = await addDoc(commentRef, userComment);
          await updateDoc(postRef, { num_comments: increment(1) });
          handleIncrementComment(); // updates UI to reflect new comment
          
          if (!replyCommentID) {
            let updatedComment = {id: resp.id, ...userComment};
            updatedComment.created_at = localTimestamp;
            setDisplayComments([updatedComment, ...displayComments]);
          } else if (replyData) {
            const parentID = replyParentID ? replyParentID : replyCommentID;
            let updatedReplyData = {id: resp.id, parent_id: parentID, ...userComment};
            updatedReplyData.created_at = localTimestamp;
            setReply(updatedReplyData);
            updateNumReplies(parentID, 1);
          }
    
          requestRefresh();
          if (replyCommentID != "") {
            requestReply(resp.id);
          }
          if (userData) {
            createNotification(post.user_id, NotificationType.CommentNotification, userData, post, userComment.comment, post.id)
            sendPushNotification(post.user_id, `${userData.first_name} commented on your post`, userComment.comment)
          }
          setReply(null);
        }
    }

    // Should abstract this with params
    const handleHeart = async () => {
        if (!user) return;
        
        const postRef = post.score == -2 
        ? doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id)
        : doc(db, "globalPosts", post.post_id);
        
        setIsLiked(!isLiked);
        try {
          if (isLiked) {
            setNumLikes(numLikes - 1);
            await updateDoc(postRef, {
              likes: arrayRemove(user.uid)
            }); 
          } else {
            if (userData) {
              const sendNotification = await checkShouldSendNotification(NotificationType.LikedPostNotification, post.user_id, userData);
              if (sendNotification) {
                createNotification(post.user_id, NotificationType.LikedPostNotification, userData, post, '', post.id)
                sendPushNotification(post.user_id, "Liked Post", `${userData.first_name} liked your post`)
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

    const postPageLikes = useCallback(() => {
          return (
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 5}}>
              <TouchableOpacity style={{alignItems: 'center', paddingTop: 5,}} onPress={handleHeart}>
                <Ionicons
                  name={isLiked ? "heart" :"heart-outline"} size={25}
                  color={isLiked ? '#8b0000' : Colors[colorScheme ?? 'light'].text}
                  style={{paddingRight: 5}}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{alignItems: 'center', paddingTop: 5, paddingRight: 7, flexDirection: 'row'}} onPress={() => handleLikes(true)}>
                <Text style={{fontSize: 14}}>Liked by {topLikers.length == 0 ? "nobody" : (topLikers.length == 1 ? topLikers[0].first_name : (
                  topLikers.length == 2 ? topLikers[0].first_name + ", " + topLikers[1].first_name : topLikers[0].first_name + 
                  ", " + topLikers[1].first_name + ", and " + (numLikes - topLikers.length) + " others"
                ))}</Text>
              </TouchableOpacity>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10}}>
              <TouchableOpacity style={{alignItems: 'center'}} onPress={() => setFocus(prev => 1 + prev)}>
                <Ionicons name="chatbubble-outline" size={25} color={Colors[colorScheme ?? 'light'].text} style={{paddingRight: 5}}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFocus(prev => 1 + prev)}>
                <Text style={{fontSize: 14}}>{numComments} Comments</Text>
              </TouchableOpacity>
            </View>
            </View>
          )
      }, [handleLikes, topLikers, numComments])

    return (
        <GestureHandlerRootView>
        <ScrollView style={{height: Dimensions.screenHeight}} showsVerticalScrollIndicator={false}>
            <PostFeed item={post} index={0} handleComments={() => {}} handleLikes={handleLikes} incrementComment={incrementComment}
                redirectLink={redirectLink} isPostPage={true} />
            {postPageLikes()}
            <LikesModal post={post} onClose={() => handleLikes(false)} visible={showLikes} redirectLink={redirectLink} />
            <CommentsModal post={post} onClose={() => {}} visible={true} handleIncrementComment={handleIncrementComment} redirectLink={redirectLink} isPostPage={true}
            setCommentID={setReplyCommentID} setParentID={setReplyParentID} setUsername={setReplyUsername} rep={reply} cmts={displayComments} setCmts={setDisplayComments}/>
        </ScrollView>
        <CommentInput replyUsername={replyUsername} setReplyCommentID={setReplyCommentID} setReplyUsername={setReplyUsername}
        handleComment={handleComment} setComment={setComment} comment={comment} focus={focus} />
        </GestureHandlerRootView>
    )
}