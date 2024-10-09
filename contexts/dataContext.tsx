import { usePushNotifications } from '@/components/TemplateFiles/usePushNotifications';
import { List, UserItem, UserMovie, UserShow } from '@/constants/ImportTypes';
import * as Notifications from "expo-notifications";
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './authContext';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';
import Values from '@/constants/Values';
import { FetchFollowers, FetchFollowing, FetchItems, FetchMovieLists, FetchTVLists } from '@/components/Helpers/FetchFunctions';
import { Asset } from 'expo-asset';
import { Image } from 'react-native';

type DataContextType = {
    movies: UserItem[] | null;
    setMovies: (items: UserItem[]) => void;
    shows: UserItem[] | null;
    setShows: (items: UserItem[]) => void;
    following: string[] | undefined;
    setFollowing: (users: string[] | undefined) => void;
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
    currPostID: string,
    setCurrPostID: (id: string) => void,
    currNumComments: number,
    setCurrNumComments: (num: number) => void,
    currLikePostID: string,
    setCurrLikePostID: (id: string) => void,
    currNumLikes: number,
    setCurrNumLikes: (num: number) => void,
    currIsLiked: boolean,
    setCurrIsLiked: (is: boolean) => void,
    storedMoviePosters: { [key: string]: any },
    storedShowPosters: { [key: string]: any },
    storedListPosters: { [key: string]: any },
};

type Props = {
    children: ReactNode;
}

const db = FIREBASE_DB;
const imgUrl = 'https://image.tmdb.org/t/p/w342';
const posterUrl = 'https://image.tmdb.org/t/p/w500';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<Props> = ({ children }: Props) => {
    const [movies, setMovies] = useState<UserItem[] | null>(null);
    const [shows, setShows] = useState<UserItem[] | null>(null);
    const [followers, setFollowers] = useState<string[]>([]);
    const [following, setFollowing] = useState<string[] | undefined>();
    const [tvLists, setTVLists] = useState<List[]>([]);
    const [movieLists, setMovieLists] = useState<List[]>([]);
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [refreshListFlag, setRefreshListFlag] = useState(false);
    const [currPostID, setCurrPostID] = useState('');
    const [currNumComments, setCurrNumComments] = useState(0);
    const [currLikePostID, setCurrLikePostID] = useState('');
    const [currNumLikes, setCurrNumLikes] = useState(0);
    const [currIsLiked, setCurrIsLiked] = useState(false);
    const [storedMoviePosters, setStoredMoviePosters] = useState<{ [key: string]: any }>({});
    const [storedShowPosters, setStoredShowPosters] = useState<{ [key: string]: any }>({});
    const [storedListPosters, setStoredListPosters] = useState<{ [key: string]: any }>({});
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
        let updatedMovieLists: List[] = [];
        movieLists.forEach(list => {
          const items = movies ? movies.filter(movie => movie.lists.includes(list.list_id)) : [];
          let newList = list;
          newList.top_poster_path = items.length > 0 ? imgUrl + items[0].poster_path : '';
          newList.second_poster_path= items.length > 1 ? imgUrl + items[1].poster_path : '';
          newList.bottom_poster_path = items.length > 2 ? imgUrl + items[2].poster_path: '';
          updatedMovieLists.push(newList);
        })
        setMovieLists(updatedMovieLists);
      }
    }, [movies, refreshListFlag]);

    useEffect(() => {
        if (user) {
          let updatedTVLists: List[] = [];
          tvLists.forEach(list => {
            const items = shows ? shows.filter(show => show.lists.includes(list.list_id)) : [];
            let newList = list;
            newList.top_poster_path = items.length > 0 ? imgUrl + items[0].poster_path : '';
            newList.second_poster_path= items.length > 1 ? imgUrl + items[1].poster_path : '';
            newList.bottom_poster_path = items.length > 2 ? imgUrl + items[2].poster_path: '';
            updatedTVLists.push(newList);
          })
          setTVLists(updatedTVLists);
        }
    }, [shows, refreshListFlag]);

    useEffect(() => {
      if (user) {
        FetchMovieLists(user.uid).then(list => {
          setMovieLists(list);
        })
        FetchTVLists(user.uid).then(list => {
          setTVLists(list);
        })
      }
    }, [refreshFlag, user])

    useEffect(() => {
        if (user) {
          FetchItems(true, user.uid).then(items => {
            setMovies(items);
          })
          FetchItems(false, user.uid).then(items => {
            setShows(items);
          })
        }
    }, [refreshFlag, user]);

    useEffect(() => {
      if (user) {
        if (user) {
          FetchFollowing(user.uid).then(ids => {
            setFollowing(ids);
          })
          FetchFollowers(user.uid).then(ids => {
            setFollowers(ids);
          })
        }
      }
    }, [refreshFlag, user])

    useEffect(() => {
      const prefetchMoviePosters = async () => {
        const prefetched = await Promise.all(
          (movies || []).map(async (item) => {
            if (!item.poster_path) {
              return {[item.item_id]: ''};
            }
            Image.prefetch(posterUrl + item.poster_path);
            const imageAsset = await Asset.fromURI(posterUrl + item.poster_path).downloadAsync();
            return { [item.item_id]: imageAsset.localUri };
          })
        );
  
        const imageMap = prefetched.reduce((acc, cur) => ({ ...acc, ...cur }), {});
        setStoredMoviePosters(imageMap);
      };

      const prefetchShowPosters = async () => {
        const prefetched = await Promise.all(
          (shows || []).map(async (item) => {
            Image.prefetch(posterUrl + item.poster_path);
            const imageAsset = await Asset.fromURI(posterUrl + item.poster_path).downloadAsync();
            return { [item.item_id]: imageAsset.localUri };
          })
        );
  
        const imageMap = prefetched.reduce((acc, cur) => ({ ...acc, ...cur }), {});
        setStoredShowPosters(imageMap);
      };
  
      prefetchMoviePosters();
      prefetchShowPosters();
    }, [movies, shows]);

    useEffect(() => {
      const prefetchPosters = async () => {
        const allLists = [...(movieLists || []), ...(tvLists || [])];
        
        const prefetched = await Promise.all(
          allLists.map(async (list) => {
            const topPoster = list.top_poster_path && await Asset.fromURI(imgUrl + list.top_poster_path).downloadAsync();
            const secondPoster = list.second_poster_path && await Asset.fromURI(imgUrl + list.second_poster_path).downloadAsync();
            const bottomPoster = list.bottom_poster_path && await Asset.fromURI(imgUrl + list.bottom_poster_path).downloadAsync();
    
            return {
              [list.top_poster_path]: topPoster ? topPoster.localUri : '',
              [list.second_poster_path]: secondPoster ? secondPoster.localUri : '',
              [list.bottom_poster_path]: bottomPoster ? bottomPoster.localUri : '',
            };
          })
        );
    
        const imageMap = prefetched.reduce((acc, cur) => ({ ...acc, ...cur }), {});
        setStoredListPosters(imageMap);
      };
    
      prefetchPosters();
    }, [movieLists, tvLists]);

    return (
        <DataContext.Provider
            value={{ movies, setMovies, shows, setShows, followers, setFollowers, following,
                setFollowing, tvLists, setTVLists, movieLists, setMovieLists,
                refreshFlag, requestRefresh, refreshListFlag, requestListRefresh,
                replyID, requestReply, userPushToken, notification, currPostID, setCurrPostID,
                currNumComments, setCurrNumComments, currLikePostID, setCurrLikePostID, currNumLikes, setCurrNumLikes,
                currIsLiked, setCurrIsLiked, storedMoviePosters, storedShowPosters, storedListPosters
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