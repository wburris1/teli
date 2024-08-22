import { FIREBASE_DB } from "@/firebaseConfig"
import { collection, getDocs } from "firebase/firestore";
const db = FIREBASE_DB;

export async function FetchFollowedUsers (userID: string): Promise<string[]> {
  if (!userID) return [];
  const followingCollectionRef = collection(db, 'users', userID, 'following');
  const followingSnapshot = await getDocs(followingCollectionRef);
  return followingSnapshot.docs.map((doc) => doc.id);
};