import { useAuth } from "@/contexts/authContext";
import { UpdateListPosters, updateSomeListPosters } from "./posterUpdates";
import { useUserAdjustScores } from "./itemScores";
import Values from "@/constants/Values";
import { FIREBASE_DB } from "@/firebaseConfig";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { removeFromList } from "./deleteItem";
import { useTab } from "@/contexts/listContext";
import { Post, UserItem, UserMovie, UserShow } from "@/constants/ImportTypes";
import { useLoading } from "@/contexts/loading";

const db = FIREBASE_DB;

export const AddToDatabase = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();
    const adjustScoreFunc = useUserAdjustScores();
    const removeFunc = removeFromList();
    const {selectedLists, removeLists} = useTab();
    const { setLoading } = useLoading();

    async function addToDB(newScore: number, item: Item, listID: string, isMovie: boolean, isDupe: boolean, items: UserItem[], caption: string, hasSpoilers: boolean) {
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
            lists: [listID, ...selectedLists.map(list => list.list_id)]
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
            lists: [listID, ...selectedLists.map(list => list.list_id)]
          };
        }
    
        if (user) {
          const itemRef = doc(db, "users", user.uid, isMovie ? "movies" : "shows", item.id.toString());
          if (isDupe) {
            var otherItems: UserItem[] = [];
            if (items) {
              otherItems = items.filter(otherItem => otherItem.item_id !== item.id);
            }
            otherItems.push(newItem);

            items.forEach(seenItem => {
                if (seenItem.item_id == item.id) {
                    seenItem.score = newScore;
                }
            });
            const updateData = isMovie
            ? {
                created_at: serverTimestamp(),
                caption: newItem.caption,
                title: (newItem as UserMovie).title,
                poster_path: newItem.poster_path,
                score: newScore,
                release_date: (newItem as UserMovie).release_date,
                lists: [listID, ...selectedLists.map(list => list.list_id)]
              }
            : {
                created_at: serverTimestamp(),
                caption: newItem.caption,
                name: (newItem as UserShow).name,
                poster_path: newItem.poster_path,
                score: newScore,
                first_air_date: (newItem as UserShow).first_air_date,
                lists: [listID, ...selectedLists.map(list => list.list_id)]
              };
              try {
                await updateDoc(itemRef, updateData);
                await adjustScoreFunc(items, newScore, listID, listTypeID);
                updateListFunc(listTypeID);
              } catch (err: any) {
                console.error("Error updating item: ", err);
              }
              setLoading(false);
              return newItem;
          } else {
            const currItems = [...items, newItem];
            try {
              await setDoc(itemRef, newItem);
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

  const bookmark = async (item: Item, isMovie: boolean) => {
    var newItem: UserItem;
    const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

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
        lists: [listID]
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
        lists: [listID]
      };
    }

    if (user) {
      const itemRef = doc(db, "users", user.uid, listTypeID == Values.movieListsID ? "movies" : "shows", item.id.toString());
      try {
        await setDoc(itemRef, newItem);
        updatePosters(listID, listTypeID);
      } catch (err: any) {
        console.error("Error bookmarking item: ", err);
      }
    }
  }

  return bookmark;
}