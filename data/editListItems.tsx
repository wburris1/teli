import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { updateSomeListPosters } from "./posterUpdates";
import { UserItem } from "@/constants/ImportTypes";
import Values from "@/constants/Values";

const db = FIREBASE_DB;

export const editListItems = () => {
    const { user } = useAuth();
    const { requestRefresh, movies, shows } = useData();
    const updatePosters = updateSomeListPosters();

    const addAndRemove = async (addItems: UserItem[], removeItems: UserItem[], listID: string, listTypeID: string) => {
        if (user && movies && shows) {
            try {
                const itemsCollectionRef = collection(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows");
                const addPromises = addItems.map(async (item) => {
                    const newItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == item.item_id) :
                        shows.find(show => show.item_id === item.item_id);
                    if (newItem && !newItem.lists.includes(listID)) {
                        const itemRef = doc(itemsCollectionRef, item.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayUnion(listID)
                        });
                    }
                });
                
                const removePromises = removeItems.map(async (item) => {
                    const removeItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == item.item_id) :
                        shows.find(show => show.item_id === item.item_id);
                    if (removeItem && removeItem.lists.includes(listID)) {
                        const itemRef = doc(itemsCollectionRef, item.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayRemove(listID)
                        });
                    }
                });

                await Promise.all([...addPromises, ...removePromises]);
                updatePosters(listID, listTypeID);
                requestRefresh();
            } catch (err: any) {
                console.error("Error adding selected items to list: ", err);
            }
        }
    }

    return addAndRemove;
}

export const editUnwatchedItems = () => {
    const { user } = useAuth();
    const { requestRefresh, movies, shows } = useData();
    const updatePosters = updateSomeListPosters();

    const addAndRemove = async (addItems: Item[], removeItems: Item[], listID: string, listTypeID: string) => {
        if (user && movies && shows) {
            const isMovie = listTypeID == Values.movieListsID;
            try {
                const itemsCollectionRef = collection(db, "users", user.uid, isMovie ? "movies" : "shows");

                // Remove items
                const removePromises = removeItems.map(async (item) => {
                    const id = item.id.toString();
                    const removeItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == id) :
                        shows.find(show => show.item_id == id);
                    if (removeItem && removeItem.lists.includes(listID)) {
                        const itemRef = doc(itemsCollectionRef, removeItem.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayRemove(listID)
                        });
                    }
                });

                // Check if add items exist already or not
                const newItems = addItems.filter(item => isMovie ? !movies.find(movie => movie.item_id == item.id) : !shows.find(show => show.item_id == item.id));
                const existingItems = addItems.filter(item => !newItems.includes(item));

                // Add existing items to list
                const addPromises = existingItems.map(async (item) => {
                    const id = item.id.toString();
                    const newItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == id) :
                        shows.find(show => show.item_id == id);
                    if (newItem && !newItem.lists.includes(listID)) {
                        const itemRef = doc(itemsCollectionRef, newItem.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayUnion(listID)
                        });
                    }
                });

                // Create new items
                const createPromises = newItems.map(async (item) => {
                    let itemData: any = {
                        item_id: item.id.toString(),
                        item_name: 'title' in item ? item.title : item.name,
                        poster_path: item.poster_path,
                        score: -2,
                        caption: '',
                        has_spoilers: false,
                        num_comments: 0,
                        likes: [],
                        created_at: serverTimestamp(),
                        list_type_id: listTypeID,
                        lists: [listID],
                        user_id: user.uid,
                        post_id: ''
                    };
                    'title' in item ? itemData = {
                        ...itemData, title: item.title, release_date: item.release_date
                    } : {
                        ...itemData, name: item.name, first_air_date: item.first_air_date
                    }

                    const itemRef = doc(itemsCollectionRef, itemData.item_id);
                    await setDoc(itemRef, itemData);
                });

                await Promise.all([...createPromises, ...addPromises, ...removePromises]);
                updatePosters(listID, listTypeID);
                requestRefresh();
            } catch (err: any) {
                console.error("Error adding selected items to unwatched list: ", err);
            }
        }
    }

    return addAndRemove;
}