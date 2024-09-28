import { useAuth } from "@/contexts/authContext";
import { UpdateListPosters, updateSomeListPosters } from "./posterUpdates";
import { useUserAdjustScores } from "./itemScores";
import Values from "@/constants/Values";
import { FIREBASE_DB } from "@/firebaseConfig";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { removeFromList } from "./deleteItem";
import { useTab } from "@/contexts/listContext";
import { Post, UserItem, UserMovie, UserShow } from "@/constants/ImportTypes";
import { useLoading } from "@/contexts/loading";
import { useData } from "@/contexts/dataContext";
import { useCallback } from "react";

const db = FIREBASE_DB;

export const AddToDatabase = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();
    const adjustScoreFunc = useUserAdjustScores();
    const {selectedLists, removeLists} = useTab();
    const { setLoading } = useLoading();
    const {movies, shows, setMovies, setShows} = useData();

    async function addToDB(newScore: number, item: Item, listID: string, isMovie: boolean, isDupe: boolean, items: UserItem[], caption: string, hasSpoilers: boolean, dupePostID: string) {
      setLoading(true);
        var newItem: UserItem;
        const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

        if (isMovie) {
          newItem = {
            item_id: item.id.toString(),
            item_name: item.title,
            name: item.title,
            title: item.title,
            poster_path: item.poster_path,
            score: newScore,
            release_date: item.release_date,
            caption: caption,
            has_spoilers: hasSpoilers,
            num_comments: 0,
            likes: [],
            created_at: serverTimestamp(),
            list_type_id: Values.movieListsID,
            lists: [listID, ...selectedLists.map(list => list.list_id)],
            user_id: user ? user.uid : '',
            post_id: '',
            backdrop_path: item.backdrop_path,
            runtime: item.runtime ? item.runtime : 0
          };
        } else {
          newItem = {
            item_id: item.id.toString(),
            item_name: item.name,
            name: item.name,
            poster_path: item.poster_path,
            score: newScore,
            first_air_date: item.first_air_date,
            caption: caption,
            has_spoilers: hasSpoilers,
            num_comments: 0,
            likes: [],
            created_at: serverTimestamp(),
            list_type_id: Values.tvListsID,
            lists: [listID, ...selectedLists.map(list => list.list_id)],
            user_id: user ? user.uid : '',
            post_id: '',
            backdrop_path: item.backdrop_path,
            episode_run_time: item.episode_run_time ? item.episode_run_time : 0,
          };
        }
    
        if (user) {
          const itemRef = doc(db, "users", user.uid, isMovie ? "movies" : "shows", item.id.toString());
          const globalPostColRef = collection(db, "globalPosts")
          if (isDupe) {
            const gobalItemRef = doc(db, "globalPosts", dupePostID);
            const existingDoc = await getDoc(gobalItemRef);
            const existingLists = existingDoc.exists() ? existingDoc.data().lists || [] : [];

            // Merge the new lists with the existing ones
            const updatedLists = [...new Set([...existingLists, listID, ...selectedLists.map(list => list.list_id)])];
            const removeListIDs = new Set(removeLists.map(list => list.list_id));
            // Filter out the lists that are in the removeListIDs set
            const finalLists = updatedLists.filter(list => !removeListIDs.has(list));

            const updateData = isMovie
            ? {
                created_at: serverTimestamp(),
                caption: newItem.caption,
                title: (newItem as UserMovie).title,
                poster_path: newItem.poster_path,
                score: newScore,
                release_date: (newItem as UserMovie).release_date,
                lists: finalLists
              }
            : {
                created_at: serverTimestamp(),
                caption: newItem.caption,
                name: (newItem as UserShow).name,
                poster_path: newItem.poster_path,
                score: newScore,
                first_air_date: (newItem as UserShow).first_air_date,
                lists: finalLists
              };
              try {
                await updateDoc(itemRef, updateData);
                await updateDoc(gobalItemRef, updateData);
                
                items.forEach(seenItem => {
                  if (seenItem.item_id == item.id.toString()) {
                      seenItem.score = newScore;
                  }
                });
                await adjustScoreFunc(items, newScore, listID, listTypeID);
                updateListFunc(listTypeID);
              } catch (err: any) {
                console.error("Error updating item: ", err);
              }
              setLoading(false);
              return newItem;
          } else {
            try {
              await setDoc(itemRef, newItem);
              const globalPostRef = await addDoc(globalPostColRef, newItem);
              await updateDoc(globalPostRef, { post_id: globalPostRef.id });
              await updateDoc(itemRef, { post_id: globalPostRef.id });
              const currItems = [...items, {...newItem, post_id: globalPostRef.id}];

              await adjustScoreFunc(currItems, newScore, listID, listTypeID);
              updateListFunc(listTypeID);
            } catch (err: any) {
              console.error("Error adding new item: ", err);
            }
            setLoading(false);
            return newItem;
          }
        }
        setLoading(false);
        return null;
    }

    return addToDB;
}

export const addToBookmarked = () => {
  const { user } = useAuth();
  const updatePosters = updateSomeListPosters();
  const listID = Values.bookmarkListID;
  const {movies, shows, setMovies, setShows} = useData();

  const bookmark = async (item: Item, isMovie: boolean): Promise<UserItem[]> => {
    let newItem: UserItem;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;
    const currItem = isMovie ? (movies || []).find(movie => movie.item_id == item.id.toString()) : (shows || []).find(show => show.item_id == item.id.toString())
    if (isMovie) {
      newItem = {
        item_id: item.id.toString(),
        item_name: item.title,
        title: item.title,
        poster_path: item.poster_path,
        score: -2,
        release_date: item.release_date,
        caption: "",
        has_spoilers: false,
        num_comments: 0,
        likes: [],
        created_at: serverTimestamp(),
        list_type_id: Values.movieListsID,
        lists: currItem ? [...currItem.lists, listID] : [listID],
        user_id: user ? user.uid : '',
        post_id: '',
        backdrop_path: item.backdrop_path,
        runtime: item.runtime ? item.runtime : 0
      };
    } else {
      newItem = {
        item_id: item.id.toString(),
        item_name: item.name,
        name: item.name,
        poster_path: item.poster_path,
        score: -2,
        first_air_date: item.first_air_date,
        caption: "",
        has_spoilers: false,
        num_comments: 0,
        likes: [],
        created_at: serverTimestamp(),
        list_type_id: Values.tvListsID,
        lists: currItem ? [...currItem.lists, listID] : [listID],
        user_id: user ? user.uid : '',
        post_id: '',
        backdrop_path: item.backdrop_path,
        episode_run_time: item.episode_run_time ? item.episode_run_time : 0
      };
    }
    let returnedItems: UserItem[] = [];

    if (user) {
      const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item.id.toString());
      try {
        await setDoc(itemRef, newItem);
        if (isMovie && movies && movies.find(movie => movie.item_id == item.id.toString() && movie.score != -1) || 
        (!isMovie && shows && shows.find(show => show.item_id == item.id.toString() && show.score != -1))) {
          // Exists not as a post
          let updatedItems = isMovie ? (movies || []).map((item) => ({ ...item })) : (shows || []).map((item) => ({ ...item }));
          updatedItems.forEach((updated, index) => {
            if (item.id.toString() == updated.item_id && updated.score != -1) {
              updatedItems[index] = newItem;
            }
          })
          returnedItems = updatedItems;
        } else {
          returnedItems = isMovie ? [...(movies || []), newItem] : [...(shows || []), newItem];
        }
        updatePosters(listID, listTypeID);
      } catch (err: any) {
        console.error("Error bookmarking item: ", err);
      }
    }
    return returnedItems;
  }

  const bookmarkCallback = useCallback((item: Item, isMovie: boolean) => {
    bookmark(item, isMovie).then((returnedItems: UserItem[]) => {
      isMovie ? setMovies(returnedItems) : setShows(returnedItems);
    });
  }, [movies, shows])

  return bookmarkCallback;
}