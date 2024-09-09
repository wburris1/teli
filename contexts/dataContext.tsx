import { usePushNotifications } from '@/components/TemplateFiles/usePushNotifications';
import { List, UserItem } from '@/constants/ImportTypes';
import * as Notifications from "expo-notifications";
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './authContext';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import Values from '@/constants/Values';

type DataContextType = {
    movies: UserItem[] | null;
    setMovies: (items: UserItem[]) => void;
    shows: UserItem[] | null;
    setShows: (items: UserItem[]) => void;
    following: string[];
    setFollowing: (users: string[]) => void;
    followers: string[];
    setFollowers: (users: string[]) => void;
    tvLists: List[];
    setTVLists: (items: List[]) => void;
    movieLists: List[];
    setMovieLists: (items: List[]) => void;
    refreshFlag: boolean;
    requestRefresh: () => void;
    refreshListFlag: boolean,
    requestListRefresh: () => void;
    replyID: string;
    requestReply: (id: string) => void;
    userPushToken: Notifications.ExpoPushToken | undefined;
    notification: Notifications.Notification | undefined;
};

type Props = {
    children: ReactNode;
}

const db = FIREBASE_DB;
const imgUrl = 'https://image.tmdb.org/t/p/w342';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<Props> = ({ children }: Props) => {
    const [movies, setMovies] = useState<UserItem[] | null>(null);
    const [shows, setShows] = useState<UserItem[] | null>(null);
    const [followers, setFollowers] = useState<string[]>([]);
    const [following, setFollowing] = useState<string[]>([]);
    const [tvLists, setTVLists] = useState<List[]>([]);
    const [movieLists, setMovieLists] = useState<List[]>([]);
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [refreshListFlag, setRefreshListFlag] = useState(false);
    const [replyID, setReplyFlag] = useState('');
    const { userPushToken, notification} = usePushNotifications();
    const { user, userData } = useAuth();

    if (userData) {
      const currentToken = userData.userPushToken;
      const newToken = userPushToken?.data ?? '';
      
      if(currentToken !== newToken) {
        // update userPushToken 
        const userRef = doc(FIREBASE_DB, 'users', userData.user_id);
        const updatedUserData: UserData = {
            user_id: userData.user_id,
            email: userData.email,
            profile_picture: userData.profile_picture,
            first_name: userData.first_name,
            last_name: userData.last_name,
            username: userData.username,
            bio: userData.bio,
            is_private: userData.is_private,
            userPushToken: userPushToken?.data ?? '',
        };
        updateDoc(userRef, updatedUserData); 
        console.log("updated userPushToken to " + userPushToken?.data)
      }
    }

    const requestReply = useCallback((id: string) => {
        setReplyFlag(id);
    }, []);

    const requestRefresh = useCallback(() => {
        setRefreshFlag(prev => !prev);
        console.log("refreshed");
    }, []);

    const requestListRefresh = useCallback(() => {
        setRefreshListFlag(prev => !prev);
    }, []);

    useEffect(() => {
        if (user) {
          const userListsRef = collection(db, "users", user.uid, Values.movieListsID);
    
          const unsubscribe = onSnapshot(userListsRef, (snapshot) => {
            let userLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
            userLists = [...userLists.map(list => {
              const items = movies ? movies.filter(movie => movie.lists.includes(list.list_id)) : [];
              let newList = list;
              newList.top_poster_path = items.length > 0 ? imgUrl + items[0].poster_path : '';
              newList.second_poster_path= items.length > 1 ? imgUrl + items[1].poster_path : '';
              newList.bottom_poster_path = items.length > 2 ? imgUrl + items[2].poster_path: '';
              return newList;
            })];
            setMovieLists(userLists);
          }, (error: any) => {
            console.error("Error fetching movie lists: ", error);
          });
    
          return () => unsubscribe();
        }
    }, [refreshFlag, refreshListFlag, user, movies]);

    useEffect(() => {
        if (user) {
          const userListsRef = collection(db, "users", user.uid, Values.tvListsID);
    
          const unsubscribe = onSnapshot(userListsRef, (snapshot) => {
            let userLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
            userLists = [...userLists.map(list => {
              const items = shows ? shows.filter(show => show.lists.includes(list.list_id)) : [];
              let newList = list;
              newList.top_poster_path = items.length > 0 ? imgUrl + items[0].poster_path : '';
              newList.second_poster_path= items.length > 1 ? imgUrl + items[1].poster_path : '';
              newList.bottom_poster_path = items.length > 2 ? imgUrl + items[2].poster_path: '';
              return newList;
            })];
            setTVLists(userLists);
          }, (error: any) => {
            console.error("Error fetching tv lists: ", error);
          });
    
          return () => unsubscribe();
        }
    }, [refreshFlag, refreshListFlag, user, shows]);

    useEffect(() => {
        if (user) {
          const userItemsRef = collection(db, "users", user.uid, "movies");
          const itemQuery = query(userItemsRef, orderBy('score', 'desc'));
    
          const unsubscribe = onSnapshot(itemQuery, (snapshot) => {
            const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
            setMovies(itemsData || []);
          }, (error) => {
            console.error("Error fetching users movies: ", error);
          });
    
          return () => unsubscribe();
        }
    }, [refreshFlag, user]);

    useEffect(() => {
        if (user) {
          const userItemsRef = collection(db, "users", user.uid, "shows");
          const itemQuery = query(userItemsRef, orderBy('score', 'desc'));
    
          const unsubscribe = onSnapshot(itemQuery, (snapshot) => {
            const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
            setShows(itemsData || []);
          }, (error) => {
            console.error("Error fetching users shows: ", error);
          });
    
          return () => unsubscribe();
        }
    }, [refreshFlag, user]);

    useEffect(() => {
      if (user) {
        const followRef = collection(db, "users", user.uid, "followers");
        
        const unsubscribe = onSnapshot(followRef, (snapshot) => {
          setFollowers(snapshot.docs.map(doc => doc.id));
        }, (error) => {
          console.error("Error fetching users followers: ", error);
        })

        return () => unsubscribe();
      }
    }, [refreshFlag, user])

    useEffect(() => {
      if (user) {
        const followRef = collection(db, "users", user.uid, "following");
        
        const unsubscribe = onSnapshot(followRef, (snapshot) => {
          setFollowing(snapshot.docs.map(doc => doc.id));
        }, (error) => {
          console.error("Error fetching users following: ", error);
        })

        return () => unsubscribe();
      }
    }, [refreshFlag, user])

    return (
        <DataContext.Provider
            value={{ movies, setMovies, shows, setShows, followers, setFollowers, following,
                setFollowing, tvLists, setTVLists, movieLists, setMovieLists,
                refreshFlag, requestRefresh, refreshListFlag, requestListRefresh,
                replyID, requestReply, userPushToken, notification
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};