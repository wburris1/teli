import { ActivityIndicator, FlatList, LayoutAnimation, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { Text, View } from '@/components/Themed';
import MovieScreen from '@/components/Search/SearchCard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCallback, useEffect, useRef, useState } from 'react';
import Colors from "@/constants/Colors";
import { AppNotification, NotificationType } from '@/constants/ImportTypes';
import { DocumentSnapshot, Timestamp, collection, doc, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import NotificationDisplay from '@/components/NotificationDisplay';
import { FIREBASE_DB } from '@/firebaseConfig';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { useLoading } from '@/contexts/loading';

export default function TabOneScreen() {
  const { loading, setLoading } = useLoading();
  const [ loadingNoti, setLoadingNoti] = useState(false);
  const db = FIREBASE_DB;
  const { userData } = useAuth();
  const { refreshFlag } = useData();
  const [ isLoadingMore, setIsLoadingMore] = useState(false);
  const [noti, setNoti] = useState<AppNotification[]>([])
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const [deleteNoti, setDeleteNoti] = useState('')
  const lastFetchedNotification = useRef<DocumentSnapshot | null>(null);

  const fetchUserNoti = async (limitNumber: number = 15, refresh: boolean = false) => {
    if (userData) {
      try {
        const userDocRef = doc(db, 'users', userData.user_id);
        const notiCollectionRef = collection(userDocRef, 'notifications');
        const notiQuery = !lastFetchedNotification.current || refresh
        ? query(notiCollectionRef, orderBy('created_at', 'desc'), limit(limitNumber))
        : query(notiCollectionRef, orderBy('created_at', 'desc'), startAfter(lastFetchedNotification.current), limit(limitNumber));

        const postsSnapshot = await getDocs(notiQuery);
        if (!postsSnapshot.empty) {
          lastFetchedNotification.current = postsSnapshot.docs[postsSnapshot.docs.length - 1];
        }
        return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as AppNotification }));
      } catch (error) {
        console.log("error fetch user notifications " + error);
      }
    }
  };

  useEffect(() => {
    setNoti(noti.filter(noti => noti.noti_id !== deleteNoti))
  },[deleteNoti]);

  useEffect(() => {
    // fires once when we initially load notifications
    setLoadingNoti(true);
    const getNotifications = async () => {
      const newNoti =  await fetchUserNoti();
      if (newNoti) {
        setNoti(newNoti)
        setLoadingNoti(false);
      }
    }
    getNotifications();
  }, [userData]);

  const onRefresh = useCallback(async () => {    
    setRefreshing(true);
    const newNoti = await fetchUserNoti(15, true);
    if (newNoti) {
      setNoti(newNoti)
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
    }
    setRefreshing(false);
  }, []);

  const loadMoreNoti = async () => {
      setIsLoadingMore(true);
      const newNoti = await fetchUserNoti(10);
      if (newNoti) {
        const combinedNotifications = [...noti, ...newNoti];
        setNoti(combinedNotifications);
      }
      setIsLoadingMore(false);
  };
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator style={{ margin: 20 }} />;
  };

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={{ width: '100%', height: '100%', backgroundColor: Colors[colorScheme ?? 'light'].background }}>
        {!loadingNoti ? (
          <>
            <FlatList
              data={noti}
              keyExtractor={(item: AppNotification) => item.noti_id}
              renderItem={({ item, index }) => <NotificationDisplay noti={item} setDeleteNoti={setDeleteNoti} />}
              onEndReached={loadMoreNoti}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
