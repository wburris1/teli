import { ActivityIndicator, FlatList, StyleSheet, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import MovieScreen from '@/components/Search/SearchCard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import Colors from "@/constants/Colors";
import { AppNotification, NotificationType } from '@/constants/ImportTypes';
import { Timestamp, collection, doc, getDocs, query } from 'firebase/firestore';
import NotificationDisplay from '@/components/NotificationDisplay';
import { FIREBASE_DB } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { useLoading } from '@/contexts/loading';


export default function TabOneScreen() {
  const { loading, setLoading } = useLoading();
  const [ loadingNoti, setLoadingNoti] = useState(false);
  const db = FIREBASE_DB;
  const { user } = useAuth();
  const { refreshFlag } = useData();
  const [noti, setNoti] = useState<AppNotification[]>([])


  const testMovie: Movie = {
    id: "movie123",
    poster_path: "/path/to/poster.jpg",
    overview: "A thrilling adventure of a lifetime.",
    genres: [
        { id: "1", name: "Action" },
        { id: "2", name: "Adventure" }
    ],
    backdrop_path: "/path/to/backdrop.jpg",
    tagline: "The adventure begins.",
    title: "Adventure Movie",
    release_date: "2024-07-23"
  };
  const testUserData: UserData = {
    user_id: "user789",
    email: "user@example.com",
    username: "testuser",
    first_name: "Test",
    last_name: "User",
    is_private: false,
    profile_picture: "/path/to/profile.jpg",
    bio: "Just a test user."
  };
  const colorScheme = useColorScheme();
  const fetchUserNoti = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const notiCollectionRef = collection(userDocRef, 'notifications');
        const notiQuery = query(notiCollectionRef);
        const postsSnapshot = await getDocs(notiQuery);
        return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as AppNotification }));
      } catch (error) {
        console.log("error fetch user notifications " + error);
      }
    }
  };

  useEffect(() => {
    const getAllNotifications = async () => {
      setLoadingNoti(true)
      const notifications = await fetchUserNoti();

      if (notifications) {
        const allNotifications = notifications.sort((a, b) => (b.created_at as any).toDate() - (a.created_at as any).toDate());
        setNoti(allNotifications);
        return allNotifications;
      }
    }
    getAllNotifications();
    setLoadingNoti(false)

  }, [user, refreshFlag]); 
  const keyExtractor = (item: AppNotification) => item.noti_id;

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={{ width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
        {!loadingNoti ? (
          <>
            <FlatList
              data={noti}
              keyExtractor={keyExtractor}
              renderItem={({ item, index }) => <NotificationDisplay noti={item}  />}
            />
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </GestureHandlerRootView>
      {loading &&
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  loading: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'transparent',
  }
});
