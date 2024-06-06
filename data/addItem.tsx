import { useAuth } from "@/contexts/authContext";
import { UpdateListPosters } from "./posterUpdates";
import { useUserAdjustScores } from "./itemScores";
import Values from "@/constants/Values";
import { FIREBASE_DB } from "@/firebaseConfig";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { storeDataLocally } from "./userLocalData";

const db = FIREBASE_DB;

export const AddToDatabase = () => {
    const { user } = useAuth();
    const updateListFunc = UpdateListPosters();
    const adjustScoreFunc = useUserAdjustScores();

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
                await storeDataLocally(`items_${user!.uid}_${listTypeID}_${item.id}`, updateData);
                updateListFunc(listTypeID);
              } catch (err: any) {
                console.error("Error updating item: ", err);
              }
              return newItem;
          } else {
            const currItems = [...items, newItem];
            try {
              await setDoc(itemRef, newItem);
              await adjustScoreFunc(currItems, newScore, listID, listTypeID);
              await storeDataLocally(`items_${user!.uid}_${listTypeID}_${item.id}`, newItem);
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