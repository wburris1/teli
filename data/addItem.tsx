import { useAuth } from "@/contexts/authContext";
import { UpdateListPosters, updateSomeListPosters } from "./posterUpdates";
import { useUserAdjustScores } from "./itemScores";
import Values from "@/constants/Values";
import { FIREBASE_DB } from "@/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { storeDataLocally } from "./userLocalData";
import { removeFromList } from "./deleteItem";
import { useTab } from "@/contexts/listContext";
import { addAndRemoveItemFromLists } from "./addToList";

const db = FIREBASE_DB;

export const AddToDatabase = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();
    const adjustScoreFunc = useUserAdjustScores();
    const removeFunc = removeFromList();
    const {selectedLists, removeLists} = useTab();
    const addAndRemoveFunc = addAndRemoveItemFromLists();

    async function addToDB(newScore: number, item: Item, listID: string, isMovie: boolean, isDupe: boolean, items: UserItem[]) {
        var newItem: UserItem;
        const listTypeID = isMovie ? Values.movieListsID : Values.tvListsID;

        if (isMovie) {
          newItem = {
            item_id: item.id.toString(),
            title: item.title,
            poster_path: item.poster_path,
            score: newScore,
            release_date: item.release_date,
          };
        } else {
          newItem = {
            item_id: item.id.toString(),
            name: item.name,
            poster_path: item.poster_path,
            score: newScore,
            first_air_date: item.first_air_date,
          };
        }
    
        if (user) {
          const itemRef = doc(db, "users", user.uid, listTypeID, listID, "items", item.id.toString());
          if (isDupe) {
            var otherItems: UserItem[] = [];
            if (items) {
              otherItems = items.filter(otherItem => otherItem.item_id !== item.id);
            }
            otherItems.push(newItem);
            const mapItems = otherItems.map(doc => ({ id: doc.item_id, ...doc as UserItem }));

            items.forEach(seenItem => {
                if (seenItem.item_id == item.id) {
                    seenItem.score = newScore;
                }
            });
            const updateData = isMovie
            ? {
                title: (newItem as UserMovie).title,
                poster_path: newItem.poster_path,
                score: newScore,
                release_date: (newItem as UserMovie).release_date,
              }
            : {
                name: (newItem as UserShow).name,
                poster_path: newItem.poster_path,
                score: newScore,
                first_air_date: (newItem as UserShow).first_air_date,
              };
              try {
                await updateDoc(itemRef, updateData);
                await adjustScoreFunc(items, newScore, listID, listTypeID);
                await storeDataLocally(`items_${user!.uid}_${listTypeID}_${listID}`, mapItems);
                addAndRemoveFunc(newItem, selectedLists, removeLists, listTypeID);
                updateListFunc(listTypeID);
              } catch (err: any) {
                console.error("Error updating item: ", err);
              }
              return newItem;
          } else {
            const currItems = [...items, newItem];
            const mapItems = currItems.map(doc => ({ id: doc.item_id, ...doc as UserItem }));
            try {
              await setDoc(itemRef, newItem);
              await adjustScoreFunc(currItems, newScore, listID, listTypeID);
              await storeDataLocally(`items_${user!.uid}_${listTypeID}_${listID}`, mapItems);
              addAndRemoveFunc(newItem, selectedLists, removeLists, listTypeID);
              removeFunc(Values.bookmarkListID, listTypeID, itemRef.id);
              updateListFunc(listTypeID);
            } catch (err: any) {
              console.error("Error adding new item: ", err);
            }
            return newItem;
          }
        }
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
        title: item.title,
        poster_path: item.poster_path,
        score: -1,
        release_date: item.release_date,
      };
    } else {
      newItem = {
        item_id: item.id.toString(),
        name: item.name,
        poster_path: item.poster_path,
        score: -1,
        first_air_date: item.first_air_date,
      };
    }

    if (user) {
      const itemRef = doc(db, "users", user.uid, listTypeID, listID, "items", item.id.toString());
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