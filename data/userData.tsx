import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { setItem } from 'expo-secure-store';
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const db = FIREBASE_DB;

export const useUserItemsSeenSearch = (isMovies: boolean) => {
    const { refreshFlag } = useData();
    const [items, setItems] = useState<UserItem[]>([]);
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);

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
                setLoaded(true);
                setItems(items);
            } else {
                setItems([]);
            }
        }).catch(error => {
            console.error("Error fetching seen items: " + error);
        });
    }, [refreshFlag]);
    
    return { items, loaded };
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
        var minScore = Values.minBadScore;
        var maxScore = 10;
        var range = Values.minMidScore;
        if (score > Values.maxMidScore) {
            minScore = Values.maxMidScore;
            maxScore = Values.maxLikeScore;
            range = 10 - Values.maxMidScore;
        } else if (score > Values.minMidScore) {
            minScore = Values.minMidScore;
            maxScore = Values.maxMidScore;
            range = Values.maxMidScore - Values.minMidScore;
        } else {
            maxScore = Values.minMidScore;
        }
        adjustScores(items, minScore, maxScore, range, isMovie).then(() => {
            requestRefresh();
        })
    }

    return reactToScoresAdjust;
}

export const AdjustReorderedScores = () => {
    const { user } = useAuth();

    async function reorderScores(items: UserItem[], isMovie: boolean) {
        // Count number of good/mid/bad items:
        var numGood = 0;
        var numMid = 0;
        var numBad = 0;
        var numUniqueGood = 0;
        var numUniqueMid = 0;
        var numUniqueBad = 0;
        var prevScore = -1;
        items.forEach(item => {
            if (item.score > Values.maxMidScore) {
                if (item.score != prevScore) {
                    numUniqueGood++;
                }
                numGood++;
            } else if (item.score >= Values.minMidScore) {
                if (item.score != prevScore) {
                    numUniqueMid++;
                }
                numMid++;
            } else {
                if (item.score != prevScore) {
                    numUniqueBad++;
                }
                numBad++;
            }
            prevScore = item.score;
        })

        const goodInc = (10 - Values.maxMidScore) / (numUniqueGood + 1);
        const midInc = (Values.maxMidScore - Values.minMidScore) / (numUniqueMid + 1);
        const badInc = Values.minMidScore / (numUniqueBad + 1);
        const batch = writeBatch(db);
        var index = 0;
        prevScore = -1;
        var lastNewScore = -1;
        
        for (let i = 0; i < items.length; i++) {
            var newScore = 0;
            if (items[i].score != prevScore) {
                if (i < numGood) {
                    newScore = Values.maxMidScore + goodInc * (numUniqueGood - index);
                    if (numUniqueGood == 1) {
                        newScore = Values.maxMidScore + goodInc;
                    } 
                } else if (i - numGood < numMid) {
                    newScore = Values.minMidScore + midInc * (numUniqueMid - (index - numUniqueGood));
                    if (numUniqueMid == 1) {
                        newScore = Values.minMidScore + midInc
                    } 
                } else if (i - numGood - numMid < numBad) {
                    newScore = Values.minBadScore + badInc * (numUniqueBad - (index - numUniqueGood - numUniqueBad));
                    if (numUniqueBad == 1) {
                        newScore = Values.minBadScore + badInc
                    } 
                }
                index++;
                prevScore = items[i].score;
                lastNewScore = newScore;
            } else {
                newScore = lastNewScore;
            }
            const itemRef = doc(db, 'users', user!.uid, isMovie ? 'movies' : 'shows', items[i].item_id);
            batch.update(itemRef, { score: newScore });
        }

        try {
            await batch.commit();
            console.log('Score update successful');
        } catch (error) {
            console.error('Score update failed: ', error);
        }
    }

    return reorderScores;
}

