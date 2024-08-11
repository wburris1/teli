import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import {  collection, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getDataLocally, storeDataLocally } from './userLocalData';
import { List, UserItem } from '@/constants/ImportTypes';
import { useLoading } from '@/contexts/loading';

const db = FIREBASE_DB;

export const useUserItemsSearch = (userID: string, listID: string, listTypeID: string) => {
  const { refreshFlag, refreshListFlag } = useData();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  if (listID === "") {
    return { items: [], loaded: true };
  }

  useEffect(() => {
    if (userID && listID && listID != "") {
      const userItemsRef = collection(db, "users", userID, listTypeID == Values.movieListsID ? 'movies' : 'shows');
      const itemQuery = query(userItemsRef, where('lists', 'array-contains', listID));

      const unsubscribe = onSnapshot(itemQuery, (snapshot) => {
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
      const itemsRef = collection(userDocRef, listTypeID == Values.movieListsID ? 'movies' : 'shows');
      const itemQuery = query(itemsRef, where('lists', 'array-contains', listID));
      const snapshot = await getDocs(itemQuery);
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
      return itemsData;
    }
    return [];
  }

  return fetchItems;
}
