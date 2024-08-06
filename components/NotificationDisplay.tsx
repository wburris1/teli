import { FIREBASE_DB } from '@/firebaseConfig';
import { Link } from 'expo-router';
import { Text, View} from "./Themed";
import { ActivityIndicator, Alert, Image, LayoutAnimation, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Colors from "@/constants/Colors";
import { formatDate } from "./Helpers/FormatDate";
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Timestamp, collection, deleteDoc, doc } from 'firebase/firestore';
import { AppNotification, NotificationType } from '@/constants/ImportTypes';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useCallback, useState } from 'react';
import { useData } from '@/contexts/dataContext';
import { useLoading } from '@/contexts/loading';


type notiProps = {
  noti: AppNotification
  setDeleteNoti: (deleteNoti: string) => void,
};

const NotificationDisplay = ({ noti, setDeleteNoti}: notiProps) => {
  const { loading, setLoading } = useLoading();
  const imgUrl = 'https://image.tmdb.org/t/p/w500';
  const homeFeedFontSize = 18
  const colorScheme = useColorScheme();
  const formattedDate = formatDate(noti.created_at as Timestamp);
  const id = noti.noti_id;
  const item = noti.item;
  const [isSwiped, setSwiped] = useState(false);
  const DELETE_WIDTH = 80;
  const db = FIREBASE_DB;
  const { requestRefresh } = useData();

  const getNotificationText = (notificationType: NotificationType): string => {
    switch (notificationType) {
      case NotificationType.LikedCommentNotification:
        return " liked your comment: ";
      case NotificationType.LikedPostNotification:
        return " liked your post on ";
      case NotificationType.CommentNotification:
        return " commented on your post: ";
      case NotificationType.FollowNotification:
        return " started following you";
      default:
        return " we defaulted";
    }
  };  
  const transX = useSharedValue(0);
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
  const handleSetSwiped = useCallback((value: boolean) => {
      setSwiped(value);
  }, []);

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
  const onDelete = useCallback(() => {
    const alertHeaderText = "Confirm Delete";
    const alertText = "Are you sure you want to delete this notification?";
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
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
      setDeleteNoti(noti.noti_id)
      const userNotiRef = collection(db, 'users', noti.receiver_id, 'notifications');
      const docReference = doc(userNotiRef, noti.noti_id)
      await deleteDoc(docReference)
      console.log("notification deleted");
    } catch (error) {
      console.error("Error deleting notification: ", error);
    }
  }, [])
  
  return (
    <View>
    <GestureDetector gesture={panGesture} key={noti.noti_id}>
    
    <View>
      <Animated.View style={[styles.itemContainer, animatedStyle, {
          backgroundColor: Colors[colorScheme ?? 'light'].background, 
          borderBottomColor: Colors[colorScheme ?? 'light'].text,
      }]}>
      <View style={[styles.postContainer, {borderColor: Colors[colorScheme ?? 'light'].gray}]} key={id}>
        <View style={{flexDirection: 'row', flex: 1,}}>
          <Link href={{pathname: 'notification_user', params: { userID: noti.sender_id }}} asChild>
              <TouchableOpacity>
                  <Image
                      source={{ uri: noti.profile_picture }}
                      style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text}]}
                  />
              </TouchableOpacity>
          </Link>
            <View style={{flex: 1, alignItems: 'flex-start', paddingLeft: 7,}}>
                <View style={{flexDirection: 'row', alignItems: 'flex-start',}}>
                    <Text numberOfLines={2} style={{fontSize: 17, marginBottom: 3, flex: 1, paddingRight: 15,}}>
                      <Link href={{pathname: 'notification_user', params: { userID: noti.sender_id }}} asChild>
                        <TouchableOpacity>
                          <Text style={{fontWeight: '500',fontSize: homeFeedFontSize}}>{noti.sender_username}</Text>
                        </TouchableOpacity>
                      </Link>
                      <View>
                        <Text style = {{fontWeight: '300', fontSize: homeFeedFontSize}}>{
                          getNotificationText(noti.notification_type)
                        }</Text>
                      </View>
                      <View>
                        {noti.comment_id && (
                          <Text style={{ fontWeight: '300', fontSize: 16 }}>
                            {`${noti.comment_id}`}
                          </Text>
                        )}
                      </View>
                      
                      {(item && !noti.comment_id) && 
                        <TouchableOpacity>
                            <Text style={{fontWeight: 'bold',fontSize: homeFeedFontSize}}>{item.item_name}</Text>
                        </TouchableOpacity>
                      }
                    </Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', paddingRight: 95}}>
                  <Text numberOfLines={1} style={{fontSize: 14, fontWeight: '200', alignSelf: 'flex-start',}}>{formattedDate}</Text>
                </View>
            </View>
            <TouchableOpacity>
              {item && <Image
                source={{ uri: imgUrl + item.poster_path }}
                style={[styles.itemImage, { borderColor: Colors[colorScheme ?? 'light'].text }]}
              />
              }
            </TouchableOpacity>
        </View>
      </View>
      </Animated.View>
      <Animated.View style={[styles.deleteButtonContainer, deleteButtonStyle]}
          pointerEvents={isSwiped && transX.value <= -DELETE_WIDTH ? 'auto' : 'none'}>
          <TouchableOpacity style={[styles.fullSize, { borderBottomColor: Colors[colorScheme ?? 'light'].text }]} onPress={() => onDelete()}>
              <Ionicons
                  name={"trash"}
                  size={30}
                  color={'#fff'}
              />
          </TouchableOpacity>
      </Animated.View>
    </View>
    </GestureDetector>
    </View>
  )
};

const styles = StyleSheet.create({
  profilePic: {
      width: 60,
      aspectRatio: 1,
      borderRadius: 50,
      backgroundColor: 'gray',
      borderWidth: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    aspectRatio: 2/3,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingRight: 5,
    width: '100%',
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
  fullSize: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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

export default NotificationDisplay;