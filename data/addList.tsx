import { List, UserItem } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { useAuth } from "@/contexts/authContext";
import { useData } from "@/contexts/dataContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { addDoc, arrayUnion, collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Alert, BackHandler } from "react-native";

const db = FIREBASE_DB;

export const CreateListDB = () => {
    const { tvLists, movieLists, requestListRefresh, requestRefresh, movies, shows, setMovies, setShows,
    setMovieLists, setTVLists } = useData();
    const { user } = useAuth();

    const isDuplicateListName = (listName: string, currLists: List[]): boolean => {
      return currLists.some(item => item.name === listName);
    };

    // Extracted function for updating poster paths
    const updatePosterPaths = (list: List, selectedItems: UserItem[], selectedUnseenItems: Item[]) => {
      const items = selectedUnseenItems.length > 0 ? selectedUnseenItems : selectedItems;
      
      if (items.length > 0) {
          list.top_poster_path = items[0].poster_path;
      }
      if (items.length > 1) {
          list.second_poster_path = items[1].poster_path;
      }
      if (items.length > 2) {
          list.bottom_poster_path = items[2].poster_path;
      }
  };

    const isValidListName = (list: List, listTypeID: string) => {
      const currLists = listTypeID === Values.movieListsID ? movieLists : tvLists;
      if (isDuplicateListName(list.name, currLists)) {
        Alert.alert("List name already exists, please choose a different one");
        return false;
      }
      if (!list.name) {
        Alert.alert("Please enter a name for the list");
        return false;
      }
      return true
    }
    // Three steps:
    // 1. Check if list id already exists, give alert if so and don't close modal yet
    // 2. Create list doc in db
    // 3. Add selectedItems to items of newly created list
    async function addList(list: List, listTypeID: string, selectedItems: UserItem[], selectedUnseenItems: Item[]) {
        selectedItems.sort((a: UserItem, b: UserItem) => b.score - a.score);
        var listAdded = false;
        var itemsAdded = selectedItems.length == 0 && selectedUnseenItems.length == 0;

        updatePosterPaths(list, selectedItems, selectedUnseenItems);
        if (!isValidListName(list, listTypeID) || !user) {
          return false
        }
        
        const listsRef = collection(db, "users", user.uid, listTypeID);
        var listID = "";
        try {
            const listRef = await addDoc(listsRef, list);
            listID = listRef.id;
            await updateDoc(listRef, { list_id: listRef.id, last_modified: serverTimestamp() });
            let newList = list;
            newList.list_id = listID;
            newList.last_modified = new Date();
            listTypeID == Values.movieListsID ? setMovieLists([...movieLists, newList]) : setTVLists([...tvLists, newList]);
            listAdded = true;
        } catch (err: any) {
            console.error("Error creating new list: ", err);
        }
        if (listAdded && !itemsAdded) {
            const isMovie = listTypeID == Values.movieListsID;
            // Add selectedItems to new list and update poster paths?
            try {
                if (selectedUnseenItems.length > 0 && movies && shows) {
                    const itemsCollectionRef = collection(db, "users", user.uid, isMovie ? "movies" : "shows");

                    const newItems = selectedUnseenItems.filter(item => isMovie ? !movies.find(movie => movie.item_id == item.id) : !shows.find(show => show.item_id == item.id));
                    const existingItems = selectedUnseenItems.filter(item => !newItems.includes(item));

                    let updatedAdd: UserItem[] = [];
                    let count = 0;
                    const addPromises = existingItems.map(async (item) => {
                        const id = item.id.toString();
                        const newItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == id) :
                            shows.find(show => show.item_id == id);
                        if (newItem && !newItem.lists.includes(listID)) {
                            updatedAdd.push(newItem);
                            updatedAdd[count].lists = [listID, ...newItem.lists];
                            count++;
                            const itemRef = doc(itemsCollectionRef, newItem.item_id);
                            await updateDoc(itemRef, {
                                lists: arrayUnion(listID)
                            });
                        }
                    });
    
                    // Create new items
                    let createdItems: UserItem[] = [];
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
                            post_id: '',
                            backdrop_path: item.backdrop_path || "",
                        };
                        'title' in item ? itemData = {
                            ...itemData, title: item.title, release_date: item.release_date, runtime: item.runtime || 0,
                        } : {
                            ...itemData, name: item.name, first_air_date: item.first_air_date, episode_run_time: item.episode_run_time || 0,
                        }
                        createdItems.push(itemData);

                        const itemRef = doc(itemsCollectionRef, itemData.item_id);
                        await setDoc(itemRef, itemData);
                    });
    
                    await Promise.all([...createPromises, ...addPromises]);
                    const allItems = (isMovie ? movies : shows) || [];
                    const otherItems = allItems.filter(item => !existingItems.find(add => add.id == item.item_id));
                    const updatedItems = [...updatedAdd, ...createdItems, ...otherItems].sort((a, b) => b.score - a.score);
                    isMovie ? setMovies(updatedItems) : setShows(updatedItems);
                } else if (selectedUnseenItems.length == 0) {
                    let updatedItems = isMovie ? (movies || []).map((item) => ({ ...item })) : (shows || []).map((item) => ({ ...item }));
                    const itemsCollectionRef = collection(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows");
                    const promises = selectedItems.map(async (item) => {
                        const itemRef = doc(itemsCollectionRef, item.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayUnion(listID)
                        });
                        updatedItems.forEach((updated, index) => {
                            if (item.item_id == updated.item_id && updated.score != -1) {
                                updatedItems[index].lists = [listID, ...updated.lists];
                            }
                        })
                    });
                    await Promise.all(promises);
                    isMovie ? setMovies(updatedItems) : setShows(updatedItems);
                }
                
                //requestRefresh();
                itemsAdded = true;
            } catch (err: any) {
                console.error("Error adding selected items to new list: ", err);
            }
        } else {
            //requestListRefresh();
            //requestRefresh();
        }
        
        return listAdded && itemsAdded;
    }

    return addList;
}

export const editList = () => {
    const { user } = useAuth();
    const {movieLists, tvLists, setMovieLists, setTVLists} = useData();
    
    const handleEdit = async (listID: string, listTypeID: string, name: string, description: string) => {
        if (user) {
            const isMovie = listTypeID == Values.movieListsID;
            const listRef = doc(db, "users", user.uid, listTypeID, listID);
            try {
                await updateDoc(listRef, {
                    name: name,
                    description: description,
                    last_modified: serverTimestamp()
                });
                let lists = isMovie ? movieLists : tvLists;
                lists.forEach((list, index) => {
                    if (list.list_id == listID) {
                        lists[index].name = name;
                        lists[index].description = description;
                        lists[index].last_modified = new Date();
                    }
                })
                isMovie ? setMovieLists(lists) : setTVLists(lists);
            } catch (err: any) {
                console.error("Error updating list details: ", err);
            }
        }
    }

    return handleEdit;
}