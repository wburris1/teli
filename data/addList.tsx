import { List, UserItem } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { addDoc, arrayUnion, collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Alert } from "react-native";

const db = FIREBASE_DB;

export const CreateListDB = () => {
    const { tvLists, movieLists, requestListRefresh, requestRefresh, movies, shows } = useData();
    const { user } = useAuth();
    // Three steps:
    // 1. Check if list id already exists, give alert if so and don't close modal yet
    // 2. Create list doc in db
    // 3. Add selectedItems to items of newly created list
    async function addList(list: List, listTypeID: string, selectedItems: UserItem[], selectedUnseenItems: Item[]) {
        selectedItems.sort((a: UserItem, b: UserItem) => b.score - a.score);
        const currLists = listTypeID == Values.movieListsID ? movieLists : tvLists;
        var isDupe = false;
        var listAdded = false;
        var itemsAdded = selectedItems.length == 0 && selectedUnseenItems.length == 0;

        if (selectedUnseenItems.length > 0) {
            list.top_poster_path = selectedUnseenItems[0].poster_path;
            if (selectedUnseenItems.length > 1) {
                list.second_poster_path = selectedUnseenItems[1].poster_path;
            }
            if (selectedUnseenItems.length > 2) {
                list.bottom_poster_path = selectedUnseenItems[2].poster_path;
            }
        } else {
            if (selectedItems.length > 0) {
                list.top_poster_path = selectedItems[0].poster_path;
            }
            if (selectedItems.length > 1) {
                list.second_poster_path = selectedItems[1].poster_path;
            }
            if (selectedItems.length > 2) {
                list.bottom_poster_path = selectedItems[2].poster_path;
            }
        }

        currLists.forEach(item => {
            if (item.name == list.name) {
                isDupe = true;
            }
        })
        if (isDupe) {
            Alert.alert("List name already exists, please choose a different one");
            return false;
        } else if (list.name == "") {
            Alert.alert("Please enter a name for the list");
            return false;
        } else if (user) {
            const listsRef = collection(db, "users", user.uid, listTypeID);
            var listID = "";
            try {
                const listRef = await addDoc(listsRef, list);
                listID = listRef.id;
                await updateDoc(listRef, { list_id: listRef.id });
                listAdded = true;
            } catch (err: any) {
                console.error("Error creating new list: ", err);
            }
            if (listAdded && !itemsAdded) {
                // Add selectedItems to new list and update poster paths?
                try {
                    if (selectedUnseenItems.length > 0 && movies && shows) {
                        const isMovie = listTypeID == Values.movieListsID;
                        const itemsCollectionRef = collection(db, "users", user.uid, isMovie ? "movies" : "shows");

                        const newItems = selectedUnseenItems.filter(item => isMovie ? !movies.find(movie => movie.item_id == item.id) : !shows.find(show => show.item_id == item.id));
                        const existingItems = selectedUnseenItems.filter(item => !newItems.includes(item));

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
        
                        await Promise.all([...createPromises, ...addPromises]);
                    } else if (selectedUnseenItems.length == 0) {
                        const itemsCollectionRef = collection(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows");
                        const promises = selectedItems.map(async (item) => {
                            const itemRef = doc(itemsCollectionRef, item.item_id);
                            await updateDoc(itemRef, {
                                lists: arrayUnion(listID)
                            });
                        });
                        await Promise.all(promises);
                    }
                    
                    requestRefresh();
                    itemsAdded = true;
                } catch (err: any) {
                    console.error("Error adding selected items to new list: ", err);
                }
            } else {
                //requestListRefresh();
                requestRefresh();
            }
        }
        return listAdded && itemsAdded;
    }

    return addList;
}

export const editList = () => {
    const { user } = useAuth();
    
    const handleEdit = async (listID: string, listTypeID: string, name: string, description: string) => {
        if (user) {
            const listRef = doc(db, "users", user.uid, listTypeID, listID);
            try {
                await updateDoc(listRef, {
                    name: name,
                    description: description,
                });
            } catch (err: any) {
                console.error("Error updating list details: ", err);
            }
        }
    }

    return handleEdit;
}