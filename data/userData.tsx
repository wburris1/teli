import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { setItem } from 'expo-secure-store';
import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const db = FIREBASE_DB;

export const useUserItemsSeenSearch = (isMovies: boolean) => {
    const { refreshFlag } = useData();
    const [itemList, setItemList] = useState<UserItem[]>([]);
    const { user } = useAuth();

    async function fetchItems() {
        if (user) {
            const userItemsRef = collection(db, "users", user.uid, isMovies ? "movies" : "shows");
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
            } else {
                setItemList([]);
            }
        }).catch(error => {
            console.error("Error fetching seen items: " + error);
        });
    }, [refreshFlag]);
    
    return itemList;
}

export const useUserItemDelete = (item_id: string, score: number, collection_name: string) => {
    const { user } = useAuth();
    const { requestRefresh } = useData();
    const adjustScoreFunc = useUserAdjustScores();

    async function deleteItem() {
        if (user) {
          const collRef = collection(db, "users", user.uid, collection_name);
          const itemQuery = query(collRef,
            where("item_id", "==", item_id)
          );
          const snapshot = await getDocs(itemQuery);
          
          try {
            const snapshot = await getDocs(itemQuery);
            const batch = writeBatch(db);
    
            snapshot.forEach(doc => {
              batch.delete(doc.ref);
            });
    
            await batch.commit();
            console.log("Item successfully deleted: ", item_id);
          } catch (error) {
            console.error("Error removing document: ", error);
          }
        }
    };

    function reactToDelete() {
        deleteItem().then(() => {
            adjustScoreFunc(score, collection_name == "movies");
        })
    }

    return reactToDelete;
}

export const useUserAdjustScores = () => {
    const { requestRefresh } = useData();
    const { user } = useAuth();

    async function adjustScores(minScore: number, maxScore: number, range: number, isMovie: boolean) {
        const userItemRef = collection(db, "users", user!.uid, isMovie ? "movies" : "shows");
        const itemQuery = query(userItemRef,
          where("score", ">=", minScore),
          where("score", "<=", maxScore),
        );
    
        const snapshot = await getDocs(itemQuery);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
        // Distribute scores evenly between minScore and maxScore
        const count = items.length;
        var scoreIncrement = range;

        if (count - 1 > 0) {
            scoreIncrement = range / (count - 1);
        }
    
        for (let i = 0; i < count; i++) {
          var newScore = minScore + scoreIncrement * i;
          if (items.length == 1) {
            newScore = minScore + scoreIncrement;
          }
          const itemRef = doc(db, 'users', user!.uid, isMovie ? 'movies' : 'shows', items[i].id);
          await updateDoc(itemRef, { score: newScore });
        }
    }

    function reactToScoresAdjust(score: number, isMovie: boolean) {
        var minScore = 0;
        var maxScore = 10;
        var range = 4;
        if (score >= 6) {
            minScore = 6;
            maxScore = 11;
            range = 4;
        } else if (score >= 4) {
            minScore = 4;
            maxScore = 6;
            range = 2;
        } else {
            maxScore = 4;
        }
        adjustScores(minScore, maxScore, range, isMovie).then(() => {
            requestRefresh();
        })
    }

    return reactToScoresAdjust;
}

