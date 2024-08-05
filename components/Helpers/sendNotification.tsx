// notifications.ts

import { ExpoPushToken } from "expo-notifications";

// Function to send a push notification using Expo
export async function sendPushNotification(
  userPushToken: string | undefined,
  title: string,
  body: string,
) : Promise<void> {
  if(userPushToken) {
    try {
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