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
export const useUserItemDelete = () => {
    const { user } = useAuth();
    const adjustScoreFunc = useUserAdjustScores();
    const updateListFunc = UpdateListPosters();
    const { requestListRefresh } = useData();

    async function deleteItem(post_id: string, item_id: string, score: number, listID: string, listTypeID: string) {
        if (user) {
            try {
                const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item_id);
                await deleteDoc(itemRef);

                const globalPostsRef = collection(db, "globalPosts");
                const deleteItemsQuery = query(globalPostsRef, 
                  where("user_id", "==", user.uid), 
                  where("item_id", "==", item_id), 
                  where("score", "!=", -1)); // ensures we don't delete posts 
                
                const querySnapshot = await getDocs(deleteItemsQuery);
                const deletePromises = querySnapshot.docs.map((docSnapshot) => {
                  return deleteDoc(doc(db, "globalPosts", docSnapshot.id));
                });
                await Promise.all(deletePromises);

                console.log(`Item ${item_id} deleted from all lists`);
                console.log(`Item ${post_id} deleted from all globalPosts`);
                updateListFunc(listTypeID);
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    };

    function reactToDelete(items: UserItem[], post_id: string, item_id: string, score: number, listID: string, listTypeID: string) {
        deleteItem(post_id, item_id, score, listID, listTypeID).then(() => {
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