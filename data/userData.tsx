import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { setItem } from 'expo-secure-store';
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
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

export const useUserItemDelete = (item_id: string, score: number, collectionName: string) => {
    const { user } = useAuth();
    const adjustScoreFunc = useUserAdjustScores();

    async function deleteItem() {
        if (user) {
            const itemRef  = doc(db, "users", user.uid, collectionName, item_id);  
            try {
                await deleteDoc(itemRef);
                console.log("Item successfully deleted: ", item_id);
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    };

    function reactToDelete(items: UserItem[]) {
        deleteItem().then(() => {
            adjustScoreFunc(items, score, collectionName == "movies");
        })
    }

    return reactToDelete;
}

export const useUserAdjustScores = () => {
    const { requestRefresh } = useData();
    const { user } = useAuth();

    async function adjustScores(items: UserItem[], minScore: number, maxScore: number, range: number, isMovie: boolean) {
        // Distribute scores evenly between minScore and maxScore
        var filteredItems: UserItem[] = [];
        if (minScore == 0) {
            // Bad items - include 0, exclude 4
            filteredItems = items.filter(item => item.score >= minScore && item.score < maxScore)
        } else if (minScore == 4) {
            // Mid items (includes 4 and 6)
            filteredItems = items.filter(item => item.score >= minScore && item.score <= maxScore)
        } else {
            // Good items, exclude 6
            filteredItems = items.filter(item => item.score > minScore && item.score <= maxScore)
        }
        filteredItems.sort((a: UserItem, b: UserItem) => a.score - b.score);
        const scores = new Set();
        filteredItems.forEach(item => scores.add(item.score));

        const count = scores.size + 1;
        var scoreIncrement = range / count;

        const batch = writeBatch(db);

        var lastScore = -1;
        var lastNewScoreIndex = 0;
        for (let i = 0; i < filteredItems.length; i++) {
            console.log(lastNewScoreIndex);
            var newScore = minScore + scoreIncrement * (lastNewScoreIndex + 1);
            if (filteredItems[i].score != lastScore && lastScore > 0) {
                lastNewScoreIndex++;
                newScore = minScore + scoreIncrement * (lastNewScoreIndex + 1);
                lastScore = filteredItems[i].score;
            } else if (lastScore < 0) {
                lastScore = filteredItems[i].score;
            }
            const itemRef = doc(db, 'users', user!.uid, isMovie ? 'movies' : 'shows', filteredItems[i].item_id);
            batch.update(itemRef, { score: newScore });
        }

        try {
            await batch.commit();
            console.log('Score update successful');
        } catch (error) {
            console.error('Score update failed: ', error);
        }
    }

    function reactToScoresAdjust(items: UserItem[], score: number, isMovie: boolean) {
        var minScore = 0;
        var maxScore = 10;
        var range = 4;
        if (score > 6) {
            minScore = 6;
            maxScore = 11;
            range = 4;
        } else if (score > 4) {
            minScore = 4;
            maxScore = 6;
            range = 2;
        } else {
            maxScore = 4;
        }
        adjustScores(items, minScore, maxScore, range, isMovie).then(() => {
            requestRefresh();
        })
    }

    return reactToScoresAdjust;
}

