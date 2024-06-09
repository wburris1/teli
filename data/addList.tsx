import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { Alert } from "react-native";

const db = FIREBASE_DB;

export const CreateListDB = () => {
    const { tvLists, movieLists, requestListRefresh, requestRefresh } = useData();
    const { user } = useAuth();
    // Three steps:
    // 1. Check if list id already exists, give alert if so and don't close modal yet
    // 2. Create list doc in db
    // 3. Add selectedItems to items of newly created list
    async function addList(list: List, listTypeID: string, selectedItems: UserItem[]) {
        selectedItems.sort((a: UserItem, b: UserItem) => b.score - a.score);
        const currLists = listTypeID == Values.movieListsID ? movieLists : tvLists;
        var isDupe = false;
        var listAdded = false;
        var itemsAdded = selectedItems.length == 0;

        if (selectedItems.length > 0) {
            list.top_poster_path = selectedItems[0].poster_path;
        }
        if (selectedItems.length > 1) {
            list.second_poster_path = selectedItems[1].poster_path;
        }
        if (selectedItems.length > 2) {
            list.bottom_poster_path = selectedItems[2].poster_path;
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
                    const itemsCollectionRef = collection(db, "users", user.uid, listTypeID, listID, "items");
                    const promises = selectedItems.map(async (item) => {
                        const itemRef = doc(itemsCollectionRef, item.item_id);
                        await setDoc(itemRef, item);
                    });
                    await Promise.all(promises);
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
    const { requestListRefresh, requestRefresh } = useData();
    
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