import { List, UserItem, UserMovie, UserShow } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";

const db = FIREBASE_DB;

async function getListPosters(listID: string, listTypeID: string, userID: string) {
    var top_poster_path = "";
    var top_item_name = "";

    var second_poster_path = "";
    var second_item_name = "";

    var bottom_poster_path = "";
    var bottom_item_name = "";

    const isMovie = listTypeID == Values.movieListsID;

    const listItemsRef = collection(db, "users", userID, isMovie ? "movies" : "shows");
    const itemQuery = query(listItemsRef,
        orderBy('score', 'desc'),
        limit(3),
        where('lists', 'array-contains', listID)
    );
    const itemsSnapshot = await getDocs(itemQuery);
    if (!itemsSnapshot.empty) {
        const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as UserItem })) as UserItem[];
        top_poster_path = items[0].poster_path;
        top_item_name = isMovie ? (items[0] as UserMovie).title : (items[0] as UserShow).name;

        second_poster_path = items.length > 1 ? items[1].poster_path : "";
        second_item_name = items.length > 1 ? (isMovie ? (items[1] as UserMovie).title : (items[1] as UserShow).name) : "";
        
        bottom_poster_path = items.length > 2 ? items[2].poster_path : "";
        bottom_item_name = items.length > 2 ? (isMovie ? (items[2] as UserMovie).title : (items[2] as UserShow).name) : "";

    }
    return { top_poster_path, top_item_name, second_poster_path, second_item_name, bottom_poster_path, bottom_item_name };
}

export const updateSomeListPosters = () => {
    const { user } = useAuth();
    const { requestListRefresh } = useData();

    async function updatePosters(listID: string, listTypeID: string) {
        if (user) {
            try {
                const posters = await getListPosters(listID, listTypeID, user.uid);
                const listRef = doc(db, "users", user.uid, listTypeID, listID);
                await updateDoc(listRef, {
                    top_poster_path: posters.top_poster_path,
                    second_poster_path: posters.second_poster_path,
                    bottom_poster_path: posters.bottom_poster_path, 
                    top_item_name: posters.top_item_name,
                    second_item_name: posters.second_item_name,
                    bottom_item_name: posters.bottom_item_name,
                    last_modified: serverTimestamp(),
                });
                //requestListRefresh();
            } catch (err: any) {
                console.error("Error updating specific list posters: ", err);
            }
        }
    }

    return updatePosters;
}

export const UpdateListPosters = () => {
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
                        bottom_poster_path: posters.bottom_poster_path,
                        top_item_name: posters.top_item_name,
                        second_item_name: posters.second_item_name,
                        bottom_item_name: posters.bottom_item_name,
                    });
                });
    
                await Promise.all(batchUpdatePromises);
                
                try {
                    await batch.commit();
                    //requestListRefresh();
                    console.log("List posters updated");
                } catch (err: any) {
                    console.error("List posters update failed: ", err);
                }
            }
        }
    }

    return updatePosters;
}