import { usePushNotifications } from '@/components/TemplateFiles/usePushNotifications';
import { UserItem } from '@/constants/ImportTypes';
import * as Notifications from "expo-notifications";
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './authContext';
import { doc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '@/firebaseConfig';

type DataContextType = {
    movies: UserItem[];
    setMovies: (items: UserItem[]) => void;
    shows: UserItem[];
    setShows: (items: UserItem[]) => void;
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
    userPushToken: Notifications.ExpoPushToken | undefined
    notification: Notifications.Notification | undefined
};

type Props = {
    children: ReactNode;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<Props> = ({ children }: Props) => {
    const [movies, setMovies] = useState<UserItem[]>([]);
    const [shows, setShows] = useState<UserItem[]>([]);
    const [tvLists, setTVLists] = useState<List[]>([]);
    const [movieLists, setMovieLists] = useState<List[]>([]);
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [refreshListFlag, setRefreshListFlag] = useState(false);
    const [replyID, setReplyFlag] = useState('');
    const { userPushToken, notification} = usePushNotifications();
    const { userData } = useAuth()

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

    return (
        <DataContext.Provider
            value={{ movies, setMovies, shows, setShows,
                tvLists, setTVLists, movieLists, setMovieLists,
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