import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { deleteDoc, doc } from "firebase/firestore";

const db = FIREBASE_DB;

export const deleteList = (listID: string, listTypeID: string) => {
    const { user } = useAuth();

    const deletion = async () => {
        if (user) {
            const listRef = doc(db, "users", user.uid, listTypeID, listID);
    
            try {
                await deleteDoc(listRef);
            } catch (err: any) {
                console.error("Error deleting list: ", err);
            }
        }
    }
    
    return deletion;
}