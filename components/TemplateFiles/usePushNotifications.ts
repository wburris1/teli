
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {Platform} from "react-native"
import { useEffect, useRef, useState } from "react";
import { projectID } from "firebase-functions/params";


export interface PushNotificationState {
  notification?: Notifications.Notification;
  userPushToken?: Notifications.ExpoPushToken;
}

export const usePushNotifications = (): PushNotificationState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldShowAlert: true,
      shouldSetBadge: false,
    })
  })
  const [userPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    if(Device.isDevice) {
      const {status: existingStatus} = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert("failed to get push token");
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectID
      });
      if(Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync("default",{
          name: "this is the name",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C'
        });
      }
      return token;
    } else {
      console.log("Error: Push Notifications only work with physical device not simulators")
    }
  }
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("this is the notification" + notification);
        setNotification(notification);
      })
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("this is the response: " + response)
    })
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      )
      Notifications.removeNotificationSubscription(
        responseListener.current!
      )
    }
  }, [])
  return { userPushToken, notification }
}