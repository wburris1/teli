// notifications.ts

import { fetchUserData } from "@/data/getComments";
import {  NotificationType } from "@/constants/ImportTypes";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { FIREBASE_DB } from "@/firebaseConfig";
import { useAuth } from "@/contexts/authContext";

const db = FIREBASE_DB;

// Function to send a push notification using Expo
export async function sendPushNotification(
  sender_id: string | undefined,
  receiverUserID: string | undefined,
  title: string,
  body: string,
) : Promise<void> {
  if(receiverUserID && receiverUserID !== sender_id) {
    try {
      const receiverData = await fetchUserData(receiverUserID);
      const userPushToken = receiverData.userPushToken 
      if (!userPushToken) return;
      // Define the message to be sent
      const message = {
        to: userPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: { someData: 'goes here' },
      };
      
      // Send the push notification via a POST request
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
        // Check for successful response
      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.status}`);
      }
      console.log('Push notification sent successfully');
    } catch (error) {
      // Catch and log any errors that occur during the process
      console.error('Error sending push notification:', error);
      throw error; // Rethrow the error to handle it outside
    }
  }
}

export async function checkShouldSendNotification(notificationType: NotificationType, userID: string, userData: UserData) {
  const timeLimit = 1 * 60 * 1000; // 1 minutes in milliseconds

  const notificationsRef = collection(db, "users", userID, "notifications");
  const q = query(
    notificationsRef,
    where("notification_type", "==", notificationType),
    where("sender_id", "==", userData.user_id),
    orderBy("created_at", "desc"),
    limit(1),
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const currentTime = new Date();
    const lastNotification = querySnapshot.docs[0];
    const lastNotificationTime = lastNotification.data().created_at.toDate();
    const timeDiff = currentTime.getTime() - lastNotificationTime.getTime();
    if (timeDiff < timeLimit) {
      console.log('Follow notification sent recently, skipping notification.');
      return false;
    }
  }
  return true;
}

