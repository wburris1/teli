import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AppNotification, FeedPost, NotificationType } from '@/constants/ImportTypes';
import { useAuth } from '@/contexts/authContext';
import { FIREBASE_DB } from '@/firebaseConfig';

export const createNotification = async (
  receiver_id: string,
  notificationType: NotificationType,
  userData: UserData,
  item?: FeedPost,
  comment_id?: string,
  post_id?: string
) => {
  const db = FIREBASE_DB;
  const newNotification: AppNotification = {
    noti_id: "",
    receiver_id: receiver_id,
    sender_id: userData.user_id,
    sender_username: userData.first_name,
    comment_id: comment_id ?? '',
    profile_picture: userData.profile_picture,
    created_at: serverTimestamp(),
    item: item ?? null,
    notification_type: notificationType,
    post_id: post_id ?? '',
  };
  if (newNotification.receiver_id !== newNotification.sender_id) {
    try {
      const userNotiRef = collection(db, 'users', newNotification.receiver_id, 'notifications');
      const NotiRef = await addDoc(userNotiRef, newNotification);
      await updateDoc(NotiRef, { noti_id: NotiRef.id });
      console.log(notificationType + " successfully added!");
    } catch (error) {
      console.error("Error adding notification: ", error);
    }
  }
};
