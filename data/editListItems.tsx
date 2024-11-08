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
    const { requestRefresh, movies, shows, setMovies, setShows } = useData();
    const updatePosters = updateSomeListPosters();

    const addAndRemove = async (addItems: UserItem[], removeItems: UserItem[], listID: string, listTypeID: string) => {
        if (user && movies && shows) {
            try {
                const isMovie = listTypeID == Values.movieListsID;
                let updatedAdd: UserItem[] = [];
                let updatedRemove: UserItem[] = [];
                let count = 0;
                const itemsCollectionRef = collection(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows");
                const addPromises = addItems.map(async (item, index) => {
                    const newItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == item.item_id) :
                        shows.find(show => show.item_id === item.item_id);
                    if (newItem && !newItem.lists.includes(listID)) {
                        updatedAdd.push(newItem);
                        updatedAdd[count].lists = [listID, ...item.lists];
                        count++;
                        const itemRef = doc(itemsCollectionRef, item.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayUnion(listID)
                        });
                    }
                });
                
                count = 0;
                const removePromises = removeItems.map(async (item, index) => {
                    const removeItem = listTypeID == Values.movieListsID ? movies.find(movie => movie.item_id == item.item_id) :
                        shows.find(show => show.item_id === item.item_id);
                    if (removeItem && removeItem.lists.includes(listID)) {
                        updatedRemove.push(removeItem);
                        updatedRemove[count].lists = removeItem.lists.filter(id => id != listID);
                        count++;
                        const itemRef = doc(itemsCollectionRef, item.item_id);
                        await updateDoc(itemRef, {
                            lists: arrayRemove(listID)
                        });
                    }
                });

                await Promise.all([...addPromises, ...removePromises]);
                const allItems = (isMovie ? movies : shows) || [];
                const otherItems = allItems.filter(item => !updatedAdd.find(add => add.item_id == item.item_id) &&
                    !updatedRemove.find(add => add.item_id == item.item_id));
                const updatedItems = [...updatedAdd, ...updatedRemove, ...otherItems].sort((a, b) => b.score - a.score);
                isMovie ? setMovies(updatedItems) : setShows(updatedItems);
                updatePosters(listID, listTypeID);
                //requestRefresh();
            } catch (err: any) {
                console.error("Error adding selected items to list: ", err);
            }
        }
    }

    return addAndRemove;
}

export const editUnwatchedItems = () => {
    const { user } = useAuth();
    const { requestRefresh, movies, shows, setMovies, setShows } = useData();
    const updatePosters = updateSomeListPosters();

    const addAndRemove = async (
        addItems: Item[],
        removeItems: Item[],
        listID: string,
        listTypeID: string
      ) => {
        if (user && movies && shows) {
          const isMovie = listTypeID == Values.movieListsID;
          try {
            const itemsCollectionRef = collection(
              db,
              "users",
              user.uid,
              isMovie ? "movies" : "shows"
            );
            let updatedAdd: UserItem[] = [];
            let updatedRemove: UserItem[] = [];
      
            // Remove items
            const removePromises = removeItems.map(async (item) => {
              const id = item.id.toString();
              const removeItem = isMovie
                ? movies.find((movie) => movie.item_id == id)
                : shows.find((show) => show.item_id == id);
      
              if (removeItem && removeItem.lists.includes(listID)) {
                // Push a new modified copy of the item instead of directly modifying
                updatedRemove.push({
                  ...removeItem,
                  lists: removeItem.lists.filter((id) => id != listID),
                });
      
                const itemRef = doc(itemsCollectionRef, removeItem.item_id);
                await updateDoc(itemRef, {
                  lists: arrayRemove(listID),
                });
              }
            });
      
            // Separate new and existing items
            const newItems = addItems.filter((item) =>
              isMovie
                ? !movies.find((movie) => movie.item_id == item.id.toString())
                : !shows.find((show) => show.item_id == item.id.toString())
            );
      
            const existingItems = addItems.filter(
              (item) => !newItems.includes(item)
            );
      
            // Add existing items to the list
            const addPromises = existingItems.map(async (item) => {
              const id = item.id.toString();
              const newItem = isMovie
                ? movies.find((movie) => movie.item_id == id)
                : shows.find((show) => show.item_id == id);
      
              if (newItem && !newItem.lists.includes(listID)) {
                // Push a new modified copy of the item instead of directly modifying
                updatedAdd.push({
                  ...newItem,
                  lists: [listID, ...newItem.lists],
                });
      
                const itemRef = doc(itemsCollectionRef, newItem.item_id);
                await updateDoc(itemRef, {
                  lists: arrayUnion(listID),
                });
              }
            });
      
            // Create new items
            let createdItems: UserItem[] = [];
            const createPromises = newItems.map(async (item) => {
              const itemData: UserItem = {
                item_id: item.id.toString(),
                item_name: 'title' in item ? item.title : item.name,
                poster_path: item.poster_path || "",
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
                ...(item.title
                  ? { title: item.title, release_date: item.release_date || "", runtime: item.runtime || 0 }
                  : { name: item.name, first_air_date: item.first_air_date || "", episode_run_time: item.episode_run_time || 0 }),
              };
      
              createdItems.push(itemData);
      
              const itemRef = doc(itemsCollectionRef, itemData.item_id);
              await setDoc(itemRef, itemData);
            });
      
            // Await all asynchronous operations
            await Promise.all([...createPromises, ...addPromises, ...removePromises]);
      
            // Update local state with newly modified and added items
            const allItems = (isMovie ? movies : shows) || [];
            const otherItems = allItems.filter(
              (item) =>
                !addItems.some((add) => add.id.toString() == item.item_id) &&
                !removeItems.some((remove) => remove.id.toString() == item.item_id)
            );
            const updatedItems = [
              ...createdItems,
              ...updatedAdd,
              ...updatedRemove,
              ...otherItems,
            ].sort((a, b) => b.score - a.score);
      
            // Update the state with sorted items
            isMovie ? setMovies(updatedItems) : setShows(updatedItems);
            updatePosters(listID, listTypeID);
          } catch (err: any) {
            console.error(
              "Error adding selected items to unwatched list: ",
              err.message
            );
          }
        }
      };

    return addAndRemove;
}