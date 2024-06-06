import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import {  collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getDataLocally, storeDataLocally } from './userLocalData';

const db = FIREBASE_DB;

export const useUserListsSearch = (listTypeID: string) => {
    const { refreshFlag, refreshListFlag } = useData();
    const [lists, setLists] = useState<List[]>([]);
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const { setMovieLists, setTVLists } = useData();
  
    useEffect(() => {
      if (user) {
        const userListsRef = collection(db, "users", user.uid, listTypeID);
  
        const unsubscribe = onSnapshot(userListsRef, (snapshot) => {
          const userLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
          setLists(userLists);
          setLoaded(true);
  
          if (listTypeID == Values.movieListsID) {
            setMovieLists(userLists);
          } else {
            setTVLists(userLists);
          }
  
          // Store lists locally
          storeDataLocally(`lists_${user.uid}_${listTypeID}`, userLists);
        }, (error: any) => {
          console.error("Error fetching lists: ", error);
          setLoaded(true);
        });
  
        return () => unsubscribe();
      }
    }, [refreshFlag, refreshListFlag, user]);
  
    useEffect(() => {
      if (user) {
        // Load lists from local storage initially
        getDataLocally(`lists_${user.uid}_${listTypeID}`).then(localLists => {
          setLists(localLists);
          setLoaded(true);
        });
      }
    }, [user]);
  
    return { lists, loaded };
}

export const useUserItemsSeenSearch = (listID: string, listTypeID: string) => {
    const { refreshFlag, refreshListFlag } = useData();
    const [items, setItems] = useState<UserItem[]>([]);
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);
  
    useEffect(() => {
      if (user) {
        const userItemsRef = collection(db, "users", user.uid, listTypeID, listID, "items");
  
        const unsubscribe = onSnapshot(userItemsRef, (snapshot) => {
          const seenItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
          setItems(seenItems);
          setLoaded(true);
  
          // Store items locally
          storeDataLocally(`items_${user.uid}_${listTypeID}_${listID}`, seenItems);
        }, (error) => {
          console.error("Error fetching seen items: ", error);
          setLoaded(true);
        });
  
        return () => unsubscribe();
      }
    }, [refreshFlag, user]);
  
    useEffect(() => {
      if (user) {
        // Load items from local storage initially
        getDataLocally(`items_${user.uid}_${listTypeID}_${listID}`).then(localItems => {
          setItems(localItems);
          setLoaded(true);
        });
      }
    }, [user]);
  
    return { items, loaded };
}


