import { useAuth } from "@/contexts/authContext";
import { AdjustReorderedScores, useUserAdjustScores } from "./itemScores";
import { UpdateListPosters, updateSomeListPosters } from "./posterUpdates";
import { arrayRemove, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { FIREBASE_DB } from "@/firebaseConfig";
import { useData } from "@/contexts/dataContext";
import { UserItem } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useCallback } from "react";

const db = FIREBASE_DB;

async function deleteItem(userID: string, post_id: string, item_id: string, listID: string, listTypeID: string) {
    try {
        const itemRef = doc(db, "users", userID, listTypeID == Values.movieListsID ? "movies" : "shows", item_id);
        await deleteDoc(itemRef);

        const globalPostRef = doc(db, "globalPosts", post_id);
        await deleteDoc(globalPostRef);

        console.log(`Item ${item_id} deleted from all lists`);
        console.log(`Item ${post_id} deleted from all globalPosts`);
    } catch (error) {
        console.error("Error removing document: ", error);
    }
};

// Deletes watched item from all watched lists
export const useUserItemDelete = () => {
    const { user } = useAuth();
    const adjustScoreFunc = useUserAdjustScores();
    const updateListFunc = UpdateListPosters();

    function reactToDelete(items: UserItem[], post_id: string, item_id: string, score: number, listID: string, listTypeID: string) {
        adjustScoreFunc(items, score, listID, listTypeID);
        if (user) deleteItem(user.uid, post_id, item_id, listID, listTypeID).then(() => {
            updateListFunc(listTypeID);
        });
    }

    return reactToDelete;
}

export const useUserSelectedDelete = () => {
    const { user } = useAuth();
    const adjustScoreFunc = AdjustReorderedScores();
    const updateListFunc = UpdateListPosters();

    function reactToDelete(
        items: UserItem[],
        selectedItems: { post_id: string; item_id: string }[],
        listID: string,
        listTypeID: string
      ) {
          // Adjust scores for all items
          adjustScoreFunc(items, listID, listTypeID);
          
          if (user) {
              const deletePromises = selectedItems.map(({ post_id, item_id }) => 
                  deleteItem(user.uid, post_id, item_id, listID, listTypeID)
              );
  
              Promise.all(deletePromises).then(() => {
                  updateListFunc(listTypeID); // Update the list after all deletions
              }).catch(error => {
                  console.error('Error deleting items: ', error);
              });
          }
      }

    return reactToDelete;
}

// Remove item from a list
export const removeFromList = () => {
    const { user } = useAuth();
    const updatePosterFunc = updateSomeListPosters();
    const {movies, shows, setMovies, setShows} = useData();

    async function removeItem(listID: string, listTypeID: string, item_id: string) {
        if (user) {
            let updatedItems = listTypeID == Values.movieListsID ? (movies || []).map((item) => ({ ...item })) : (shows || []).map((item) => ({ ...item }));
            updatedItems.forEach((item, index) => {
                if (item.item_id == item_id) {
                    updatedItems[index].lists = item.lists.filter(id => id != listID);
                }
            })
            listTypeID == Values.movieListsID ? setMovies(updatedItems) : setShows(updatedItems); 
            //listTypeID == Values.movieListsID ? setMovies(updatedItems) : setShows(updatedItems);
            const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item_id);  
            try {
                await updateDoc(itemRef, {
                    lists: arrayRemove(listID)
                });

                updatePosterFunc(listID, listTypeID);
                console.log("Item successfully removed: ", item_id);
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    };

    return removeItem;
}

export const removeSelected = () => {
    const { user } = useAuth();
    const updatePosterFunc = updateSomeListPosters();
    const {movies, shows, setMovies, setShows} = useData();

    async function removeItems(listID: string, listTypeID: string, item_ids: string[]) {
        if (user) {
            let updatedItems = listTypeID == Values.movieListsID ? (movies || []).map((item) => ({ ...item })) : (shows || []).map((item) => ({ ...item }));
            updatedItems.forEach((item, index) => {
                if (item_ids.includes(item.item_id)) {
                    updatedItems[index].lists = item.lists.filter(id => id != listID);
                }
            })
            listTypeID == Values.movieListsID ? setMovies(updatedItems) : setShows(updatedItems); 
            //listTypeID == Values.movieListsID ? setMovies(updatedItems) : setShows(updatedItems);
            await Promise.all(item_ids.map(async (id) => {
                const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", id);
                try {
                    await updateDoc(itemRef, {
                        lists: arrayRemove(listID)
                    });
                } catch (error) {
                    console.error("Error removing document: ", error);
                }
            }));
            try {
                updatePosterFunc(listID, listTypeID);
            } catch (error) {
                console.error("Error updating posters: ", error);
            }
        }
    };

    return removeItems;
}