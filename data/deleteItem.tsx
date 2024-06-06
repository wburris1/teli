import { useAuth } from "@/contexts/authContext";
import { useUserAdjustScores } from "./itemScores";
import { UpdateListPosters, updateSomeListPosters } from "./posterUpdates";
import { collection, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { FIREBASE_DB } from "@/firebaseConfig";
import { useData } from "@/contexts/dataContext";

const db = FIREBASE_DB;

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
    const { requestListRefresh, requestRefresh } = useData();
    const updatePosterFunc = updateSomeListPosters(listID, listTypeID);

    async function removeItem() {
        if (user) {
            const itemRef = doc(db, "users", user.uid, listTypeID, listID, "items", item_id);  
            try {
                await deleteDoc(itemRef);
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