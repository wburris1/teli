import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { UpdateListPosters } from "./posterUpdates";
import { useTab } from "@/contexts/listContext";

const db = FIREBASE_DB;

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
    const {setSelectedLists, setRemoveLists} = useTab();

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
                setSelectedLists([]);
                setRemoveLists([]);
                updateListFunc(listTypeID);
                console.log('Item added and removed successfully.');
            } catch (error: any) {
                console.error('Error when adding/removing item from lists: ', error);
            }
        }
    }

    return addAndRemove;
}