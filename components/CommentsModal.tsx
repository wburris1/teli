import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, LayoutAnimation, Modal, Platform, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, UIManager, useColorScheme } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Dimensions from '@/constants/Dimensions';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp, addDoc, arrayUnion, collection, doc, getDoc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { CommentsList } from './CommentsList';
import { AppNotification, DisplayComment, FeedPost, NotificationType, UserComment } from '@/constants/ImportTypes';
import { getComments, getUsersData } from '@/data/getComments';
import { useLoading } from '@/contexts/loading';
import { createNotification } from './Helpers/CreatePlusAddNotification';
import { sendPushNotification } from './Helpers/sendNotification';

const db = FIREBASE_DB;

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CommentsModal = ({post, onClose, visible, redirectLink, handleIncrementComment}: {post: FeedPost, onClose: () => void, visible: boolean, redirectLink: string, handleIncrementComment: () => void}) => {
  const { user, userData } = useAuth();
  const translateY = useSharedValue(0);
  const [dragging, setDragging] = useState(false);
  const colorScheme = useColorScheme();
  const [comment, setComment] = useState('');
  const { comments, loaded } = getComments(post);
  const [displayComments, setDisplayComments] = useState<any[]>([]);
  const { requestRefresh } = useData();
  const textInputRef = useRef<TextInput>(null);
  const [replyUsername, setReplyUsername] = useState('');
  const [replyCommentID, setReplyCommentID] = useState('');
  const [replyParentID, setReplyParentID] = useState('');
  const { requestReply } = useData();
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<any>(null);

  const animateComment = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  useEffect(() => {
    if (comments) {
      setDisplayComments(comments);
    }
  }, [comments])

  useEffect(() => {
    if (loaded) {
      setLoading(false);
    }
  }, [loaded])

  useEffect(() => {
    setLoading(true);
  }, [post])

  useEffect(() => {
    if (!visible) {
      setReplyUsername('');
      setComment('');
      setReplyCommentID('');
      setReplyParentID('');
      requestReply('');
    }
  }, [visible])

  const updateNumReplies = (parentID: string, inc: number) => {
    setDisplayComments(prevComments => prevComments.map(cmt => {
      if (cmt.id === parentID) {
        return { ...cmt, num_replies: cmt.num_replies + inc };
      }
      return cmt;
    }));
  }

  const handleReply = async (username: string, comment_id: string, parentCommentID: string) => {
    setReplyUsername(username);
    setReplyCommentID(comment_id);
    setReplyParentID(parentCommentID);

    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }

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
        userPushToken: userData.userPushToken,
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

      if (replyCommentID != "") {
        replyData = {parent_id: replyParentID ? replyParentID : replyCommentID, ...displayComment};
        setReply(replyData);

        if (replyParentID != "") {
          commentRef = collection(commentRef, replyParentID, "replies"); // Replying to a reply just replies to parent comment
          // TODO: Add tagged user when replying
        } else {
          commentRef = collection(commentRef, replyCommentID, "replies");
        }
      } else {
        setDisplayComments([displayComment, ...displayComments]);
        animateComment();
      }
      
      const resp = await addDoc(commentRef, userComment);
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

      await updateDoc(postRef, { num_comments: increment(1) });
      handleIncrementComment(); // updates UI to reflect new comment
      if (replyCommentID) {
        const parentCommentRef = doc(postRef, "comments", replyParentID != "" ? replyParentID : replyCommentID);
        await updateDoc(parentCommentRef, { num_replies: increment(1) })
      }
      
      requestRefresh();
      if (replyCommentID != "") {
        requestReply(resp.id);
      }
      if (userData) {
        createNotification(post.user_id, NotificationType.CommentNotification, userData, post, userComment.comment)
        sendPushNotification(post.userPushToken, `${post.first_name} commented on your post`, userComment.comment)
      }
      setReply(null);
    }
  }

  const gestureHandler = (event: PanGestureHandlerGestureEvent) => {
    setDragging(true);
    if (event.nativeEvent.translationY >= Dimensions.screenHeight * 0.5) {
      onClose();
    } else if (event.nativeEvent.translationY > 0) {
      //translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      translateY.value = event.nativeEvent.translationY;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    if (!dragging || visible) {
      if (translateY.value >= Dimensions.screenHeight * 0.5) {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
        onClose();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    }
  }, [dragging, visible])

  const commentsList = useCallback(() => 
    <CommentsList comments={displayComments} post={post} handleReply={handleReply} onClose={onClose}
    redirectLink={redirectLink} changeComments={setDisplayComments} newReply={reply} updateNumReplies={updateNumReplies} animateComment={animateComment}/>
  , [reply, displayComments, post, redirectLink])

  return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{flex: 1, backgroundColor: 'transparent'}}/>
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <PanGestureHandler onGestureEvent={gestureHandler} onEnded={() => setDragging(false)}>
                <Animated.View style={[styles.container, animatedStyle, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
                    <View style={styles.handle} />
                    <Text style={styles.text}>Comments</Text>
                    {!loading ? commentsList() : (
                      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                        <ActivityIndicator size="large" />
                      </View>
                    )}
                </Animated.View>
              </PanGestureHandler>
            </TouchableWithoutFeedback>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{position: 'absolute', bottom: 40, zIndex: 1, width: '100%'}}
            >
                <View style={styles.inputContainer}>
                    {replyUsername != "" && (
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 5,}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Ionicons name="caret-forward" size={20} color={Colors[colorScheme ?? 'light'].text} />
                          <Text style={styles.replyText}>Replying to <Text style={styles.username}>@{replyUsername}</Text></Text>
                        </View>
                        <TouchableOpacity onPress={() => {
                          setReplyUsername('');
                          setReplyCommentID('');
                        }}>
                          <Ionicons name="close" size={20} color={Colors[colorScheme ?? 'light'].text} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={{flexDirection: 'row', flex: 1, alignItems: 'center'}}>
                      <TextInput
                          ref={textInputRef}
                          placeholder="Write a comment..."
                          placeholderTextColor="#999"
                          value={comment}
                          onChangeText={setComment}
                          style={[styles.input,{color: Colors[colorScheme ?? 'light'].text,}]}
                      />
                      {comment != "" && (
                        <TouchableOpacity onPress={handleComment} style={{
                          borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7,
                          backgroundColor: Colors[colorScheme ?? 'light'].text,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{fontSize: 16, fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].background}}>Post</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                </View>
            </KeyboardAvoidingView>
            <View style={{position: 'absolute', bottom: 0, height: 40, width: '100%', zIndex: 1}} />
        </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1,
  },
  handle: {
    width: 60,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginVertical: 10,
  },
  text: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    height: 40,
    fontSize: 16,
    paddingRight: 5,
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '300',
  },
  replyText: {
    fontSize: 14,
    fontWeight: '400',
    paddingHorizontal: 3,
  }
});

export default CommentsModal;