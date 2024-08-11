import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { UpdateListPosters } from "./posterUpdates";
import { useTab } from "@/contexts/listContext";
import { List, UserItem } from "@/constants/ImportTypes";
import Toast from "react-native-toast-message";

const db = FIREBASE_DB;

export const useGetItemLists = (item_id: string, listTypeID: string, isWatched: boolean) => {
    // Return all lists the item is in, and all valid lists the item is not in
    const { user } = useAuth();
    const [inLists, setInLists] = useState<List[]>([]);
    const [outLists, setOutLists] = useState<List[]>([]);
    const { refreshFlag, movies, shows, movieLists, tvLists } = useData();

    function checkLists() {
        // get all valid lists (exclude seen, bookmarked)
        let listsIn: List[] = [];
        let listsOut: List[] = [];
        if (!movies || !shows || !user) return;        ;
        const item = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id === item_id) :
            shows.find(show => show.item_id === item_id);
        if (!item) {
            listsOut = listTypeID == Values.movieListsID ? movieLists.filter(
                list => list.list_id != Values.seenListID && list.is_ranked == isWatched
            ) : tvLists.filter(
                list => list.list_id != Values.seenListID && list.is_ranked == isWatched
            );
        } else {
            listsIn = listTypeID == Values.movieListsID ? movieLists.filter(
                list => list.list_id != Values.seenListID && list.is_ranked == isWatched && item.lists.includes(list.list_id)
            ) : tvLists.filter(
                list => list.list_id != Values.seenListID && list.is_ranked == isWatched && item.lists.includes(list.list_id)
            );
            listsOut = listTypeID == Values.movieListsID ? movieLists.filter(
                list => list.list_id != Values.seenListID && list.is_ranked == isWatched && !item.lists.includes(list.list_id)
            ) : tvLists.filter(
                list => list.list_id != Values.seenListID && list.is_ranked == isWatched && !item.lists.includes(list.list_id)
            );
        }

        setInLists(listsIn);
        setOutLists(listsOut);
    }

    useEffect(() => {
        checkLists();
    }, [refreshFlag, movies, shows])

    return { inLists, outLists };
}

export const addAndRemoveItemFromLists = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();
    const {setSelectedLists, setRemoveLists} = useTab();

    async function addAndRemove(item_id: string, item_name: string, newItem: Item | null, addLists: List[], removeLists: List[], listTypeID: string) {
        // Add item to addLists, remove item from removeLists:
        const isMovie = listTypeID == Values.movieListsID;
        if (user) {
            // Add item to addLists    
            try {
                if (newItem) {
                    let itemData: any = {
                        item_id: newItem.id.toString(),
                        item_name: 'title' in newItem ? newItem.title : newItem.name,
                        poster_path: newItem.poster_path,
                        score: -2,
                        caption: '',
                        has_spoilers: false,
                        num_comments: 0,
                        likes: [],
                        created_at: serverTimestamp(),
                        list_type_id: listTypeID,
                        lists: [...addLists.map(list => list.list_id)]
                    };
                    'title' in newItem ? itemData = {
                        ...itemData, title: newItem.title, release_date: newItem.release_date
                    } : {
                        ...itemData, name: newItem.name, first_air_date: newItem.first_air_date
                    }

                    const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item_id);
                    await setDoc(itemRef, itemData);
                } else {
                    const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item_id);
                    let newLists = addLists.length > 0 && addLists[0].is_ranked ? 
                        [Values.seenListID, ...addLists.map(addList => addList.list_id)] :
                        [...addLists.map(addList => addList.list_id)];
                    if (addLists.length == 0 && removeLists.length == 0) return;
                    if (removeLists.length > 0 && addLists.length == 0) {
                        newLists = removeLists[0].is_ranked ? [Values.seenListID] : [];
                    }
                    await updateDoc(itemRef, {
                        lists: newLists
                    })
                }
                setSelectedLists([]);
                setRemoveLists([]);
                updateListFunc(listTypeID);
                console.log('Item added and removed successfully.');
            } catch (error: any) {
                console.error('Error when adding/removing item from lists: ', error);
            }
            if (addLists.length > 0) {
              Toast.show({
                type: 'info',
                text1: "Added '" + item_name + "'",
                text2: "You successfully added " + item_name,
                position: "bottom",
                visibilityTime: 3000,
                bottomOffset: 100
              });
            } 
            if (removeLists.length > 0) {
              Toast.show({
                type: 'info',
                text1: "Removed '" + item_name,
                text2: "Removed from " + removeLists.length + (removeLists.length === 1 ? " list" : " lists"),
                position: "bottom",
                visibilityTime: 3000,
                bottomOffset: 100
              });
            } 
        }
    }

    return addAndRemove;
}