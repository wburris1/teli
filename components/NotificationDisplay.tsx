import { FIREBASE_DB } from '@/firebaseConfig';
import { Link } from 'expo-router';
import { Text, View} from "./Themed";
import { Image, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Colors from "@/constants/Colors";
import { formatDate } from "./Helpers/FormatDate";
import { Timestamp } from 'firebase/firestore';
import { AppNotification, NotificationType } from '@/constants/ImportTypes';


type notiProps = {
  noti: AppNotification
};

const NotificationDisplay = ({ noti }: notiProps) => {
  const imgUrl = 'https://image.tmdb.org/t/p/w500';
  const homeFeedFontSize = 18
  const colorScheme = useColorScheme();
  const formattedDate = formatDate(noti.created_at as Timestamp);
  const id = noti.noti_id;
  const item = noti.item;
  
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
  
  return (
    <View style={[styles.postContainer, {borderColor: Colors[colorScheme ?? 'light'].gray}]} key={id}>
      <View style={{flexDirection: 'row', flex: 1,}}>
            <TouchableOpacity>
                <Image
                    source={{ uri: noti.profile_picture }}
                    style={[styles.profilePic, { borderColor: Colors[colorScheme ?? 'light'].text}]}
                />
            </TouchableOpacity>
          <View style={{flex: 1, alignItems: 'flex-start', paddingLeft: 7,}}>
              <View style={{flexDirection: 'row', alignItems: 'flex-start',}}>
                  <Text numberOfLines={2} style={{fontSize: 17, marginBottom: 3, flex: 1, paddingRight: 15,}}>
                    <TouchableOpacity>
                      <Text style={{fontWeight: '500',fontSize: homeFeedFontSize}}>{noti.sender_username}</Text>
                    </TouchableOpacity>
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