import Values from '@/constants/Values';
import { useAuth } from '@/contexts/authContext';
import { useData } from '@/contexts/dataContext';
import { FIREBASE_DB } from '@/firebaseConfig';
import { setItem } from 'expo-secure-store';
import { addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
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
    }, [refreshFlag, refreshListFlag, user]);
  
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

export const useUserItemDelete = (item_id: string, score: number, listID: string, listTypeID: string) => {
    const { user } = useAuth();
    const adjustScoreFunc = useUserAdjustScores();
    const updateListFunc = UpdateListPosters();

    async function deleteItem() {
        if (user) {
            try {
                const userListsRef = collection(db, "users", user.uid, listTypeID);

                const listsSnapshot = await getDocs(userListsRef);
                const batch = writeBatch(db);

                listsSnapshot.forEach(list => {
                    const listRef = doc(db, "users", user.uid, listTypeID, list.id, "items", item_id);
                    batch.delete(listRef);
                });

                await batch.commit();

                console.log(`Item ${item_id} deleted from all lists`);
                updateListFunc(listTypeID);
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    };

    function reactToDelete(items: UserItem[]) {
        deleteItem().then(() => {
            adjustScoreFunc(items, score, listID, listTypeID);
        })
    }

    return reactToDelete;
}

export const removeFromList = (listID: string, listTypeID: string, item_id: string) => {
    const { user } = useAuth();
    const updatePosterFunc = updateSomeListPosters(listID, listTypeID);

    async function removeItem() {
        if (user) {
            const itemRef = doc(db, "users", user.uid, listTypeID, listID, "items", item_id);  
            try {
                await deleteDoc(itemRef);
                const listItemsRef = collection(db, "users", user!.uid, listTypeID, listID, "items");
                const snapshot = await getDocs(listItemsRef);
                const listItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
                storeDataLocally(`items_${user!.uid}_${listTypeID}_${listID}`, listItems);
                updatePosterFunc();
                console.log("Item successfully removed: ", item_id);
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    };

    function reactToRemove() {
        removeItem().then(() => {
            //requestRefresh();
        })
    }

    return reactToRemove;
}

export const useUserAdjustScores = () => {
    const { user } = useAuth();
    const { requestListRefresh } = useData();

    async function adjustScores(items: UserItem[], minScore: number, maxScore: number, range: number, listID: string, listTypeID: string) {
        // Distribute scores evenly between minScore and maxScore
        if (!user) {
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
        const scores = new Set();
        filteredItems.forEach(item => scores.add(item.score));

        const count = scores.size + 1;
        var scoreIncrement = range / count;

        const batch = writeBatch(db);
        //const userListsRef = collection(db, "users", user.uid, listTypeID);
        //const listsSnapshot = await getDocs(userListsRef);
        // Fetch list ids from local storage: TODO
        const lists: List[] = await getDataLocally(`lists_${user.uid}_${listTypeID}`);
        // Get all items from all lists
        const listDict: { [key: string]: UserItem[] } = {};
        if (lists) {
            for (const list of lists) {
              const items: UserItem[] = await getDataLocally(`items_${user.uid}_${listTypeID}_${list.list_id}`);
              listDict[list.list_id] = items || [];
            }
        }

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
            const itemRef = doc(db, 'users', user.uid, listTypeID, listID, "items", filteredItems[i].item_id);
            batch.update(itemRef, { score: newScore });

            if (lists) {
                for (const list of lists) {
                    if (listDict.hasOwnProperty(list.list_id)) {
                        var listItems = listDict[list.list_id];
                        if (listItems.some(listItem => listItem.item_id === filteredItems[i].item_id)) {
                            const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", filteredItems[i].item_id);
                            batch.update(itemRef, { score: newScore });
                        }
                    }
                }
            }
        }

        try {
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
        adjustScores(items, minScore, maxScore, range, listID, listTypeID).then(() => {
            requestListRefresh();
        })
    }

    return reactToScoresAdjust;
}

export const AdjustReorderedScores = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();

    async function reorderScores(items: UserItem[], listID: string, listTypeID: string) {
        // Count number of good/mid/bad items:
        if (!user) {
            return;
        }
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
        const lists: List[] = await getDataLocally(`lists_${user.uid}_${listTypeID}`);
        const listDict: { [key: string]: UserItem[] } = {};
        if (lists) {
            for (const list of lists) {
              const items: UserItem[] = await getDataLocally(`items_${user.uid}_${listTypeID}_${list.list_id}`);
              listDict[list.list_id] = items || [];
            }
        }
        
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

            if (lists) {
                for (const list of lists) {
                    if (listDict.hasOwnProperty(list.list_id)) {
                        const listItems = listDict[list.list_id];
                        if (listItems.some(listItem => listItem.item_id === items[i].item_id)) {
                            const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", items[i].item_id);
                            batch.update(itemRef, { score: newScore });
                        }
                    }
                }
            }
        }

        try {
            await batch.commit();
            updateListFunc(listTypeID);
            console.log('Score update successful');
        } catch (error) {
            console.error('Score update failed: ', error);
        }
    }

    return reorderScores;
}

export const AddToList = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();
    const adjustScoreFunc = useUserAdjustScores();

    async function addToDB(newScore: number, item: Item, listID: string, isMovie: boolean, isDupe: boolean, items: UserItem[]) {
        var newItem: UserItem;
        const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

        if (isMovie) {
          newItem = {
            item_id: item.id.toString(),
            title: item.title,
            poster_path: item.poster_path,
            score: newScore,
            release_date: item.release_date,
          };
        } else {
          newItem = {
            item_id: item.id.toString(),
            name: item.name,
            poster_path: item.poster_path,
            score: newScore,
            first_air_date: item.first_air_date,
          };
        }
    
        if (user) {
          const itemRef = doc(db, "users", user.uid, listTypeID, listID, "items", item.id.toString());
          if (isDupe) {
            items.forEach(seenItem => {
                if (seenItem.item_id == item.id) {
                    seenItem.score = newScore;
                }
            });
            const updateData = isMovie
            ? {
                title: (newItem as UserMovie).title,
                poster_path: newItem.poster_path,
                score: newScore,
                release_date: (newItem as UserMovie).release_date,
              }
            : {
                name: (newItem as UserShow).name,
                poster_path: newItem.poster_path,
                score: newScore,
                first_air_date: (newItem as UserShow).first_air_date,
              };
              try {
                await updateDoc(itemRef, updateData);
                await adjustScoreFunc(items, newScore, listID, listTypeID);
                await storeDataLocally(`items_${user!.uid}_${listTypeID}_${item.id}`, updateData);
                updateListFunc(listTypeID);
              } catch (err: any) {
                console.error("Error updating item: ", err);
              }
              return newItem;
          } else {
            const currItems = [...items, newItem];
            try {
              await setDoc(itemRef, newItem);
              await adjustScoreFunc(currItems, newScore, listID, listTypeID);
              await storeDataLocally(`items_${user!.uid}_${listTypeID}_${item.id}`, newItem);
              updateListFunc(listTypeID);
            } catch (err: any) {
              console.error("Error adding new item: ", err);
            }
            return newItem;
          }
        }
        return null;
    }

    return addToDB;
}

async function getListPosters(listID: string, listTypeID: string, userID: string) {
    var top_poster_path = "";
    var second_poster_path = "";
    var bottom_poster_path = "";

    const listItemsRef = collection(db, "users", userID, listTypeID, listID, "items");
    const itemQuery = query(listItemsRef,
        orderBy('score', 'desc'),
        limit(3),
    );
    const itemsSnapshot = await getDocs(itemQuery);
    if (!itemsSnapshot.empty) {
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem }));
        top_poster_path = items[0].poster_path;
        second_poster_path = items.length > 1 ? items[1].poster_path : "";
        bottom_poster_path = items.length > 2 ? items[2].poster_path : "";
    }
    return { top_poster_path, second_poster_path, bottom_poster_path };
}

const updateSomeListPosters = (listID: string, listTypeID: string) => {
    const { user } = useAuth();
    const { requestListRefresh } = useData();

    async function updatePosters() {
        if (user) {
            try {
                const posters = await getListPosters(listID, listTypeID, user.uid);
                const listRef = doc(db, "users", user.uid, listTypeID, listID);
                await updateDoc(listRef, {
                    top_poster_path: posters.top_poster_path,
                    second_poster_path: posters.second_poster_path,
                    bottom_poster_path: posters.bottom_poster_path
                });
                requestListRefresh();
            } catch (err: any) {
                console.error("Error updating specific list posters: ", err);
            }
        }
    }

    return updatePosters;
}

const UpdateListPosters = () => {
    const { user } = useAuth();
    const { requestListRefresh } = useData();

    async function updatePosters(listTypeID: string) {
        // for each list of list type, fetch top 3 items by score and set poster paths
        // (except for bookmarked, just fetch any 3 for now)
        // Function must be called after addToDB or reordering
        if (user) {
            const batch = writeBatch(db);

            const userListsRef = collection(db, "users", user?.uid, listTypeID);
            const listsSnapshot = await getDocs(userListsRef);
            if (!listsSnapshot.empty) {
                const userLists = listsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));

                const batchUpdatePromises = userLists.map(async list => {
                    const posters = await getListPosters(list.list_id, listTypeID, user.uid);
                    const listRef = doc(db, "users", user.uid, listTypeID, list.list_id);
                    batch.update(listRef, {
                        top_poster_path: posters.top_poster_path,
                        second_poster_path: posters.second_poster_path,
                        bottom_poster_path: posters.bottom_poster_path
                    });
                });
    
                await Promise.all(batchUpdatePromises);
                
                try {
                    await batch.commit();
                    requestListRefresh();
                    console.log("List posters updated");
                } catch (err: any) {
                    console.error("List posters update failed: ", err);
                }
            }
        }
    }

    return updatePosters;
}

export const CreateListDB = () => {
    const { tvLists, movieLists, requestListRefresh } = useData();
    const { user } = useAuth();
    // Three steps:
    // 1. Check if list id already exists, give alert if so and don't close modal yet
    // 2. Create list doc in db
    // 3. Add selectedItems to items of newly created list
    async function addList(list: List, listTypeID: string, selectedItems: UserItem[]) {
        selectedItems.sort((a: UserItem, b: UserItem) => b.score - a.score);
        const currLists = listTypeID == Values.movieListsID ? movieLists : tvLists;
        var isDupe = false;
        var listAdded = false;
        var itemsAdded = selectedItems.length == 0;

        if (selectedItems.length > 0) {
            list.top_poster_path = selectedItems[0].poster_path;
        }
        if (selectedItems.length > 1) {
            list.second_poster_path = selectedItems[1].poster_path;
        }
        if (selectedItems.length > 2) {
            list.bottom_poster_path = selectedItems[2].poster_path;
        }

        currLists.forEach(item => {
            if (item.list_id == list.list_id) {
                isDupe = true;
            }
        })
        if (isDupe) {
            Alert.alert("List name already exists, please choose a different one");
            return false;
        } else if (user) {
            const listRef = doc(db, "users", user.uid, listTypeID, list.list_id);
            try {
                await setDoc(listRef, list);
                listAdded = true;
            } catch (err: any) {
                console.error("Error creating new list: ", err);
            }
            if (listAdded && !itemsAdded) {
                // Add selectedItems to new list and update poster paths?
                try {
                    const promises = selectedItems.map(async (item) => {
                        const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", item.item_id);
                        await setDoc(itemRef, item);
                    })
                    await Promise.all(promises);
                    requestListRefresh();
                    itemsAdded = true;
                } catch (err: any) {
                    console.error("Error adding selected items to new list: ", err);
                }
            } else {
                requestListRefresh();
            }
        }
        return listAdded && itemsAdded;
    }

    return addList;
}

export const useGetItemLists = (item_id: string, listTypeID: string) => {
    // Return all lists the item is in, and all valid lists the item is not in
    const { user } = useAuth();
    const [inLists, setInLists] = useState<List[]>([]);
    const [outLists, setOutLists] = useState<List[]>([]);
    const [loaded, setLoaded] = useState(false);
    const { refreshFlag } = useData();

    async function checkLists() {
        // get all valid lists (exclude seen, bookmarked)
        var listsIn: List[] = [];
        var listsOut: List[] = [];
        if (user) {
            const userListsRef = collection(db, "users", user.uid, listTypeID);
            const snapshot = await getDocs(userListsRef);
            if (!snapshot.empty) {
                
                const userLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
                const validLists = userLists.filter(list => list.list_id != Values.bookmarkListID && list.list_id != Values.seenListID);
                // Get all valid lists than contain item
                const promises = validLists.map(async (list) => {
                    const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", item_id);
                    const snapshot = await getDoc(itemRef);
                    if (!snapshot.exists()) {
                        listsOut = [...listsOut, list];
                    } else {
                        listsIn = [...listsIn, list];
                    }
                })
                await Promise.all(promises);
            }
        }
        return { listsIn, listsOut };
    }

    useEffect(() => {
        checkLists().then(lists => {
            setInLists(lists.listsIn);
            setOutLists(lists.listsOut);
            setLoaded(true);
        })
    }, [refreshFlag])

    return { inLists, outLists, loaded };
}

export const addAndRemoveItemFromLists = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();

    async function addAndRemove(item: UserItem, addLists: List[], removeLists: List[], listTypeID: string) {
        // Add item to addLists, remove item from removeLists:
        if (user) {
            const batch = writeBatch(db);
            // Add item to addLists
            addLists.forEach(list => {
                const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", item.item_id);
                batch.set(itemRef, item);
            });
    
            // Remove item from removeLists
            removeLists.forEach(list => {
                const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", item.item_id);
                batch.delete(itemRef);
            });
    
            try {
                await batch.commit();
                updateListFunc(listTypeID);
                console.log('Item added and removed successfully.');
            } catch (error: any) {
                console.error('Error when adding/removing item from lists: ', error);
            }
        }
    }

    return addAndRemove;
}


