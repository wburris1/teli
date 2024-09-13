import { FeedPost, List, Post } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { fetchUserData } from "@/data/getComments";
import { FIREBASE_DB } from "@/firebaseConfig"
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
const db = FIREBASE_DB;

const userCache = new Map<string, UserData>(); // Cache to locally store many ppl's userData

// returns all users that are following
export async function FetchFollowing (userID: string): Promise<string[]> {
  // cache our users following list. 
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
  const tvListsRef = collection(userDocRef, Values.tvListsID);
  const tvListsQuery = query(tvListsRef);
  const snapshot = await getDocs(tvListsQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as List }));
};

export async function FetchFollowedUsersRankings (ItemID: string, userID: string, following: string[]): Promise<FeedPost[]> {
  if (!following.length) {
    return [];
  }

  const globalPostsRef = collection(db, 'globalPosts');
  const filterPostsQuery = query(globalPostsRef,
    where("item_id", "==", ItemID),
    where("user_id", "in", following),
    where("score", ">=", 0),
    where("score", "<=", 10)
  )
  const querySnapshot = await getDocs(filterPostsQuery);
  const posts: Post[] = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      const postData = doc.data();
        posts.push(postData as Post);
      }
    )
  }

  const feedPosts = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
    const userData = await getUserData(docSnapshot.data().user_id);
    return {
      ...docSnapshot.data() as Post,
      ...userData, // Combined user and post data in a single object
    };
  })); 

  return feedPosts as FeedPost[];
};

export const getUserData = async (userId: string): Promise<UserData> => {
  if (userCache.has(userId)) {
    return userCache.get(userId) as UserData; // Return cached data if available
  }
  const userData = await fetchUserData(userId)
  userCache.set(userId, userData); // Cache the fetched data
  return userData
};