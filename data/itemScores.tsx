import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { UpdateListPosters } from "./posterUpdates";
import { List, UserItem } from "@/constants/ImportTypes";
import { useLoading } from "@/contexts/loading";
import { useData } from "@/contexts/dataContext";

const db = FIREBASE_DB;

export const useUserAdjustScores = () => {
    const { user, userData } = useAuth();
    const {movies, shows, setMovies, setShows} = useData();

    async function adjustScores(items: UserItem[], minScore: number, maxScore: number, range: number, listID: string, listTypeID: string) {
        // Distribute scores evenly between minScore and maxScore
        if (!user || !userData) {
            return;
        }
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
        let updatedItems = filteredItems;
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
            const itemRef = doc(db, 'users', user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", filteredItems[i].item_id);
            const globalPostRef = doc(db, 'globalPosts', filteredItems[i].post_id)
            batch.update(itemRef, { score: newScore });
            batch.update(globalPostRef, { score: newScore });
            updatedItems[i].score = newScore;
        }

        try {
            const allItems = (listTypeID == Values.movieListsID ? movies : shows) || [];
            const otherItems = allItems.filter(item => item.score < 0);
            listTypeID == Values.movieListsID ? setMovies([...updatedItems, ...otherItems].sort((a, b) => b.score - a.score)) : 
                setShows([...updatedItems, ...otherItems].sort((a, b) => b.score - a.score));
            await batch.commit();

            console.log('Score update successful');
        } catch (error) {
            console.error('Score update failed: ', error);
        }
    }

    function reactToScoresAdjust(items: UserItem[], score: number, listID: string, listTypeID: string) {
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
        adjustScores(items, minScore, maxScore, range, listID, listTypeID);
    }

    return reactToScoresAdjust;
}

export const AdjustReorderedScores = () => {
    const { user, userData } = useAuth();
    const updateListFunc = UpdateListPosters();
    const { setLoading } = useLoading();
    const {movies, shows, setMovies, setShows} = useData();

    async function reorderScores(items: UserItem[], listID: string, listTypeID: string) {
        // Count number of good/mid/bad items:
        if (!user || !userData) {
            return;
        }
        let updatedItems = items;
        setLoading(true);
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

            const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", items[i].item_id);
            const globalPostRef = doc(db, 'globalPosts', items[i].post_id)
            batch.update(itemRef, { score: newScore });
            batch.update(globalPostRef, { score: newScore});
            updatedItems[i].score = newScore;
        }

        try {
            await batch.commit();
            setLoading(false);
            updateListFunc(listTypeID);
            const allItems = (listTypeID == Values.movieListsID ? movies : shows) || [];
            const otherItems = allItems.filter(item => item.score < 0);
            listTypeID == Values.movieListsID ? setMovies([...updatedItems, ...otherItems].sort((a, b) => b.score - a.score)) : 
                setShows([...updatedItems, ...otherItems]);
            console.log('Score update successful');
        } catch (error) {
            setLoading(false);
            console.error('Score update failed: ', error);
        }
    }

    return reorderScores;
}