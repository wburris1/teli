import { useAuth } from "@/contexts/authContext";
import { useUserAdjustScores } from "./itemScores";
import { UpdateListPosters, updateSomeListPosters } from "./posterUpdates";
import { arrayRemove, collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { FIREBASE_DB } from "@/firebaseConfig";
import { useData } from "@/contexts/dataContext";
import { UserItem } from "@/constants/ImportTypes";
import Values from "@/constants/Values";

const db = FIREBASE_DB;

// Deletes watched item from all watched lists
export const useUserItemDelete = (post_id: string, item_id: string, score: number, listID: string, listTypeID: string) => {
    const { user } = useAuth();
    const adjustScoreFunc = useUserAdjustScores();
    const updateListFunc = UpdateListPosters();
    const { requestListRefresh } = useData();

    async function deleteItem() {
        if (user) {
            try {
                const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item_id);
                await deleteDoc(itemRef);
                const globalPostRef = doc(db, "globalPosts", post_id)
                await deleteDoc(globalPostRef);

                console.log(`Item ${item_id} deleted from all lists`);
                console.log(`Item ${post_id} deleted from all globalPosts`);
                updateListFunc(listTypeID);
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    };

    function reactToDelete(items: UserItem[]) {
        deleteItem().then(() => {
            requestListRefresh();
            adjustScoreFunc(items, score, listID, listTypeID);
        })
    }

    return reactToDelete;
}

// Remove item from a list
export const removeFromList = () => {
    const { user } = useAuth();
    const updatePosterFunc = updateSomeListPosters();

    async function removeItem(listID: string, listTypeID: string, item_id: string) {
        if (user) {
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