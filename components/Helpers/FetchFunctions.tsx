import { List } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { FIREBASE_DB } from "@/firebaseConfig"
import { collection, doc, getDocs, query } from "firebase/firestore";
const db = FIREBASE_DB;

// returns all users that are following
export async function FetchFollowing (userID: string): Promise<string[]> {
  if (!userID) return [];
  const followingCollectionRef = collection(db, 'users', userID, 'following');
  const followingSnapshot = await getDocs(followingCollectionRef);
  return followingSnapshot.docs.map((doc) => doc.id);
};

// returns all users that are following
export async function FetchFollowers (userID: string): Promise<string[]> {
  if (!userID) return [];
  const followingCollectionRef = collection(db, 'users', userID, 'followers');
  const followingSnapshot = await getDocs(followingCollectionRef);
  return followingSnapshot.docs.map((doc) => doc.id);
};

export async function FetchMovieLists (userID: string): Promise<List[]> {
  const userDocRef = doc(db, 'users', userID);
  const movieListsRef = collection(userDocRef, Values.movieListsID);
  const movieListsQuery = query(movieListsRef);
  const snapshot = await getDocs(movieListsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
};

export async function FetchTVLists (userID: string): Promise<List[]> {
  const userDocRef = doc(db, 'users', userID);
  const movieListsRef = collection(userDocRef, Values.movieListsID);
  const movieListsQuery = query(movieListsRef);
  const snapshot = await getDocs(movieListsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
};