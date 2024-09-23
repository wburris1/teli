import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig"
import { deleteDoc, doc } from "firebase/firestore";

const db = FIREBASE_DB;

export const deleteList = (listID: string, listTypeID: string) => {
    const { user } = useAuth();
    const {movieLists, tvLists, setMovieLists, setTVLists} = useData();

    const deletion = async () => {
        if (user) {
            const listRef = doc(db, "users", user.uid, listTypeID, listID);
            const isMovie = listTypeID == Values.movieListsID;
            try {
                await deleteDoc(listRef);
                isMovie ? setMovieLists(movieLists.filter(list => list.list_id != listID)) :
                    setTVLists(tvLists.filter(list => list.list_id != listID));

            } catch (err: any) {
                console.error("Error deleting list: ", err);
            }
        }
    }
    
    return deletion;
}