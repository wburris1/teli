import { useAuth } from "@/contexts/authContext";
import { FIREBASE_DB } from "@/firebaseConfig";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";

const db = FIREBASE_DB;

export const followUser = () => {
  const { user } = useAuth();

  async function follow(userID: string) {
    if (user && userID) {
      const userFollowingRef = doc(collection(db, "users", user.uid, "following"), userID);
      const followUserFollowersRef = doc(collection(db, "users", userID, "followers"), user.uid);
      try {
        await setDoc(userFollowingRef, { user_id: userID });

        await setDoc(followUserFollowersRef, { user_id: user.uid });

        console.log('Followed successfully');
      } catch (error) {
        console.error('Error following user: ', error);
      }
    }
  }
  return follow;
}

export const unfollowUser = () => {
  const { user } = useAuth();

  async function unfollow(userID: string) {
    if (user && userID) {
      const userFollowingRef = doc(collection(db, "users", user.uid, "following"), userID);
      const followUserFollowersRef = doc(collection(db, "users", userID, "followers"), user.uid);
      try {
        // Remove userID from current user's following collection
        await deleteDoc(userFollowingRef);

        // Remove current user's ID from the target user's followers collection
        await deleteDoc(followUserFollowersRef);

        console.log('Unfollowed successfully');
      } catch (error) {
        console.error('Error unfollowing user: ', error);
      }
    }
  }
  return unfollow;
}