import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
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
            if (item.list_id == list.list_id) {
                isDupe = true;
            }
        })
        if (isDupe) {
            Alert.alert("List name already exists, please choose a different one");
            return false;
        } else if (user) {
            const listRef = doc(db, "users", user.uid, listTypeID, list.list_id);
            try {
                await setDoc(listRef, list);
                listAdded = true;
            } catch (err: any) {
                console.error("Error creating new list: ", err);
            }
            if (listAdded && !itemsAdded) {
                // Add selectedItems to new list and update poster paths?
                try {
                    const promises = selectedItems.map(async (item) => {
                        const itemRef = doc(db, "users", user.uid, listTypeID, list.list_id, "items", item.item_id);
                        await setDoc(itemRef, item);
                    })
                    await Promise.all(promises);
                    //requestListRefresh();
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