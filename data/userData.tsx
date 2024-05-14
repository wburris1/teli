import { useAuth } from '@/contexts/authContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useUserItemsSeenSearch = (isMovies: boolean, refreshFlag: boolean) => {
    const [itemList, setItemList] = useState<UserItem[]>([]);
    const { user } = useAuth();
    const db = FIREBASE_DB;

    async function fetchItems() {
        if (user) {
            const userItemsRef = isMovies ? collection(db, "users", user.uid, "movies") :
                                            collection(db, "users", user.uid, "shows");
            const itemQuery = query(userItemsRef);
            const snapshot = await getDocs(itemQuery);
            if (!snapshot.empty) {
                const seenItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
                return seenItems;
            } else {
                return null;
            }
        }
    }

    useEffect(() => {
        fetchItems().then(items => {
            if (items) {
                setItemList(items);
            }
        }).catch(error => {
            console.error("Error fetching seen items: " + error);
        });
    }, [refreshFlag]);
    
    return itemList;
}

