import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { collection, deleteDoc, doc, setDoc } from "firebase/firestore";
import { updateSomeListPosters } from "./posterUpdates";
import { UserItem } from "@/constants/ImportTypes";

const db = FIREBASE_DB;

export const editListItems = () => {
    const { user } = useAuth();
    const { requestRefresh } = useData();
    const updatePosters = updateSomeListPosters();

    const addAndRemove = async (addItems: UserItem[], removeItems: UserItem[], listID: string, listTypeID: string) => {
        if (user) {
            try {
                const itemsCollectionRef = collection(db, "users", user.uid, listTypeID, listID, "items");
                const addPromises = addItems.map(async (item) => {
                    const itemRef = doc(itemsCollectionRef, item.item_id);
                    await setDoc(itemRef, item);
                });
                
                const removePromises = removeItems.map(async (item) => {
                    const itemRef = doc(itemsCollectionRef, item.item_id);
                    await deleteDoc(itemRef);
                });

                await Promise.all([...addPromises, ...removePromises]);
                updatePosters(listID, listTypeID);
                requestRefresh();
            } catch (err: any) {
                console.error("Error adding selected items to new list: ", err);
            }
        }
    }

    return addAndRemove;
}