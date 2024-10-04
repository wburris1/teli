import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Dimensions from '@/constants/Dimensions';
import { Text, View } from './Themed';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc} from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FeedPost } from '@/constants/ImportTypes';
import { fetchUserData } from '@/data/getComments';
import { UsersListScreen } from './Search/UserSearchCard';
import { useLoading } from '@/contexts/loading';

const db = FIREBASE_DB;

const LikesModal = ({post, onClose, visible, redirectLink}: {post: FeedPost, onClose: () => void, visible: boolean, redirectLink: string}) => {
  const { user } = useAuth();
  const translateY = useSharedValue(0);
  const [dragging, setDragging] = useState(false);
  const colorScheme = useColorScheme();
  //const { displayComments, loaded } = getComments(post);
  const { refreshFlag, requestRefresh } = useData();
  const [userList, setUserList] = useState<UserData[]>([]);
  const { loading, setLoading } = useLoading();
  const USERS_PAGE_SIZE = 10;

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
  


  const getLikedUsers = useCallback(async () => {
    if (!post.post_id) {
      return
    }
    try {
      setLoading(true);
      const postRef = post.score >= 0 ? doc(db, "globalPosts", post.post_id) :
        (post.score == -2 ?  doc(db, "users", post.user_id, post.list_type_id, Values.bookmarkListID, "items", post.item_id) :
          doc(db, "globalPosts", post.post_id));

      const updatedDoc = await getDoc(postRef);

      if (updatedDoc.exists()) {
        const updatedLikes = updatedDoc.data().likes as string[];
        const userDataPromises = updatedLikes.map(userId => fetchUserData(userId));
        const usersData = await Promise.all(userDataPromises);
        setUserList(usersData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  }, [post])
  useEffect(() => {
    if (visible) {
      getLikedUsers();
    }
  }, [visible, getLikedUsers]);

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
                  <Text style={styles.text}>Likes</Text>
                  {!loading && userList.length == 0 ? (
                      <View style={{justifyContent: 'flex-start', width: '100%', alignItems: 'center', flex: 1, marginTop: 100}}>
                        <Text style={{fontSize: 22, color: 'gray'}}>Noone has liked yet</Text>
                        <Text style={{fontSize: 22, color: 'gray', paddingTop: 5}}>Be the first!</Text>
                      </View>
                    ) :
                  !loading ?
                  <View style={{ flex: 1 }}>
                    <UsersListScreen users={userList} redirectPath= {redirectLink + '_user'} onClose={onClose}/>
                    {loading && <Text>Loading...</Text>}
                    {userList.length == USERS_PAGE_SIZE &&
                    <TouchableOpacity onPress={loadMoreUsers} disabled={loading}>
                        <Text>Load More</Text>
                    </TouchableOpacity>}
                  </View> : (
                    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                      <ActivityIndicator size="large" />
                    </View>
                  )}
                </Animated.View>
              </PanGestureHandler>
            </TouchableWithoutFeedback>
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
});

export default LikesModal;