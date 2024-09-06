import { List, Post } from "@/constants/ImportTypes";
import Values from "@/constants/Values";
import { FIREBASE_DB } from "@/firebaseConfig"
import { collection, doc, getDocs, orderBy, query, where } from "firebase/firestore";
const db = FIREBASE_DB;

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

export async function FetchFollowedUsersRankings (ItemID: string, userID: string): Promise<Post[]> {
  const following = await FetchFollowing(userID);
  if (!following.length) {
    return [];

  }
  const globalPostsRef = collection(db, 'globalPosts');
  const filterPostsQuery = query(globalPostsRef,
    where("item_id", "==", ItemID),
    where("user_id", "in", following),
  )
  const querySnapshot = await getDocs(filterPostsQuery);
  const uniqueUserPosts: any = {}; // Map to store one post per user
  const posts: Post[] = [];
  if (!querySnapshot.empty) {
    querySnapshot.forEach((doc) => {
      const postData = doc.data();
      const userId = postData.user_id;

      // If the user is not yet in uniqueUserPosts, add their post
      if (!uniqueUserPosts[userId]) {
        uniqueUserPosts[userId] = postData;
        posts.push(postData as Post);
      }
    });
  }
  return posts as Post[];
};