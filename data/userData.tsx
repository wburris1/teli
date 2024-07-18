import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import {  collection, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getDataLocally, storeDataLocally } from './userLocalData';
import { UserItem } from '@/constants/ImportTypes';
import { useLoading } from '@/contexts/loading';

const db = FIREBASE_DB;

export const useUserListsSearch = (listTypeID: string) => {
    const { refreshFlag, refreshListFlag } = useData();
    const [lists, setLists] = useState<List[]>([]);
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const { setMovieLists, setTVLists } = useData();
    const { loading, setLoading } = useLoading();
  
    useEffect(() => {
      if (user) {
        const userListsRef = collection(db, "users", user.uid, listTypeID);
  
        const unsubscribe = onSnapshot(userListsRef, (snapshot) => {
          const userLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
          setLists(userLists);
          setLoaded(true);
  
          if (listTypeID == Values.movieListsID) {
            //setMovieLists(userLists);
          } else {
            //setTVLists(userLists);
          }
  
          // Store lists locally
          storeDataLocally(`lists_${user.uid}_${listTypeID}`, userLists);
        }, (error: any) => {
          console.error("Error fetching lists: ", error);
          setLoading(false);
        });
  
        return () => unsubscribe();
      }
    }, [refreshFlag, refreshListFlag, user]);
  
    useEffect(() => {
      if (user) {
        // Load lists from local storage initially
        getDataLocally(`lists_${user.uid}_${listTypeID}`).then(localLists => {
          setLists(localLists);
          setLoading(false);
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

    if (listID === "") {
      return { items: [], loaded: true };
    }

    useEffect(() => {
      if (user && listID && listID != "") {
        const userItemsRef = collection(db, "users", user.uid, listTypeID, listID, "items");
  
        const unsubscribe = onSnapshot(userItemsRef, (snapshot) => {
          const seenItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
          setItems(seenItems || []);
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
      if (user && listID && listID != "") {
        // Load items from local storage initially
        getDataLocally(`items_${user.uid}_${listTypeID}_${listID}`).then(localItems => {
          setItems(localItems || []);
          setLoaded(true);
        });
      }
    }, [user]);
  
    return { items, loaded };
}

export const useUserItemsSearch = (userID: string, listID: string, listTypeID: string) => {
  const { refreshFlag, refreshListFlag } = useData();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  if (listID === "") {
    return { items: [], loaded: true };
  }

  useEffect(() => {
    if (userID && listID && listID != "") {
      const userItemsRef = collection(db, "users", userID, listTypeID, listID, "items");

      const unsubscribe = onSnapshot(userItemsRef, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
        setItems(itemsData || []);
        setLoaded(true);
      }, (error) => {
        console.error("Error fetching seen items: ", error);
        setLoaded(true);
      });

      return () => unsubscribe();
    }
  }, [refreshFlag]);

  return { items, loaded };
}

export const getItems = () => {
  const { user } = useAuth();

  async function fetchItems(listID: string, listTypeID: string) {
    if (user && listID && listTypeID) {
      const userDocRef = doc(db, 'users', user.uid);
      const itemsRef = collection(userDocRef, listTypeID, listID, "items");
      const snapshot = await getDocs(itemsRef);
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
      return itemsData;
    }
    return [];
  }

  return fetchItems;
}
